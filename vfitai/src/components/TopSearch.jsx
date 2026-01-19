import React from 'react';
import { Link } from 'react-router-dom';

function TopSearch({ products }) {
    return (
        <div className="container top-search-section">
            <div className="top-header">
                <div className="top-title">TÌM KIẾM HÀNG ĐẦU</div>
            </div>
            <div className="top-grid">
                {/* Kiểm tra mảng tồn tại và có dữ liệu */}
                {products?.length > 0 && products.map((item) => (
                    <Link
                        to={`/product/${item.id}`}
                        key={item.id}
                        className="top-item"
                        style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}
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

                            <div className="sales-bar">Đã bán {item.sold}</div>
                        </div>
                        <div className="top-item-name">{item.name}</div>
                    </Link>
                ))}
            </div>
        </div>
    );
}

export default TopSearch;