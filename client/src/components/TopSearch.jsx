import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';

function TopSearch({ products }) {
    const navigate = useNavigate();
    const { t } = useLanguage();

    const handleProductClick = (item) => {
        navigate('/top-products', { state: { selectedCategory: item.category } });
    };

    return (
        <div className="top-search-section">
            <div className="top-header">
                <div className="top-title">{t('top_search_title')}</div>
                <Link to="/top-products" className="section-view-more">
                    {t('view_all') || 'Xem thêm'} →
                </Link>
            </div>
            <div className="top-grid">
                {/* Kiểm tra mảng tồn tại và có dữ liệu */}
                {products?.length > 0 && products.map((item) => (
                    <div
                        onClick={() => handleProductClick(item)}
                        key={item.id}
                        className="top-item"
                        style={{ textDecoration: 'none', color: 'inherit', display: 'block', cursor: 'pointer' }}
                    >
                        <div className="top-item-img-wrapper">
                            <div className="top-badge">TOP</div>

                            {/* 👇 ĐÃ SỬA: Thêm xử lý lỗi ảnh và đổi sang placehold.co */}
                            <img
                                src={item.img}
                                alt={item.name}
                                className="top-item-img"
                                onError={(e) => {
                                    e.target.onerror = null; // Chặn lặp vô hạn
                                    e.target.src = "https://placehold.co/150?text=Anh+Loi";
                                }}
                            />

                            <div className="sales-bar">{t('sold_count_monthly')} {item.sold}</div>
                        </div>
                        <div className="top-item-name">{item.name}</div>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default TopSearch;