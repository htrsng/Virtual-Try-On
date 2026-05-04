import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Banner from '../components/Banner';
import Category from '../components/Category';
import TopSearch from '../components/TopSearch';
import ProductList from '../components/ProductList';
import FlashSale from '../components/FlashSale';
import ReviewCarousel from '../components/ReviewCarousel';
import { useLanguage } from '../contexts/LanguageContext';

function HomePage({ products, categories, topSearch, bannerData, flashSaleProducts, onBuy }) {
    const [isLoading, setIsLoading] = useState(true);
    const { t } = useLanguage();

    // Debug products received
    useEffect(() => {
        console.log('🏠 HomePage received products:', products?.length);
        if (products?.length > 0) {
            console.log('Sample products:', products.slice(0, 3).map(p => p.name));
        }
    }, [products]);

    useEffect(() => {
        // Giả lập loading khi trang load lần đầu
        const timer = setTimeout(() => {
            setIsLoading(false);
        }, 800);
        return () => clearTimeout(timer);
    }, []);

    const pageVariants = {
        initial: { opacity: 0, y: 20 },
        animate: {
            opacity: 1,
            y: 0,
            transition: {
                duration: 0.5,
                staggerChildren: 0.2
            }
        },
        exit: {
            opacity: 0,
            y: -20,
            transition: { duration: 0.3 }
        }
    };

    const sectionVariants = {
        initial: { opacity: 0, y: 30 },
        animate: {
            opacity: 1,
            y: 0,
            transition: { duration: 0.6 }
        }
    };

    return (
        <motion.div
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="home-page"
        >
            {/* Hero Banner với Slider */}
            <motion.section variants={sectionVariants}>
                <Banner bannerData={bannerData} />
            </motion.section>

            {/* ── AI & 3D FEATURES SECTION ── */}
            <motion.section variants={sectionVariants} className="features-section">
                <div className="features-inner">

                    <div className="features-header">
                        <span className="features-eyebrow">✦ Công nghệ độc quyền</span>
                        <h2 className="features-title">Mua sắm thông minh hơn với AI & 3D</h2>
                        <p className="features-sub">Lần đầu tiên tại Việt Nam — thử đồ ảo trên avatar 3D cá nhân hóa theo số đo của bạn</p>
                    </div>

                    <div className="features-grid">

                        <div className="feature-card">
                            <div className="feature-icon">
                                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" />
                                    <path d="M12 8v4l3 3" />
                                </svg>
                            </div>
                            <h3 className="feature-title">Phòng thử đồ 3D</h3>
                            <p className="feature-desc">Mặc thử quần áo lên avatar 3D theo đúng số đo cơ thể của bạn trước khi quyết định mua</p>
                            <a href="/try-on" className="feature-cta">Thử ngay →</a>
                        </div>

                        <div className="feature-card feature-card--highlight">
                            <div className="feature-badge">Phổ biến nhất</div>
                            <div className="feature-icon">
                                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="12" cy="12" r="3" />
                                    <path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83" />
                                </svg>
                            </div>
                            <h3 className="feature-title">AI gợi ý size chính xác</h3>
                            <p className="feature-desc">AI phân tích số đo và lịch sử mua hàng — gợi ý đúng size, không lo mua về không vừa</p>
                            <a href="/try-on" className="feature-cta">Xem gợi ý →</a>
                        </div>

                        <div className="feature-card">
                            <div className="feature-icon">
                                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
                                </svg>
                            </div>
                            <h3 className="feature-title">Tủ đồ cá nhân hóa</h3>
                            <p className="feature-desc">Đồ đã mua tự động lưu vào tủ đồ ảo — thử phối với đồ mới bất cứ lúc nào</p>
                            <a href="/try-on" className="feature-cta">Xem tủ đồ →</a>
                        </div>

                        <div className="feature-card">
                            <div className="feature-icon">
                                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
                                </svg>
                            </div>
                            <h3 className="feature-title">AI Outfit Generator</h3>
                            <p className="feature-desc">Nhập mô tả "đi cafe cuối tuần" — AI tạo outfit hoàn chỉnh từ tủ đồ của bạn</p>
                            <span className="feature-coming">Sắp ra mắt</span>
                        </div>

                    </div>

                    <div className="features-cta-row">
                        <a href="/try-on" className="features-main-cta">
                            Vào phòng thử đồ 3D ngay
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
                        </a>
                    </div>

                </div>
            </motion.section>

            {/* Danh mục thời trang */}
            <motion.section variants={sectionVariants} className="section-spacing">
                <div className="container">
                    <Category data={categories} />
                </div>
            </motion.section>

            {/* Tìm kiếm hàng đầu */}
            <motion.section variants={sectionVariants} className="section-spacing">
                <div className="container">
                    <TopSearch products={topSearch} />
                </div>
            </motion.section>

            {/* Flash Sale với countdown */}
            <motion.section variants={sectionVariants} className="section-spacing">
                <FlashSale products={flashSaleProducts} />
            </motion.section>

            {/* Sản phẩm gợi ý */}
            <motion.section variants={sectionVariants} className="section-spacing">
                <div className="container">
                    <ProductList
                        products={products}
                        title={t('suggestions').toUpperCase()}
                        onBuy={onBuy}
                        loading={isLoading}
                    />
                </div>
            </motion.section>

            {/* Đánh giá khách hàng */}
            <motion.section variants={sectionVariants} className="section-spacing">
                <ReviewCarousel />
            </motion.section>

            {/* ── TECH STACK SECTION ── */}
            <motion.section variants={sectionVariants} className="tech-section">
                <div className="tech-inner">
                    <div className="tech-header">
                        <span className="tech-eyebrow">Được xây dựng bởi</span>
                        <h2 className="tech-title">Công nghệ hiện đại</h2>
                    </div>
                    <div className="tech-grid">
                        {[
                            { name: 'React.js', desc: 'Giao diện người dùng', icon: '⚛️' },
                            { name: 'Three.js', desc: 'Đồ họa 3D Avatar', icon: '🎮' },
                            { name: 'Node.js', desc: 'Backend & API', icon: '🟢' },
                            { name: 'MongoDB', desc: 'Cơ sở dữ liệu', icon: '🍃' },
                            { name: 'Claude AI', desc: 'AI Stylist & Sizing', icon: '✦' },
                            { name: 'WebGL', desc: 'Render 3D thời gian thực', icon: '🖼️' },
                        ].map(tech => (
                            <div key={tech.name} className="tech-item">
                                <span className="tech-icon">{tech.icon}</span>
                                <span className="tech-name">{tech.name}</span>
                                <span className="tech-desc">{tech.desc}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </motion.section>
        </motion.div>
    );
}

export default HomePage;