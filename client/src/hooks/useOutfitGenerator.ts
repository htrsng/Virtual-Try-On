/**
 * Custom Hook: useOutfitGenerator
 * Implements Circuit Breaker pattern for resilient outfit generation
 * 
 * Flow:
 * 1. Try Gemini API (with 8s timeout) — SUCCESS → use Gemini outfits
 * 2. Gemini timeout/error → CIRCUIT BREAKER TRIGGERS
 * 3. Try Local Engine — SUCCESS → use local outfits + set fallbackMode = true
 * 4. Local Engine also fails → FALLBACK ERROR → show error message
 */

import { useState, useCallback, useEffect } from 'react';
import axios from 'axios';
import type { OutfitFilter, OutfitResult } from '../types/outfit';
import { fetchWithTimeout } from '../utils/fetchWithTimeout';
import { generateLocalOutfits } from '../utils/generateLocalOutfits';

type Product = {
    _id?: string;
    id?: string;
    name?: string;
    price?: number;
    category?: string;
    imageUrl?: string;
    aiStylist?: {
        styles?: string[];
        occasions?: string[];
        colorTone?: string;
    };
};

interface UseOutfitGeneratorOptions {
    closetItems: any[];
    shopItems?: any[];
    userId?: string;
    avatarData?: any;
}

// Helper: Get authentication token from localStorage
const getToken = (): string => {
    return (
        localStorage.getItem('token') ||
        localStorage.getItem('accessToken') ||
        localStorage.getItem('authToken') ||
        localStorage.getItem('jwt') ||
        ''
    );
};
// Helper: Generate fallback prompt from filter selections when user doesn't provide description
const generateFallbackPrompt = (filters: OutfitFilter): string => {
    const parts: string[] = [];

    // Map occasions to Vietnamese descriptions
    const occasionMap: Record<string, string> = {
        cafe: 'đi cafe',
        office: 'công sở',
        street: 'dạo phố',
        party: 'dự tiệc',
        travel: 'du lịch',
        date: 'hẹn hò',
    };

    if (filters.occasions.length > 0) {
        const occasionTexts = filters.occasions.map(o => occasionMap[o] || o);
        parts.push(`Tôi muốn mặc ${occasionTexts.join(' hoặc ')}`);
    }

    if (filters.styles.length > 0) {
        parts.push(`phong cách ${filters.styles.join(', ')}`);
    }

    if (filters.colors.length > 0) {
        // Color hex map
        const colorNames: Record<string, string> = {
            '#1a1a1a': 'đen',
            '#ffffff': 'trắng',
            '#93c5fd': 'xanh nhạt',
            '#f9a8d4': 'hồng',
            '#86efac': 'xanh lá',
            '#fcd34d': 'vàng',
            '#fdba74': 'cam',
            '#c4b5fd': 'tím',
        };
        const colorTexts = filters.colors.map(c => colorNames[c] || c);
        parts.push(`tông màu ${colorTexts.join(', ')}`);
    }

    // Combine parts into a sentence
    if (parts.length === 0) {
        return 'Gợi ý cho tôi một bộ trang phục đẹp';
    }

    // "Tôi muốn mặc... + phong cách... + tông màu..."
    return parts.join(', ');
};

const normalizeText = (value = ''): string =>
    value
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');

const productMatchesFilter = (product: Product, filters: OutfitFilter): boolean => {
    const budgetMatch = (product.price ?? 0) <= filters.budget;
    if (!budgetMatch) {
        return false;
    }

    const styleMatch = filters.styles.length === 0
        ? true
        : filters.styles.some((style) =>
            product.aiStylist?.styles?.some((candidate) =>
                normalizeText(candidate).includes(normalizeText(style))
            )
        );

    const occasionMatch = filters.occasions.length === 0
        ? true
        : filters.occasions.some((occasion) =>
            product.aiStylist?.occasions?.some((candidate) =>
                normalizeText(candidate).includes(normalizeText(occasion))
            )
        );

    return styleMatch || occasionMatch;
};

const buildGeminiProducts = (shopItems: Product[], filters: OutfitFilter): Product[] => {
    const topKeywords = ['áo', 'shirt', 'top', 'blouse', 'hoodie', 'crop'];
    const bottomKeywords = ['quần', 'váy', 'jean', 'pant', 'skirt', 'short'];
    const shoeKeywords = ['giày', 'dép', 'sneaker', 'boot', 'sandal'];

    const filtered = shopItems.filter((product) => productMatchesFilter(product, filters));

    const pickCategory = (items: Product[], keywords: string[]) =>
        items
            .filter((product) => {
                const category = normalizeText(product.category ?? '');
                const name = normalizeText(product.name ?? '');
                return keywords.some((keyword) =>
                    category.includes(normalizeText(keyword)) || name.includes(normalizeText(keyword))
                );
            })
            .slice(0, 10);

    const merged = [
        ...pickCategory(filtered, topKeywords),
        ...pickCategory(filtered, bottomKeywords),
        ...pickCategory(filtered, shoeKeywords),
    ];

    const unique: Product[] = [];
    const seen = new Set<string>();

    merged.forEach((product) => {
        const id = String(product._id ?? product.id ?? product.name ?? Math.random());
        if (seen.has(id)) {
            return;
        }
        seen.add(id);
        unique.push(product);
    });

    return unique.slice(0, 30);
};

