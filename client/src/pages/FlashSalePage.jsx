import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { FiShoppingCart, FiZap, FiClock } from 'react-icons/fi';

function FlashSalePage({ flashSaleProducts = [], onBuy }) {
    const [timeLeft, setTimeLeft] = useState({
        hours: 2,
        minutes: 45,
        seconds: 30
    });

    useEffect(() => {
        const timer = setInterval(() => {
            setTimeLeft(prev => {
                let { hours, minutes, seconds } = prev;

                if (seconds > 0) {
                    seconds--;
                } else if (minutes > 0) {
                    minutes--;
                    seconds = 59;
                } else if (hours > 0) {
                    hours--;
                    minutes = 59;
                    seconds = 59;
                }

                return { hours, minutes, seconds };
            });
        }, 1000);

        return () => clearInterval(timer);
    }, []);

    const formatTime = (value) => value.toString().padStart(2, '0');

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flash-sale-page"
        >
            <div className="container">
                {/* Header */}
                <div className="flash-sale-page-header">
                    <div className="flash-sale-page-title">
                        <FiZap className="flash-icon" />
                        <h1>FLASH SALE</h1>
                    </div>
                    <div className="flash-sale-countdown-large">
                        <FiClock />
                        <span>Kết thúc trong</span>
                        <div className="countdown-box">
                            <span>{formatTime(timeLeft.hours)}</span>
                        </div>
                        <span>:</span>
                        <div className="countdown-box">
                            <span>{formatTime(timeLeft.minutes)}</span>
                        </div>
                        <span>:</span>
                        <div className="countdown-box">
                            <span>{formatTime(timeLeft.seconds)}</span>
                        </div>
                    </div>
                </div>

                {/* Products Grid */}
                <div className="flash-sale-products-grid">
                    {flashSaleProducts.length === 0 ? (
                        <div className="no-products">
                            <FiZap size={64} />
                            <p>Không có sản phẩm Flash Sale</p>
                        </div>
                    ) : (
                        flashSaleProducts.map((product, index) => {
                            const soldPercentage = Math.round((product.sold / (product.sold + product.stock)) * 100);

                            return (
                                <motion.div
                                    key={product.id}
                                    className="flash-sale-product-card"
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.1 }}
                                    whileHover={{ y: -5 }}
                                >
                                    <Link to={`/product/${product.id}`} className="product-link">
                                        <div className="product-image-wrapper">
                                            <img src={product.img} alt={product.name} />
                                            <div className="discount-badge">
                                                -{product.discount}%
                                            </div>
                                        </div>

                                        <div className="product-info">
                                            <h3 className="product-name">{product.name}</h3>

                                            <div className="price-row">
                                                <span className="current-price">
                                                    ₫{product.price.toLocaleString()}
                                                </span>
                                                <span className="original-price">
                                                    ₫{product.originalPrice.toLocaleString()}
                                                </span>
                                            </div>

                                            <div className="progress-wrapper">
                                                <div className="progress-bar">
                                                    <motion.div
                                                        className="progress-fill"
                                                        initial={{ width: 0 }}
                                                        animate={{ width: `${soldPercentage}%` }}
                                                        transition={{ duration: 1, delay: index * 0.1 }}
                                                    />
                                                </div>
                                                <div className="progress-text">
                                                    Đã bán {product.sold}/{product.sold + product.stock}
                                                </div>
                                            </div>
                                        </div>
                                    </Link>

                                    <button
                                        className="add-to-cart-btn"
                                        onClick={(e) => {
                                            e.preventDefault();
                                            onBuy && onBuy(product);
                                        }}
                                    >
                                        <FiShoppingCart />
                                        Thêm vào giỏ
                                    </button>
                                </motion.div>
                            );
                        })
                    )}
                </div>
            </div>
        </motion.div>
    );
}

export default FlashSalePage;
