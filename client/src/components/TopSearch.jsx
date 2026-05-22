import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './CategoryTopSearch.css';

function TrendingImage({ src, alt }) {
    const [isLoaded, setIsLoaded] = useState(false);

    return (
        <img
            src={src}
            alt={alt}
            loading="lazy"
            decoding="async"
            className={`ts-card__img${isLoaded ? ' ts-card__img--loaded' : ' ts-card__img--loading'}`}
            onLoad={() => setIsLoaded(true)}
            onError={(e) => {
                e.target.onerror = null;
                e.target.src = 'https://placehold.co/440x580/f0ece4/8B6F47?text=' + encodeURIComponent(alt);
            }}
        />
    );
}

function TopSearch({ products }) {
    const navigate = useNavigate();
    const sectionRef = useRef(null);
    const [isVisible, setIsVisible] = useState(false);
    const [likedIds, setLikedIds] = useState(() => new Set());

    const AI_REASONS = [
        { icon: '🔥', text: 'Bán chạy tuần này' },
        { icon: '💫', text: 'Hợp style của bạn' },
        { icon: '🌤', text: 'Phù hợp thời tiết' },
        { icon: '⭐', text: 'Được yêu thích nhất' },
        { icon: '✨', text: 'Mới về hôm nay' },
    ];

    const SCORE_VALUES = [91, 94, 87, 96, 89];

    const getAIReason = (index) => AI_REASONS[index % AI_REASONS.length];

    const displayProducts = useMemo(() => (products || []).slice(0, 6), [products]);

    useEffect(() => {
        const target = sectionRef.current;
        if (!target) {
            return undefined;
        }

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsVisible(true);
                    observer.disconnect();
                }
            },
            { threshold: 0.22 },
        );

        observer.observe(target);
        return () => observer.disconnect();
    }, []);

    const toggleWishlist = (itemId) => {
        setLikedIds((prev) => {
            const next = new Set(prev);
            if (next.has(itemId)) {
                next.delete(itemId);
            } else {
                next.add(itemId);
            }
            return next;
        });
    };

    const handleTryOn = (e, item) => {
        e.stopPropagation();
        navigate('/try-on', { state: { product: item } });
    };

    const handleCardClick = (item) => {
        navigate('/top-products', { state: { selectedCategory: item.category } });
    };

    const handleCardKeyDown = (event, item) => {
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            handleCardClick(item);
        }
    };

    if (displayProducts.length === 0) {
        return (
            <section className="ts-section">
                <div className="ts-section__header">
                    <div className="ts-section__header-left">
                        <span className="ts-section__eyebrow ts-section__eyebrow--pill">
                            ✦ AI ĐANG GỢI Ý CHO BẠN
                        </span>
                        <h2 className="ts-section__title ts-section__title--accented">
                            <span className="ts-section__title-word">Được</span> Chọn Riêng Cho Bạn
                        </h2>
                    </div>
                    <Link to="/top-products" className="ts-section__viewall">
                        <span>Xem tất cả</span>
                        <svg className="ts-section__viewall-icon ts-section__brain-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <path d="M9.5 5a3.5 3.5 0 0 1 6.8 1.2A3.2 3.2 0 0 1 19 9.3a3.5 3.5 0 0 1-1.3 6.7V17a3 3 0 0 1-3 3h-5a3 3 0 0 1-3-3v-.8A3.5 3.5 0 0 1 6.8 9.2 3.2 3.2 0 0 1 9.5 5Z" />
                            <path d="M9 10.2c.8-.7 1.9-1 3-1s2.2.3 3 1" />
                            <path d="M9 13.8c.8.7 1.9 1 3 1s2.2-.3 3-1" />
                        </svg>
                    </Link>
                </div>

                <div className="ts-track ts-track--skeleton" aria-hidden="true">
                    {Array.from({ length: 6 }).map((_, index) => (
                        <article key={`ts-skeleton-${index}`} className="ts-card ts-card--skeleton">
                            <div className="ts-card__media">
                                <div className="ts-card__skeleton ts-card__skeleton-media" />
                                <div className="ts-card__skeleton ts-card__skeleton-badge" />
                                <div className="ts-card__skeleton ts-card__skeleton-chip" />
                            </div>
                            <div className="ts-card__body">
                                <div className="ts-card__skeleton ts-card__skeleton-line ts-card__skeleton-line--name" />
                                <div className="ts-card__skeleton-row">
                                    <div className="ts-card__skeleton ts-card__skeleton-line ts-card__skeleton-line--price" />
                                    <div className="ts-card__skeleton ts-card__skeleton-line" style={{ width: '56px' }} />
                                </div>
                                <div className="ts-card__score">
                                    <div className="ts-card__skeleton-row">
                                        <div className="ts-card__skeleton ts-card__skeleton-line" style={{ width: '88px', height: '10px' }} />
                                        <div className="ts-card__skeleton ts-card__skeleton-line" style={{ width: '34px', height: '10px' }} />
                                    </div>
                                    <div className="ts-card__skeleton ts-card__skeleton-line ts-card__skeleton-line--score" />
                                </div>
                                <div className="ts-card__actions">
                                    <div className="ts-card__skeleton" style={{ width: '30px', height: '30px', borderRadius: '999px' }} />
                                    <div className="ts-card__skeleton" style={{ width: '76px', height: '26px', borderRadius: '20px' }} />
                                </div>
                            </div>
                        </article>
                    ))}
                </div>
            </section>
        );
    }

    return (
        <section ref={sectionRef} className="ts-section">
            {/* Header */}
            <div className="ts-section__header">
                <div className="ts-section__header-left">
                    <span className="ts-section__eyebrow ts-section__eyebrow--pill">
                        ✦ AI ĐANG GỢI Ý CHO BẠN
                    </span>
                    <h2 className="ts-section__title ts-section__title--accented">
                        <span className="ts-section__title-word">Được</span> Chọn Riêng Cho Bạn
                    </h2>
                </div>
                <Link to="/top-products" className="ts-section__viewall">
                    <span>Xem tất cả</span>
                    <svg className="ts-section__viewall-icon ts-section__brain-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M9.5 5a3.5 3.5 0 0 1 6.8 1.2A3.2 3.2 0 0 1 19 9.3a3.5 3.5 0 0 1-1.3 6.7V17a3 3 0 0 1-3 3h-5a3 3 0 0 1-3-3v-.8A3.5 3.5 0 0 1 6.8 9.2 3.2 3.2 0 0 1 9.5 5Z" />
                        <path d="M9 10.2c.8-.7 1.9-1 3-1s2.2.3 3 1" />
                        <path d="M9 13.8c.8.7 1.9 1 3 1s2.2-.3 3-1" />
                    </svg>
                </Link>
            </div>

            <div className="ts-track">
                {displayProducts.map((item, index) => {
                    const aiReason = getAIReason(index);
                    const score = SCORE_VALUES[index % SCORE_VALUES.length];
                    const originalPrice = item.originalPrice || item.oldPrice || null;
                    const hasDiscount = Boolean(item.discount || originalPrice);
                    const isLiked = likedIds.has(item.id);

                    return (
                        <article
                            key={item.id}
                            className={`ts-card${isVisible ? ' ts-card--visible' : ''}`}
                            style={{ transitionDelay: `${index * 80}ms` }}
                            onClick={() => handleCardClick(item)}
                            onKeyDown={(event) => handleCardKeyDown(event, item)}
                            role="button"
                            tabIndex={0}
                            aria-label={`Xem sản phẩm gợi ý ${item.name}`}
                        >
                            <div className="ts-card__media">
                                <div className="ts-card__image-wrap">
                                    <TrendingImage src={item.img} alt={item.name} />
                                </div>

                                <div className="ts-card__image-gradient" />

                                <span className="ts-card__rank-pill" aria-hidden="true">
                                    ✦ #{index + 1}
                                </span>

                                <span className="ts-card__reason-chip" aria-hidden="true">
                                    <span className="ts-card__reason-icon">{aiReason.icon}</span>
                                    {aiReason.text}
                                </span>
                            </div>

                            <div className="ts-card__body">
                                <p className="ts-card__name">{item.name}</p>

                                <div className="ts-card__price-row">
                                    <span className="ts-card__price">
                                        {item.price}
                                    </span>
                                    {hasDiscount && originalPrice && (
                                        <span className="ts-card__original-price">
                                            {originalPrice}
                                        </span>
                                    )}
                                </div>

                                <div className="ts-card__score">
                                    <div className="ts-card__score-head">
                                        <span>Độ phù hợp AI</span>
                                        <strong>{score}%</strong>
                                    </div>
                                    <div className="ts-card__score-bar" aria-hidden="true">
                                        <span style={{ width: isVisible ? `${score}%` : '0%' }} />
                                    </div>
                                </div>

                                <div className="ts-card__actions">
                                    <button
                                        type="button"
                                        className={`ts-card__heart-btn ${isLiked ? 'is-active' : ''}`}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            toggleWishlist(item.id);
                                        }}
                                        aria-label={isLiked ? `Bỏ yêu thích ${item.name}` : `Thêm ${item.name} vào yêu thích`}
                                    >
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill={isLiked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                            <path d="M20.8 4.6a5.5 5.5 0 00-7.8 0L12 5.6l-1-1a5.5 5.5 0 00-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 000-7.8z" />
                                        </svg>
                                    </button>

                                    <button
                                        type="button"
                                        className="ts-card__try-btn"
                                        onClick={(e) => handleTryOn(e, item)}
                                        aria-label={`Thử 3D ${item.name}`}
                                    >
                                        Thử 3D →
                                    </button>
                                </div>
                            </div>
                        </article>
                    );
                })}
            </div>
        </section>
    );
}

export default TopSearch;