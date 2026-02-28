import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
// @ts-ignore – AuthContext is JSX without declarations
import { useAuth } from '../contexts/AuthContext';
import { fallbackSuggestions } from '../data/initialData';
import './CartPage.css';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */
type PriceValue = number | string;

interface CartItemType {
    id: number | string;
    name: string;
    price: PriceValue;
    quantity: number;
    size: string;
    cartId: number;
    img?: string;
    image?: string;
    category?: string;
    model3D?: { enable?: boolean;[k: string]: unknown };
    [key: string]: unknown;
}

interface SuggestionProduct {
    id: number | string;
    name: string;
    price: PriceValue;
    img?: string;
    image?: string;
    discount?: number;
    category?: string;
    model3D?: { enable?: boolean;[k: string]: unknown };
    [key: string]: unknown;
}

interface CartPageProps {
    cartItems: CartItemType[];
    onRemove: (cartId: number) => void;
    onUpdateQuantity: (cartId: number, amount: number) => void;
    onAddToCart?: (product: SuggestionProduct, size?: string) => void;
    showToast: (msg: string, type?: string) => void;
    suggestionProducts?: SuggestionProduct[];
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */
const parsePrice = (price: PriceValue): number => {
    if (typeof price === 'number') return price;
    return parseInt(String(price).replace(/\./g, '').replace(' đ', '').replace(/,/g, ''), 10) || 0;
};

const fmt = (n: number) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n);

/* ------------------------------------------------------------------ */
/*  Skeleton placeholder while loading                                 */
/* ------------------------------------------------------------------ */
const CartSkeleton: React.FC = () => (
    <div className="cp-skeleton-wrap">
        {[1, 2, 3].map(i => (
            <div key={i} className="cp-skeleton-row">
                <div className="cp-skel cp-skel-check" />
                <div className="cp-skel cp-skel-img" />
                <div className="cp-skel-info">
                    <div className="cp-skel cp-skel-title" />
                    <div className="cp-skel cp-skel-sub" />
                </div>
                <div className="cp-skel cp-skel-price" />
            </div>
        ))}
    </div>
);

/* ------------------------------------------------------------------ */
/*  Empty-state illustration                                           */
/* ------------------------------------------------------------------ */
const EmptyCart: React.FC = () => (
    <div className="cp-empty">
        <div className="cp-empty-icon">
            <svg width="120" height="120" viewBox="0 0 120 120" fill="none">
                <circle cx="60" cy="60" r="58" stroke="var(--cp-accent)" strokeWidth="2" opacity=".18" />
                <path d="M35 45h6l8 35h30l7-25H47" stroke="var(--cp-accent)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                <circle cx="55" cy="90" r="4" fill="var(--cp-accent)" opacity=".6" />
                <circle cx="79" cy="90" r="4" fill="var(--cp-accent)" opacity=".6" />
                <line x1="58" y1="60" x2="72" y2="60" stroke="var(--cp-accent)" strokeWidth="2" opacity=".35" strokeLinecap="round" />
                <line x1="65" y1="53" x2="65" y2="67" stroke="var(--cp-accent)" strokeWidth="2" opacity=".35" strokeLinecap="round" />
            </svg>
        </div>
        <h2 className="cp-empty-title">Giỏ hàng đang trống</h2>
        <p className="cp-empty-sub">Hãy khám phá bộ sưu tập và thêm sản phẩm yêu thích!</p>
        <Link to="/" className="cp-empty-cta">
            <span>Khám phá ngay</span>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
        </Link>
    </div>
);

