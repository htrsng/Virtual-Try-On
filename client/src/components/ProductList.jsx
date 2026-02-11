import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FiHeart, FiShoppingCart, FiEye, FiRepeat } from 'react-icons/fi';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import { useAuth } from '../contexts/AuthContext';
import { useWishlist } from '../contexts/WishlistContext';
import { useCompare } from '../contexts/CompareContext';
import { useLanguage } from '../contexts/LanguageContext';
import QuickViewModal from './QuickViewModal';
import './ProductCard.css';

function ProductList({ products, title, onBuy, loading = false }) {
    const [hoveredId, setHoveredId] = useState(null);
    const [quickViewProduct, setQuickViewProduct] = useState(null);
    const navigate = useNavigate();
    const { isAuthenticated } = useAuth();
    const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
    const { addToCompare, isInCompare } = useCompare();
    const { t } = useLanguage();

    const displayTitle = title || t('suggestions').toUpperCase();

    // Hiển thị TẤT CẢ sản phẩm, không giới hạn theo login
    // (Nếu muốn giới hạn, dùng isAuthenticated thay vì currentUser)
    const displayProducts = products || [];

    // Nếu đang loading, hiển thị skeleton
    if (loading) {
        return (
            <div className="product-section">
                <h3 className="section-title">{displayTitle}</h3>
                <div className="product-grid">
                    {[...Array(8)].map((_, index) => (
                        <div key={index} className="product-card-skeleton">
                            <Skeleton height={250} />
                            <div style={{ padding: '15px' }}>
                                <Skeleton count={2} />
                                <Skeleton width={100} style={{ marginTop: '10px' }} />
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

    const handleQuickAction = (e, action, product) => {
        e.preventDefault();
        e.stopPropagation();

        if (action === 'wishlist') {
            if (isInWishlist(product.id)) {
                removeFromWishlist(product.id);
            } else {
                addToWishlist(product);
            }
        } else if (action === 'compare') {
            addToCompare(product);
        } else if (action === 'quickview') {
            setQuickViewProduct(product);
        }
    };

    return (
        <div className="product-section">
            <div className="product-header">{displayTitle}</div>

            <motion.div
                className="product-grid"
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
                        whileHover={{ y: -8 }}
                        onHoverStart={() => setHoveredId(product.id)}
                        onHoverEnd={() => setHoveredId(null)}
                    >
                        <Link
                            to={`/product/${product.id}`}
                            className="modern-product-card"
                        >
                            {/* Badge sale */}
                            {product.discount && (
                                <div className="product-badge sale-badge">
                                    -{product.discount}%
                                </div>
                            )}

                            {/* Quick Actions */}
                            <AnimatePresence>
                                {hoveredId === product.id && (
                                    <motion.div
                                        className="quick-actions"
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: 20 }}
                                        transition={{ duration: 0.2 }}
                                    >
                                        <motion.button
                                            className={`quick-action-btn ${isInWishlist(product.id) ? 'active' : ''}`}
                                            whileHover={{ scale: 1.1 }}
                                            whileTap={{ scale: 0.9 }}
                                            onClick={(e) => handleQuickAction(e, 'wishlist', product)}
                                            title={isInWishlist(product.id) ? t('remove_wishlist') : t('add_wishlist')}
                                        >
                                            <FiHeart fill={isInWishlist(product.id) ? "currentColor" : "none"} />
                                        </motion.button>
                                        <motion.button
                                            className="quick-action-btn"
                                            whileHover={{ scale: 1.1 }}
                                            whileTap={{ scale: 0.9 }}
                                            onClick={(e) => handleQuickAction(e, 'compare', product)}
                                            title={t('compare')}
                                        >
                                            <FiRepeat />
                                        </motion.button>
                                        <motion.button
                                            className="quick-action-btn"
                                            whileHover={{ scale: 1.1 }}
                                            whileTap={{ scale: 0.9 }}
                                            onClick={(e) => handleQuickAction(e, 'quickview', product)}
                                            title={t('quick_view')}
                                        >
                                            <FiEye />
                                        </motion.button>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* Product Image */}
                            <div className="product-image-wrapper">
                                <img
                                    src={product.img}
                                    alt={product.name}
                                    className="product-image"
                                    loading="lazy"
                                />
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
                            <div className="product-info">
                                <h4 className="product-name">{product.name}</h4>
                                <div className="product-meta">
                                    <div className="product-rating">
                                        <span className="stars">⭐⭐⭐⭐⭐</span>
                                        <span className="sold-count">{t('sold')} {product.sold || 0}</span>
                                    </div>
                                    <div className="product-price-wrapper">
                                        {product.oldPrice && (
                                            <span className="old-price">{product.oldPrice}</span>
                                        )}
                                        <span className="product-price">
                                            {typeof product.price === 'number'
                                                ? new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(product.price)
                                                : product.price
                                            }
                                        </span>
                                    </div>
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