import React from 'react';
import Banner from '../components/Banner';
import Category from '../components/Category';
import TopSearch from '../components/TopSearch';
import ProductList from '../components/ProductList';

function HomePage2({ products, topSearch, categories, onBuy }) {
    return (
        <div className="home-page-container">
            {/* Banner chính */}
            <Banner data={categories} />

            {/* Danh mục */}
            <Category data={categories} />

            {/* Tìm kiếm hàng đầu */}
            <TopSearch data={topSearch} />

            {/* Danh sách sản phẩm */}
            <ProductList products={products} title="GỢI Ý HÔM NAY" onBuy={onBuy} />
        </div>
    );
}

export default HomePage2;
