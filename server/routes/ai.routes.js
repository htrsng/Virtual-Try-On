const express = require("express");

function createAiRouter(deps) {
    const {
        authenticateToken,
        requireDbReady,
        geminiModel,
        ProductModel,
        mongoose,
    } = deps;

    const router = express.Router();

    const GEMINI_TIMEOUT = 10000; // 10s server-side (2s buffer vs client 8s)

    const safeTrim = (value) => (typeof value === "string" ? value.trim() : "");
    const safeArray = (value) => (Array.isArray(value) ? value.filter(Boolean) : []);
    const safeNumber = (value, fallback = null) => {
        const num = Number(value);
        return Number.isFinite(num) ? num : fallback;
    };
    const withTimeout = async (promise, ms, label = "operation") => {
        let timeoutId;
        const timeout = new Promise((_, reject) => {
            timeoutId = setTimeout(() => reject(new Error(`${label} timeout after ${ms}ms`)), ms);
        });

        try {
            return await Promise.race([promise, timeout]);
        } finally {
            clearTimeout(timeoutId);
        }
    };

    router.post("/outfit-suggest", authenticateToken, requireDbReady, async (req, res) => {
        try {
            if (!geminiModel) {
                return res.status(503).json({ error: "AI service is not available", code: "AI_NOT_INITIALIZED" });
            }

            if (!req.user?.id) {
                return res.status(401).json({ error: "Missing authenticated user", code: "UNAUTHORIZED" });
            }

            const {
                userPrompt,
                products: clientProducts = [],
                closetItems = [],
                avatarData = {},
                measurements: requestMeasurements = {},
                filter: filterContext = {},
                occasions = [],
                styles = [],
                colors = [],
                budget,
            } = req.body;

            const promptOccasions = Array.isArray(filterContext?.occasions)
                ? filterContext.occasions
                : Array.isArray(occasions)
                    ? occasions
                    : [];
            const promptStyles = Array.isArray(filterContext?.styles)
                ? filterContext.styles
                : Array.isArray(styles)
                    ? styles
                    : [];
            const promptColors = Array.isArray(filterContext?.colors)
                ? filterContext.colors
                : Array.isArray(colors)
                    ? colors
                    : [];
            const promptBudget = safeNumber(filterContext?.budget ?? budget, 2000000) || 2000000;
            const normalizedUserPrompt = safeTrim(userPrompt);

            if (normalizedUserPrompt.length === 0) {
                return res.status(400).json({ error: "Vui lòng nhập câu hỏi" });
            }

            // Extract measurements from request body (primary source)
            const requestHeight = safeNumber(requestMeasurements?.height);
            const requestWeight = safeNumber(requestMeasurements?.weight);
            const requestChest = safeNumber(requestMeasurements?.chest);
            const requestWaist = safeNumber(requestMeasurements?.waist);
            const requestHip = safeNumber(requestMeasurements?.hip);

            // Fetch user measurements from DB as fallback
            let dbMeasurements = null;
            try {
                const UserModel = mongoose.models.User || mongoose.model("User", new mongoose.Schema({}));
                const user = await withTimeout(
                    UserModel.findById(req.user.id).select("height weight chest waist hip").lean(),
                    4000,
                    "user lookup",
                );
                if (user && (user.height || user.weight)) {
                    dbMeasurements = {
                        height: user.height,
                        weight: user.weight,
                        chest: user.chest,
                        waist: user.waist,
                        hip: user.hip,
                    };
                }
            } catch (_) {
                // Continue without DB measurements if fetch fails
            }

            // Merge request measurements (override DB measurements)
            const userMeasurements = {
                height: requestHeight || dbMeasurements?.height || null,
                weight: requestWeight || dbMeasurements?.weight || null,
                chest: requestChest || dbMeasurements?.chest || null,
                waist: requestWaist || dbMeasurements?.waist || null,
                hip: requestHip || dbMeasurements?.hip || null,
            };

            // Check if we have meaningful measurements
            const hasMeasurements = userMeasurements.height != null || userMeasurements.weight != null;

            // Fetch user's virtual closet to identify owned items
            let ownedProductIds = [];
            try {
                const VirtualClosetModel =
                    mongoose.models.VirtualCloset ||
                    mongoose.model("VirtualCloset", new mongoose.Schema({
                        userId: mongoose.Schema.Types.ObjectId,
                        items: [{
                            productId: mongoose.Schema.Types.Mixed,
                        }],
                    }));
                const closet = await withTimeout(
                    VirtualClosetModel.findOne({ userId: req.user.id }).select("items.productId").lean(),
                    4000,
                    "closet lookup",
                );
                if (closet && Array.isArray(closet.items)) {
                    ownedProductIds = closet.items
                        .map((item) => String(item.productId ?? ""))
                        .filter((id) => id.length > 0);
                }
            } catch (_) {
                // Continue without closet data if fetch fails
            }

            // ============================================
            // STEP 1: Use client-filtered products if provided, otherwise query DB
            // ============================================
            const productQuery = { isActive: true };
            if (promptBudget) {
                // Pre-filter: Ensure we only feed Gemini products within budget
                productQuery.price = { $lte: promptBudget };
            }

            let products = Array.isArray(clientProducts) && clientProducts.length > 0
                ? clientProducts
                : await withTimeout(ProductModel.find(productQuery)
                    .select(`
                        _id name price imageUrl category slug
                        aiStylist.styles
                        aiStylist.occasions
                        aiStylist.weather
                        aiStylist.colorTone
                        aiStylist.formFit
                        aiStylist.material
                        aiStylist.description
                        model3D
                    `)
                    .limit(120)
                    .lean(), 6000, "product lookup");

            // Fallback if query is empty
            if (!Array.isArray(products) || products.length === 0) {
                products = await withTimeout(ProductModel.find({})
                    .select(`
                        _id name price imageUrl category
                        aiStylist.styles
                        aiStylist.occasions
                        aiStylist.weather
                        aiStylist.colorTone
                        aiStylist.formFit
                        aiStylist.material
                        model3D
                    `)
                    .limit(120)
                    .lean(), 6000, "product fallback lookup");
            }

            if (!Array.isArray(products)) {
                products = [];
            }

            // ============================================
            // Format product list for Gemini
            // ============================================
            const productList = products.map(p => {
                const id = String(p._id ?? p.id ?? "");
                const styles = (p.aiStylist?.styles || []).join(",");
                const occasions = (p.aiStylist?.occasions || []).join(",");
                const weather = (p.aiStylist?.weather || []).join(",");
                const colorTone = p.aiStylist?.colorTone || "neutral";
                const formFit = p.aiStylist?.formFit || "standard";
                const material = p.aiStylist?.material || "cotton";

                return `[ID:${id}]|${p.name}|${p.category}|${p.price}đ|styles:${styles}|occasions:${occasions}|weather:${weather}|color:${colorTone}|fit:${formFit}|material:${material}`;
            }).join("\n");

            const avatarSummary = avatarData
                ? {
                    height: avatarData.height,
                    weight: avatarData.weight,
                    chest: avatarData.chest,
                    waist: avatarData.waist,
                    hip: avatarData.hip,
                }
                : null;

            // ============================================
            // STEP 2: Build enhanced system prompt
            // ============================================
            const systemPrompt = `Bạn là AI Stylist chuyên nghiệp cho nền tảng thời trang Việt Nam VFitAI.
Nhiệm vụ: Tạo 3 outfit GỢI Ý KHÁC NHAU hoàn toàn, không lặp sản phẩm giữa các outfit.

NGUYÊN TẮC BẮT BUỘC:
1. Mỗi outfit gồm 3-4 sản phẩm: 1 áo + 1 quần/váy + 1 giày (+ 1 phụ kiện tùy chọn)
2. TUYỆT ĐỐI KHÔNG dùng cùng 1 productId trong 2 outfit khác nhau
3. Chỉ chọn sản phẩm từ danh sách được cung cấp (dùng đúng ID)
4. Mỗi outfit phải có phong cách nhận diện rõ ràng và khác nhau
5. Ưu tiên sản phẩm có styles và occasions khớp với yêu cầu người dùng
6. Màu sắc phải phối hợp hài hoà (không clash màu)
7. Tổng giá mỗi outfit không vượt quá ${promptBudget}đ

THÔNG TIN NGƯỜI DÙNG:
- Yêu cầu: "${normalizedUserPrompt}"
- Dịp: ${promptOccasions.join(", ") || "không rõ"}
- Phong cách: ${promptStyles.join(", ") || "không rõ"}
- Màu yêu thích: ${promptColors.join(", ") || "không rõ"}
- Ngân sách: ${promptBudget}đ
${hasMeasurements ? `- Số đo: Cao ${userMeasurements.height || "?"}cm, Nặng ${userMeasurements.weight || "?"}kg, Ngực ${userMeasurements.chest || "?"}cm, Eo ${userMeasurements.waist || "?"}cm, Mông ${userMeasurements.hip || "?"}cm` : "- Số đo: Không cung cấp"}

DANH SÁCH SẢN PHẨM (Format: [ID:xxx]|Tên|Category|Giá|styles:...|occasions:...|color:...|fit:...|material:...)
${productList.slice(0, 5000)}

OUTPUT FORMAT (JSON thuần, không markdown, không giải thích):
{
  "outfits": [
    {
      "id": 1,
      "name": "Tên outfit ngắn gọn",
      "style": "casual|minimal|streetwear|formal|...",
      "occasion": "Dịp phù hợp",
      "colorStory": "Mô tả bảng màu",
      "whyThisOutfit": "1 câu giải thích",
      "items": [
        {
          "productId": "ID_CHÍNH_XÁC",
          "name": "Tên sản phẩm",
          "category": "tops|bottoms|shoes|outerwear|accessories",
          "price": 250000,
          "recommendedSize": "S|M|L|XL|36|37|38|39",
          "sizeReason": "Lý do ngắn gọn"
        }
      ]
    }
  ]
}`;

            const geminiResponseSchema = {
                type: "object",
                properties: {
                    outfits: {
                        type: "array",
                        description: "Danh sách 3 outfit gợi ý",
                        items: {
                            type: "object",
                            properties: {
                                id: { type: "number" },
                                name: { type: "string" },
                                style: { type: "string" },
                                occasion: { type: "string" },
                                colorStory: { type: "string" },
                                whyThisOutfit: { type: "string" },
                                items: {
                                    type: "array",
                                    items: {
                                        type: "object",
                                        properties: {
                                            productId: { type: "string" },
                                            name: { type: "string" },
                                            category: { type: "string" },
                                            price: { type: "number" },
                                            recommendedSize: { type: "string" },
                                            sizeReason: { type: "string" }
                                        },
                                        required: ["productId", "name", "category", "price", "recommendedSize", "sizeReason"]
                                    }
                                }
                            },
                            required: ["id", "name", "style", "occasion", "colorStory", "whyThisOutfit", "items"]
                        }
                    }
                },
                required: ["outfits"]
            };

            let result;
            try {
                // ─── Gemini call with server-side timeout signal ───
                // 10s timeout gives client time to fallback to local engine
                const timeoutPromise = new Promise((_, reject) =>
                    setTimeout(() => reject(new Error('GEMINI_TIMEOUT')), GEMINI_TIMEOUT)
                );

                result = await Promise.race([
                    withTimeout(geminiModel.generateContent({
                        contents: [
                            {
                                role: "user",
                                parts: [{ text: systemPrompt }],
                            },
                        ],
                        generationConfig: {
                            temperature: 0.7,
                            topP: 0.85,
                            topK: 40,
                            maxOutputTokens: 4096,
                            responseMimeType: "application/json",
                            responseSchema: geminiResponseSchema,
                        },
                    }), 15000, "gemini generation"),
                    timeoutPromise
                ]);

            } catch (modelErr) {
                const msg = String(modelErr?.message || "");

                // ─── Handle Gemini timeout → return 503 immediately (no fallback) ───
                if (msg.includes("GEMINI_TIMEOUT")) {
                    console.warn("[Server] Gemini API timed out at server (10s limit). Signaling client to use local engine.");
                    res.setHeader("X-AI-Source", "timeout");
                    return res.status(503).json({
                        success: false,
                        fallback: true,
                        message: "Gemini API timed out",
                        code: "GEMINI_TIMEOUT",
                    });
                }

                // ─── Normal error handling with fallback models ───
                const shouldFallbackModel =
                    msg.includes("is not found") ||
                    msg.includes("not supported for generateContent") ||
                    modelErr?.status === 404;

                if (!shouldFallbackModel || !geminiModel.__fallbackCandidates || !geminiModel.__genAI) {
                    throw modelErr;
                }

                let recovered = null;
                for (const modelName of geminiModel.__fallbackCandidates.slice(1)) {
                    try {
                        const altModel = geminiModel.__genAI.getGenerativeModel({
                            model: modelName,
                            generationConfig: geminiModel.__generationConfig,
                        });
                        recovered = await withTimeout(altModel.generateContent({
                            contents: [
                                {
                                    role: "user",
                                    parts: [{ text: systemPrompt }],
                                },
                            ],
                            generationConfig: {
                                temperature: 0.7,
                                topP: 0.85,
                                topK: 40,
                                maxOutputTokens: 4096,
                                responseMimeType: "application/json",
                                responseSchema: geminiResponseSchema,
                            },
                        }), 15000, "gemini fallback generation");
                        console.warn(`[AI outfit-suggest] Fallback model in use: ${modelName}`);
                        break;
                    } catch (_) {
                        // Try next candidate.
                    }
                }

                if (!recovered) throw modelErr;
                result = recovered;
            }
            let rawText;
            try {
                if (result?.response && typeof result.response.text === "function") {
                    rawText = await result.response.text();
                } else if (typeof result === "string") {
                    rawText = result;
                } else {
                    rawText = JSON.stringify(result);
                }
            } catch (e) {
                rawText = String(result);
            }

            let parsed;
            try {
                parsed = JSON.parse(rawText);
            } catch (parseErr) {
                const cleaned = String(rawText || "").replace(/```json|```/g, "").trim();
                try {
                    parsed = JSON.parse(cleaned);
                } catch (_) {
                    const start = cleaned.indexOf("{");
                    const end = cleaned.lastIndexOf("}");
                    if (start >= 0 && end > start) {
                        const candidate = cleaned.slice(start, end + 1);
                        parsed = JSON.parse(candidate);
                    } else {
                        parsed = {};
                    }
                }
            }

            if (!parsed || typeof parsed !== "object") {
                parsed = {};
            }

            try {
                const AILogModel =
                    mongoose.models.AILog ||
                    mongoose.model(
                        "AILog",
                        new mongoose.Schema({
                            userId: mongoose.Schema.Types.ObjectId,
                            userPrompt: String,
                            outfitCount: Number,
                            suggestCount: Number,
                            createdAt: { type: Date, default: Date.now },
                        }),
                    );
                await AILogModel.create({
                    userId: req.user.id,
                    userPrompt: normalizedUserPrompt,
                    outfitCount: parsed.outfit?.length ?? 0,
                    suggestCount: parsed.suggestions?.length ?? 0,
                });
            } catch (_) {
                // Keep API response success even if analytics logging fails.
            }

            let fallbackMode = "gemini";

            // Helper functions for size recommendations
            const buildSyntheticSize = (slot) => {
                if (slot === "shoes") {
                    const h = Number(userMeasurements?.height || avatarSummary?.height || 0);
                    if (h > 0 && h < 155) return "36";
                    if (h >= 155 && h <= 165) return "37";
                    if (h > 165) return "38";
                    return "37";
                }
                const w = Number(userMeasurements?.weight || avatarSummary?.weight || 0);
                const h = Number(userMeasurements?.height || avatarSummary?.height || 0);
                if ((w > 0 && w < 50) || (h > 0 && h < 155)) return "S";
                if (w > 60 || h > 165) return "L";
                return "M";
            };

            const buildSizeReason = (slot, size) => {
                const h = Number(userMeasurements?.height || avatarSummary?.height || 0);
                const w = Number(userMeasurements?.weight || avatarSummary?.weight || 0);
                const c = Number(userMeasurements?.chest || avatarSummary?.chest || 0);
                const wa = Number(userMeasurements?.waist || avatarSummary?.waist || 0);

                if (slot === "shoes") {
                    if (h > 0) {
                        if (size === "36") return `Phù hợp với chiều cao ${h}cm`;
                        if (size === "37") return `Phù hợp với chiều cao ${h}cm`;
                        if (size === "38") return `Phù hợp với chiều cao ${h}cm`;
                        return `Phù hợp với chiều cao ${h}cm`;
                    }
                    if (size === "36") return "Phù hợp với chiều cao dưới 155cm";
                    if (size === "37") return "Phù hợp với chiều cao 155-165cm";
                    return "Phù hợp với chiều cao trên 165cm";
                }

                // For clothing (tops, bottoms, outerwear)
                if (w > 0 && h > 0) {
                    return `Phù hợp với chiều cao ${h}cm, cân nặng ${w}kg`;
                } else if (w > 0) {
                    return `Phù hợp với cân nặng ${w}kg`;
                } else if (h > 0) {
                    return `Phù hợp với chiều cao ${h}cm`;
                }
                return "Kích thước chuẩn (M)";
            };

            // STEP 4: Normalize outfits and apply post-processing
            let outfits = Array.isArray(parsed?.outfits) ? parsed.outfits : [];

            // Backward compatibility: map old schema outfit+suggestions to outfits[]
            if (!outfits.length && (Array.isArray(parsed?.outfit) || Array.isArray(parsed?.suggestions))) {
                outfits = [{
                    id: 1,
                    name: parsed?.occasion ? `Outfit ${parsed.occasion}` : "Outfit 1",
                    style: "casual",
                    occasion: parsed?.occasion || "daily",
                    whyThisOutfit: parsed?.explanation || "",
                    items: [...(Array.isArray(parsed?.outfit) ? parsed.outfit : []), ...(Array.isArray(parsed?.suggestions) ? parsed.suggestions : [])],
                }];
            }

            if (!outfits.length) {
                const fallbackProducts = products.slice(0, 12);
                outfits = [0, 1, 2].map((idx) => ({
                    id: idx + 1,
                    name: `Outfit ${idx + 1}`,
                    style: ["casual", "minimal", "streetwear"][idx],
                    occasion: "daily",
                    whyThisOutfit: "Phối đồ dự phòng từ catalog khi AI chưa trả đủ dữ liệu.",
                    items: fallbackProducts
                        .slice(idx * 3, idx * 3 + 3)
                        .map((p) => ({
                            productId: String(p._id ?? ""),
                            name: p.name,
                            category: String(p.category || "tops").toLowerCase(),
                            price: Number(p.price || 0),
                            imageUrl: p.imageUrl || "",
                            recommendedSize: buildSyntheticSize(String(p.category || "tops").toLowerCase()),
                            sizeReason: buildSizeReason(String(p.category || "tops").toLowerCase(), buildSyntheticSize(String(p.category || "tops").toLowerCase())),
                        })),
                }));
                fallbackMode = "synthetic-fallback";
            }

            outfits = outfits.slice(0, 3).map((outfit, index) => ({
                id: outfit.id || index + 1,
                name: outfit.name || `Outfit ${index + 1}`,
                style: outfit.style || "casual",
                occasion: outfit.occasion || parsed?.occasion || "daily",
                colorStory: outfit.colorStory || "",
                whyThisOutfit: outfit.whyThisOutfit || parsed?.explanation || "",
                items: Array.isArray(outfit.items) ? outfit.items : [],
            }));

            // STEP 4.1: duplicate check + dedup fix
            const allIdsBefore = outfits.flatMap((o) => (Array.isArray(o.items) ? o.items.map((i) => String(i.productId || "")) : []));
            const hasDuplicate = allIdsBefore.length !== new Set(allIdsBefore).size;

            if (hasDuplicate) {
                console.warn("[AI] Duplicate products detected, applying dedup fix");
                const seen = new Set();
                outfits = outfits.map((outfit) => ({
                    ...outfit,
                    items: (outfit.items || []).filter((item) => {
                        const id = String(item.productId || "");
                        if (!id || seen.has(id)) return false;
                        seen.add(id);
                        return true;
                    }),
                }));
            }

            // STEP 4.2: closet ownership check using distinct + existing fallback
            let ownedIdsFromDistinct = [];
            try {
                const VirtualClosetModel =
                    mongoose.models.VirtualCloset ||
                    mongoose.model("VirtualCloset", new mongoose.Schema({}));
                ownedIdsFromDistinct = await VirtualClosetModel.find({ userId: req.user.id }).distinct("productId");
            } catch (_) {
                ownedIdsFromDistinct = [];
            }

            const ownedIds = Array.from(
                new Set([
                    ...ownedProductIds.map((id) => String(id)),
                    ...ownedIdsFromDistinct.map((id) => String(id)),
                ]),
            );
            const ownedIdSet = new Set(ownedIds);

            // STEP 4.3: enrich by DB data and recompute totals
            for (const outfit of outfits) {
                let validItems = [];
                for (const item of outfit.items) {
                    let productId = String(item.productId || "");
                    const targetCategory = String(item.category || "tops").toLowerCase();

                    // Prefer cached products from initial query
                    let dbProduct = products.find((p) => String(p._id) === productId);

                    // Fallback: direct DB lookup per item when not in initial pool
                    if (!dbProduct && mongoose.Types.ObjectId.isValid(productId)) {
                        try {
                            dbProduct = await ProductModel.findById(productId)
                                .select("name price imageUrl category model3D")
                                .lean();
                        } catch (_) {}
                    }

                    // AUTO-RECOVERY: If Gemini hallucinated a productId, find a real product from the list!
                    if (!dbProduct && products.length > 0) {
                        console.warn(`[AI] Hallucinated productId ${productId} detected. Attempting auto-recovery for category: ${targetCategory}`);
                        // Try to find a product in the same category that hasn't been used yet in this outfit
                        const usedIds = new Set(validItems.map(i => String(i.productId)));
                        dbProduct = products.find((p) => 
                            String(p.category || "tops").toLowerCase() === targetCategory &&
                            !usedIds.has(String(p._id))
                        );
                        // If no matching category, just pick any random product that hasn't been used
                        if (!dbProduct) {
                            dbProduct = products.find((p) => !usedIds.has(String(p._id))) || products[0];
                        }
                        
                        if (dbProduct) {
                            productId = String(dbProduct._id || dbProduct.id);
                            item.productId = productId;
                            console.warn(`[AI] Auto-recovered with real product: ${dbProduct.name} (${productId})`);
                        }
                    }

                    if (dbProduct) {
                        item.name = dbProduct.name || item.name;
                        item.price = Number(dbProduct.price || item.price || 0);
                        item.imageUrl = dbProduct.imageUrl || item.imageUrl || "";
                        item.category = String(dbProduct.category || item.category || "tops").toLowerCase();
                        
                        const slot = String(item.category || item.slot || "tops").toLowerCase();
                        const size = item.recommendedSize || item.suggestedSize || buildSyntheticSize(slot);
                        item.recommendedSize = size;
                        item.suggestedSize = size;
                        item.sizeReason = item.sizeReason || buildSizeReason(slot, size);
                        item.owned = ownedIdSet.has(productId);
                        
                        // Check if 3D model exists for try-on
                        item.tryon_ready = !!(dbProduct.model3D && dbProduct.model3D.url);

                        validItems.push(item);
                    }
                }
                outfit.items = validItems; // Only keep items that are real products

                outfit.totalPrice = (outfit.items || []).reduce((sum, i) => sum + Number(i.price || 0), 0);
                outfit.totalBuyPrice = (outfit.items || [])
                    .filter((i) => !i.owned)
                    .reduce((sum, i) => sum + Number(i.price || 0), 0);
                outfit.ownedCount = (outfit.items || []).filter((i) => i.owned).length;
                outfit.buyCount = (outfit.items || []).filter((i) => !i.owned).length;
            }

            const firstOutfit = outfits[0] || { items: [] };
            const legacyOutfit = (firstOutfit.items || []).filter((item) => item.owned);
            const legacySuggestions = (firstOutfit.items || []).filter((item) => !item.owned);

            const debug = {
                shopProductsCount: products.length,
                closetItemsCount: Array.isArray(closetItems) ? closetItems.length : 0,
                parsedOutfitsCount: Array.isArray(parsed?.outfits) ? parsed.outfits.length : 0,
                finalOutfitsCount: outfits.length,
                fallbackMode,
                ownedProductIdsCount: ownedIds.length,
            };

            // STEP 5: Return response with debug metadata
            res.setHeader("X-AI-Source", fallbackMode === "gemini" ? "gemini" : "local-fallback");
            res.json({
                success: true,
                outfits,
                // Backward compatibility fields
                outfit: legacyOutfit,
                suggestions: legacySuggestions,
                explanation: outfits[0]?.whyThisOutfit || parsed?.explanation || "",
                occasion: outfits[0]?.occasion || parsed?.occasion || "",
                weatherTip: parsed?.weatherTip || "",
                stats: {
                    ownedCount: firstOutfit.ownedCount || 0,
                    buyCount: firstOutfit.buyCount || 0,
                    totalBuyPrice: firstOutfit.totalBuyPrice || 0,
                },
                meta: {
                    totalProductsAvailable: products.length,
                    userMeasurementsProvided: !!(userMeasurements?.height && userMeasurements?.weight),
                    closetItemsCount: ownedIds.length,
                    duplicatesFixed: hasDuplicate,
                    generatedAt: new Date().toISOString(),
                },
                debug,
            });
        } catch (err) {
            console.error("[AI outfit-suggest]", err);
            if (err.message?.includes("429") || err.message?.includes("quota")) {
                return res.status(429).json({
                    error: "AI đang bận, vui lòng thử lại sau vài giây",
                    code: "RATE_LIMIT",
                });
            }

            res.status(500).json({
                error: "AI tạm thời không khả dụng",
                code: "AI_ERROR",
                detail: process.env.NODE_ENV === "production" ? undefined : String(err?.message || err),
            });
        }
    });

    return router;
}

module.exports = { createAiRouter };