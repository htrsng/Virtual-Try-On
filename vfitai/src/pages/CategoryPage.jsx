import React from 'react';
import { useParams } from 'react-router-dom';
import ProductList from '../components/ProductList';

function CategoryPage({ products, onBuy }) {
    const { id } = useParams();

    const categoryMap = {
        "ao-thun": "Áo Thun",
        "ao-so-mi": "Áo Sơ Mi",
        "ao-khoac": "Áo Khoác",
        "quan-jeans": "Quần Jeans",
        "quan-short": "Quần Short",
        "vay-dam": "Váy & Đầm",
        "chan-vay": "Chân Váy",
        "do-ngu": "Đồ Ngủ",
        "the-thao": "Đồ Thể Thao",
        "phu-kien": "Phụ Kiện"
    };

    const currentCategoryName = categoryMap[id] || "Sản phẩm";

    const filteredProducts = products.filter(p => p.category === currentCategoryName);

    return (
        <div className="container" style={{ marginTop: '20px' }}>
            <h2 style={{ color: '#ee4d2d', borderBottom: '1px solid #ddd', paddingBottom: '10px' }}>
                Danh mục: {currentCategoryName}
            </h2>
            {filteredProducts.length > 0 ? (
                <ProductList products={filteredProducts} onBuy={onBuy} />
            ) : (
                <div style={{ textAlign: 'center', padding: '50px' }}>Chưa có sản phẩm nào thuộc danh mục này.</div>
            )}
        </div>
    );
}

export default CategoryPage;