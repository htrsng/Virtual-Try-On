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
        <div
            className="flash-sale-section"
            style={{
                background: 'var(--bg-dark-section)',
                borderTop: '1px solid var(--border-dark)',
                borderBottom: '1px solid var(--border-dark)',
                borderRadius: '0',
                margin: '0',
                padding: '40px 0',
                position: 'relative',
                overflow: 'hidden'
            }}
        >
            <style>
                {`
                @media (max-width: 768px) {
                    .flash-sale-section { padding: 20px 16px !important; }
                }
                .dark-flash-card {
                    background: var(--surface-dark-card) !important;
                    border: 0.5px solid var(--border-dark) !important;
                    border-radius: 12px !important;
                    overflow: hidden !important;
                    transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease !important;
                    box-shadow: none !important;
                }
                .dark-flash-card:hover {
                    transform: translateY(-3px) scale(1.01) !important;
                    border-color: rgba(201,150,63,0.4) !important;
                    box-shadow: 0 8px 24px rgba(139,105,20,0.1) !important;
                    background: rgba(201,150,63,0.04) !important;
                }
                .dark-flash-timer-box {
                    background: rgba(201,150,63,0.08) !important;
                    border: 0.5px solid var(--border-dark) !important;
                    color: #D4AF37 !important;
                }
                .dark-flash-title {
                    color: #D4AF37 !important;
                }
                .dark-flash-price {
                    color: var(--gold-primary) !important;
                }
                .dark-flash-name {
                    color: var(--text-dark-primary) !important;
                }
                .dark-flash-original {
                    color: rgba(232, 220, 200, 0.4) !important;
                }
                `}
            </style>
            <div className="container">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5 }}
                    className="flash-sale-header"
                    style={{ position: 'relative', zIndex: 1 }}
                >
                    <div className="flash-sale-title" style={{ alignItems: 'center', gap: '8px' }}>
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
                        <h2
                            className="gradient-text dark-flash-title"
                            style={{
                                fontFamily: 'inherit',
                                letterSpacing: '0.08em',
                                fontSize: '20px',
                                fontWeight: '700'
                            }}
                        >
                            ⚡ FLASH SALE
                        </h2>
                    </div>

                    <div className="countdown-timer" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span className="timer-label" style={{ color: 'var(--text-dark-primary)' }}>{t('ends_in')}</span>
                        <div className="timer-display">
                            <motion.div
                                className="timer-box dark-flash-timer-box"
                                animate={{ scale: [1, 1.05, 1] }}
                                transition={{ duration: 1, repeat: Infinity }}
                                style={{
                                    borderRadius: '8px',
                                    padding: '6px 12px',
                                    fontSize: '18px',
                                    fontWeight: '600',
                                    minWidth: '40px',
                                    textAlign: 'center'
                                }}
                            >
                                <span className="timer-value">{formatTime(timeLeft.hours)}</span>
                                <span className="timer-unit">h</span>
                            </motion.div>
                            <span className="timer-separator" style={{ color: '#D4AF37' }}>:</span>
                            <motion.div
                                className="timer-box dark-flash-timer-box"
                                animate={{ scale: [1, 1.05, 1] }}
                                transition={{ duration: 1, repeat: Infinity, delay: 0.2 }}
                                style={{
                                    borderRadius: '8px',
                                    padding: '6px 12px',
                                    fontSize: '18px',
                                    fontWeight: '600',
                                    minWidth: '40px',
                                    textAlign: 'center'
                                }}
                            >
                                <span className="timer-value">{formatTime(timeLeft.minutes)}</span>
                                <span className="timer-unit">m</span>
                            </motion.div>
                            <span className="timer-separator" style={{ color: '#D4AF37' }}>:</span>
                            <motion.div
                                className="timer-box dark-flash-timer-box"
                                animate={{ scale: [1, 1.05, 1] }}
                                transition={{ duration: 1, repeat: Infinity, delay: 0.4 }}
                                style={{
                                    borderRadius: '8px',
                                    padding: '6px 12px',
                                    fontSize: '18px',
                                    fontWeight: '600',
                                    minWidth: '40px',
                                    textAlign: 'center'
                                }}
                            >
                                <span className="timer-value">{formatTime(timeLeft.seconds)}</span>
                                <span className="timer-unit">s</span>
                            </motion.div>
                        </div>
                    </div>

                    <Link
                        to="/flash-sale"
                        className="view-all-link"
                        style={{
                            color: 'var(--gold-primary)',
                            fontSize: '12px',
                            textDecoration: 'none',
                            borderBottom: '1px solid var(--gold-border)',
                            paddingBottom: '1px'
                        }}
                    >
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
                                className="flash-sale-card dark-flash-card"
                                style={{}}
                            >
                                <Link to={`/product/${product.id}`}>
                                    <div className="flash-product-image">
                                        <img
                                            src={product.img}
                                            alt={product.name}
                                            loading="lazy"
                                        />
                                        <div className="flash-badge" style={{ background: 'var(--gold-primary)', borderRadius: '6px' }}>
                                            <span
                                                className="flash-badge-value"
                                                style={{
                                                    color: '#0F0B07',
                                                    fontSize: '10px',
                                                    fontWeight: '700',
                                                    padding: '2px 7px'
                                                }}
                                            >
                                                -{product.discount}%
                                            </span>
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
                                        <div className="price-section">
                                            <span className="flash-price dark-flash-price">{typeof product.price === 'number' ? product.price.toLocaleString('vi-VN') : product.price} <u>đ</u></span>
                                            <span className="original-price dark-flash-original">{typeof product.originalPrice === 'number' ? product.originalPrice.toLocaleString('vi-VN') : product.originalPrice}đ</span>
                                        </div>

                                        <div className="stock-progress">
                                            <div className="progress-bar" style={{ background: 'rgba(201,150,63,0.15)' }}>
                                                <motion.div
                                                    className="progress-fill"
                                                    initial={{ width: 0 }}
                                                    whileInView={{ width: `${Math.max(soldPercent, 30)}%` }}
                                                    viewport={{ once: true }}
                                                    transition={{ duration: 1, delay: 0.5 }}
                                                    style={{ background: 'linear-gradient(to right, var(--gold-primary), #E8B84B)' }}
                                                >
                                                    <span className="progress-text">{t('sold').toUpperCase()} {product.sold}</span>
                                                </motion.div>
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
                    <Link
                        to="/flash-sale"
                        className="view-all-btn"
                        style={{
                            background: 'var(--gold-primary)',
                            color: '#0F0B07',
                            border: 'none',
                            borderRadius: '24px',
                            padding: '10px 28px',
                            fontWeight: '600',
                            letterSpacing: '0.04em'
                        }}
                    >
                        {t('view_all_flash')}
                    </Link>
                </motion.div>
            </div>
        </div>
    );
}

export default FlashSale;
