import { useEffect, useMemo, useState } from 'react';
import './VirtualPersonalClosetDrawer.css';
import VirtualClosetItem from './VirtualClosetItem';

type ClosetSlotCategory = 'tops' | 'bottoms' | 'outerwear' | 'dresses';

type ClosetColorOption = {
    name: string;
    value: string;
    hex?: string;
};

export type ClosetItem = {
    id: string;
    itemId?: string;
    productId?: string | number;
    orderId?: string;
    name: string;
    category: string;
    categoryKey: string;
    slotCategory: ClosetSlotCategory;
    thumbnail: string;
    imageUrl?: string;
    thumbnailUrl?: string;
    purchasedSize?: string;
    purchasedColor?: string;
    availableColors?: ClosetColorOption[];
    availableSizes?: string[];
    model3D?: Record<string, unknown>;
    wornCount?: number;
    lastWornAt?: string;
    purchasedAt?: string;
    isOwned: boolean;
    source: 'order' | 'fallback' | 'import';
};

type ClosetTab = {
    key: string;
    label: string;
    items: ClosetItem[];
};

type SavedOutfitSlot = {
    itemId?: string;
    name?: string;
    thumbnailUrl?: string;
};

type SavedOutfit = {
    _id: string;
    name?: string;
    slots?: {
        tops?: SavedOutfitSlot;
        bottoms?: SavedOutfitSlot;
        outerwear?: SavedOutfitSlot;
        dresses?: SavedOutfitSlot;
    };
    createdAt?: string;
};

type SortMode = 'all' | 'match' | 'newest';

type ProductLike = {
    id?: number | string;
    name?: string;
    category?: string;
};

type ClosetApiItem = {
    itemId?: string;
    orderId?: string;
    productId?: string | number;
    name?: string;
    category?: string;
    img?: string;
    image?: string;
    imageUrl?: string;
    thumbnailUrl?: string;
    purchasedSize?: string;
    purchasedColor?: string;
    availableColors?: ClosetColorOption[];
    availableSizes?: string[];
    model3D?: Record<string, unknown>;
    size?: string;
    color?: string;
    isActive?: boolean;
    wearCount?: number;
    wornCount?: number;
    lastWorn?: string;
    lastWornAt?: string;
    dateAdded?: string;
    purchasedAt?: string;
    source?: 'order' | 'fallback' | 'import';
};

type ClosetApiResponse = {
    items?: ClosetApiItem[];
};

type ProductCatalogItem = {
    id?: number | string;
    productId?: number | string;
    model3D?: {
        colors?: Array<{ name?: string; hex?: string; value?: string }>;
        sizes?: Record<string, unknown>;
    };
};

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const ABSOLUTE_URL_PATTERN = /^(data:|blob:|https?:\/\/)/i;

