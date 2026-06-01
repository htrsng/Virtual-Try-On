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
        <div className="cat-section" style={{ padding: '40px 0' }}>
            <div className="container">
            <style>
                {`
                @media (max-width: 768px) {
                    .cat-section { padding: 20px 16px !important; }
                }
                .light-cat-card {
                    background: var(--surface-card) !important;
                    border: 1px solid var(--gold-border) !important;
                    border-radius: 16px !important;
                    transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) !important;
                    cursor: pointer;
                    box-shadow: var(--card-shadow) !important;
                    padding: 8px !important;
                    display: flex !important;
                    flex-direction: column !important;
                }
                .light-cat-card:hover {
                    border-color: rgba(201,150,63,0.4) !important;
                    transform: translateY(-4px) !important;
                    box-shadow: 0 12px 24px rgba(201,150,63,0.12) !important;
                }
                .light-cat-card.is-hot {
                    background: linear-gradient(160deg, var(--surface-card) 0%, rgba(212,169,66,0.06) 100%) !important;
                    border: 1.5px solid var(--gold-primary) !important;
                }
                .light-cat-card .cat-card__img-wrap {
                    background: #fdfcf9 !important;
                    padding: 0 !important;
                    position: relative !important;
                    flex: 1 !important;
                    border-radius: 12px !important;
                    border: 1px solid rgba(201,150,63,0.1) !important;
                    overflow: hidden !important;
                }
                .light-cat-card .cat-card__img {
                    width: 100% !important;
                    height: 100% !important;
                    object-fit: cover !important;
                    transition: transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) !important;
                }
                .light-cat-card:hover .cat-card__img {
                    transform: scale(1.06) !important;
                }
                .light-ai-badge {
                    background: rgba(255,255,255,0.85) !important;
                    border: 1px solid rgba(201,150,63,0.3) !important;
                    border-radius: 8px !important;
                    padding: 4px 10px !important;
                    font-size: 9px !important;
                    color: var(--gold-primary) !important;
                    backdrop-filter: blur(8px) !important;
                    top: 14px !important;
                    right: 14px !important;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.05) !important;
                    z-index: 10 !important;
                    font-weight: 700 !important;
                }
                .light-cat-info {
                    padding: 16px 6px 8px;
                    background: transparent;
                    position: relative;
                    z-index: 5;
                    text-align: center;
                }
                .light-cat-name {
                    color: var(--text-primary);
                    font-size: 14px;
                    font-weight: 700;
                    display: block;
                    margin-bottom: 4px;
                }
                .light-cat-card.is-hot .light-cat-name {
                    color: var(--gold-primary);
                }
                .light-cat-subtitle {
                    color: var(--text-secondary);
                    font-size: 11px;
                    display: block;
                }
                .light-cat-card .light-try-btn {
                    position: absolute !important;
                    bottom: 78px !important;
                    left: 50% !important;
                    transform: translateX(-50%) translateY(10px) !important;
                    opacity: 0 !important;
                    background: var(--gold-primary) !important;
                    color: #0F0B07 !important;
                    border: none !important;
                    border-radius: 100px !important;
                    padding: 8px 18px !important;
                    font-size: 11px !important;
                    font-weight: 700 !important;
                    box-shadow: 0 6px 16px rgba(201,150,63,0.3) !important;
                    transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) !important;
                    z-index: 10 !important;
                    white-space: nowrap !important;
                    display: flex !important;
                    align-items: center !important;
                    gap: 6px !important;
                }
                .light-cat-card:hover .light-try-btn {
                    opacity: 1 !important;
                    transform: translateX(-50%) translateY(0) !important;
                }
                `}
            </style>
            {/* Header */}
            <div className="cat-section__header">
                <div className="cat-section__header-left">
                    <span className="cat-section__eyebrow" style={{ color: '#8B6914', fontSize: '9px', letterSpacing: '0.1em' }}>✦ Khám phá</span>
                    <h2 className="cat-section__title" style={{ color: 'var(--text-primary)', fontSize: '20px', fontWeight: '700' }}>{t('fashion_categories') || 'Danh mục thời trang'}</h2>
                </div>
                <Link to="/categories" className="cat-section__viewall" style={{ color: 'var(--gold-primary)' }}>
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
                            className={`cat-card light-cat-card ${index === 0 ? 'is-hot' : ''}`}
                            role="group"
                        >
                            <Link
                                to={`/category/${nameToSlug(item.name)}`}
                                className="cat-card__main-link"
                                aria-label={`Xem danh mục ${item.name}`}
                            />

                            {/* AI Try-On tag */}
                            {hasAITag(item.name) && (
                                <span className="cat-card__ai-tag light-ai-badge">
                                    <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
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
                            </div>

                            {/* Thông tin ở dưới ảnh */}
                            <div className="light-cat-info">
                                <span className="light-cat-name">{item.name}</span>
                                <span className="light-cat-subtitle">
                                    {index === 0 ? "+ Cập nhật theo AI" : "+ Khám phá bộ sưu tập"}
                                </span>
                            </div>

                            {/* Nút hiển thị khi hover */}
                            <button
                                type="button"
                                className="light-try-btn"
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    handleTryOn(item);
                                }}
                                aria-label={`Thử đồ ảo ngay với danh mục ${item.name}`}
                            >
                                Thử đồ ảo
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                    <path d="M5 12h14M12 5l7 7-7 7" />
                                </svg>
                            </button>
                        </div>
                ))}
            </div>
            </div>
        </div>
    );
}

export default Category;