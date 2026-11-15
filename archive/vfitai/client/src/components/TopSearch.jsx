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

    const displayProducts = useMemo(() => (products || []).slice(0, 5), [products]);

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
        return null;
    }

    const renderHeroCard = (item, index, aiReason, score) => {
        const isLiked = likedIds.has(item.id);
        return (
            <div
                key={item.id}
                onClick={() => handleCardClick(item)}
                onKeyDown={(e) => handleCardKeyDown(e, item)}
                role="button"
                tabIndex={0}
                style={{
                    background: 'var(--surface-card)',
                    borderRadius: '14px',
                    overflow: 'hidden',
                    boxShadow: '0 2px 12px rgba(139,105,20,0.13), 0 0 0 1px rgba(201,150,63,0.18)',
                    gridRow: 'span 2',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column'
                }}
            >
                <div style={{ height: '260px', background: '#F4F4F4', position: 'relative', overflow: 'hidden' }}>
                    <img
                        src={item.img}
                        alt={item.name}
                        style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                    />
                    <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '100px', background: 'linear-gradient(transparent, rgba(15,11,7,0.95))' }} />
                    <div style={{ position: 'absolute', bottom: '16px', left: '16px' }}>
                        <div style={{ fontSize: '12px', color: '#D4AF37', letterSpacing: '0.07em', marginBottom: '6px', fontWeight: '800' }}>
                            ✦ #1 · {aiReason.text}
                        </div>
                        <div style={{ fontSize: '24px', color: '#FFFFFF', fontWeight: '800', letterSpacing: '-0.02em', textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>
                            {item.name}
                        </div>
                    </div>
                </div>
                <div style={{ padding: '12px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <div style={{ fontSize: '16px', color: 'var(--gold-primary)', fontWeight: '700' }}>
                        {typeof item.price === 'number' ? item.price.toLocaleString('vi-VN') : item.price}đ
                    </div>
                    <div style={{ fontSize: '10px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                        Độ phù hợp AI: {score}% · Vừa vặn
                    </div>
                    <div style={{ width: '100%', height: '2px', background: '#E8E0D0', marginTop: '6px', borderRadius: '2px', overflow: 'hidden' }}>
                        <div style={{ width: `${score}%`, height: '100%', background: 'linear-gradient(90deg, #C9963F 0%, #E8B84B 100%)' }} />
                    </div>
                    <div style={{ marginTop: 'auto', paddingTop: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); toggleWishlist(item.id); }}
                            style={{ background: 'none', border: 'none', color: isLiked ? 'var(--gold-primary)' : 'var(--text-secondary)', cursor: 'pointer', padding: '4px' }}
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill={isLiked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M20.8 4.6a5.5 5.5 0 00-7.8 0L12 5.6l-1-1a5.5 5.5 0 00-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 000-7.8z" />
                            </svg>
                        </button>
                        <button
                            type="button"
                            onClick={(e) => handleTryOn(e, item)}
                            style={{ border: '1px solid var(--gold-primary)', color: 'var(--gold-primary)', background: 'transparent', fontSize: '11px', fontWeight: '700', borderRadius: '20px', padding: '4px 12px', cursor: 'pointer' }}
                        >
                            Thử 3D →
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    const renderSmallCard = (item, index, aiReason, score) => {
        return (
            <div
                key={item.id}
                onClick={() => handleCardClick(item)}
                onKeyDown={(e) => handleCardKeyDown(e, item)}
                role="button"
                tabIndex={0}
                style={{
                    background: 'var(--surface-card)',
                    borderRadius: '10px',
                    overflow: 'hidden',
                    boxShadow: '0 1px 6px rgba(139,105,20,0.09)',
                    border: '0.5px solid rgba(201,150,63,0.12)',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column'
                }}
            >
                <div style={{ height: '130px', position: 'relative', background: '#F4F4F4' }}>
                    <img src={item.img} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                    <div style={{ position: 'absolute', top: '6px', right: '6px', background: 'rgba(15,11,7,0.75)', border: '0.5px solid rgba(201,150,63,0.4)', borderRadius: '10px', padding: '4px 8px', fontSize: '10px', color: '#D4AF37', fontWeight: '700' }}>
                        ✦ #{index + 1}
                    </div>
                    <div style={{ position: 'absolute', bottom: '6px', left: '6px', background: 'rgba(15,11,7,0.75)', borderRadius: '8px', padding: '4px 8px', fontSize: '9px', color: '#E8DCC8', fontWeight: '600' }}>
                        {aiReason.icon} {aiReason.text}
                    </div>
                </div>
                <div style={{ padding: '7px 9px 9px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <div style={{ fontSize: '12px', fontWeight: '700', color: '#1C1409', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {item.name}
                    </div>
                    <div style={{ fontSize: '11px', color: '#B38B36', fontWeight: '700' }}>
                        {typeof item.price === 'number' ? item.price.toLocaleString('vi-VN') : item.price}đ
                    </div>
                    <div style={{ width: '100%', height: '2px', background: '#E8E0D0', borderRadius: '2px', overflow: 'hidden' }}>
                        <div style={{ width: `${score}%`, height: '100%', background: 'linear-gradient(90deg, #C9963F 0%, #E8B84B 100%)' }} />
                    </div>
                </div>
            </div>
        );
    };

    return (
        <section ref={sectionRef} className="ts-section" style={{ padding: '20px 0' }}>
            <div className="container">
                <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: '0' }}>
                    <div style={{ fontSize: '52px', fontWeight: '500', color: 'rgba(201,150,63,0.1)', lineHeight: '1', marginRight: '8px', fontFamily: 'Georgia, serif', userSelect: 'none', flexShrink: 0 }}>
                        AI
                    </div>
                    <div>
                        <div style={{ fontSize: '10px', letterSpacing: '0.12em', color: '#8B6914', fontWeight: '700', marginBottom: '4px' }}>
                            ✦ ĐƯỢC CHỌN RIÊNG CHO BẠN
                        </div>
                        <div style={{ fontSize: '20px', fontWeight: '700', color: '#1C1409', margin: 0, letterSpacing: '-0.02em' }}>
                            Picks hôm nay
                        </div>
                    </div>
                </div>
                <Link to="/top-products" style={{ fontSize: '11px', color: 'var(--gold-primary)', textDecoration: 'none' }}>
                    Xem tất cả →
                </Link>
            </div>

            <div className="editorial-grid">
                {displayProducts.length > 0 && renderHeroCard(displayProducts[0], 0, getAIReason(0), SCORE_VALUES[0])}
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {displayProducts.slice(1, 3).map((item, i) => {
                        const actualIndex = i + 1;
                        return renderSmallCard(item, actualIndex, getAIReason(actualIndex), SCORE_VALUES[actualIndex % SCORE_VALUES.length]);
                    })}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {displayProducts.slice(3, 5).map((item, i) => {
                        const actualIndex = i + 3;
                        return renderSmallCard(item, actualIndex, getAIReason(actualIndex), SCORE_VALUES[actualIndex % SCORE_VALUES.length]);
                    })}
                </div>
            </div>
            </div>
        </section>
    );
}

export default TopSearch;