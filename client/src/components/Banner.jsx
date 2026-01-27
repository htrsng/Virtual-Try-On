import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, Autoplay } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import { motion } from 'framer-motion';

function Banner({ bannerData }) {
    const navigate = useNavigate();

    // Sử dụng dữ liệu từ props hoặc fallback
    const defaultBanners = {
        big: [
            "https://cf.shopee.vn/file/vn-50009109-c8c772213d4eb0c102a2815c32d9136c_xxhdpi",
            "https://cf.shopee.vn/file/vn-50009109-7756e18722421c4558e8b0b5550a2995_xxhdpi",
            "https://cf.shopee.vn/file/vn-50009109-ca7d751537233ba49a37e199f36f339c_xxhdpi"
        ],
        smallTop: "https://cf.shopee.vn/file/vn-50009109-1a8df9e82936a71e721c5db605021571_xhdpi",
        smallBottom: "https://cf.shopee.vn/file/vn-50009109-00569106043234b68e77a10271b0586e_xhdpi"
    };

    const banners = bannerData || defaultBanners;

    const mainBanners = banners.big.map((img, idx) => ({
        id: idx + 1,
        image: img,
        link: "/"
    }));

    const sideBanners = [
        {
            id: 1,
            image: banners.smallTop,
            link: "/"
        },
        {
            id: 2,
            image: banners.smallBottom,
            link: "/"
        }
    ];

    return (
        <div className="shopee-banner-container">
            <div className="container">
                <div className="banner-layout">
                    {/* Main Banner Slider - Bên trái */}
                    <div className="main-banner">
                        <Swiper
                            modules={[Navigation, Pagination, Autoplay]}
                            navigation
                            pagination={{ clickable: true }}
                            autoplay={{ delay: 3000, disableOnInteraction: false }}
                            loop={mainBanners.length >= 3}
                            speed={800}
                            className="main-banner-swiper"
                        >
                            {mainBanners.map((banner, index) => (
                                <SwiperSlide key={banner.id}>
                                    <div
                                        onClick={() => navigate(`/banner/banner${index + 1}`)}
                                        className="banner-link"
                                        style={{ cursor: 'pointer' }}
                                    >
                                        <img
                                            src={banner.image}
                                            alt={`Banner ${banner.id}`}
                                            className="banner-image"
                                            onError={(e) => {
                                                e.target.onerror = null;
                                                e.target.src = "https://placehold.co/800x300/ee4d2d/white?text=Shopee+Fashion";
                                            }}
                                        />
                                    </div>
                                </SwiperSlide>
                            ))}
                        </Swiper>
                    </div>

                    {/* Side Banners - Bên phải */}
                    <div className="side-banners">
                        {sideBanners.map((banner, index) => (
                            <motion.div
                                key={banner.id}
                                onClick={() => navigate(`/banner/banner${index + 4}`)}
                                className="side-banner-item"
                                whileHover={{ scale: 1.02 }}
                                transition={{ duration: 0.2 }}
                                style={{ cursor: 'pointer' }}
                            >
                                <img
                                    src={banner.image}
                                    alt={`Side Banner ${index + 1}`}
                                    className="side-banner-image"
                                    onError={(e) => {
                                        e.target.onerror = null;
                                        e.target.src = "https://placehold.co/400x150/ee4d2d/white?text=Banner";
                                    }}
                                />
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Banner;