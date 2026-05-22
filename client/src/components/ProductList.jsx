import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiHeart, FiShoppingCart, FiEye } from 'react-icons/fi';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import { useWishlist } from '../contexts/WishlistContext';
import { useLanguage } from '../contexts/LanguageContext';
import QuickViewModal from './QuickViewModal';
import './ProductCard.css';

function ProductList({ products, title, onBuy, loading = false }) {
    const [quickViewProduct, setQuickViewProduct] = useState(null);
    const navigate = useNavigate();
    const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
    const { t } = useLanguage();

    const displayTitle = title || t('suggestions').toUpperCase();

    // Hiển thị TẤT CẢ sản phẩm, không giới hạn theo login
    // (Nếu muốn giới hạn, dùng isAuthenticated thay vì currentUser)
    const displayProducts = products || [];

    // Nếu đang loading, hiển thị skeleton
    if (loading) {
        return (
            <div className="product-section">
                <div>
                    <div className="section-label">✦ CẬP NHẬT THEO AI</div>
                    <h2 style={{ fontSize: '22px', margin: '4px 0 0', color: 'var(--text-primary)' }}>
                        {displayTitle}
                    </h2>
                </div>
                <div className="product-grid">
                    {[...Array(8)].map((_, index) => (
                        <div
                            key={index}
                            className="product-card-skeleton"
                            style={{
                                background: 'var(--surface-subtle)',
                                borderRadius: 'var(--card-radius)',
                                border: '1px solid var(--gold-border)',
                                overflow: 'hidden',
                                boxShadow: 'var(--card-shadow)'
                            }}
                        >
                            <Skeleton
                                height={250}
                                className="skeleton-shimmer"
                                baseColor="var(--surface-subtle)"
                                highlightColor="var(--gold-light)"
                                borderRadius={0}
                            />
                            <div style={{ padding: '15px' }}>
                                <Skeleton className="skeleton-shimmer" baseColor="var(--surface-subtle)" highlightColor="var(--gold-light)" />
                                <Skeleton count={2} className="skeleton-shimmer" baseColor="var(--surface-subtle)" highlightColor="var(--gold-light)" />
                                <Skeleton width={100} style={{ marginTop: '10px' }} className="skeleton-shimmer" baseColor="var(--surface-subtle)" highlightColor="var(--gold-light)" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    // Kiểm tra xem có dữ liệu sản phẩm không
    if (!displayProducts || displayProducts.length === 0) {
        return <div className="empty-state">{t('no_products')}</div>;
    }

    const getDisplayedSold = (product) => {
        const soldValue = Number(product?.sold);
        if (Number.isFinite(soldValue) && soldValue > 0) {
            return Math.round(soldValue);
        }

        const seed = Number(product?.id) || 1;
        return 120 + ((Math.abs(seed) * 137) % 3800);
    };

    const isEightProductLayout = displayProducts.length === 8;
    const productGridClassName = isEightProductLayout ? 'product-grid product-grid--eight' : 'product-grid';

    const handleQuickAction = (e, action, product) => {
        e.preventDefault();
        e.stopPropagation();

        if (action === 'wishlist') {
            if (isInWishlist(product.id)) {
                removeFromWishlist(product.id);
            } else {
                addToWishlist(product);
            }
        } else if (action === 'quickview') {
            setQuickViewProduct(product);
        }
    };

    const getFitScore = (product) => {
        const score = product?.fitScore ?? product?.matchScore ?? product?.aiScore;
        const numericScore = Number(score);
        return Number.isFinite(numericScore) ? Math.max(0, Math.min(100, Math.round(numericScore))) : null;
    };

    return (
        <div className="product-section">
            <div className="product-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: '16px' }}>
                <div>
                    <div className="section-label">✦ CẬP NHẬT THEO AI</div>
                    <h2 style={{ fontSize: '22px', margin: '4px 0 0', color: 'var(--text-primary)' }}>
                        {displayTitle}
                    </h2>
                </div>
                <Link
                    to="/products"
                    className="section-view-more"
                    style={{ color: 'var(--gold-primary)' }}
                >
                    {t('view_all') || 'Xem thêm'} →
                </Link>
            </div>

            <motion.div
                className={productGridClassName}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
            >
                {displayProducts.map((product, index) => (
                    <motion.div
                        key={product.id}
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: index * 0.05 }}
                        whileHover={{
                            y: -4,
                            boxShadow: '0 14px 34px rgba(139,105,20,0.12)'
                        }}
                        style={{
                            background: 'var(--surface-card)',
                            borderRadius: 'var(--card-radius)',
                            border: '1px solid var(--gold-border)',
                            boxShadow: 'var(--card-shadow)',
                            overflow: 'hidden',
                            transition: 'transform 0.25s ease, box-shadow 0.25s ease'
                        }}
                    >
                        <Link
                            to={`/product/${product.id}`}
                            className="modern-product-card"
                            style={{ display: 'block', height: '100%', color: 'inherit', textDecoration: 'none' }}
                        >
                            {/* Product Image */}
                            <div
                                className="product-image-wrapper"
                                style={{ aspectRatio: '3 / 4', overflow: 'hidden', position: 'relative' }}
                            >
                                <img
                                    src={product.img}
                                    alt={product.name}
                                    className="product-image"
                                    loading="lazy"
                                    style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.3s ease' }}
                                />
                                <div
                                    style={{
                                        position: 'absolute',
                                        top: '10px',
                                        right: '10px',
                                        background: 'rgba(15,11,7,0.7)',
                                        backdropFilter: 'blur(6px)',
                                        border: '1px solid var(--gold-border)',
                                        borderRadius: '20px',
                                        padding: '3px 10px',
                                        fontSize: '10px',
                                        color: 'var(--gold-primary)',
                                        letterSpacing: '0.06em',
                                        fontWeight: 600,
                                        zIndex: 2
                                    }}
                                >
                                    AI Try-On
                                </div>
                                {product.discount && (
                                    <div
                                        className="product-badge sale-badge"
                                        style={{
                                            position: 'absolute',
                                            top: '10px',
                                            left: '10px',
                                            background: 'var(--gold-primary)',
                                            color: '#0F0B07',
                                            borderRadius: '6px',
                                            fontSize: '10px',
                                            fontWeight: '700',
                                            padding: '2px 7px'
                                        }}
                                    >
                                        -{product.discount}%
                                    </div>
                                )}
                                <div className="product-overlay">
                                    <motion.button
                                        className="add-to-cart-overlay"
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            // Chuyển đến trang chi tiết để chọn size
                                            navigate(`/product/${product.id}`);
                                        }}
                                    >
                                        <FiEye /> {t('view_product')}
                                    </motion.button>
                                </div>
                            </div>

                            {/* Product Info */}
                            <div className="product-info" style={{ padding: '12px 12px 14px' }}>
                                <h4
                                    className="product-name"
                                    style={{
                                        fontSize: '13px',
                                        fontWeight: '500',
                                        color: 'var(--text-primary)',
                                        marginBottom: '4px',
                                        display: '-webkit-box',
                                        WebkitLineClamp: 1,
                                        WebkitBoxOrient: 'vertical',
                                        overflow: 'hidden'
                                    }}
                                >{product.name}</h4>
                                <div className="product-meta">
                                    <div className="product-rating">
                                        <span className="stars">⭐⭐⭐⭐⭐</span>
                                        <span className="sold-count">{t('sold')} {getDisplayedSold(product).toLocaleString('vi-VN')}</span>
                                    </div>
                                    <div className="product-price-wrapper">
                                        {product.oldPrice && (
                                            <span
                                                className="old-price"
                                                style={{
                                                    fontSize: '11px',
                                                    color: 'var(--text-secondary)',
                                                    textDecoration: 'line-through',
                                                    marginLeft: '6px'
                                                }}
                                            >{product.oldPrice}</span>
                                        )}
                                        <span
                                            className="product-price"
                                            style={{ fontSize: '14px', fontWeight: '700', color: 'var(--gold-primary)' }}
                                        >
                                            {typeof product.price === 'number'
                                                ? new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(product.price)
                                                : product.price
                                            }
                                        </span>
                                    </div>
                                </div>

                                {getFitScore(product) !== null && (
                                    <div style={{ marginTop: '8px' }}>
                                        <div style={{ fontSize: '10px', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                                            Độ vừa vặn
                                        </div>
                                        <div style={{ height: '2px', background: 'var(--gold-light)', borderRadius: '2px', overflow: 'hidden' }}>
                                            <div
                                                style={{
                                                    width: `${getFitScore(product)}%`,
                                                    height: '100%',
                                                    background: 'linear-gradient(90deg, var(--gold-primary), #E8B84B)'
                                                }}
                                            />
                                        </div>
                                    </div>
                                )}

                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <motion.button
                                            type="button"
                                            onClick={(e) => handleQuickAction(e, 'wishlist', product)}
                                            title={isInWishlist(product.id) ? t('remove_wishlist') : t('add_wishlist')}
                                            style={{
                                                background: 'transparent',
                                                border: 'none',
                                                padding: '0',
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                color: 'var(--text-secondary)',
                                                cursor: 'pointer'
                                            }}
                                            whileHover={{ color: '#E8B84B', scale: 1.06 }}
                                            whileTap={{ scale: 0.96 }}
                                        >
                                            <FiHeart fill={isInWishlist(product.id) ? 'currentColor' : 'none'} />
                                        </motion.button>

                                        <motion.button
                                            type="button"
                                            onClick={(e) => handleQuickAction(e, 'quickview', product)}
                                            title={t('quick_view')}
                                            style={{
                                                background: 'transparent',
                                                border: 'none',
                                                padding: '0',
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                color: 'var(--text-secondary)',
                                                cursor: 'pointer'
                                            }}
                                            whileHover={{ color: '#E8B84B', scale: 1.06 }}
                                            whileTap={{ scale: 0.96 }}
                                        >
                                            <FiShoppingCart />
                                        </motion.button>
                                    </div>

                                    <motion.button
                                        type="button"
                                        onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            navigate('/try-on');
                                        }}
                                        style={{
                                            fontSize: '10px',
                                            color: 'var(--gold-primary)',
                                            border: '1px solid var(--gold-border)',
                                            borderRadius: '20px',
                                            padding: '3px 10px',
                                            background: 'transparent',
                                            cursor: 'pointer'
                                        }}
                                        whileHover={{ background: 'var(--gold-primary)', color: '#0F0B07' }}
                                        whileTap={{ scale: 0.98 }}
                                    >
                                        Thử 3D
                                    </motion.button>
                                </div>
                            </div>
                        </Link>
                    </motion.div>
                ))}
            </motion.div>

            {/* Quick View Modal */}
            {quickViewProduct && (
                <QuickViewModal
                    product={quickViewProduct}
                    onClose={() => setQuickViewProduct(null)}
                    onAddToCart={onBuy}
                />
            )}
        </div>
    );
}

export default ProductList;