/* ------------------------------------------------------------------ */
/*  Suggestion card                                                    */
/* ------------------------------------------------------------------ */
const SuggestionCard: React.FC<{
    product: SuggestionProduct;
    matchWith?: string;
    onAdd?: (p: SuggestionProduct) => void;
    onTryOutfit?: (p: SuggestionProduct) => void;
}> = ({ product, matchWith, onAdd, onTryOutfit }) => {
    const price = parsePrice(product.price);
    const has3D = product.model3D?.enable;

    return (
        <div className="cp-sug-card">
            <div className="cp-sug-img-wrap">
                <img
                    src={product.img || product.image || ''}
                    alt={product.name}
                    className="cp-sug-img"
                    loading="lazy"
                />
                {product.discount && product.discount > 0 && (
                    <span className="cp-sug-badge">-{product.discount}%</span>
                )}
                {has3D && <span className="cp-sug-badge-3d">3D</span>}
            </div>
            {matchWith && (
                <span className="cp-sug-match-tag">Match tốt với {matchWith}</span>
            )}
            <div className="cp-sug-body">
                <p className="cp-sug-name">{product.name}</p>
                <p className="cp-sug-price">{fmt(price)}</p>
            </div>
            <div className="cp-sug-actions">
                {onTryOutfit && (
                    <button className="cp-sug-try" onClick={() => onTryOutfit(product)} title="Thử vào outfit">
                        👗 Thử
                    </button>
                )}
                {onAdd && (
                    <button className="cp-sug-add" onClick={() => onAdd(product)} title="Thêm vào giỏ">
                        + Thêm vào giỏ
                    </button>
                )}
            </div>
        </div>
    );
};

/* ------------------------------------------------------------------ */
/*  Horizontal scroll wrapper with arrows                              */
/* ------------------------------------------------------------------ */
const HScroll: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const ref = useRef<HTMLDivElement>(null);
    const [canL, setCanL] = useState(false);
    const [canR, setCanR] = useState(false);

    const check = useCallback(() => {
        const el = ref.current;
        if (!el) return;
        setCanL(el.scrollLeft > 2);
        setCanR(el.scrollLeft + el.clientWidth < el.scrollWidth - 2);
    }, []);

    useEffect(() => { check(); }, [check, children]);

    const scroll = (dir: number) => {
        ref.current?.scrollBy({ left: dir * 260, behavior: 'smooth' });
        setTimeout(check, 350);
    };

    return (
        <div className="cp-hscroll-wrap">
            {canL && (
                <button className="cp-hscroll-arr cp-hscroll-l" onClick={() => scroll(-1)} aria-label="Scroll left">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M15 18l-6-6 6-6" /></svg>
                </button>
            )}
            <div className="cp-hscroll" ref={ref} onScroll={check}>
                {children}
            </div>
            {canR && (
                <button className="cp-hscroll-arr cp-hscroll-r" onClick={() => scroll(1)} aria-label="Scroll right">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M9 18l6-6-6-6" /></svg>
                </button>
            )}
        </div>
    );
};

