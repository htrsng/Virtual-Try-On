import React, { useState, useEffect } from 'react';
import { useSearchParams, useLocation } from 'react-router-dom';
import ProductList from '../components/ProductList';

function TopProductsPage({ products, onBuy, categories }) {
    const [searchParams] = useSearchParams();
    const location = useLocation();
    const [selectedCategory, setSelectedCategory] = useState(null);

    // Nếu có state từ TopSearch (click từ tìm kiếm hàng đầu), tự động set category
    useEffect(() => {
        if (location.state?.selectedCategory) {
            setSelectedCategory(location.state.selectedCategory);
        }
    }, [location.state]);

    // Filter sản phẩm theo danh mục
    const filteredProducts = React.useMemo(() => {
        if (!products || products.length === 0) return [];

        if (!selectedCategory) {
            return products; // Hiển thị all nếu không chọn danh mục
        }

        return products.filter(p => p.category === selectedCategory);
    }, [products, selectedCategory]);

    return (
        <div className="container list-page">
            <h2 className="list-page-title">Sản Phẩm Bán Chạy</h2>

            {/* Danh mục filter */}
            {categories && categories.length > 0 && (
                <div className="list-page-filters">
                    <button
                        onClick={() => setSelectedCategory(null)}
                        className={`filter-btn ${selectedCategory === null ? 'active' : ''}`}
                    >
                        Tất cả
                    </button>
                    {categories.map(cat => (
                        <button
                            key={cat.id}
                            onClick={() => setSelectedCategory(cat.name)}
                            className={`filter-btn ${selectedCategory === cat.name ? 'active' : ''}`}
                        >
                            {cat.name}
                        </button>
                    ))}
                </div>
            )}

            {filteredProducts && filteredProducts.length > 0 ? (
                <ProductList products={filteredProducts} onBuy={onBuy} title="" />
            ) : (
                <div className="list-page-empty">Chưa có sản phẩm bán chạy nào.</div>
            )}
        </div>
    );
}

export default TopProductsPage;
