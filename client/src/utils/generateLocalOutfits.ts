/**
 * Local Outfit Generation Engine
 * Used as fallback when Gemini API is unavailable or times out
 * Generates outfit suggestions using rule-based algorithm without external API calls
 */
import type { OutfitFilter, OutfitResult, OutfitItem } from '../types/outfit';

interface Product {
    _id?: string;
    id?: string;
    name: string;
    category: string;
    price: number;
    imageUrl?: string;
    img?: string;
    color?: string;
    aiStylist?: {
        styles?: string[];
        occasions?: string[];
        colorTone?: string;
    };
    productId?: string;
}

interface ClosetItem {
    _id?: string;
    id?: string;
    productId?: string;
    name: string;
    category: string;
    imageUrl?: string;
    img?: string;
    color?: string;
}

function mapCategory(rawCategory: string): 'top' | 'bottom' | 'shoes' | 'accessory' | 'outerwear' {
    const cat = rawCategory?.toLowerCase() || '';

    if (cat.includes('áo') || cat.includes('shirt') || cat.includes('top') || cat.includes('hoodie') || cat.includes('croptop')) {
        return 'top';
    }
    if (cat.includes('quần') || cat.includes('pants') || cat.includes('jeans') || cat.includes('chân váy') || cat.includes('váy') || cat.includes('dress')) {
        return 'bottom';
    }
    if (cat.includes('giày') || cat.includes('shoes') || cat.includes('sneaker') || cat.includes('dép')) {
        return 'shoes';
    }
    if (cat.includes('khoác') || cat.includes('jacket') || cat.includes('coat') || cat.includes('outerwear')) {
        return 'outerwear';
    }
    if (cat.includes('phụ kiện') || cat.includes('accessory') || cat.includes('túi') || cat.includes('nón')) {
        return 'accessory';
    }

    return 'accessory';
}

function calculateScore(product: Product, filter: OutfitFilter): number {
    let score = 0;

    // Style match
    if (product.aiStylist?.styles) {
        filter.styles.forEach(style => {
            if (product.aiStylist?.styles?.some(s => s.toLowerCase().includes(style.toLowerCase()))) {
                score += 3;
            }
        });
    }

    // Occasion match
    if (product.aiStylist?.occasions) {
        filter.occasions.forEach(occasion => {
            if (product.aiStylist?.occasions?.some(o => o.toLowerCase().includes(occasion.toLowerCase()))) {
                score += 3;
            }
        });
    }

    // Color tone match
    if (product.aiStylist?.colorTone && filter.colors.length > 0) {
        if (filter.colors.some(c => c.toLowerCase().includes(product.aiStylist?.colorTone?.toLowerCase() || ''))) {
            score += 2;
        }
    }

    return score;
}

export function generateLocalOutfits(
    filters: OutfitFilter,
    closetItems: ClosetItem[],
    shopItems: Product[]
): OutfitResult[] {
    const ownedIds = new Set<string>(
        closetItems.map(item => String(item._id || item.id || item.productId || ''))
    );

    // Step 1: Filter by budget
    const affordable = shopItems.filter(p => (p.price || 0) <= (filters.budget || 2000000));

    // Step 2: Score products based on filter preferences
    const scored = affordable
        .map(p => ({
            ...p,
            score: calculateScore(p, filters)
        }))
        .sort((a, b) => b.score - a.score);

    // Step 3: Separate by category
    const tops = scored.filter(p => mapCategory(p.category) === 'top');
    const bottoms = scored.filter(p => mapCategory(p.category) === 'bottom');
    const shoes = scored.filter(p => mapCategory(p.category) === 'shoes');

    // Step 4: Generate 3 outfits with no duplicate products
    const usedIds = new Set<string>();
    const outfits: OutfitResult[] = [];
    const styleNames = ['Casual Everyday', 'Minimal Chic', 'Street Style'];

    for (let i = 0; i < 3; i++) {
        const top = tops.find(p => !usedIds.has(String(p._id || p.id || '')));
        const bottom = bottoms.find(p => !usedIds.has(String(p._id || p.id || '')));
        const shoe = shoes.find(p => !usedIds.has(String(p._id || p.id || '')));

        // Need at least top + bottom
        if (!top || !bottom) continue;

        // Mark as used
        [top, bottom, shoe].filter(Boolean).forEach(p => {
            usedIds.add(String(p._id || p.id || ''));
        });

        // Build items array
        const items: OutfitItem[] = [top, bottom, shoe]
            .filter(Boolean)
            .map(p => {
                const productId = String(p?._id || p?.id || p?.productId || '');
                const isOwned = ownedIds.has(productId);

                return {
                    id: productId,
                    name: p?.name || 'Sản phẩm',
                    category: mapCategory(p?.category || ''),
                    price: p?.price || 0,
                    imageUrl: p?.imageUrl || p?.img || 'https://via.placeholder.com/300x400?text=No+Image',
                    productUrl: `/product/${productId}`,
                    color: p?.color || '#888888',
                    source: isOwned ? 'closet' : 'shop',
                    suggestedSize: 'M', // Default size for local engine
                    sizeReason: 'Kích thước mặc định',
                    owned: isOwned,
                    slot: mapCategory(p?.category || ''),
                };
            });

        if (items.length < 2) continue;

        // Calculate totals
        const totalPrice = items.reduce((sum, item) => sum + item.price, 0);
        const ownedCount = items.filter(item => item.owned).length;
        const buyCount = items.filter(item => !item.owned).length;
        const totalBuyPrice = items.filter(item => !item.owned).reduce((sum, item) => sum + item.price, 0);

        outfits.push({
            id: `local-${i + 1}`,
            name: styleNames[i] || `Outfit ${i + 1}`,
            matchScore: Math.max(50 + Math.random() * 40, 60), // 60-100 range for local suggestions
            items,
            totalPrice,
            aiReason: `Được gợi ý bởi hệ thống nội bộ dựa trên bộ lọc của bạn (${filters.styles.join(', ') || 'Phong cách'})`,
            stats: {
                ownedCount,
                buyCount,
                totalBuyPrice,
            },
        });
    }

    return outfits;
}
