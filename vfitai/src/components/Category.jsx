import React from 'react';
import { Link } from 'react-router-dom';

function Category({ data }) {
    // Nếu chưa có dữ liệu truyền vào thì dùng mảng rỗng
    const categories = data || [];

    return (
        <div className="container category-section">
            <div className="category-header">DANH MỤC THỜI TRANG</div>
            <div className="category-grid">
                {categories.map((item) => (
                    <Link
                        to={`/category/${item.id}`}
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