import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    FiFacebook,
    FiInstagram,
    FiTwitter,
    FiYoutube,
    FiMail,
    FiPhone,
    FiMapPin,
    FiShoppingBag
} from 'react-icons/fi';
import { useLanguage } from '../contexts/LanguageContext';
import './Footer.css';

function Footer() {
    const currentYear = new Date().getFullYear();
    const { t } = useLanguage();

    const footerLinks = {
        customerService: [
            { name: t('help_center_link'), path: '/help' },
            { name: t('buy_guide'), path: '/guide' },
            { name: t('sell_guide'), path: '/sell-guide' },
            { name: t('payment_link'), path: '/payment' },
            { name: t('shipping_link'), path: '/shipping' },
            { name: t('return_policy'), path: '/return-policy' }
        ],
        about: [
            { name: t('intro_shopee'), path: '/about' },
            { name: t('terms'), path: '/terms' },
            { name: t('privacy_policy'), path: '/privacy' },
            { name: t('cookie_policy'), path: '/cookies' },
        ],
        categories: [
            { name: 'Thời trang nữ', path: '/category/women' },
            { name: 'Thời trang nam', path: '/category/men' },
            { name: 'Điện thoại & Phụ kiện', path: '/category/phones' },
            { name: 'Máy tính & Laptop', path: '/category/computers' },
            { name: 'Nhà cửa & Đời sống', path: '/category/home' },
            { name: 'Sức khỏe & Làm đẹp', path: '/category/beauty' }
        ]
    };

    const socialLinks = [
        { icon: FiFacebook, url: 'https://facebook.com', name: 'Facebook', color: '#1877f2' },
        { icon: FiInstagram, url: 'https://instagram.com', name: 'Instagram', color: '#e4405f' },
        { icon: FiTwitter, url: 'https://twitter.com', name: 'Twitter', color: '#1da1f2' },
        { icon: FiYoutube, url: 'https://youtube.com', name: 'YouTube', color: '#ff0000' }
    ];

    const paymentMethods = [
        'Visa', 'Mastercard', 'JCB', 'Momo', 'ZaloPay', 'COD'
    ];

    return (
        <footer className="modern-footer">
            {/* Main Footer Content */}
            <div className="footer-main">
                <div className="container">
                    <div className="footer-grid">
                        {/* Company Info */}
                        <motion.div
                            className="footer-column"
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.6, delay: 0.1 }}
                        >
                            <div className="footer-brand">
                                <FiShoppingBag size={32} />
                                <h3>Shopee Fashion</h3>
                            </div>
                            <p className="footer-description">
                                {t('footer_desc')}
                            </p>
                            <div className="footer-contact">
                                <div className="contact-item">
                                    <FiMapPin />
                                    <span>123 Đường ABC, Quận 1, TP.HCM</span>
                                </div>
                                <div className="contact-item">
                                    <FiPhone />
                                    <span>1900 1234 56</span>
                                </div>
                                <div className="contact-item">
                                    <FiMail />
                                    <span>support@shopeefashion.vn</span>
                                </div>
                            </div>
                        </motion.div>

                        {/* Customer Service */}
                        <motion.div
                            className="footer-column"
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.6, delay: 0.2 }}
                        >
                            <h4 className="footer-title">{t('customer_service')}</h4>
                            <ul className="footer-links">
                                {footerLinks.customerService.map((link, index) => (
                                    <li key={index}>
                                        <Link to={link.path}>{link.name}</Link>
                                    </li>
                                ))}
                            </ul>
                        </motion.div>

                        {/* About */}
                        <motion.div
                            className="footer-column"
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.6, delay: 0.3 }}
                        >
                            <h4 className="footer-title">{t('about_shopee')}</h4>
                            <ul className="footer-links">
                                {footerLinks.about.map((link, index) => (
                                    <li key={index}>
                                        <Link to={link.path}>{link.name}</Link>
                                    </li>
                                ))}
                            </ul>
                        </motion.div>

                        {/* Categories */}
                    </div>
                </div>
            </div>

            {/* Footer Bottom */}
            <div className="footer-bottom">
                <div className="container">
                    <div className="footer-bottom-content">
                        <div className="footer-social">
                            <span>{t('connect_with_us')}</span>
                            <div className="social-links">
                                {socialLinks.map((social, index) => (
                                    <motion.a
                                        key={index}
                                        href={social.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="social-link"
                                        whileHover={{ scale: 1.2, y: -3 }}
                                        whileTap={{ scale: 0.9 }}
                                        style={{ '--social-color': social.color }}
                                        title={social.name}
                                    >
                                        <social.icon size={20} />
                                    </motion.a>
                                ))}
                            </div>
                        </div>

                        <div className="footer-payment">
                            <span>{t('payment_methods_label')}</span>
                            <div className="payment-methods">
                                {paymentMethods.map((method, index) => (
                                    <div key={index} className="payment-badge">
                                        {method}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="footer-copyright">
                        <p>© {currentYear} Shopee Fashion. {t('copyright')}</p>
                        <p className="footer-country">{t('country_region')}
                            <a href="#sg">Singapore</a> |
                            <a href="#id">Indonesia</a> |
                            <a href="#th">Thái Lan</a> |
                            <a href="#my">Malaysia</a> |
                            <a href="#vn" className="active">Việt Nam</a>
                        </p>
                    </div>
                </div>
            </div>
        </footer>
    );
}

export default Footer;
