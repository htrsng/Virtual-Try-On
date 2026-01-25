import React from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Pagination, EffectCoverflow } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/effect-coverflow';
import { motion } from 'framer-motion';
import { FiStar } from 'react-icons/fi';

function ReviewCarousel() {
    const reviews = [
        {
            id: 1,
            name: "Nguyễn Thị Lan",
            avatar: "https://i.pravatar.cc/150?img=1",
            rating: 5,
            comment: "Sản phẩm chất lượng tuyệt vời, giao hàng nhanh chóng. Tôi rất hài lòng với dịch vụ của Shopee Fashion!",
            date: "15/01/2026",
            product: "Áo Sơ Mi Công Sở"
        },
        {
            id: 2,
            name: "Trần Văn Minh",
            avatar: "https://i.pravatar.cc/150?img=12",
            rating: 5,
            comment: "Đóng gói cẩn thận, sản phẩm đúng như mô tả. Giá cả hợp lý, sẽ quay lại ủng hộ shop!",
            date: "12/01/2026",
            product: "Quần Jean Nam"
        },
        {
            id: 3,
            name: "Phạm Thu Hà",
            avatar: "https://i.pravatar.cc/150?img=5",
            rating: 5,
            comment: "Mình đã mua nhiều lần ở đây, lần nào cũng hài lòng. Chất liệu vải mềm mại, form dáng đẹp!",
            date: "08/01/2026",
            product: "Váy Dự Tiệc"
        },
        {
            id: 4,
            name: "Lê Hoàng Nam",
            avatar: "https://i.pravatar.cc/150?img=8",
            rating: 5,
            comment: "Shop phục vụ nhiệt tình, tư vấn tận tâm. Sản phẩm đẹp hơn ảnh, rất đáng tiền!",
            date: "05/01/2026",
            product: "Áo Khoác Nam"
        },
        {
            id: 5,
            name: "Vũ Thanh Hằng",
            avatar: "https://i.pravatar.cc/150?img=15",
            rating: 5,
            comment: "Giao hàng nhanh, đóng gói đẹp, chất lượng tốt. Sẽ giới thiệu bạn bè mua ở đây!",
            date: "02/01/2026",
            product: "Quần Tây Công Sở"
        },
        {
            id: 6,
            name: "Hoàng Thị Mai",
            avatar: "https://i.pravatar.cc/150?img=9",
            rating: 5,
            comment: "Mình đã thử nhiều shop nhưng chỉ tin tưởng ở đây. Chất vải mềm mịn, không xù lông!",
            date: "28/12/2025",
            product: "Áo Len Nữ"
        }
    ];

    return (
        <div className="review-carousel-section">
            <div className="container">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                    className="section-header"
                >
                    <h2 className="section-title gradient-text">💬 Khách Hàng Nói Gì Về Chúng Tôi</h2>
                    <p className="section-subtitle">Hơn 100,000+ khách hàng hài lòng</p>
                </motion.div>

                <Swiper
                    modules={[Autoplay, Pagination, EffectCoverflow]}
                    effect="coverflow"
                    grabCursor={true}
                    centeredSlides={true}
                    slidesPerView="auto"
                    coverflowEffect={{
                        rotate: 50,
                        stretch: 0,
                        depth: 100,
                        modifier: 1,
                        slideShadows: true,
                    }}
                    autoplay={{
                        delay: 3000,
                        disableOnInteraction: false,
                    }}
                    pagination={{ clickable: true }}
                    loop={reviews.length >= 3}
                    className="review-swiper"
                >
                    {reviews.map((review) => (
                        <SwiperSlide key={review.id}>
                            <motion.div
                                className="review-card glassmorphism"
                                whileHover={{ scale: 1.02, y: -5 }}
                                transition={{ duration: 0.3 }}
                            >
                                <div className="review-header">
                                    <img
                                        src={review.avatar}
                                        alt={review.name}
                                        className="review-avatar"
                                    />
                                    <div className="review-info">
                                        <h4 className="review-name">{review.name}</h4>
                                        <div className="review-rating">
                                            {[...Array(review.rating)].map((_, i) => (
                                                <FiStar key={i} className="star-filled" />
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <p className="review-comment">"{review.comment}"</p>

                                <div className="review-footer">
                                    <span className="review-product">Sản phẩm: {review.product}</span>
                                    <span className="review-date">{review.date}</span>
                                </div>
                            </motion.div>
                        </SwiperSlide>
                    ))}
                </Swiper>
            </div>
        </div>
    );
}

export default ReviewCarousel;
