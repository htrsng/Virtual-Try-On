import React, { useState } from 'react';
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
import './Footer.css';

function Footer() {
    const currentYear = new Date().getFullYear();
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ text: '', type: '' });

    const handleNewsletterSubmit = async (e) => {
        e.preventDefault();

        if (!email || !email.includes('@')) {
            setMessage({ text: 'Vui lòng nhập email hợp lệ!', type: 'error' });
            return;
        }

        setLoading(true);
        setMessage({ text: '', type: '' });

        try {
            const response = await fetch('http://localhost:3000/api/newsletter/subscribe', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            });

            const data = await response.json();

            if (response.ok) {
                setMessage({
                    text: `🎉 Đăng ký thành công! Mã giảm giá của bạn: ${data.couponCode}`,
                    type: 'success'
                });
                setEmail('');

                // Lưu mã vào localStorage
                const existingCoupons = JSON.parse(localStorage.getItem('myCoupons') || '[]');
                if (!existingCoupons.includes(data.couponCode)) {
                    existingCoupons.push(data.couponCode);
                    localStorage.setItem('myCoupons', JSON.stringify(existingCoupons));
                }

                // Xóa message sau 5s
                setTimeout(() => setMessage({ text: '', type: '' }), 5000);
            } else {
                setMessage({ text: data.message || 'Đăng ký thất bại!', type: 'error' });
            }
        } catch (err) {
            console.error('Lỗi đăng ký newsletter:', err);
            setMessage({ text: 'Lỗi kết nối server!', type: 'error' });
        } finally {
            setLoading(false);
        }
    };

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
            { name: 'Điều khoản', path: '/terms' },
            { name: 'Chính sách bảo mật', path: '/privacy' },
            { name: 'Chính sách cookie', path: '/cookies' },
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
                                <p>Nhận ngay mã giảm 10% cho đơn hàng đầu tiên!</p>
                            </div>
                        </div>
                        <form className="newsletter-form" onSubmit={handleNewsletterSubmit}>
                            <input
                                type="email"
                                placeholder="Nhập email của bạn..."
                                className="newsletter-input"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                disabled={loading}
                            />
                            <motion.button
                                type="submit"
                                className="newsletter-btn"
                                whileHover={{ scale: loading ? 1 : 1.05 }}
                                whileTap={{ scale: loading ? 1 : 0.95 }}
                                disabled={loading}
                                style={{ opacity: loading ? 0.6 : 1 }}
                            >
                                {loading ? 'Đang xử lý...' : 'Đăng ký'}
                            </motion.button>
                        </form>
                        {message.text && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                style={{
                                    marginTop: '15px',
                                    padding: '12px 20px',
                                    borderRadius: '8px',
                                    background: message.type === 'success' ? '#f6ffed' : '#fff2f0',
                                    border: `1px solid ${message.type === 'success' ? '#b7eb8f' : '#ffccc7'}`,
                                    color: message.type === 'success' ? '#52c41a' : '#ff4d4f',
                                    fontSize: '14px',
                                    textAlign: 'center'
                                }}
                            >
                                {message.text}
                            </motion.div>
                        )}
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
