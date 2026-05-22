import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FreeMode } from 'swiper/modules';
import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';
import { useLanguage } from '../contexts/LanguageContext';
import './CategoryTopSearch.css';

// Static AI insight data — display only for aesthetics
const AI_INSIGHTS = [
    { icon: '🔥', label: 'Hot nhất tuần', accent: '#b5441f', variant: 'hot' },
    { icon: '⬆️', label: '+38% tháng này', accent: '#19795c', variant: 'growth' },
    { icon: '✦', label: 'AI Gợi ý', accent: '#8b6530', variant: 'ai' },
    { icon: '👁️', label: 'Xem nhiều nhất', accent: '#5f6fb2', variant: 'view' },
    { icon: '🔥', label: 'Bán chạy nhất', accent: '#b5441f', variant: 'hot' },
    { icon: '⬆️', label: '+21% tuần này', accent: '#19795c', variant: 'growth' },
];

// Rank badge styles
const RANK_STYLES = {
    0: { label: '#1', tone: 'gold', size: 'lg' },
    1: { label: '#2', tone: 'silver', size: 'lg' },
    2: { label: '#3', tone: 'bronze', size: 'lg' },
    3: { label: '#4', tone: 'neutral', size: 'sm' },
    4: { label: '#5', tone: 'neutral', size: 'sm' },
    5: { label: '#6', tone: 'neutral', size: 'sm' },
};

const getFitScore = (item, index) => {
    const seed = Number(item?.id) || index + 1;
    const categoryWeight = item?.category?.length || 0;
    const score = 90 + ((seed * 7 + categoryWeight * 3) % 10);
    return Math.min(99, Math.max(90, score));
};

function TopSearch({ products }) {
    const navigate = useNavigate();
    const { t } = useLanguage();

    const displayProducts = (products || []).slice(0, 6);

    const handleTryOn = (e, item) => {
        e.stopPropagation();
        // Dẫn thẳng vào /try-on với product id
        navigate(`/try-on`, { state: { product: item } });
    };

    const handleCardClick = (item) => {
        navigate('/top-products', { state: { selectedCategory: item.category } });
    };

    return (
        <div className="ts-section">
            {/* Header */}
            <div className="ts-section__header">
                <div className="ts-section__header-left">
                    <span className="ts-section__eyebrow">
                        <span className="ts-live-dot" />
                        + Cập nhật theo AI
                    </span>
                    <h2 className="ts-section__title">{t('top_search_title') || 'Tìm kiếm hàng đầu'}</h2>
                </div>
                <Link to="/top-products" className="ts-section__viewall">
                    Xem tất cả
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                </Link>
            </div>

            <div className="ts-slider-shell">
                <Swiper
                    className="ts-slider"
                    modules={[FreeMode]}
                    freeMode
                    grabCursor
                    slidesPerView={1.15}
                    spaceBetween={14}
                    watchOverflow
                    breakpoints={{
                        640: { slidesPerView: 2.15, spaceBetween: 14 },
                        960: { slidesPerView: 3.15, spaceBetween: 16 },
                        1280: { slidesPerView: 4.5, spaceBetween: 18 },
                    }}
                >
                    {displayProducts.map((item, index) => {
                        const rank = RANK_STYLES[index] || RANK_STYLES[5];
                        const insight = AI_INSIGHTS[index] || AI_INSIGHTS[0];
                        const fitScore = getFitScore(item, index);

                        return (
                            <SwiperSlide key={item.id} className="ts-slide">
                                <div
                                    className={`ts-card ts-card--${rank.size}`}
                                    onClick={() => handleCardClick(item)}
                                    role="button"
                                    tabIndex={0}
                                >
                                    <div className={`ts-rank ts-rank--${rank.size} ts-rank--${rank.tone}`}>
                                        {rank.label}
                                    </div>

                                    <div className="ts-card__img-wrap">
                                        <img
                                            src={item.img}
                                            alt={item.name}
                                            className="ts-card__img"
                                            onError={(e) => {
                                                e.target.onerror = null;
                                                e.target.src = 'https://placehold.co/200x260/f0ece4/8B6F47?text=' + encodeURIComponent(item.name);
                                            }}
                                        />

                                        <button
                                            className="ts-tryon-btn"
                                            onClick={(e) => handleTryOn(e, item)}
                                            title="Thử đồ ảo trên avatar 3D"
                                        >
                                            <span className="ts-tryon-btn__icon" aria-hidden="true">
                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                                                    <path d="M12 3l3 6 6 3-6 3-3 6-3-6-6-3 6-3z" />
                                                    <circle cx="12" cy="12" r="2.2" />
                                                </svg>
                                            </span>
                                            <span>Thử đồ ảo</span>
                                        </button>

                                        <div className="ts-fit-score">
                                            <div className="ts-fit-score__row">
                                                <span>Độ vừa vặn</span>
                                                <strong>{fitScore}%</strong>
                                            </div>
                                            <div className="ts-fit-score__bar">
                                                <span style={{ width: `${fitScore}%` }} />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="ts-card__info">
                                        <div className="ts-card__title-row">
                                            <p className="ts-card__name">{item.name}</p>
                                            <span className="ts-card__hot-dot" aria-hidden="true" />
                                        </div>

                                        <div className="ts-card__meta-row">
                                            <span className={`ts-insight ts-insight--${insight.variant}`}>
                                                <span className="ts-insight__icon">{insight.icon}</span>
                                                {insight.label}
                                            </span>
                                            <span className="ts-fit-chip">AI & 3D</span>
                                        </div>
                                    </div>
                                </div>
                            </SwiperSlide>
                        );
                    })}
                </Swiper>
            </div>
        </div>
    );
}

export default TopSearch;