import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FiHeart, FiShoppingCart, FiEye, FiRepeat } from 'react-icons/fi';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import './ProductCard.css';

function ProductList({ products, title = "GỢI Ý HÔM NAY", onBuy, loading = false }) {
    const [hoveredId, setHoveredId] = useState(null);
    const navigate = useNavigate();

    // Giới hạn sản phẩm hiển thị: 6 items x 6 rows = 36 items
    const displayProducts = products?.slice(0, 36) || [];

    // Nếu đang loading, hiển thị skeleton
    if (loading) {
        return (
            <div className="product-section">
                <h3 className="section-title">{title}</h3>
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
        return <div className="empty-state">Không có sản phẩm nào</div>;
    }

    const handleQuickAction = (e, action, product) => {
        e.preventDefault();
        e.stopPropagation();
        console.log(action, product);
        // TODO: Implement wishlist, compare, quick view
    };

    return (
        <div className="product-section">
            <div className="product-header">{title}</div>

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
                                            className="quick-action-btn"
                                            whileHover={{ scale: 1.1 }}
                                            whileTap={{ scale: 0.9 }}
                                            onClick={(e) => handleQuickAction(e, 'wishlist', product)}
                                            title="Thêm vào yêu thích"
                                        >
                                            <FiHeart />
                                        </motion.button>
                                        <motion.button
                                            className="quick-action-btn"
                                            whileHover={{ scale: 1.1 }}
                                            whileTap={{ scale: 0.9 }}
                                            onClick={(e) => handleQuickAction(e, 'compare', product)}
                                            title="So sánh"
                                        >
                                            <FiRepeat />
                                        </motion.button>
                                        <motion.button
                                            className="quick-action-btn"
                                            whileHover={{ scale: 1.1 }}
                                            whileTap={{ scale: 0.9 }}
                                            onClick={(e) => handleQuickAction(e, 'quickview', product)}
                                            title="Xem nhanh"
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
                                        <FiEye /> Xem sản phẩm
                                    </motion.button>
                                </div>
                            </div>

                            {/* Product Info */}
                            <div className="product-info">
                                <h4 className="product-name">{product.name}</h4>
                                <div className="product-meta">
                                    <div className="product-rating">
                                        <span className="stars">⭐⭐⭐⭐⭐</span>
                                        <span className="sold-count">Đã bán {product.sold || 0}</span>
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
        </div>
    );
}

export default ProductList;