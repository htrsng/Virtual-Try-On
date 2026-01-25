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

function Footer() {
    const currentYear = new Date().getFullYear();

    const footerLinks = {
        customerService: [
            { name: 'Trung tâm trợ giúp', path: '/help' },
            { name: 'Hướng dẫn mua hàng', path: '/guide' },
            { name: 'Hướng dẫn bán hàng', path: '/sell-guide' },
            { name: 'Thanh toán', path: '/payment' },
            { name: 'Vận chuyển', path: '/shipping' },
            { name: 'Chính sách đổi trả', path: '/return-policy' }
        ],
        about: [
            { name: 'Giới thiệu Shopee Fashion', path: '/about' },
            { name: 'Tuyển dụng', path: '/careers' },
            { name: 'Điều khoản', path: '/terms' },
            { name: 'Chính sách bảo mật', path: '/privacy' },
            { name: 'Chính sách cookie', path: '/cookies' },
            { name: 'Flash Sales', path: '/flash-sales' }
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
            {/* Newsletter Section */}
            <div className="footer-newsletter">
                <div className="container">
                    <motion.div
                        className="newsletter-content"
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                    >
                        <div className="newsletter-text">
                            <FiMail className="newsletter-icon" />
                            <div>
                                <h3>Đăng ký nhận tin khuyến mãi</h3>
                                <p>Nhận ngay ưu đãi 10% cho đơn hàng đầu tiên!</p>
                            </div>
                        </div>
                        <form className="newsletter-form" onSubmit={(e) => e.preventDefault()}>
                            <input
                                type="email"
                                placeholder="Nhập email của bạn..."
                                className="newsletter-input"
                            />
                            <motion.button
                                type="submit"
                                className="newsletter-btn"
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                            >
                                Đăng ký
                            </motion.button>
                        </form>
                    </motion.div>
                </div>
            </div>

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
                                Nền tảng thương mại điện tử hàng đầu Việt Nam, mang đến trải nghiệm mua sắm tuyệt vời với hàng triệu sản phẩm chất lượng.
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
                            <h4 className="footer-title">Chăm sóc khách hàng</h4>
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
                            <h4 className="footer-title">Về Shopee Fashion</h4>
                            <ul className="footer-links">
                                {footerLinks.about.map((link, index) => (
                                    <li key={index}>
                                        <Link to={link.path}>{link.name}</Link>
                                    </li>
                                ))}
                            </ul>
                        </motion.div>

                        {/* Categories */}
                        <motion.div
                            className="footer-column"
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.6, delay: 0.4 }}
                        >
                            <h4 className="footer-title">Danh mục</h4>
                            <ul className="footer-links">
                                {footerLinks.categories.map((link, index) => (
                                    <li key={index}>
                                        <Link to={link.path}>{link.name}</Link>
                                    </li>
                                ))}
                            </ul>
                        </motion.div>
                    </div>
                </div>
            </div>

            {/* Footer Bottom */}
            <div className="footer-bottom">
                <div className="container">
                    <div className="footer-bottom-content">
                        <div className="footer-social">
                            <span>Kết nối với chúng tôi:</span>
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
                            <span>Phương thức thanh toán:</span>
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
                        <p>© {currentYear} Shopee Fashion. Bản quyền thuộc về Công ty TNHH Shopee Fashion Việt Nam.</p>
                        <p className="footer-country">Quốc gia & Khu vực:
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
