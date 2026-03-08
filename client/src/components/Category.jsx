import React from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';

function Category({ data }) {
    const { t } = useLanguage();
    // Nếu chưa có dữ liệu truyền vào thì dùng mảng rỗng
    const categories = data || [];

    // Hàm chuyển tên thành slug
    const nameToSlug = (name) => {
        return name
            .toLowerCase()
            .replace(/\s+/g, '-')
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '');
    };

    return (
        <div className="category-section">
            <div className="category-header">
                <span>{t('fashion_categories')}</span>
                <Link to="/categories" className="section-view-more">
                    {t('view_all') || 'Xem thêm'} →
                </Link>
            </div>
            <div className="category-grid">
                {categories.map((item) => (
                    <Link
                        to={`/category/${nameToSlug(item.name)}`}
                        key={item.id}
                        className="category-item"
                        style={{ textDecoration: 'none', color: 'inherit' }}
                    >
                        <div style={{ height: '70%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <img
                                src={item.img}
                                alt={item.name}
                                className="category-img"
                                // 👇 ĐÃ SỬA: Đổi sang placehold.co và thêm chặn lặp vô hạn
                                onError={(e) => {
                                    e.target.onerror = null;
                                    e.target.src = "https://placehold.co/100?text=Anh+Loi"
                                }}
                            />
                        </div>
                        <div className="icon-text">{item.name}</div>
                    </Link>
                ))}
            </div>
        </div>
    );
}

export default Category;