export function useOutfitGenerator(options: UseOutfitGeneratorOptions) {
    const { closetItems, shopItems: initialShopItems = [], userId, avatarData } = options;

    const [outfits, setOutfits] = useState<OutfitResult[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string>('');
    const [fallbackMode, setFallbackMode] = useState(false);
    const [shopItems, setShopItems] = useState<Product[]>(initialShopItems);
    const [shopLoading, setShopLoading] = useState(true);

    useEffect(() => {
        let mounted = true;
        const abortController = new AbortController();

        const fetchShopItems = async () => {
            try {
                const token = getToken();
                const response = await axios.get('/api/products', {
                    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
                    params: { limit: 100, isActive: true },
                    signal: abortController.signal,
                });

                const products =
                    response.data?.products ??
                    response.data?.data ??
                    response.data?.items ??
                    response.data ??
                    [];

                if (!mounted) {
                    return;
                }

                const normalizedProducts = Array.isArray(products) ? products : [];
                setShopItems(normalizedProducts);
                console.log('[ShopItems] Loaded:', normalizedProducts.length, 'products');
            } catch (err) {
                if (!mounted) {
                    return;
                }

                if (axios.isAxiosError(err) && err.code === 'ERR_CANCELED') {
                    return;
                }

                console.error('[ShopItems] Failed to fetch:', err);
                setShopItems([]);
            } finally {
                if (mounted) {
                    setShopLoading(false);
                }
            }
        };

        fetchShopItems();

        return () => {
            mounted = false;
            abortController.abort();
        };
    }, []);

    const handleGenerateOutfit = useCallback(
        async (filters: OutfitFilter) => {
            if (shopLoading) {
                setError('Đang tải danh sách sản phẩm, vui lòng thử lại...');
                return;
            }

            if (shopItems.length === 0) {
                setError('Không có sản phẩm nào trong hệ thống.');
                return;
            }

            setIsLoading(true);
            setError('');
            setFallbackMode(false);
            setOutfits([]);

            try {
                // ─── HAPPY PATH: Try Gemini API with timeout ───
                console.info('[AI] Attempting Gemini API...');

                const token = getToken();
                if (!token) {
                    console.warn('[AI] No authentication token found. Request may fail.');
                }

                const geminiProducts = buildGeminiProducts(shopItems, filters);
                console.log('[Gemini] Sending', geminiProducts.length, 'products (pre-filtered)');

                const response = await fetchWithTimeout(
                    '/api/ai/outfit-suggest',
                    {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': token ? `Bearer ${token}` : ''
                        },
                        body: JSON.stringify({
                            ...filters,
                            userPrompt: filters.description || generateFallbackPrompt(filters),
                            userId,
                            products: geminiProducts.map((product) => ({
                                _id: product._id,
                                id: product.id,
                                name: product.name,
                                price: product.price,
                                category: product.category,
                                imageUrl: product.imageUrl,
                                aiStylist: product.aiStylist,
                            })),
                        }),
                    },
                    8000 // 8 second timeout
                );

                // ─── Check for server-side Gemini timeout (503 + GEMINI_TIMEOUT code) ───
                if (!response.ok) {
                    const responseData = await response.json().catch(() => ({}));

                    // Server signaled Gemini timeout → trigger local engine immediately
                    if (response.status === 503 && responseData.code === 'GEMINI_TIMEOUT') {
                        console.warn('[AI] Server: Gemini timed out at 10s. Triggering local engine fallback.');
                        throw new Error('SERVER_GEMINI_TIMEOUT');
                    }

                    throw new Error(`API returned ${response.status}: ${responseData.message || responseData.error || 'Unknown error'}`);
                }

                const data = await response.json();

                // Check if Gemini returned valid outfits
                if (!data.outfits || data.outfits.length === 0) {
                    throw new Error('Gemini returned empty outfits');
                }

                setOutfits(data.outfits);
                console.info('[AI] ✓ Gemini API succeeded. Outfits loaded:', data.outfits.length);

            } catch (err: any) {
                // ─── FALLBACK: Circuit Breaker Triggered ───
                console.warn('[AI] ⚠ Circuit Breaker activated. Reason:', err.message);
                console.info('[AI] Attempting Local Outfit Engine...');

                try {
                    // Try generating outfits locally without Gemini
                    const localOutfits = generateLocalOutfits(filters, closetItems, shopItems);

                    if (localOutfits.length > 0) {
                        setOutfits(localOutfits);
                        setFallbackMode(true); // Signal to UI that we're using fallback
                        console.info('[AI] ✓ Local Engine succeeded. Outfits generated:', localOutfits.length);
                    } else {
                        throw new Error('Local engine generated no outfits');
                    }

                } catch (localErr: any) {
                    // ─── TOTAL FAILURE: Both Gemini and Local Engine failed ───
                    console.error('[AI] ✗ Both Gemini and Local Engine failed:', localErr.message);
                    setError(
                        'Hệ thống tạm thời gián đoạn. Vui lòng thử lại sau hoặc điều chỉnh bộ lọc.'
                    );
                    setOutfits([]);
                }

            } finally {
                setIsLoading(false);
            }
        },
        [closetItems, shopItems, userId]
    );

    return {
        outfits,
        isLoading,
        error,
        fallbackMode,
        shopLoading,
        shopItems,
        handleGenerateOutfit,
        setOutfits,
        setError,
        setFallbackMode,
    };
}