/* ================================================================== */
/*  MAIN COMPONENT                                                     */
/* ================================================================== */
export default function CartPage({
    cartItems,
    onRemove,
    onUpdateQuantity,
    onAddToCart,
    showToast,
    suggestionProducts,
}: CartPageProps) {
    const navigate = useNavigate();
    const { isAuthenticated, loading: authLoading } = useAuth();
    const hasRedirected = useRef(false);

    /* ---- selection -------------------------------------------------- */
    const [selected, setSelected] = useState<Record<number, boolean>>({});
    const [isLoading, setIsLoading] = useState(true);
    const [removingId, setRemovingId] = useState<number | null>(null);

    // initialise selection (default: none)
    useEffect(() => {
        const s: Record<number, boolean> = {};
        cartItems.forEach(it => { s[it.cartId] = false; });
        setSelected(s);
        // fake loading for UX polish
        const t = setTimeout(() => setIsLoading(false), 400);
        return () => clearTimeout(t);
    }, [cartItems]);

    // auth guard
    useEffect(() => {
        if (authLoading) return;
        if (hasRedirected.current) return;
        if (!isAuthenticated) {
            hasRedirected.current = true;
            showToast('Vui lòng đăng nhập để xem giỏ hàng!', 'warning');
            navigate('/login', { replace: true });
        }
    }, [authLoading, isAuthenticated, navigate, showToast]);

    /* ---- derived ---------------------------------------------------- */
    const selectedCount = useMemo(
        () => Object.values(selected).filter(Boolean).length,
        [selected],
    );
    const allSelected = selectedCount === cartItems.length && cartItems.length > 0;

    const totalPrice = useMemo(
        () =>
            cartItems.reduce((acc, it) => {
                if (selected[it.cartId]) {
                    return acc + parsePrice(it.price) * it.quantity;
                }
                return acc;
            }, 0),
        [cartItems, selected],
    );

    const selectedItemsList = useMemo(
        () => cartItems.filter(it => selected[it.cartId]),
        [cartItems, selected],
    );

    /* ---- outfit mixing ---------------------------------------------- */
    const canMixOutfit = selectedCount >= 2;
    const outfitCategories = useMemo(() => {
        const cats = new Set<string>();
        selectedItemsList.forEach(it => {
            if (it.category) cats.add(it.category);
        });
        return cats;
    }, [selectedItemsList]);

    /* ---- suggestions ------------------------------------------------ */
    const allSuggestions: SuggestionProduct[] = useMemo(() => {
        const pool = suggestionProducts && suggestionProducts.length > 0
            ? suggestionProducts
            : fallbackSuggestions;
        // exclude items already in cart
        const cartIds = new Set(cartItems.map(it => String(it.id)));
        return pool.filter(p => !cartIds.has(String(p.id)));
    }, [suggestionProducts, cartItems]);

    // "Perfect match" – items from categories that complement selected items
    const matchSuggestions = useMemo(() => {
        if (selectedItemsList.length === 0) return allSuggestions.slice(0, 8);
        const selectedCats = new Set(selectedItemsList.map(it => it.category).filter(Boolean));
        // Show items NOT in the same categories (complementary)
        const complementary = allSuggestions.filter(p => p.category && !selectedCats.has(p.category));
        return complementary.length > 0 ? complementary.slice(0, 10) : allSuggestions.slice(0, 10);
    }, [allSuggestions, selectedItemsList]);

    // "You may also like" – generic popular items
    const likeSuggestions = useMemo(
        () => allSuggestions.slice(0, 12),
        [allSuggestions],
    );

    /* ---- handlers --------------------------------------------------- */
    const toggleItem = (cartId: number) =>
        setSelected(prev => ({ ...prev, [cartId]: !prev[cartId] }));

    const toggleAll = () => {
        const val = !allSelected;
        const s: Record<number, boolean> = {};
        cartItems.forEach(it => { s[it.cartId] = val; });
        setSelected(s);
    };

    const handleRemove = (cartId: number) => {
        setRemovingId(cartId);
        setTimeout(() => {
            onRemove(cartId);
            setRemovingId(null);
        }, 300);
    };

    const handleCheckout = () => {
        if (selectedCount === 0) {
            showToast('Vui lòng chọn ít nhất 1 sản phẩm!', 'warning');
            return;
        }
        try {
            localStorage.setItem(
                'selectedProductsForCheckout',
                JSON.stringify(selectedItemsList),
            );
        } catch { /* silent */ }
        navigate('/checkout/cart', {
            state: { selectedProducts: selectedItemsList },
        });
    };

    const handleMixOutfit = () => {
        if (!canMixOutfit) return;
        navigate('/try-on', { state: { selectedItems: selectedItemsList } });
        showToast(`Đang mở phòng thử đồ với ${selectedCount} sản phẩm...`, 'success');
    };

    const handleAddSuggestion = (product: SuggestionProduct) => {
        if (onAddToCart) {
            onAddToCart(product, 'M');
        }
    };

    const handleTrySuggestionOutfit = (product: SuggestionProduct) => {
        navigate('/try-on', { state: { selectedItems: [product] } });
        showToast(`Đang mở phòng thử đồ với ${product.name}...`, 'success');
    };

    /* ---- render guards ---------------------------------------------- */
    if (authLoading) return <CartSkeleton />;

    /* ================================================================ */
    return (
        <div className="cp-root">
            {/* ---- Page Header ------------------------------------------- */}
            <header className="cp-header">
                <div className="cp-header-inner">
                    <div className="cp-header-left">
                        <Link to="/" className="cp-back" title="Về trang chủ">
                            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
                        </Link>
                        <h1 className="cp-title">
                            <svg className="cp-title-icon" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
                                <line x1="3" y1="6" x2="21" y2="6" />
                                <path d="M16 10a4 4 0 01-8 0" />
                            </svg>
                            Giỏ hàng
                            {cartItems.length > 0 && (
                                <span className="cp-title-count">{cartItems.length}</span>
                            )}
                        </h1>
                    </div>

                    {/* Outfit mixer CTA (floating on mobile) */}
                    {canMixOutfit && (
                        <button className="cp-mix-btn" onClick={handleMixOutfit}>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <rect x="3" y="3" width="7" height="7" rx="1" />
                                <rect x="14" y="3" width="7" height="7" rx="1" />
                                <rect x="3" y="14" width="7" height="7" rx="1" />
                                <rect x="14" y="14" width="7" height="7" rx="1" />
                            </svg>
                            <span>Thử phối outfit ({selectedCount})</span>
                        </button>
                    )}
                </div>
            </header>

            {/* ---- Outfit helper banner --------------------------------- */}
            {!isLoading && cartItems.length > 0 && (
                <div className="cp-outfit-helper">
                    <div className={`cp-outfit-helper-inner${canMixOutfit ? ' cp-outfit-helper--active' : ''}`}>
                        <div className="cp-outfit-helper-left">
                            <span className="cp-outfit-helper-icon">👗</span>
                            <div className="cp-outfit-helper-text">
                                <strong>Thử phối outfit</strong>
                                <span>Chọn ít nhất 2 sản phẩm để thử phối outfit</span>
                            </div>
                        </div>
                        <button
                            className="cp-outfit-helper-btn"
                            onClick={handleMixOutfit}
                            disabled={!canMixOutfit}
                        >
                            👗 Thử phối outfit{canMixOutfit ? ` (${selectedCount})` : ''}
                        </button>
                    </div>
                </div>
            )}

            {/* ---- Loading state ----------------------------------------- */}
            {isLoading ? (
                <CartSkeleton />
            ) : cartItems.length === 0 ? (
                /* ---- Empty state ------------------------------------------ */
                <EmptyCart />
            ) : (
                /* ---- Cart content ----------------------------------------- */
                <div className="cp-body">
                    <div className="cp-main">
                        {/* Select-all bar */}
                        <div className="cp-select-bar">
                            <label className="cp-checkbox-label">
                                <input
                                    type="checkbox"
                                    checked={allSelected}
                                    onChange={toggleAll}
                                    className="cp-checkbox"
                                />
                                <span className="cp-checkmark" />
                                <span>
                                    Chọn tất cả
                                    <span className="cp-select-count">
                                        ({selectedCount}/{cartItems.length})
                                    </span>
                                </span>
                            </label>
                            {selectedCount > 0 && (
                                <span className="cp-selected-tag">{selectedCount} đã chọn</span>
                            )}
                        </div>

                        {/* Items list */}
                        <ul className="cp-list">
                            {cartItems.map(item => {
                                const key = item.cartId;
                                const isSelected = !!selected[key];
                                const isRemoving = removingId === key;
                                const unitPrice = parsePrice(item.price);
                                const lineTotal = unitPrice * item.quantity;
                                const has3D = item.model3D?.enable;

                                return (
                                    <li
                                        key={key}
                                        className={`cp-item${isSelected ? ' cp-item--on' : ''}${isRemoving ? ' cp-item--out' : ''}`}
                                    >
                                        {/* Checkbox */}
                                        <label className="cp-checkbox-label cp-item-check">
                                            <input
                                                type="checkbox"
                                                checked={isSelected}
                                                onChange={() => toggleItem(key)}
                                                className="cp-checkbox"
                                            />
                                            <span className="cp-checkmark" />
                                        </label>

                                        {/* Image */}
                                        <div className="cp-item-img-wrap">
                                            <img
                                                src={item.img || item.image || ''}
                                                alt={item.name}
                                                className="cp-item-img"
                                            />
                                            {has3D && (
                                                <span className="cp-item-3d" title="Hỗ trợ thử đồ 3D">3D</span>
                                            )}
                                        </div>

                                        {/* Info */}
                                        <div className="cp-item-info">
                                            <p className="cp-item-name">{item.name}</p>
                                            <div className="cp-item-meta">
                                                <span className="cp-item-size">Size {item.size}</span>
                                                {item.category && (
                                                    <span className="cp-item-cat">{item.category}</span>
                                                )}
                                            </div>
                                            <p className="cp-item-unit-price">{fmt(unitPrice)}</p>
                                        </div>

                                        {/* Qty controls */}
                                        <div className="cp-item-qty">
                                            <button
                                                className="cp-qty-btn"
                                                onClick={() => onUpdateQuantity(key, -1)}
                                                disabled={item.quantity <= 1}
                                                aria-label="Giảm"
                                            >
                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><line x1="5" y1="12" x2="19" y2="12" /></svg>
                                            </button>
                                            <span className="cp-qty-val">{item.quantity}</span>
                                            <button
                                                className="cp-qty-btn"
                                                onClick={() => onUpdateQuantity(key, 1)}
                                                aria-label="Tăng"
                                            >
                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
                                            </button>
                                        </div>

                                        {/* Line total */}
                                        <p className="cp-item-total">{fmt(lineTotal)}</p>

                                        {/* Remove */}
                                        <button
                                            className="cp-item-del"
                                            onClick={() => handleRemove(key)}
                                            title="Xóa"
                                            aria-label="Xóa"
                                        >
                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <polyline points="3 6 5 6 21 6" />
                                                <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
                                                <path d="M10 11v6M14 11v6" />
                                                <path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2" />
                                            </svg>
                                        </button>
                                    </li>
                                );
                            })}
                        </ul>

                        {/* Outfit mix banner (inline) */}
                        {canMixOutfit && (
                            <div className="cp-outfit-banner">
                                <div className="cp-outfit-preview">
                                    {selectedItemsList.slice(0, 4).map((it, i) => (
                                        <img
                                            key={it.cartId}
                                            src={it.img || it.image || ''}
                                            alt=""
                                            className="cp-outfit-thumb"
                                            style={{ zIndex: 4 - i }}
                                        />
                                    ))}
                                    {selectedCount > 4 && (
                                        <span className="cp-outfit-more">+{selectedCount - 4}</span>
                                    )}
                                </div>
                                <div className="cp-outfit-text">
                                    <strong>Phối {selectedCount} sản phẩm</strong>
                                    {outfitCategories.size > 1 && (
                                        <span className="cp-outfit-cats">
                                            {Array.from(outfitCategories).join(' + ')}
                                        </span>
                                    )}
                                </div>
                                <button className="cp-outfit-go" onClick={handleMixOutfit}>
                                    Thử phối ngay
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
                                </button>
                            </div>
                        )}
                    </div>

                    {/* ---- Sidebar / Summary --------------------------------- */}
                    <aside className="cp-sidebar">
                        <div className="cp-summary">
                            <h3 className="cp-summary-title">Tóm tắt đơn hàng</h3>

                            <div className="cp-summary-rows">
                                <div className="cp-summary-row">
                                    <span>Tạm tính ({selectedCount} sản phẩm)</span>
                                    <span>{fmt(totalPrice)}</span>
                                </div>
                                <div className="cp-summary-row">
                                    <span>Phí vận chuyển</span>
                                    <span className="cp-free">Miễn phí</span>
                                </div>
                            </div>

                            <div className="cp-summary-total">
                                <span>Tổng cộng</span>
                                <span className="cp-summary-amount">{fmt(totalPrice)}</span>
                            </div>

                            <button
                                className="cp-checkout-btn"
                                disabled={selectedCount === 0}
                                onClick={handleCheckout}
                            >
                                <span>Tiến hành thanh toán</span>
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
                            </button>

                            {canMixOutfit && (
                                <button className="cp-tryon-btn" onClick={handleMixOutfit}>
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M20.38 3.46L16 2 12 5.5 8 2 3.62 3.46a2 2 0 00-1.34 2.23l.58 3.47a1 1 0 00.99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 002-2V10h2.15a1 1 0 00.99-.84l.58-3.47a2 2 0 00-1.34-2.23z" />
                                    </svg>
                                    <span>Thử phối outfit ({selectedCount})</span>
                                </button>
                            )}

                            <p className="cp-summary-note">
                                Miễn phí đổi trả 30 ngày &bull; Thanh toán an toàn
                            </p>
                        </div>
                    </aside>
                </div>
            )}

            {/* ---- Suggestion sections ----------------------------------- */}
            {!isLoading && cartItems.length > 0 && (
                <div className="cp-suggestions">
                    {/* Section 1 – Perfect match */}
                    {matchSuggestions.length > 0 && (
                        <section className="cp-sug-section">
                            <div className="cp-sug-header">
                                <h2 className="cp-sug-title">
                                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--cp-accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                                    </svg>
                                    Gợi ý phối cùng outfit của bạn
                                </h2>
                                <p className="cp-sug-desc">Sản phẩm bổ trợ hoàn hảo cho outfit đã chọn</p>
                            </div>
                            <HScroll>
                                {matchSuggestions.map(p => {
                                    // Determine which selected category this matches with
                                    const selectedCats = selectedItemsList
                                        .map(it => it.category)
                                        .filter(Boolean) as string[];
                                    const matchCat = selectedCats.length > 0 ? selectedCats[0] : undefined;
                                    return (
                                        <SuggestionCard
                                            key={p.id}
                                            product={p}
                                            matchWith={matchCat}
                                            onAdd={onAddToCart ? handleAddSuggestion : undefined}
                                            onTryOutfit={handleTrySuggestionOutfit}
                                        />
                                    );
                                })}
                            </HScroll>
                        </section>
                    )}

                    {/* Section 2 – You may like */}
                    {likeSuggestions.length > 0 && (
                        <section className="cp-sug-section">
                            <div className="cp-sug-header">
                                <h2 className="cp-sug-title">
                                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--cp-accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
                                    </svg>
                                    Bạn có thể thích
                                </h2>
                                <p className="cp-sug-desc">Dựa trên phong cách mua sắm của bạn</p>
                            </div>
                            <HScroll>
                                {likeSuggestions.map(p => (
                                    <SuggestionCard
                                        key={p.id}
                                        product={p}
                                        onAdd={onAddToCart ? handleAddSuggestion : undefined}
                                        onTryOutfit={handleTrySuggestionOutfit}
                                    />
                                ))}
                            </HScroll>
                        </section>
                    )}
                </div>
            )}

            {/* ---- Fixed bottom bar (mobile) ----------------------------- */}
            {!isLoading && cartItems.length > 0 && (
                <div className="cp-bottom-bar">
                    <label className="cp-checkbox-label">
                        <input
                            type="checkbox"
                            checked={allSelected}
                            onChange={toggleAll}
                            className="cp-checkbox"
                        />
                        <span className="cp-checkmark" />
                        <span className="cp-bb-all">Tất cả</span>
                    </label>
                    <div className="cp-bb-summary">
                        <span className="cp-bb-total-label">Tổng:</span>
                        <span className="cp-bb-total-price">{fmt(totalPrice)}</span>
                    </div>
                    <button
                        className="cp-bb-checkout"
                        disabled={selectedCount === 0}
                        onClick={handleCheckout}
                    >
                        Thanh toán ({selectedCount})
                    </button>
                </div>
            )}
        </div>
    );
}
