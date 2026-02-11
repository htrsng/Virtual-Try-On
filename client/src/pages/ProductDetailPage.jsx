import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

function ProductDetailPage({ products, flashSaleProducts = [], onAddToCart, onBuyNow, showToast }) {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user, isAuthenticated } = useAuth();

    // Tìm sản phẩm theo ID - tìm trong cả products và flashSaleProducts
    // Chuyển id về string để so sánh chính xác giữa MongoDB _id và id số
    const product = products ? products.find(p => String(p.id) === String(id)) : null;
    const flashProduct = !product && flashSaleProducts ? flashSaleProducts.find(p => String(p.id) === String(id)) : null;
    const finalProduct = product || flashProduct;

    // --- STATE QUẢN LÝ ---
    const [selectedSize, setSelectedSize] = useState(null);
    const [selectedVariant, setSelectedVariant] = useState(null);
    const [reviewFilter, setReviewFilter] = useState('all');
    const [userReviews, setUserReviews] = useState([]);
    const [newReview, setNewReview] = useState({ rating: 5, comment: '', images: [] });

    // Sample reviews data
    const [allReviews] = useState([
        { id: 1, user: 'Nguyễn Thị Mai', avatar: 'N', rating: 5, date: '2024-01-15', variant: 'Trắng, Size M', comment: 'Sản phẩm rất đẹp, chất liệu vải mềm mại, đúng như mô tả. Form dáng chuẩn, mặc vừa vặn. Shop giao hàng nhanh, đóng gói cẩn thận. Mình rất hài lòng và sẽ ủng hộ shop lâu dài! 💕', images: ['https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=100&h=100&fit=crop', 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=100&h=100&fit=crop'], shopReply: 'Cảm ơn bạn đã tin tưởng shop! Chúc bạn luôn xinh đẹp và mua sắm vui vẻ ❤️', gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' },
        { id: 2, user: 'Lê Văn Tùng', avatar: 'L', rating: 5, date: '2024-01-10', variant: 'Đen, Size L', comment: 'Hàng chất lượng tốt, đúng với giá tiền. Giao hàng nhanh, đóng gói kỹ càng. Mình đã mua lần thứ 2 rồi và vẫn rất hài lòng!', images: [], shopReply: null, gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' },
        { id: 3, user: 'Trần Hương Giang', avatar: 'T', rating: 4, date: '2024-01-08', variant: 'Be, Size S', comment: 'Đẹp nha mọi người, chất vải mát, form chuẩn. Mình cao 1m58 nặng 48kg mặc size S vừa vặn. Giá hơi cao nhưng chất lượng xứng đáng!', images: ['https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=100&h=100&fit=crop'], shopReply: null, gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' },
        { id: 4, user: 'Hoàng Thị Lan', avatar: 'H', rating: 5, date: '2024-01-02', variant: 'Hồng Pastel, Size M', comment: 'Đồ đẹp lắm ạ! Chất vải mềm mịn, mặc rất thoải mái. Form dáng đẹp, phù hợp đi làm và đi chơi. Mình đã giới thiệu cho nhiều bạn bè rồi. 5 sao cho shop! 🌟', images: ['https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=100&h=100&fit=crop', 'https://images.unsplash.com/photo-1566174053879-31528523f8ae?w=100&h=100&fit=crop'], shopReply: null, gradient: 'linear-gradient(135deg, #30cfd0 0%, #330867 100%)' }
    ]);

    // Khi sản phẩm được load, tự động chọn màu đầu tiên làm mặc định
    useEffect(() => {
        if (finalProduct && finalProduct.variants && finalProduct.variants.length > 0) {
            setSelectedVariant(finalProduct.variants[0]);
        }
    }, [finalProduct]);

    // Filter reviews based on selected criteria
    const filteredReviews = [...allReviews, ...userReviews].filter(review => {
        if (reviewFilter === 'all') return true;
        if (reviewFilter === '5') return review.rating === 5;
        if (reviewFilter === '4') return review.rating === 4;
        if (reviewFilter === 'comment') return review.comment.length > 0;
        if (reviewFilter === 'images') return review.images.length > 0;
        return true;
    });

    // Calculate review counts
    const reviewCounts = {
        all: allReviews.length + userReviews.length,
        5: [...allReviews, ...userReviews].filter(r => r.rating === 5).length,
        4: [...allReviews, ...userReviews].filter(r => r.rating === 4).length,
        comment: [...allReviews, ...userReviews].filter(r => r.comment.length > 0).length,
        images: [...allReviews, ...userReviews].filter(r => r.images.length > 0).length
    };

    // Handle review submission
    const handleSubmitReview = (e) => {
        e.preventDefault();
        console.log('Submit review clicked', { isAuthenticated, user });

        if (!isAuthenticated) {
            if (showToast) {
                showToast('Vui lòng đăng nhập để đánh giá sản phẩm', 'error');
            } else {
                alert('Vui lòng đăng nhập để đánh giá sản phẩm');
            }
            setTimeout(() => navigate('/login'), 1500);
            return;
        }

        if (!newReview.comment.trim()) {
            if (showToast) {
                showToast('Vui lòng nhập nội dung đánh giá', 'error');
            } else {
                alert('Vui lòng nhập nội dung đánh giá');
            }
            return;
        }

        const review = {
            id: Date.now(),
            user: user?.fullName || user?.email || 'Người dùng',
            avatar: (user?.fullName?.[0] || user?.email?.[0] || 'U').toUpperCase(),
            rating: newReview.rating,
            date: new Date().toISOString().split('T')[0],
            variant: selectedVariant ? `${selectedVariant.color}, Size ${selectedSize || 'M'}` : 'Chưa chọn',
            comment: newReview.comment,
            images: newReview.images,
            shopReply: null,
            gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
        };

        console.log('Adding review:', review);
        setUserReviews([review, ...userReviews]);
        setNewReview({ rating: 5, comment: '', images: [] });

        if (showToast) {
            showToast('✅ Đánh giá của bạn đã được gửi thành công!', 'success');
        } else {
            alert('✅ Đánh giá của bạn đã được gửi thành công!');
        }
    };

    if (!products && !flashSaleProducts) return <div style={{ padding: '50px', textAlign: 'center' }}>Đang tải...</div>;
    if (!finalProduct) return <div style={{ padding: '50px', textAlign: 'center' }}>Không tìm thấy sản phẩm</div>;

    // Xác định ảnh đang hiển thị (Nếu chọn biến thể thì lấy ảnh biến thể, ko thì lấy ảnh gốc)
    const currentImage = selectedVariant ? selectedVariant.img : finalProduct.img;

    // Hàm format giá tiền cho đẹp
    const formatPrice = (price) => {
        if (typeof price === 'string') return price;
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
    };

    // --- HÀM XỬ LÝ MUA HÀNG ---
    const handleAction = (isBuyNow) => {
        if (!isAuthenticated) {
            showToast("Bạn cần đăng nhập để mua hàng!", "warning");
            setTimeout(() => navigate('/login'), 1000);
            return;
        }

        if (!selectedSize) {
            showToast("Vui lòng chọn Size!", "warning");
            return;
        }

        // Tạo object sản phẩm để thêm vào giỏ (gộp thông tin màu đã chọn)
        const productToAdd = {
            ...finalProduct,
            img: currentImage, // Lưu ảnh đúng màu
            color: selectedVariant ? selectedVariant.name : 'Mặc định',
            variant: selectedVariant
        };

        if (isBuyNow) {
            // Mua ngay: chỉ mua sản phẩm này, không gộp với giỏ hàng
            onBuyNow(productToAdd, selectedSize);
        } else {
            // Thêm vào giỏ hàng bình thường
            onAddToCart(productToAdd, selectedSize);
        }
    };

    // --- 👇 HÀM XỬ LÝ THỬ ĐỒ 3D ---
    const handleTryOn = () => {
        navigate('/try-on', {
            state: {
                product: {
                    ...finalProduct,
                    // Quan trọng: Gửi kèm biến thể đang chọn để trang 3D biết load màu gì
                    currentVariant: selectedVariant
                }
            }
        });
    };

    return (
        <div className="container product-detail-page">
            <div className="product-detail-card">
                <div className="product-detail-grid">
                    {/* CỘT ẢNH (Hiển thị ảnh theo màu đang chọn) */}
                    <div className="product-detail-media">
                        <img
                            src={currentImage}
                            alt={finalProduct.name}
                            className="product-detail-image"
                        />
                    </div>

                    {/* CỘT THÔNG TIN */}
                    <div className="product-detail-info">
                        <h1 className="product-detail-title">{finalProduct.name}</h1>

                        <div className="product-detail-price-box">
                            <span className="product-detail-price">
                                {formatPrice(finalProduct.price)}
                            </span>
                        </div>

                        {/* --- 1. CHỌN MÀU SẮC / BIẾN THỂ (MỚI) --- */}
                        {finalProduct.variants && finalProduct.variants.length > 0 && (
                            <div className="product-detail-section">
                                <div className="section-label">Màu Sắc</div>
                                <div className="option-list">
                                    {finalProduct.variants.map((variant, index) => (
                                        <button
                                            key={index}
                                            onClick={() => setSelectedVariant(variant)}
                                            className={`option-button ${selectedVariant === variant ? 'selected' : ''}`}
                                        >
                                            {variant.img ? (
                                                <img src={variant.img} alt="" className="option-swatch" />
                                            ) : (
                                                <div
                                                    className="option-swatch"
                                                    style={{ background: variant.hex }}
                                                ></div>
                                            )}
                                            <span>{variant.name}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* --- 2. CHỌN SIZE --- */}
                        <div className="product-detail-section">
                            <div className="section-label">Kích thước (Size)</div>
                            <div className="option-list">
                                {['S', 'M', 'L', 'XL'].map(size => (
                                    <button
                                        key={size}
                                        className={`option-button size-option ${selectedSize === size ? 'selected' : ''}`}
                                        onClick={() => setSelectedSize(size)}
                                    >
                                        {size}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* CÁC NÚT HÀNH ĐỘNG */}
                        <div className="product-detail-actions">
                            <button
                                onClick={() => handleAction(false)}
                                className="action-btn primary"
                            >
                                Thêm Vào Giỏ
                            </button>

                            <button
                                onClick={() => handleAction(true)}
                                className="action-btn outline"
                            >
                                Mua Ngay
                            </button>

                            <button
                                onClick={handleTryOn}
                                className="action-btn tryon"
                            >
                                <span className="action-icon">🕴️</span> Thử lên người mẫu 3D
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Chi tiết sản phẩm */}
            <div className="product-detail-block">
                <h3 className="product-detail-block-title">CHI TIẾT SẢN PHẨM</h3>
                <div className="product-specs">
                    <div className="product-spec-row">
                        <div className="product-spec-label">Danh Mục</div>
                        <div className="product-spec-value">Shopee {'>'} Thời Trang {'>'} {finalProduct.category}</div>
                    </div>
                    <div className="product-spec-row">
                        <div className="product-spec-label">Chất liệu</div>
                        <div className="product-spec-value">Denim, Cotton cao cấp</div>
                    </div>
                    <div className="product-spec-row">
                        <div className="product-spec-label">Mẫu</div>
                        <div className="product-spec-value">Trơn / Họa tiết</div>
                    </div>
                    <div className="product-spec-row">
                        <div className="product-spec-label">Xuất xứ</div>
                        <div className="product-spec-value">Việt Nam</div>
                    </div>
                </div>
            </div>

            {/* ĐÁNH GIÁ VÀ BÌNH LUẬN */}
            <div className="product-detail-block reviews-block">
                <h3 className="product-detail-block-title">ĐÁNH GIÁ SẢN PHẨM</h3>

                {/* Tổng quan đánh giá */}
                <div className="review-summary">
                    <div className="review-score">
                        <div className="review-score-value">4.8</div>
                        <div className="review-stars">⭐⭐⭐⭐⭐</div>
                        <div className="review-count">(1.2k đánh giá)</div>
                    </div>
                    <div className="review-breakdown">
                        {[5, 4, 3, 2, 1].map(star => (
                            <div key={star} className="review-bar-row">
                                <span className="review-bar-label">{star} ⭐</span>
                                <div className="review-bar">
                                    <div
                                        className="review-bar-fill"
                                        style={{ width: star === 5 ? '75%' : star === 4 ? '18%' : star === 3 ? '5%' : '2%' }}
                                    ></div>
                                </div>
                                <span className="review-bar-value">{star === 5 ? '75%' : star === 4 ? '18%' : star === 3 ? '5%' : '2%'}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Bộ lọc đánh giá */}
                <div className="review-filters">
                    <button
                        onClick={() => setReviewFilter('all')}
                        className={`review-filter-btn ${reviewFilter === 'all' ? 'active' : ''}`}
                    >
                        Tất Cả ({reviewCounts.all})
                    </button>
                    <button
                        onClick={() => setReviewFilter('5')}
                        className={`review-filter-btn ${reviewFilter === '5' ? 'active' : ''}`}
                    >
                        5 Sao ({reviewCounts[5]})
                    </button>
                    <button
                        onClick={() => setReviewFilter('4')}
                        className={`review-filter-btn ${reviewFilter === '4' ? 'active' : ''}`}
                    >
                        4 Sao ({reviewCounts[4]})
                    </button>
                    <button
                        onClick={() => setReviewFilter('comment')}
                        className={`review-filter-btn ${reviewFilter === 'comment' ? 'active' : ''}`}
                    >
                        Có Bình Luận ({reviewCounts.comment})
                    </button>
                    <button
                        onClick={() => setReviewFilter('images')}
                        className={`review-filter-btn ${reviewFilter === 'images' ? 'active' : ''}`}
                    >
                        Có Hình Ảnh ({reviewCounts.images})
                    </button>
                </div>

                {/* Form đánh giá cho người dùng đã đăng nhập */}
                {isAuthenticated ? (
                    <div className="review-form">
                        <h4 className="review-form-title">Viết Đánh Giá Của Bạn</h4>
                        <form onSubmit={handleSubmitReview}>
                            <div className="review-form-group">
                                <label className="review-form-label">Đánh giá của bạn</label>
                                <div className="review-star-group">
                                    {[5, 4, 3, 2, 1].map(star => (
                                        <button
                                            key={star}
                                            type="button"
                                            onClick={() => setNewReview({ ...newReview, rating: star })}
                                            className={`review-star-button ${newReview.rating === star ? 'selected' : ''}`}
                                        >
                                            {star} ⭐
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="review-form-group">
                                <label className="review-form-label">Nhận xét của bạn</label>
                                <textarea
                                    value={newReview.comment}
                                    onChange={(e) => setNewReview({ ...newReview, comment: e.target.value })}
                                    placeholder="Chia sẻ trải nghiệm của bạn về sản phẩm này..."
                                    className="review-textarea"
                                    required
                                />
                            </div>

                            <button type="submit" className="review-submit-btn">
                                Gửi Đánh Giá
                            </button>
                        </form>
                    </div>
                ) : (
                    <div className="review-login-prompt">
                        <div className="review-login-icon">🔒</div>
                        <h4 className="review-login-title">Bạn cần đăng nhập để đánh giá</h4>
                        <p className="review-login-text">Vui lòng đăng nhập để chia sẻ trải nghiệm của bạn về sản phẩm này</p>
                        <button
                            onClick={() => navigate('/login')}
                            className="review-login-btn"
                        >
                            Đăng Nhập Ngay
                        </button>
                    </div>
                )}

                {/* Danh sách đánh giá */}
                <div className="review-list">
                    {filteredReviews.length === 0 ? (
                        <div className="review-empty">
                            <div className="review-empty-icon">📝</div>
                            <div>Chưa có đánh giá nào phù hợp với bộ lọc</div>
                        </div>
                    ) : (
                        filteredReviews.map((review, index) => (
                            <div key={review.id} className={`review-item ${index === filteredReviews.length - 1 ? 'last' : ''}`}>
                                <div className="review-item-header">
                                    <div className="review-avatar" style={{ background: review.gradient }}>
                                        {review.avatar}
                                    </div>
                                    <div>
                                        <div className="review-author">{review.user}</div>
                                        <div className="review-rating">{'⭐'.repeat(review.rating)}</div>
                                    </div>
                                </div>
                                <div className="review-meta">
                                    {review.date} | Phân loại: {review.variant}
                                </div>
                                <div className="review-comment">{review.comment}</div>
                                {review.images.length > 0 && (
                                    <div className="review-images">
                                        {review.images.map((img, imgIndex) => (
                                            <img key={imgIndex} src={img} alt="" className="review-image" />
                                        ))}
                                    </div>
                                )}
                                {review.shopReply && (
                                    <div className="review-reply">
                                        <strong>Phản Hồi Của Shop:</strong> {review.shopReply}
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>

                {/* Xem thêm */}
                <div className="review-more">
                    <button className="review-more-btn">Xem Thêm Đánh Giá</button>
                </div>
            </div>
        </div>
    );
}

export default ProductDetailPage;
