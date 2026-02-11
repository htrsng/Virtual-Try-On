import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Banner from '../components/Banner';
import Category from '../components/Category';
import TopSearch from '../components/TopSearch';
import ProductList from '../components/ProductList';
import FlashSale from '../components/FlashSale';
import ReviewCarousel from '../components/ReviewCarousel';
import BrandPartners from '../components/BrandPartners';
import { useLanguage } from '../contexts/LanguageContext';

function HomePage({ products, categories, topSearch, bannerData, flashSaleProducts, onBuy }) {
    const [isLoading, setIsLoading] = useState(true);
    const { t } = useLanguage();

    // Debug products received
    useEffect(() => {
        console.log('🏠 HomePage received products:', products?.length);
        if (products?.length > 0) {
            console.log('Sample products:', products.slice(0, 3).map(p => p.name));
        }
    }, [products]);

    useEffect(() => {
        // Giả lập loading khi trang load lần đầu
        const timer = setTimeout(() => {
            setIsLoading(false);
        }, 800);
        return () => clearTimeout(timer);
    }, []);

    const pageVariants = {
        initial: { opacity: 0, y: 20 },
        animate: {
            opacity: 1,
            y: 0,
            transition: {
                duration: 0.5,
                staggerChildren: 0.2
            }
        },
        exit: {
            opacity: 0,
            y: -20,
            transition: { duration: 0.3 }
        }
    };

    const sectionVariants = {
        initial: { opacity: 0, y: 30 },
        animate: {
            opacity: 1,
            y: 0,
            transition: { duration: 0.6 }
        }
    };

    return (
        <motion.div
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="home-page"
        >
            {/* Hero Banner với Slider */}
            <motion.section variants={sectionVariants}>
                <Banner bannerData={bannerData} />
            </motion.section>

            {/* Danh mục thời trang */}
            <motion.section variants={sectionVariants} className="section-spacing">
                <div className="container">
                    <Category data={categories} />
                </div>
            </motion.section>

            {/* Tìm kiếm hàng đầu */}
            <motion.section variants={sectionVariants} className="section-spacing">
                <div className="container">
                    <TopSearch products={topSearch} />
                </div>
            </motion.section>

            {/* Flash Sale với countdown */}
            <motion.section variants={sectionVariants} className="section-spacing">
                <FlashSale products={flashSaleProducts} />
            </motion.section>

            {/* Sản phẩm gợi ý */}
            <motion.section variants={sectionVariants} className="section-spacing">
                <div className="container">
                    <ProductList
                        products={products}
                        title={t('suggestions').toUpperCase()}
                        onBuy={onBuy}
                        loading={isLoading}
                    />
                </div>
            </motion.section>

            {/* Đánh giá khách hàng */}
            <motion.section variants={sectionVariants} className="section-spacing">
                <ReviewCarousel />
            </motion.section>

            {/* Thương hiệu đối tác */}
            <motion.section variants={sectionVariants} className="section-spacing">
                <BrandPartners />
            </motion.section>
        </motion.div>
    );
}

export default HomePage;