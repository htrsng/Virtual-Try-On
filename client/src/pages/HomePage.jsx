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

    useEffect(() => {
        console.log('🏠 HomePage received products:', products?.length);
        if (products?.length > 0) {
            console.log('Sample products:', products.slice(0, 3).map(p => p.name));
        }
    }, [products]);

    useEffect(() => {
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

    const sectionWrapperStyle = {
        marginBottom: 'var(--section-gap)',
        paddingLeft: 0,
        paddingRight: 0,
    };

    return (
        <div className="premium-home-bg" style={{ minHeight: '100vh' }}>
            <motion.div
                variants={pageVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                className="home-page"
            >
                <motion.section variants={sectionVariants} style={sectionWrapperStyle}>
                    <Banner bannerData={bannerData} />
                </motion.section>

                <div className="gold-divider" />

                <motion.section
                    variants={sectionVariants}
                    className="features-section"
                    style={{
                        ...sectionWrapperStyle,
                        background: 'var(--surface-subtle)',
                        borderRadius: '0',
                        padding: '40px 32px'
                    }}
                >
                    <div className="features-inner">
                        <div className="features-header">
                            <span className="features-eyebrow">✦ Công nghệ độc quyền</span>
                            <h2 className="features-title">Mua sắm thông minh hơn với AI & 3D</h2>
                            <p className="features-sub">Lần đầu tiên tại Việt Nam — thử đồ ảo trên avatar 3D cá nhân hóa theo số đo của bạn</p>
                        </div>

                        <div className="features-grid">
                            <div className="feature-card" style={{ background: 'var(--surface-card)', borderRadius: '14px', border: '1px solid var(--gold-border)', padding: '20px', boxShadow: 'var(--card-shadow)' }}>
                                <div className="feature-icon" style={{ background: 'var(--gold-light)', color: 'var(--gold-primary)' }}>
                                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" />
                                        <path d="M12 8v4l3 3" />
                                    </svg>
                                </div>
                                <h3 className="feature-title">Phòng thử đồ 3D</h3>
                                <p className="feature-desc">Mặc thử quần áo lên avatar 3D theo đúng số đo cơ thể của bạn trước khi quyết định mua</p>
                                <a href="/try-on" className="feature-cta" style={{ color: 'var(--gold-primary)' }}>Thử ngay →</a>
                            </div>

                            <div className="feature-card feature-card--highlight" style={{ background: 'var(--surface-card)', borderRadius: '14px', border: '1.5px solid var(--gold-primary)', padding: '20px', boxShadow: 'var(--card-shadow)' }}>
                                <div className="feature-badge">Phổ biến nhất</div>
                                <div className="feature-icon" style={{ background: 'var(--gold-light)', color: 'var(--gold-primary)' }}>
                                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                        <circle cx="12" cy="12" r="3" />
                                        <path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83" />
                                    </svg>
                                </div>
                                <h3 className="feature-title">AI gợi ý size chính xác</h3>
                                <p className="feature-desc">AI phân tích số đo và lịch sử mua hàng — gợi ý đúng size, không lo mua về không vừa</p>
                                <a href="/try-on" className="feature-cta" style={{ color: 'var(--gold-primary)' }}>Xem gợi ý →</a>
                            </div>

                            <div className="feature-card" style={{ background: 'var(--surface-card)', borderRadius: '14px', border: '1px solid var(--gold-border)', padding: '20px', boxShadow: 'var(--card-shadow)' }}>
                                <div className="feature-icon" style={{ background: 'var(--gold-light)', color: 'var(--gold-primary)' }}>
                                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
                                    </svg>
                                </div>
                                <h3 className="feature-title">Tủ đồ cá nhân hóa</h3>
                                <p className="feature-desc">Đồ đã mua tự động lưu vào tủ đồ ảo — thử phối với đồ mới bất cứ lúc nào</p>
                                <a href="/try-on" className="feature-cta" style={{ color: 'var(--gold-primary)' }}>Xem tủ đồ →</a>
                            </div>

                            <div className="feature-card" style={{ background: 'var(--surface-card)', borderRadius: '14px', border: '1px solid var(--gold-border)', padding: '20px', boxShadow: 'var(--card-shadow)' }}>
                                <div className="feature-icon" style={{ background: 'var(--gold-light)', color: 'var(--gold-primary)' }}>
                                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
                                    </svg>
                                </div>
                                <h3 className="feature-title">AI Outfit Generator</h3>
                                <p className="feature-desc">Nhập mô tả "đi cafe cuối tuần" — AI tạo outfit hoàn chỉnh từ tủ đồ của bạn</p>
                                <a href="/ai-outfit" className="feature-cta" style={{ color: 'var(--gold-primary)' }}>Phối đồ ngay →</a>
                            </div>
                        </div>

                        <div className="features-cta-row">
                            <a
                                href="/try-on"
                                className="features-main-cta"
                                style={{
                                    background: 'var(--gold-primary)',
                                    color: '#0F0B07',
                                    border: 'none',
                                    borderRadius: '28px',
                                    padding: '12px 32px',
                                    fontWeight: '600',
                                    fontSize: '14px',
                                    letterSpacing: '0.04em',
                                    boxShadow: '0 4px 16px rgba(201,150,63,0.3)',
                                    transition: 'transform 0.2s, box-shadow 0.2s'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.transform = 'translateY(-2px)';
                                    e.currentTarget.style.boxShadow = '0 8px 22px rgba(201,150,63,0.38)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.transform = 'translateY(0)';
                                    e.currentTarget.style.boxShadow = '0 4px 16px rgba(201,150,63,0.3)';
                                }}
                            >
                                Vào phòng thử đồ 3D ngay
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
                            </a>
                        </div>
                    </div>
                </motion.section>

                <div className="gold-divider" />

                <motion.section variants={sectionVariants} className="section-spacing" style={sectionWrapperStyle}>
                    <Category data={categories} />
                </motion.section>

                <div className="gold-divider" />

                <motion.section variants={sectionVariants} className="section-spacing" style={{ ...sectionWrapperStyle, marginBottom: '10px' }}>
                    <TopSearch products={topSearch} />
                </motion.section>

                <div className="gold-divider" />

                <motion.section variants={sectionVariants} className="section-spacing" style={{ ...sectionWrapperStyle, marginBottom: '20px' }}>
                    <FlashSale products={flashSaleProducts} />
                </motion.section>

                <motion.section variants={sectionVariants} className="section-spacing" style={sectionWrapperStyle}>
                    <div className="container">
                        <ProductList
                            products={products}
                            title={t('suggestions').toUpperCase()}
                            onBuy={onBuy}
                            loading={isLoading}
                        />
                    </div>
                </motion.section>

                <div className="gold-divider" />

                <motion.section variants={sectionVariants} className="section-spacing" style={sectionWrapperStyle}>
                    <ReviewCarousel />
                </motion.section>


            </motion.div>
        </div>
    );
}

export default HomePage;