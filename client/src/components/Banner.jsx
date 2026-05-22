import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

const HERO_SLIDES = [
    {
        eyebrow: '✦ Phòng thử đồ 3D · Công nghệ AI',
        headline: ['Mặc thử trước', 'Mua sau — chuẩn size'],
        sub: 'Avatar 3D theo đúng số đo cơ thể. Thử ngàn bộ trang phục trong vài giây, không lo trả hàng.',
        cta: { label: 'Vào phòng thử đồ 3D', path: '/try-on' },
        ctaSecondary: { label: 'Khám phá sản phẩm', path: '/products' },
    },
    {
        eyebrow: '✦ AI Size Recommendation',
        headline: ['Size đúng ngay', 'lần đầu tiên'],
        sub: 'AI phân tích số đo cơ thể, gợi ý size chính xác — giảm 90% đơn trả hàng do không vừa.',
        cta: { label: 'Thử AI sizing ngay', path: '/try-on' },
        ctaSecondary: { label: 'Xem bộ sưu tập', path: '/products' },
    },
    {
        eyebrow: '✦ Heatmap Fit Analysis',
        headline: ['Xem vùng vừa,', 'vùng chật trên 3D'],
        sub: 'Bản đồ nhiệt hiển thị trực tiếp: đỏ là chật, xanh là vừa vặn hoàn hảo cho từng vùng cơ thể.',
        cta: { label: 'Xem Heatmap →', path: '/try-on' },
        ctaSecondary: { label: 'Tìm hiểu thêm', path: '/about' },
    },
];

const STATS = [
    { value: '10,000+', label: 'Sản phẩm' },
    { value: '3D Real-time', label: 'Try-On' },
    { value: 'AI', label: 'Gợi ý size' },
    { value: '99%', label: 'Hài lòng' },
];

