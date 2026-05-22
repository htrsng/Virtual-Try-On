import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import './CategoryTopSearch.css';

function Category({ data }) {
    const { t } = useLanguage();
    const navigate = useNavigate();
    const categories = data || [];

    // Chỉ lấy 5 danh mục đầu tiên để ảnh to và đẹp hơn
    const displayCategories = categories.slice(0, 5);

    const nameToSlug = (name) =>
        name
            .toLowerCase()
            .replace(/\s+/g, '-')
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '');

    // Những category nào liên quan đến thử đồ AI
    const AI_TRYON_KEYWORDS = ['áo', 'quần', 'đầm', 'váy', 'khoác'];
    const hasAITag = (name) =>
        AI_TRYON_KEYWORDS.some((kw) => name.toLowerCase().includes(kw));

    const handleTryOn = (item) => {
        navigate('/ai-outfit', {
            state: {
                initialPrompt: `Tạo outfit theo danh mục ${item.name}`,
                categoryName: item.name,
            },
        });
    };

    return (
        <div className="cat-section">
            {/* Header */}
            <div className="cat-section__header">
                <div className="cat-section__header-left">
                    <span className="cat-section__eyebrow">✦ Khám phá</span>
                    <h2 className="cat-section__title">{t('fashion_categories') || 'Danh mục thời trang'}</h2>
                </div>
                <Link to="/categories" className="cat-section__viewall">
                    Xem tất cả
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                </Link>
            </div>

            {/* Editorial grid — 5 portrait cards */}
            <div className="cat-grid">
                {displayCategories.map((item, index) => (
                    <div
                        key={item.id}
                        className={`cat-card${index === 0 ? ' cat-card--featured' : ''}`}
                        role="group"
                    >
                        <Link
                            to={`/category/${nameToSlug(item.name)}`}
                            className="cat-card__main-link"
                            aria-label={`Xem danh mục ${item.name}`}
                        />

                        {index === 0 && (
                            <span className="cat-card__feature-tag">
                                + Cập nhật theo AI
                            </span>
                        )}

                        {/* AI Try-On tag */}
                        {hasAITag(item.name) && (
                            <span className="cat-card__ai-tag">
                                <svg width="9" height="9" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                                </svg>
                                AI Try-On
                            </span>
                        )}

                        {/* Ảnh portrait */}
                        <div className="cat-card__img-wrap">
                            <img
                                src={item.img}
                                alt={item.name}
                                className="cat-card__img"
                                onError={(e) => {
                                    e.target.onerror = null;
                                    e.target.src =
                                        'https://placehold.co/360x480/f0ece4/8B6F47?text=' +
                                        encodeURIComponent(item.name);
                                }}
                            />
                            {/* Gradient overlay */}
                            <div className="cat-card__overlay">
                                <div className="cat-card__overlay-copy">
                                    <span className="cat-card__name">{item.name}</span>
                                    <span className="cat-card__eyebrow-inline">+ Khám phá bộ sưu tập</span>
                                </div>
                                <button
                                    type="button"
                                    className="cat-card__cta"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        handleTryOn(item);
                                    }}
                                    aria-label={`Thử đồ ảo ngay với danh mục ${item.name}`}
                                >
                                    Thử đồ ảo ngay
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                        <path d="M5 12h14M12 5l7 7-7 7" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default Category;