function createPlaceholderThumb(title: string): string {
    const safeTitle = title.replace(/[&<>]/g, (char) => {
        if (char === '&') return '&amp;';
        if (char === '<') return '&lt;';
        if (char === '>') return '&gt;';
        return char;
    });

    const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='520' height='640' viewBox='0 0 520 640'><defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'><stop offset='0%' stop-color='#f7f1e8'/><stop offset='100%' stop-color='#efe5d7'/></linearGradient></defs><rect width='520' height='640' fill='url(#g)'/><rect x='18' y='18' width='484' height='604' rx='24' fill='none' stroke='#d9c9b5' stroke-width='3'/><text x='50%' y='48%' text-anchor='middle' fill='#6b5a45' font-size='30' font-family='Georgia, serif'>SmartFit Closet</text><text x='50%' y='56%' text-anchor='middle' fill='#8c765c' font-size='20' font-family='Georgia, serif'>${safeTitle}</text></svg>`;
    return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

function inferCategory(input?: string): ClosetSlotCategory {
    const text = String(input || '').trim().toLowerCase();

    if (
        text.includes('dress')
        || text.includes('đầm')
        || text.includes('váy liền')
    ) {
        return 'dresses';
    }

    if (
        text.includes('coat')
        || text.includes('jacket')
        || text.includes('blazer')
        || text.includes('hoodie')
        || text.includes('áo khoác')
    ) {
        return 'outerwear';
    }

    if (
        text.includes('pant')
        || text.includes('jean')
        || text.includes('skirt')
        || text.includes('short')
        || text.includes('quần')
        || text.includes('chân váy')
    ) {
        return 'bottoms';
    }

    return 'tops';
}

function formatCategoryLabel(input?: string): string {
    const value = String(input || '').trim();
    if (!value) {
        return 'Khác';
    }

    return value.replace(/\s+/g, ' ');
}

function normalizeCategoryKey(input?: string): string {
    return formatCategoryLabel(input).toLowerCase();
}

function scoreStylistMatch(item: ClosetItem, viewedProduct?: ProductLike): number {
    if (!viewedProduct) {
        return 0;
    }

    const viewedCategory = inferCategory(viewedProduct.category || viewedProduct.name);
    const viewedName = String(viewedProduct.name || '').toLowerCase();
    const closetName = item.name.toLowerCase();

    let score = 0.36;

    if (viewedCategory !== item.slotCategory) {
        score += 0.22;
    }

    const sharedWords = ['linen', 'denim', 'silk', 'wool', 'basic', 'classic', 'formal', 'casual', 'black', 'white', 'beige'];
    sharedWords.forEach((word) => {
        if (viewedName.includes(word) && closetName.includes(word)) {
            score += 0.04;
        }
    });

    return Math.min(0.95, Number(score.toFixed(2)));
}

function resolveAssetUrl(raw?: string): string {
    const value = String(raw || '').trim();
    if (!value) {
        return '';
    }

    if (ABSOLUTE_URL_PATTERN.test(value)) {
        return value;
    }

    if (value.startsWith('//')) {
        return `https:${value}`;
    }

    const normalized = value.replace(/\\/g, '/').replace(/^\.\//, '');
    const withoutPublicPrefix = normalized.startsWith('public/') ? normalized.slice('public/'.length) : normalized;
    const browserOrigin = typeof window !== 'undefined' ? window.location.origin : API_URL;
    const apiBase = API_URL.replace(/\/$/, '');

    if (withoutPublicPrefix.startsWith('/')) {
        return `${browserOrigin}${withoutPublicPrefix}`;
    }

    if (
        withoutPublicPrefix.startsWith('assets/')
        || withoutPublicPrefix.startsWith('models/')
        || withoutPublicPrefix.startsWith('uploads/')
    ) {
        return `${browserOrigin}/${withoutPublicPrefix}`;
    }

    // Skip unresolved source paths that are not publicly served in production.
    if (withoutPublicPrefix.startsWith('src/')) {
        return '';
    }

    return `${apiBase}/${withoutPublicPrefix}`;
}

function mapProductColors(model3D?: ProductCatalogItem['model3D']): ClosetColorOption[] {
    const colors = model3D?.colors;
    if (!Array.isArray(colors) || colors.length === 0) {
        return [];
    }

    const normalizedColors: ClosetColorOption[] = [];

    colors.forEach((color) => {
        const name = String(color?.name || color?.value || color?.hex || '').trim();
        const value = String(color?.hex || color?.value || color?.name || '').trim();
        if (!name || !value) {
            return;
        }

        normalizedColors.push({
            name,
            value,
            hex: String(color?.hex || '').trim() || undefined,
        });
    });

    return normalizedColors;
}

function mapProductSizes(model3D?: ProductCatalogItem['model3D']): string[] {
    const sizes = model3D?.sizes;
    return sizes ? Object.keys(sizes).map((size) => String(size).trim()).filter(Boolean) : [];
}

function mapApiClosetItems(rawItems: ClosetApiItem[], products: ProductCatalogItem[] = []): ClosetItem[] {
    const dedupe = new Map<string, ClosetItem>();
    const productLookup = new Map<string, ProductCatalogItem>();

    products.forEach((product) => {
        const keys = [product.id, product.productId].filter((value) => value !== undefined && value !== null);
        keys.forEach((value) => {
            productLookup.set(String(value), product);
        });
    });

    rawItems.forEach((item, index) => {
        if (item.isActive === false) {
            return;
        }

        const name = String(item.name || '').trim() || `Purchased Item ${index + 1}`;
        const seed = String(item.itemId || item.productId || `${index}`);
        const id = `closet-${seed}`;
        const product = productLookup.get(String(item.productId || item.itemId || ''));
        const productModel3D = product?.model3D;

        if (dedupe.has(id)) {
            return;
        }

        dedupe.set(id, {
            id,
            itemId: item.itemId,
            productId: item.productId,
            orderId: item.orderId,
            name,
            thumbnail: resolveAssetUrl(
                String(item.thumbnailUrl || item.imageUrl || item.img || item.image || '').trim(),
            ) || createPlaceholderThumb(name),
            imageUrl: resolveAssetUrl(String(item.imageUrl || item.img || item.image || '').trim()) || undefined,
            thumbnailUrl: resolveAssetUrl(String(item.thumbnailUrl || item.imageUrl || item.img || '').trim()) || undefined,
            category: formatCategoryLabel(item.category || name),
            categoryKey: normalizeCategoryKey(item.category || name),
            slotCategory: inferCategory(item.category || name),
            purchasedSize: String(item.purchasedSize || item.size || '').trim() || undefined,
            purchasedColor: String(item.purchasedColor || item.color || '').trim() || undefined,
            availableColors: mapProductColors(productModel3D),
            availableSizes: mapProductSizes(productModel3D),
            model3D: item.model3D || productModel3D || undefined,
            wornCount: Number(item.wornCount ?? item.wearCount ?? 0),
            lastWornAt: String(item.lastWornAt || item.lastWorn || '').trim() || undefined,
            purchasedAt: String(item.purchasedAt || item.dateAdded || '').trim() || undefined,
            isOwned: true,
            source: item.source || 'order',
        });
    });

    return Array.from(dedupe.values());
}

type VirtualPersonalClosetDrawerProps = {
    viewedProduct?: ProductLike;
    onWearItem?: (item: ClosetItem, selectedColor?: string, selectedSize?: string) => void;
    onViewDetails?: (item: ClosetItem) => void;
    onApplySavedOutfit?: (outfit: SavedOutfit) => void;
    savedOutfitsCount?: number;
    isOpen?: boolean;
    onClose?: () => void;
};

export default function VirtualPersonalClosetDrawer({
    viewedProduct,
    onWearItem,
    onViewDetails,
    onApplySavedOutfit,
    savedOutfitsCount = 0,
    isOpen = false,
    onClose,
}: VirtualPersonalClosetDrawerProps) {
    const [items, setItems] = useState<ClosetItem[]>([]);
    const [activeTab, setActiveTab] = useState<string>('');
    const [sortMode, setSortMode] = useState<SortMode>('all');
    const [savedOutfits, setSavedOutfits] = useState<SavedOutfit[]>([]);

    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

    useEffect(() => {
        let mounted = true;

        const hydrateCloset = async () => {
            const token = localStorage.getItem('token');
            if (!token) {
                if (mounted) {
                    setItems([]);
                    setSavedOutfits([]);
                }
                return;
            }

            try {
                const [closetResponse, productsResponse] = await Promise.all([
                    fetch(`${API_URL}/api/virtual-closet`, {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    }),
                    fetch(`${API_URL}/api/products`),
                ]);

                if (!closetResponse.ok) {
                    throw new Error('Unable to load closet data');
                }

                const data = await closetResponse.json();
                const apiResponse = (data || {}) as ClosetApiResponse;
                const productsData = productsResponse.ok ? await productsResponse.json() : [];
                const products = Array.isArray(productsData) ? productsData : [];
                const mapped = mapApiClosetItems(Array.isArray(apiResponse.items) ? apiResponse.items : [], products);

                if (mounted) {
                    setItems(mapped);
                }
            } catch {
                if (mounted) {
                    setItems([]);
                }
            }
        };

        hydrateCloset();

        return () => {
            mounted = false;
        };
    }, []);

    useEffect(() => {
        let mounted = true;

        const hydrateSavedOutfits = async () => {
            if (!token) {
                if (mounted) {
                    setSavedOutfits([]);
                }
                return;
            }

            try {
                const response = await fetch(`${API_URL}/api/saved-outfits`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });

                if (!response.ok) {
                    throw new Error('Unable to load saved outfits');
                }

                const data = await response.json();
                const outfits = Array.isArray(data?.outfits) ? data.outfits : [];
                if (mounted) {
                    setSavedOutfits(outfits);
                }
            } catch {
                if (mounted) {
                    setSavedOutfits([]);
                }
            }
        };

        hydrateSavedOutfits();

        return () => {
            mounted = false;
        };
    }, [token]);

    const groupedCategories = useMemo<ClosetTab[]>(() => {
        const grouped = new Map<string, { label: string; items: ClosetItem[] }>();

        items.forEach((item) => {
            const key = item.categoryKey || normalizeCategoryKey(item.category);
            const existing = grouped.get(key);
            if (existing) {
                existing.items.push(item);
                return;
            }

            grouped.set(key, {
                label: item.category || formatCategoryLabel(item.category),
                items: [item],
            });
        });

        return Array.from(grouped.entries()).map(([key, value]) => ({
            key,
            label: value.label,
            items: value.items,
        }));
    }, [items]);

    const tabs = useMemo<ClosetTab[]>(() => {
        const baseTabs = [...groupedCategories];
        baseTabs.push({
            key: '__saved__',
            label: 'Saved',
            items: [],
        });
        return baseTabs;
    }, [groupedCategories]);

    useEffect(() => {
        if (!tabs.length) {
            setActiveTab('');
            return;
        }

        const hasActiveTab = tabs.some((group) => group.key === activeTab);
        if (!hasActiveTab) {
            setActiveTab(tabs[0].key);
        }
    }, [activeTab, tabs]);

    const activeGroup = tabs.find((group) => group.key === activeTab) || tabs[0];
    const activeItems = activeGroup?.items || [];

    const sortedItems = useMemo(() => {
        if (activeGroup?.key === '__saved__') {
            return [];
        }

        if (sortMode === 'match') {
            return [...activeItems].sort((a, b) =>
                scoreStylistMatch(b, viewedProduct) - scoreStylistMatch(a, viewedProduct),
            );
        }

        if (sortMode === 'newest') {
            return [...activeItems].sort((a, b) => {
                const aTime = new Date(a.purchasedAt || 0).getTime();
                const bTime = new Date(b.purchasedAt || 0).getTime();
                return bTime - aTime;
            });
        }

        return activeItems;
    }, [activeGroup?.key, activeItems, sortMode, viewedProduct]);

    const totalClosetItems = items.length;
    const wornItems = items.filter((item) => (item.wornCount ?? 0) > 0).length;

    const handleWearItem = (item: ClosetItem, selectedColor?: string, selectedSize?: string) => {
        setItems((prev) => prev.map((entry) => {
            if (entry.itemId !== item.itemId) {
                return entry;
            }
            return {
                ...entry,
                wornCount: (entry.wornCount ?? 0) + 1,
                lastWornAt: new Date().toISOString(),
            };
        }));
        onWearItem?.(item, selectedColor, selectedSize);
    };

    return (
        <aside
            className={`vpc-drawer vpc-drawer--sidebar ${isOpen ? 'vpc-drawer--open' : ''}`}
            aria-label="Virtual Personal Closet - SmartFit"
            role="region"
            data-testid="closet-drawer"
        >
            {/* Drawer Content */}
            <div className="vpc-drawer__content">
                {/* Header */}
                <header className="closet-header">
                    <div className="closet-header-top">
                        <div>
                            <span className="closet-brand">SMARTFIT</span>
                            <h2 className="closet-title">Your Closet</h2>
                        </div>
                        <button
                            type="button"
                            className="closet-close"
                            onClick={onClose}
                            aria-label="Close closet drawer"
                            title="Close"
                        >
                            ✕
                        </button>
                    </div>

                        <div className="closet-stats">
                            <div className="closet-stat">
                                <span className="closet-stat-num">{totalClosetItems}</span>
                                <span className="closet-stat-lbl">Tổng đồ</span>
                            </div>
                            <div className="closet-stat">
                                <span className="closet-stat-num">{wornItems}</span>
                                <span className="closet-stat-lbl">Đã mặc thử</span>
                            </div>
                            <div className="closet-stat">
                                <span className="closet-stat-num">{savedOutfitsCount || savedOutfits.length}</span>
                                <span className="closet-stat-lbl">Outfit lưu</span>
                            </div>
                        </div>
                </header>

                {/* Category Tabs */}
                <div className="closet-tabs" role="tablist" aria-label="Closet categories">
                    {tabs.map((category) => {
                        const isActive = activeTab === category.key;
                        const count = category.key === '__saved__' ? savedOutfits.length : category.items.length;

                        return (
                            <div
                                key={category.key}
                                className={`closet-tab${isActive ? ' closet-tab--on' : ''}`}
                                onClick={() => setActiveTab(category.key)}
                            >
                                {category.label}
                                <span className="closet-tab-count">{count}</span>
                            </div>
                        );
                    })}
                </div>

                {activeGroup?.key !== '__saved__' && (
                    <div className="drawer-chips">
                        {(['all', 'match', 'newest'] as SortMode[]).map((mode) => (
                            <button
                                key={mode}
                                type="button"
                                className={`chip${sortMode === mode ? ' chip--on' : ''}`}
                                onClick={() => setSortMode(mode)}
                            >
                                {mode === 'all' ? 'Tất cả' : mode === 'match' ? 'Match cao' : 'Mới nhất'}
                            </button>
                        ))}
                    </div>
                )}

                {/* Items Grid */}
                <div className="closet-items-grid" role="tabpanel">
                    {activeGroup?.key !== '__saved__' && sortedItems.length === 0 && activeGroup && (
                        <div className="closet-empty">Chưa có sản phẩm nào<br />trong danh mục này</div>
                    )}

                    {activeGroup?.key === '__saved__' && savedOutfits.length === 0 && (
                        <div className="closet-empty">Chưa có outfit đã lưu.</div>
                    )}

                    {activeGroup?.key === '__saved__' && savedOutfits.map((outfit) => (
                        <button
                            key={outfit._id}
                            type="button"
                            className="vpc-saved-outfit"
                            onClick={() => onApplySavedOutfit?.(outfit)}
                        >
                            <span className="vpc-saved-outfit__name">{outfit.name || 'Outfit chưa đặt tên'}</span>
                            <span className="vpc-saved-outfit__date">{new Date(outfit.createdAt || Date.now()).toLocaleDateString('vi-VN')}</span>
                        </button>
                    ))}

                    {activeGroup?.key !== '__saved__' && sortedItems.map((item) => {
                        const score = scoreStylistMatch(item, viewedProduct);

                        return (
                            <VirtualClosetItem
                                key={item.id}
                                item={item}
                                matchScore={Math.round(score * 100)}
                                onWear={handleWearItem}
                                onViewDetails={onViewDetails}
                            />
                        );
                    })}
                </div>
            </div>
        </aside>
    );
}