function Banner({ bannerData }) {
    const navigate = useNavigate();
    const [current, setCurrent] = useState(0);
    const intervalRef = useRef(null);

    useEffect(() => {
        intervalRef.current = setInterval(() => {
            setCurrent(c => (c + 1) % HERO_SLIDES.length);
        }, 5500);
        return () => clearInterval(intervalRef.current);
    }, []);

    const textVariants = {
        hidden: { opacity: 0, y: 36, filter: 'blur(6px)' },
        visible: (i) => ({
            opacity: 1, y: 0, filter: 'blur(0px)',
            transition: { duration: 0.6, delay: i * 0.11, ease: [0.22, 1, 0.36, 1] }
        }),
        exit: { opacity: 0, y: -16, transition: { duration: 0.25 } },
    };

    const slide = HERO_SLIDES[current];

    return (
        <div className="noise-texture" style={{ position: 'relative', overflow: 'hidden' }}>
            <section className="vf-hero" aria-label="Hero banner" style={{ position: 'relative', overflow: 'hidden' }}>
                {/* Dark bg with gold gradient overlay */}
                <div className="vf-hero__bg">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={current}
                            className="vf-hero__glow"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 1.2 }}
                        />
                    </AnimatePresence>
                    <div className="vf-hero__noise" />
                    <div className="vf-hero__fade-bottom" />
                </div>

                {/* Content */}
                <div className="vf-hero__content container">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={current}
                            className="vf-hero__text"
                            initial="hidden"
                            animate="visible"
                            exit="exit"
                        >
                            {/* Eyebrow */}
                            <motion.span className="vf-hero__eyebrow" custom={0} variants={textVariants}>
                                {slide.eyebrow}
                            </motion.span>

                            {/* Headline */}
                            <motion.h1 className="vf-hero__headline">
                                {slide.headline.map((line, i) => (
                                    <motion.span
                                        key={i}
                                        style={{ display: 'block' }}
                                        custom={i + 1}
                                        variants={textVariants}
                                    >
                                        {i === 0
                                            ? <span className="vf-hero__headline-gold">{line}</span>
                                            : line
                                        }
                                    </motion.span>
                                ))}
                            </motion.h1>

                            {/* Sub */}
                            <motion.p className="vf-hero__sub" custom={3} variants={textVariants}>
                                {slide.sub}
                            </motion.p>

                            {/* CTA */}
                            <motion.div className="vf-hero__cta-row" custom={4} variants={textVariants}>
                                <button
                                    className="vf-btn vf-btn--gold"
                                    onClick={() => navigate(slide.cta.path)}
                                >
                                    {slide.cta.label}
                                </button>
                                <button
                                    className="vf-btn vf-btn--outline"
                                    onClick={() => navigate(slide.ctaSecondary.path)}
                                >
                                    {slide.ctaSecondary.label}
                                </button>
                            </motion.div>
                        </motion.div>
                    </AnimatePresence>

                    {/* Right: decorative floating card */}
                    <motion.div
                        className="vf-hero__deco"
                        initial={{ opacity: 0, x: 48 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.9, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
                    >
                        {/* Floating avatar card */}
                        <div className="vf-deco-card">
                            <div className="vf-deco-label">AI Heatmap Analysis</div>
                            <div className="vf-deco-avatar">
                                <svg viewBox="0 0 100 140" fill="none" xmlns="http://www.w3.org/2000/svg" width="90" height="126">
                                    {/* Head */}
                                    <ellipse cx="50" cy="30" rx="18" ry="20" fill="rgba(255,255,255,0.10)" stroke="rgba(200,168,103,0.45)" strokeWidth="1.2" />
                                    <circle cx="50" cy="30" r="11" fill="rgba(255,255,255,0.14)" />
                                    {/* Body */}
                                    <path d="M18 140 Q18 82 50 74 Q82 82 82 140Z" fill="rgba(200,168,103,0.20)" stroke="rgba(200,168,103,0.50)" strokeWidth="1.2" />
                                    {/* Heatmap dots */}
                                    <circle cx="50" cy="93" r="7" fill="rgba(52,211,153,0.75)" />
                                    <circle cx="37" cy="104" r="5" fill="rgba(52,211,153,0.60)" />
                                    <circle cx="63" cy="104" r="5" fill="rgba(52,211,153,0.60)" />
                                    <circle cx="43" cy="115" r="5" fill="rgba(251,191,36,0.70)" />
                                    <circle cx="57" cy="115" r="5" fill="rgba(251,191,36,0.70)" />
                                    <circle cx="50" cy="126" r="6" fill="rgba(239,68,68,0.65)" />
                                </svg>
                            </div>
                            <div className="vf-deco-pills">
                                <div className="vf-deco-pill vf-deco-pill--green">
                                    <span className="vf-dot vf-dot--green" />Vừa vặn
                                </div>
                                <div className="vf-deco-pill vf-deco-pill--amber">
                                    <span className="vf-dot vf-dot--amber" />Hơi chật
                                </div>
                                <div className="vf-deco-pill vf-deco-pill--red">
                                    <span className="vf-dot vf-dot--red" />Cần size to hơn
                                </div>
                            </div>
                        </div>

                        {/* Floating badge */}
                        <motion.div
                            className="vf-float-badge"
                            animate={{ y: [0, -8, 0] }}
                            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                        >
                            <span className="vf-float-badge__icon">✓</span>
                            <div>
                                <div className="vf-float-badge__title">AI gợi ý: Size M</div>
                                <div className="vf-float-badge__sub">Phù hợp 96%</div>
                            </div>
                        </motion.div>
                    </motion.div>
                </div>

                {/* Stats bar */}
                <div
                    className="vf-hero__stats"
                    style={{
                        borderTop: '1px solid var(--gold-divider)',
                        backdropFilter: 'blur(8px)',
                        background: 'rgba(15,11,7,0.6)'
                    }}
                >
                    <div className="container vf-hero__stats-inner">
                        {STATS.map((s, i) => (
                            <motion.div
                                key={i}
                                className="vf-hero__stat"
                                initial={{ opacity: 0, y: 16 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.7 + i * 0.1 }}
                            >
                                <span className="vf-hero__stat-value" style={{ color: 'var(--gold-primary)' }}>{s.value}</span>
                                <span className="vf-hero__stat-label">{s.label}</span>
                            </motion.div>
                        ))}
                    </div>
                </div>

                {/* Slide dots */}
                <div className="vf-hero__dots">
                    {HERO_SLIDES.map((_, i) => (
                        <button
                            key={i}
                            className={`vf-hero__dot${i === current ? ' active' : ''}`}
                            onClick={() => setCurrent(i)}
                            aria-label={`Slide ${i + 1}`}
                        />
                    ))}
                </div>
            </section>
        </div>
    );
}

export default Banner;