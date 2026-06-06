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

    useEffect(() => {
        const cards = document.querySelectorAll('.feature-card');
        const obs = new IntersectionObserver((entries) => {
            entries.forEach((e, i) => {
                if (e.isIntersecting) {
                    setTimeout(() => e.target.classList.add('visible'), i * 100);
                }
            });
        }, { threshold: 0.1 });
        cards.forEach(c => obs.observe(c));
        return () => cards.forEach(c => obs.unobserve(c));
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

                {/* Smooth transition zone */}
                <div className="section-transition">
                    <div className="transition-glow"></div>
                </div>

                <motion.section
                    variants={sectionVariants}
                    className="features-section"
                    style={sectionWrapperStyle}
                >
                    <div className="orb-purple"></div>
                    <div className="orb-gold"></div>
                    <div className="features-inner">
                        <div className="features-header">
                            <span className="features-eyebrow">
                                <span className="eyebrow-dot"></span>
                                Công nghệ độc quyền
                            </span>
                            <h2 className="features-title">
                                Mua sắm thông minh hơn với <span className="title-gradient">AI & 3D</span>
                            </h2>
                            <p className="features-sub">Lần đầu tiên tại Việt Nam — thử đồ ảo trên avatar 3D cá nhân hóa theo số đo của bạn</p>
                        </div>

                        <div className="features-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '24px', marginBottom: '40px' }}>
                            <div className="feature-card" style={{ background: 'var(--surface-card)', borderRadius: '20px', border: '1px solid rgba(212,169,66,0.15)', padding: '40px 32px', boxShadow: 'var(--card-shadow)', position: 'relative', display: 'flex', flexDirection: 'column', minHeight: '340px', overflow: 'hidden', transition: 'transform 0.3s, box-shadow 0.3s' }} onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-5px)'; e.currentTarget.style.boxShadow = '0 12px 30px rgba(212,169,66,0.12)'; }} onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'var(--card-shadow)'; }}>
                                <div style={{ position: 'absolute', bottom: '-5px', right: '10px', fontSize: '140px', fontWeight: '900', color: 'rgba(212,169,66,0.08)', zIndex: 0, lineHeight: 0.8, pointerEvents: 'none', fontFamily: 'var(--font-display)', letterSpacing: '-0.04em' }}>01</div>
                                <div style={{ position: 'relative', zIndex: 1, flex: 1, display: 'flex', flexDirection: 'column' }}>
                                    <div className="feature-icon" style={{ background: 'var(--gold-light)', color: 'var(--gold-primary)', width: '56px', height: '56px', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}>
                                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" />
                                            <path d="M12 8v4l3 3" />
                                        </svg>
                                    </div>
                                    <h3 className="feature-title" style={{ fontSize: '22px', fontWeight: '700', marginBottom: '12px', color: 'var(--text-primary)' }}>Phòng Thử Đồ 3D Độc Quyền</h3>
                                    <p className="feature-desc" style={{ fontSize: '15px', color: 'var(--text-secondary)', lineHeight: '1.6', marginBottom: '32px' }}>Ướm thử mọi trang phục lên Avatar 3D với chính xác số đo của bạn. Chân thực đến từng nếp vải, mua sắm không lo đổi trả!</p>
                                    <div style={{ marginTop: 'auto' }}>
                                        <a href="/try-on" className="feature-cta" style={{ color: 'var(--gold-primary)', fontSize: '15px', fontWeight: '600', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>Trải nghiệm ngay &rarr;</a>
                                    </div>
                                </div>
                            </div>

                            <div className="feature-card feature-card--highlight" style={{ background: 'linear-gradient(160deg, var(--surface-card) 0%, rgba(212,169,66,0.03) 100%)', borderRadius: '20px', border: '1px solid rgba(212,169,66,0.4)', padding: '40px 32px', boxShadow: 'var(--card-shadow)', position: 'relative', display: 'flex', flexDirection: 'column', minHeight: '340px', overflow: 'hidden', transition: 'transform 0.3s, box-shadow 0.3s' }} onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-5px)'; e.currentTarget.style.boxShadow = '0 12px 30px rgba(212,169,66,0.18)'; }} onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'var(--card-shadow)'; }}>
                                <div style={{ position: 'absolute', bottom: '-5px', right: '10px', fontSize: '140px', fontWeight: '900', color: 'rgba(212,169,66,0.10)', zIndex: 0, lineHeight: 0.8, pointerEvents: 'none', fontFamily: 'var(--font-display)', letterSpacing: '-0.04em' }}>02</div>
                                <div className="feature-badge" style={{ position: 'absolute', top: '-1px', right: '24px', background: 'var(--gold-primary)', color: '#0F0B07', fontSize: '11px', fontWeight: '800', padding: '6px 14px', borderRadius: '0 0 10px 10px', zIndex: 2, textTransform: 'uppercase', letterSpacing: '0.05em' }}>ĐƯỢC YÊU THÍCH NHẤT</div>
                                <div style={{ position: 'relative', zIndex: 1, flex: 1, display: 'flex', flexDirection: 'column' }}>
                                    <div className="feature-icon" style={{ background: 'var(--gold-primary)', color: '#0F0B07', width: '56px', height: '56px', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px', boxShadow: '0 4px 14px rgba(212,169,66,0.3)' }}>
                                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                            <circle cx="12" cy="12" r="3" />
                                            <path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83" />
                                        </svg>
                                    </div>
                                    <h3 className="feature-title" style={{ fontSize: '22px', fontWeight: '700', marginBottom: '12px', color: 'var(--text-primary)' }}>AI Tư Vấn Size Chuẩn Xác</h3>
                                    <p className="feature-desc" style={{ fontSize: '15px', color: 'var(--text-secondary)', lineHeight: '1.6', marginBottom: '32px' }}>Quên đi nỗi lo chọn nhầm size. Trí tuệ nhân tạo phân tích số đo của bạn để gợi ý kích cỡ hoàn hảo như may đo riêng.</p>
                                    <div style={{ marginTop: 'auto' }}>
                                        <a href="/try-on" className="feature-cta" style={{ color: 'var(--gold-primary)', fontSize: '15px', fontWeight: '600', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>Khám phá AI &rarr;</a>
                                    </div>
                                </div>
                            </div>

                            <div className="feature-card" style={{ background: 'var(--surface-card)', borderRadius: '20px', border: '1px solid rgba(212,169,66,0.15)', padding: '40px 32px', boxShadow: 'var(--card-shadow)', position: 'relative', display: 'flex', flexDirection: 'column', minHeight: '340px', overflow: 'hidden', transition: 'transform 0.3s, box-shadow 0.3s' }} onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-5px)'; e.currentTarget.style.boxShadow = '0 12px 30px rgba(212,169,66,0.12)'; }} onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'var(--card-shadow)'; }}>
                                <div style={{ position: 'absolute', bottom: '-5px', right: '10px', fontSize: '140px', fontWeight: '900', color: 'rgba(212,169,66,0.08)', zIndex: 0, lineHeight: 0.8, pointerEvents: 'none', fontFamily: 'var(--font-display)', letterSpacing: '-0.04em' }}>03</div>
                                <div style={{ position: 'relative', zIndex: 1, flex: 1, display: 'flex', flexDirection: 'column' }}>
                                    <div className="feature-icon" style={{ background: 'var(--gold-light)', color: 'var(--gold-primary)', width: '56px', height: '56px', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}>
                                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
                                        </svg>
                                    </div>
                                    <h3 className="feature-title" style={{ fontSize: '22px', fontWeight: '700', marginBottom: '12px', color: 'var(--text-primary)' }}>SmartFit Closet Cá Nhân</h3>
                                    <p className="feature-desc" style={{ fontSize: '15px', color: 'var(--text-secondary)', lineHeight: '1.6', marginBottom: '32px' }}>Mỗi món đồ bạn mua tự động lưu vào tủ đồ ảo. Thỏa sức mix &amp; match hàng ngàn phong cách mới mọi lúc, mọi nơi.</p>
                                    <div style={{ marginTop: 'auto' }}>
                                        <a href="/try-on" className="feature-cta" style={{ color: 'var(--gold-primary)', fontSize: '15px', fontWeight: '600', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>Vào tủ đồ &rarr;</a>
                                    </div>
                                </div>
                            </div>

                            <div className="feature-card" style={{ background: 'var(--surface-card)', borderRadius: '20px', border: '1px solid rgba(212,169,66,0.15)', padding: '40px 32px', boxShadow: 'var(--card-shadow)', position: 'relative', display: 'flex', flexDirection: 'column', minHeight: '340px', overflow: 'hidden', transition: 'transform 0.3s, box-shadow 0.3s' }} onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-5px)'; e.currentTarget.style.boxShadow = '0 12px 30px rgba(212,169,66,0.12)'; }} onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'var(--card-shadow)'; }}>
                                <div style={{ position: 'absolute', bottom: '-5px', right: '10px', fontSize: '140px', fontWeight: '900', color: 'rgba(212,169,66,0.08)', zIndex: 0, lineHeight: 0.8, pointerEvents: 'none', fontFamily: 'var(--font-display)', letterSpacing: '-0.04em' }}>04</div>
                                <div style={{ position: 'relative', zIndex: 1, flex: 1, display: 'flex', flexDirection: 'column' }}>
                                    <div className="feature-icon" style={{ background: 'var(--gold-light)', color: 'var(--gold-primary)', width: '56px', height: '56px', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}>
                                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
                                        </svg>
                                    </div>
                                    <h3 className="feature-title" style={{ fontSize: '22px', fontWeight: '700', marginBottom: '12px', color: 'var(--text-primary)' }}>Stylist AI Riêng Của Bạn</h3>
                                    <p className="feature-desc" style={{ fontSize: '15px', color: 'var(--text-secondary)', lineHeight: '1.6', marginBottom: '32px' }}>Bạn cần outfit "Đi cafe cuối tuần" hay "Tiệc sang trọng"? Chỉ cần mô tả, AI sẽ lên ngay set đồ cực chất từ tủ đồ của bạn.</p>
                                    <div style={{ marginTop: 'auto' }}>
                                        <a href="/ai-outfit" className="feature-cta" style={{ color: 'var(--gold-primary)', fontSize: '15px', fontWeight: '600', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>Tạo outfit ngay &rarr;</a>
                                    </div>
                                </div>
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