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
        <div className="container" style={{ marginTop: '20px' }}>
            <h2 style={{ color: '#ee4d2d', borderBottom: '1px solid #ddd', paddingBottom: '10px' }}>
                Sản Phẩm Bán Chạy
            </h2>

            {/* Danh mục filter */}
            {categories && categories.length > 0 && (
                <div style={{ marginTop: '15px', marginBottom: '20px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    <button
                        onClick={() => setSelectedCategory(null)}
                        style={{
                            padding: '8px 15px',
                            border: selectedCategory === null ? '2px solid #ee4d2d' : '1px solid #ddd',
                            background: selectedCategory === null ? '#ee4d2d' : 'white',
                            color: selectedCategory === null ? 'white' : '#333',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontWeight: selectedCategory === null ? 'bold' : 'normal'
                        }}
                    >
                        Tất cả
                    </button>
                    {categories.map(cat => (
                        <button
                            key={cat.id}
                            onClick={() => setSelectedCategory(cat.name)}
                            style={{
                                padding: '8px 15px',
                                border: selectedCategory === cat.name ? '2px solid #ee4d2d' : '1px solid #ddd',
                                background: selectedCategory === cat.name ? '#ee4d2d' : 'white',
                                color: selectedCategory === cat.name ? 'white' : '#333',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontWeight: selectedCategory === cat.name ? 'bold' : 'normal'
                            }}
                        >
                            {cat.name}
                        </button>
                    ))}
                </div>
            )}

            {filteredProducts && filteredProducts.length > 0 ? (
                <ProductList products={filteredProducts} onBuy={onBuy} title="" />
            ) : (
                <div style={{ textAlign: 'center', padding: '50px' }}>Chưa có sản phẩm bán chạy nào.</div>
            )}
        </div>
    );
}

export default TopProductsPage;
