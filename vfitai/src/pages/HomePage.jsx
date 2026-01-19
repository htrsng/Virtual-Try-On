import React from 'react';
import Banner from '../components/Banner';
import Category from '../components/Category';
import TopSearch from '../components/TopSearch';
import ProductList from '../components/ProductList';

function HomePage({ products }) {
    return (
        <div>
            <Banner />
            <Category />
            <TopSearch />
            <ProductList products={products} />
        </div>
    );
}

export default HomePage;