import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { FiShoppingCart, FiHeart, FiZap } from 'react-icons/fi';
import { useLanguage } from '../contexts/LanguageContext';

function FlashSale({ products = [] }) {
    const { t } = useLanguage();
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

    // Sử dụng dữ liệu truyền vào, không random hóa để tránh nhảy loạn
    const flashSaleProducts = products.slice(0, 6);

    const formatTime = (value) => value.toString().padStart(2, '0');

    return (
        <div className="flash-sale-section">
            <div className="container">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5 }}
                    className="flash-sale-header"
                >
                    <div className="flash-sale-title">
                        <motion.div
                            animate={{
                                rotate: [0, 10, -10, 10, 0],
                                scale: [1, 1.1, 1, 1.1, 1]
                            }}
                            transition={{
                                duration: 0.5,
                                repeat: Infinity,
                                repeatDelay: 3
                            }}
                        >
                            <FiZap className="flash-icon" />
                        </motion.div>
                        <h2 className="gradient-text">FLASH SALE</h2>
                    </div>

                    <div className="countdown-timer">
                        <span className="timer-label">{t('ends_in')}</span>
                        <div className="timer-display">
                            <motion.div
                                className="timer-box"
                                animate={{ scale: [1, 1.05, 1] }}
                                transition={{ duration: 1, repeat: Infinity }}
                            >
                                {formatTime(timeLeft.hours)}
                            </motion.div>
                            <span className="timer-separator">:</span>
                            <motion.div
                                className="timer-box"
                                animate={{ scale: [1, 1.05, 1] }}
                                transition={{ duration: 1, repeat: Infinity, delay: 0.2 }}
                            >
                                {formatTime(timeLeft.minutes)}
                            </motion.div>
                            <span className="timer-separator">:</span>
                            <motion.div
                                className="timer-box"
                                animate={{ scale: [1, 1.05, 1] }}
                                transition={{ duration: 1, repeat: Infinity, delay: 0.4 }}
                            >
                                {formatTime(timeLeft.seconds)}
                            </motion.div>
                        </div>
                    </div>

                    <Link to="/flash-sale" className="view-all-link">
                        {t('view_all')}
                    </Link>
                </motion.div>

                <div className="flash-sale-products">
                    {flashSaleProducts.map((product, index) => {
                        const soldPercent = (product.sold / (product.sold + product.stock)) * 100;

                        return (
                            <motion.div
                                key={product.id}
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.5, delay: index * 0.1 }}
                                whileHover={{ y: -10, scale: 1.02 }}
                                className="flash-sale-card"
                            >
                                <Link to={`/product/${product.id}`}>
                                    <div className="flash-product-image">
                                        <img
                                            src={product.img}
                                            alt={product.name}
                                            loading="lazy"
                                        />
                                        <div className="flash-badge">
                                            <span>-{product.discount}%</span>
                                        </div>
                                        <motion.button
                                            className="quick-buy-btn"
                                            whileHover={{ scale: 1.1 }}
                                            whileTap={{ scale: 0.9 }}
                                            onClick={(e) => {
                                                e.preventDefault();
                                                console.log('Quick buy:', product);
                                            }}
                                        >
                                            <FiShoppingCart />
                                        </motion.button>
                                    </div>

                                    <div className="flash-product-info">
                                        <h4 className="product-name">{product.name}</h4>
                                        <div className="price-section">
                                            <span className="flash-price">{product.price}</span>
                                            <span className="original-price">{product.originalPrice}đ</span>
                                        </div>

                                        <div className="stock-progress">
                                            <div className="stock-info">
                                                <span>{t('sold')} {product.sold}</span>
                                                <span>{t('in_stock')} {product.stock}</span>
                                            </div>
                                            <div className="progress-bar">
                                                <motion.div
                                                    className="progress-fill"
                                                    initial={{ width: 0 }}
                                                    whileInView={{ width: `${soldPercent}%` }}
                                                    viewport={{ once: true }}
                                                    transition={{ duration: 1, delay: 0.5 }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                            </motion.div>
                        );
                    })}
                </div>

                <motion.div
                    className="view-all-flash"
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.5 }}
                >
                    <Link to="/flash-sale" className="view-all-btn">
                        {t('view_all_flash')}
                    </Link>
                </motion.div>
            </div>
        </div>
    );
}

export default FlashSale;
