import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

function ProductDetailPage({ products, flashSaleProducts = [], onAddToCart, showToast }) {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user, isAuthenticated } = useAuth();

    // Tìm sản phẩm theo ID - tìm trong cả products và flashSaleProducts
    const product = products ? products.find(p => p.id == id) : null;
    const flashProduct = !product && flashSaleProducts ? flashSaleProducts.find(p => p.id == id) : null;
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

        onAddToCart(productToAdd, selectedSize);

        if (isBuyNow) {
            navigate('/checkout');
        }
    };

    // --- 👇 HÀM XỬ LÝ THỬ ĐỒ 3D ---
    const handleTryOn = () => {
        navigate('/try-on', {
            state: {
                selectedProduct: {
                    ...finalProduct,
                    // Quan trọng: Gửi kèm biến thể đang chọn để trang 3D biết load màu gì
                    currentVariant: selectedVariant
                }
            }
        });
    };

    return (
        <div className="container" style={{ background: 'white', padding: '20px', borderRadius: '2px', marginTop: '10px' }}>
            <div style={{ display: 'flex', gap: '30px', flexDirection: 'row' }}>
                {/* CỘT ẢNH (Hiển thị ảnh theo màu đang chọn) */}
                <div style={{ width: '40%' }}>
                    <img
                        src={currentImage}
                        alt={finalProduct.name}
                        style={{ width: '100%', objectFit: 'cover', borderRadius: '4px', border: '1px solid #f0f0f0' }}
                    />
                </div>

                {/* CỘT THÔNG TIN */}
                <div style={{ width: '60%' }}>
                    <h2 style={{ fontSize: '20px', fontWeight: '500', margin: '0 0 15px 0', lineHeight: '1.2' }}>{finalProduct.name}</h2>

                    <div style={{ background: '#fafafa', padding: '15px 20px', marginBottom: '25px' }}>
                        <span style={{ color: '#ee4d2d', fontSize: '30px', fontWeight: 'bold' }}>
                            {formatPrice(finalProduct.price)}
                        </span>
                    </div>

                    {/* --- 1. CHỌN MÀU SẮC / BIẾN THỂ (MỚI) --- */}
                    {finalProduct.variants && finalProduct.variants.length > 0 && (
                        <div style={{ marginBottom: '25px' }}>
                            <div style={{ marginBottom: '10px', color: '#757575', fontSize: '14px' }}>Màu Sắc</div>
                            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                                {finalProduct.variants.map((variant, index) => (
                                    <button
                                        key={index}
                                        onClick={() => setSelectedVariant(variant)}
                                        style={{
                                            padding: '6px 15px',
                                            border: selectedVariant === variant ? '1px solid #ee4d2d' : '1px solid rgba(0,0,0,.09)',
                                            color: selectedVariant === variant ? '#ee4d2d' : 'rgba(0,0,0,.8)',
                                            background: 'white',
                                            cursor: 'pointer',
                                            minWidth: '80px',
                                            display: 'flex', alignItems: 'center', gap: '5px'
                                        }}
                                    >
                                        {/* Hiển thị ảnh nhỏ hoặc màu hex */}
                                        {variant.img ? (
                                            <img src={variant.img} alt="" style={{ width: 20, height: 20, objectFit: 'cover', borderRadius: '50%' }} />
                                        ) : (
                                            <div style={{ width: 20, height: 20, background: variant.hex, borderRadius: '50%', border: '1px solid #ddd' }}></div>
                                        )}
                                        {variant.name}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* --- 2. CHỌN SIZE --- */}
                    <div style={{ marginBottom: '30px' }}>
                        <div style={{ marginBottom: '10px', color: '#757575', fontSize: '14px' }}>Kích thước (Size)</div>
                        <div style={{ display: 'flex', gap: '10px' }}>
                            {['S', 'M', 'L', 'XL'].map(size => (
                                <button
                                    key={size}
                                    className={`size-btn ${selectedSize === size ? 'selected' : ''}`}
                                    onClick={() => setSelectedSize(size)}
                                    style={{
                                        padding: '8px 18px',
                                        cursor: 'pointer',
                                        border: selectedSize === size ? '1px solid #ee4d2d' : '1px solid rgba(0,0,0,.09)',
                                        color: selectedSize === size ? '#ee4d2d' : 'rgba(0,0,0,.8)',
                                        background: 'white',
                                        minWidth: '48px',
                                        textAlign: 'center'
                                    }}
                                >
                                    {size}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* CÁC NÚT HÀNH ĐỘNG */}
                    <div style={{ display: 'flex', gap: '15px', marginBottom: '20px' }}>
                        {/* Nút Thêm vào giỏ */}
                        <button
                            onClick={() => handleAction(false)}
                            style={{
                                background: 'linear-gradient(90deg, #ee4d2d 0%, #ff6533 100%)',
                                border: 'none', color: 'white', padding: '15px 40px',
                                cursor: 'pointer', fontWeight: 'bold', borderRadius: '2px'
                            }}
                        >
                            Thêm Vào Giỏ
                        </button>

                        {/* Nút Mua ngay */}
                        <button
                            onClick={() => handleAction(true)}
                            style={{
                                background: '#ee4d2d', border: '1px solid #ee4d2d', color: 'white',
                                padding: '15px 40px', cursor: 'pointer', fontWeight: 'bold', borderRadius: '2px'
                            }}
                        >
                            Mua Ngay
                        </button>

                        {/* 👇 NÚT THỬ ĐỒ 3D */}
                        <button
                            onClick={handleTryOn}
                            style={{
                                background: 'linear-gradient(90deg, #11998e 0%, #38ef7d 100%)',
                                border: 'none', color: 'white', padding: '15px 25px',
                                cursor: 'pointer', fontWeight: 'bold', borderRadius: '2px',
                                display: 'flex', alignItems: 'center', gap: '8px',
                                boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                            }}
                        >
                            <span style={{ fontSize: '20px' }}>🕴️</span> Thử lên người mẫu 3D
                        </button>
                    </div>
                </div>
            </div>

            {/* Chi tiết sản phẩm */}
            <div style={{ marginTop: '20px', background: 'white', borderTop: '1px solid #f5f5f5' }}>
                <h3 style={{ background: '#f5f5f5', padding: '14px', fontSize: '16px', margin: 0, textTransform: 'uppercase', color: 'rgba(0,0,0,.87)' }}>CHI TIẾT SẢN PHẨM</h3>
                <div className="detail-table" style={{ padding: '15px' }}>
                    <div className="detail-row" style={{ display: 'flex', padding: '10px 0' }}><div style={{ width: '150px', color: 'gray' }}>Danh Mục</div><div style={{ color: '#0055aa' }}>Shopee {'>'} Thời Trang {'>'} {finalProduct.category}</div></div>
                    <div className="detail-row" style={{ display: 'flex', padding: '10px 0' }}><div style={{ width: '150px', color: 'gray' }}>Chất liệu</div><div>Denim, Cotton cao cấp</div></div>
                    <div className="detail-row" style={{ display: 'flex', padding: '10px 0' }}><div style={{ width: '150px', color: 'gray' }}>Mẫu</div><div>Trơn / Họa tiết</div></div>
                    <div className="detail-row" style={{ display: 'flex', padding: '10px 0' }}><div style={{ width: '150px', color: 'gray' }}>Xuất xứ</div><div>Việt Nam</div></div>
                </div>
            </div>

            {/* ĐÁNH GIÁ VÀ BÌNH LUẬN */}
            <div style={{ marginTop: '20px', background: 'white', padding: '20px', borderRadius: '2px' }}>
                <h3 style={{ fontSize: '16px', textTransform: 'uppercase', color: 'rgba(0,0,0,.87)', marginBottom: '20px', borderBottom: '1px solid #f5f5f5', paddingBottom: '15px' }}>
                    ĐÁNH GIÁ SẢN PHẨM
                </h3>

                {/* Tổng quan đánh giá */}
                <div style={{ display: 'flex', gap: '30px', marginBottom: '30px', padding: '20px', background: '#fffbf8', borderRadius: '4px' }}>
                    <div style={{ textAlign: 'center', borderRight: '1px solid #f0f0f0', paddingRight: '30px' }}>
                        <div style={{ fontSize: '36px', fontWeight: 'bold', color: '#ee4d2d' }}>4.8</div>
                        <div style={{ color: '#ffce3d', fontSize: '20px', margin: '5px 0' }}>⭐⭐⭐⭐⭐</div>
                        <div style={{ fontSize: '12px', color: '#757575' }}>(1.2k đánh giá)</div>
                    </div>
                    <div style={{ flex: 1 }}>
                        {[5, 4, 3, 2, 1].map(star => (
                            <div key={star} style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                                <span style={{ fontSize: '13px', color: '#757575', width: '50px' }}>{star} ⭐</span>
                                <div style={{ flex: 1, height: '8px', background: '#f0f0f0', borderRadius: '4px', overflow: 'hidden' }}>
                                    <div style={{ width: star === 5 ? '75%' : star === 4 ? '18%' : star === 3 ? '5%' : '2%', height: '100%', background: '#ffce3d' }}></div>
                                </div>
                                <span style={{ fontSize: '12px', color: '#757575', width: '40px' }}>{star === 5 ? '75%' : star === 4 ? '18%' : star === 3 ? '5%' : '2%'}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Bộ lọc đánh giá */}
                <div style={{ display: 'flex', gap: '10px', marginBottom: '25px', flexWrap: 'wrap' }}>
                    <button
                        onClick={() => setReviewFilter('all')}
                        style={{ padding: '8px 16px', border: `1px solid ${reviewFilter === 'all' ? '#ee4d2d' : '#ddd'}`, background: reviewFilter === 'all' ? '#ee4d2d' : 'white', color: reviewFilter === 'all' ? 'white' : '#333', borderRadius: '2px', cursor: 'pointer', fontSize: '13px', transition: 'all 0.3s' }}
                    >
                        Tất Cả ({reviewCounts.all})
                    </button>
                    <button
                        onClick={() => setReviewFilter('5')}
                        style={{ padding: '8px 16px', border: `1px solid ${reviewFilter === '5' ? '#ee4d2d' : '#ddd'}`, background: reviewFilter === '5' ? '#ee4d2d' : 'white', color: reviewFilter === '5' ? 'white' : '#333', borderRadius: '2px', cursor: 'pointer', fontSize: '13px', transition: 'all 0.3s' }}
                    >
                        5 Sao ({reviewCounts[5]})
                    </button>
                    <button
                        onClick={() => setReviewFilter('4')}
                        style={{ padding: '8px 16px', border: `1px solid ${reviewFilter === '4' ? '#ee4d2d' : '#ddd'}`, background: reviewFilter === '4' ? '#ee4d2d' : 'white', color: reviewFilter === '4' ? 'white' : '#333', borderRadius: '2px', cursor: 'pointer', fontSize: '13px', transition: 'all 0.3s' }}
                    >
                        4 Sao ({reviewCounts[4]})
                    </button>
                    <button
                        onClick={() => setReviewFilter('comment')}
                        style={{ padding: '8px 16px', border: `1px solid ${reviewFilter === 'comment' ? '#ee4d2d' : '#ddd'}`, background: reviewFilter === 'comment' ? '#ee4d2d' : 'white', color: reviewFilter === 'comment' ? 'white' : '#333', borderRadius: '2px', cursor: 'pointer', fontSize: '13px', transition: 'all 0.3s' }}
                    >
                        Có Bình Luận ({reviewCounts.comment})
                    </button>
                    <button
                        onClick={() => setReviewFilter('images')}
                        style={{ padding: '8px 16px', border: `1px solid ${reviewFilter === 'images' ? '#ee4d2d' : '#ddd'}`, background: reviewFilter === 'images' ? '#ee4d2d' : 'white', color: reviewFilter === 'images' ? 'white' : '#333', borderRadius: '2px', cursor: 'pointer', fontSize: '13px', transition: 'all 0.3s' }}
                    >
                        Có Hình Ảnh ({reviewCounts.images})
                    </button>
                </div>

                {/* Form đánh giá cho người dùng đã đăng nhập */}
                {isAuthenticated ? (
                    <div style={{ marginBottom: '30px', padding: '20px', background: '#fafafa', borderRadius: '4px', border: '1px solid #f0f0f0' }}>
                        <h4 style={{ fontSize: '15px', fontWeight: '600', marginBottom: '15px', color: '#333' }}>Viết Đánh Giá Của Bạn</h4>
                        <form onSubmit={handleSubmitReview}>
                            {/* Chọn số sao */}
                            <div style={{ marginBottom: '15px' }}>
                                <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', marginBottom: '8px', color: '#555' }}>Đánh giá của bạn</label>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    {[5, 4, 3, 2, 1].map(star => (
                                        <button
                                            key={star}
                                            type="button"
                                            onClick={() => setNewReview({ ...newReview, rating: star })}
                                            style={{
                                                padding: '8px 16px',
                                                border: `2px solid ${newReview.rating === star ? '#ffce3d' : '#ddd'}`,
                                                background: newReview.rating === star ? '#fff9e6' : 'white',
                                                color: '#333',
                                                borderRadius: '4px',
                                                cursor: 'pointer',
                                                fontSize: '14px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '4px',
                                                transition: 'all 0.3s'
                                            }}
                                        >
                                            {star} ⭐
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Nội dung đánh giá */}
                            <div style={{ marginBottom: '15px' }}>
                                <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', marginBottom: '8px', color: '#555' }}>Nhận xét của bạn</label>
                                <textarea
                                    value={newReview.comment}
                                    onChange={(e) => setNewReview({ ...newReview, comment: e.target.value })}
                                    placeholder="Chia sẻ trải nghiệm của bạn về sản phẩm này..."
                                    style={{
                                        width: '100%',
                                        minHeight: '100px',
                                        padding: '12px',
                                        border: '1px solid #ddd',
                                        borderRadius: '4px',
                                        fontSize: '14px',
                                        fontFamily: 'inherit',
                                        resize: 'vertical'
                                    }}
                                    required
                                />
                            </div>

                            {/* Nút gửi */}
                            <button
                                type="submit"
                                style={{
                                    padding: '10px 24px',
                                    background: '#ee4d2d',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    fontSize: '14px',
                                    fontWeight: '600',
                                    transition: 'all 0.3s'
                                }}
                                onMouseOver={(e) => e.target.style.background = '#d73211'}
                                onMouseOut={(e) => e.target.style.background = '#ee4d2d'}
                            >
                                Gửi Đánh Giá
                            </button>
                        </form>
                    </div>
                ) : (
                    <div style={{ marginBottom: '30px', padding: '20px', background: '#fff9e6', borderRadius: '4px', border: '1px solid #ffd700', textAlign: 'center' }}>
                        <div style={{ fontSize: '40px', marginBottom: '10px' }}>🔒</div>
                        <h4 style={{ fontSize: '15px', fontWeight: '600', marginBottom: '10px', color: '#333' }}>Bạn cần đăng nhập để đánh giá</h4>
                        <p style={{ fontSize: '13px', color: '#666', marginBottom: '15px' }}>Vui lòng đăng nhập để chia sẻ trải nghiệm của bạn về sản phẩm này</p>
                        <button
                            onClick={() => navigate('/login')}
                            style={{
                                padding: '10px 24px',
                                background: '#ee4d2d',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontSize: '14px',
                                fontWeight: '600',
                                transition: 'all 0.3s'
                            }}
                            onMouseOver={(e) => e.target.style.background = '#d73211'}
                            onMouseOut={(e) => e.target.style.background = '#ee4d2d'}
                        >
                            Đăng Nhập Ngay
                        </button>
                    </div>
                )}

                {/* Danh sách đánh giá */}
                <div>
                    {filteredReviews.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '40px 20px', color: '#757575' }}>
                            <div style={{ fontSize: '48px', marginBottom: '10px' }}>📝</div>
                            <div style={{ fontSize: '14px' }}>Chưa có đánh giá nào phù hợp với bộ lọc</div>
                        </div>
                    ) : (
                        filteredReviews.map((review, index) => (
                            <div key={review.id} style={{ borderBottom: index === filteredReviews.length - 1 ? 'none' : '1px solid #f5f5f5', paddingBottom: '20px', marginBottom: '20px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: review.gradient, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold' }}>
                                        {review.avatar}
                                    </div>
                                    <div>
                                        <div style={{ fontWeight: '500', fontSize: '14px' }}>{review.user}</div>
                                        <div style={{ color: '#ffce3d', fontSize: '14px' }}>
                                            {'⭐'.repeat(review.rating)}
                                        </div>
                                    </div>
                                </div>
                                <div style={{ fontSize: '13px', color: '#757575', marginBottom: '8px' }}>
                                    {review.date} | Phân loại: {review.variant}
                                </div>
                                <div style={{ fontSize: '14px', lineHeight: '1.6', marginBottom: review.images.length > 0 ? '10px' : '0' }}>
                                    {review.comment}
                                </div>
                                {review.images.length > 0 && (
                                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                                        {review.images.map((img, imgIndex) => (
                                            <img key={imgIndex} src={img} alt="" style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '4px', border: '1px solid #f0f0f0' }} />
                                        ))}
                                    </div>
                                )}
                                {review.shopReply && (
                                    <div style={{ marginTop: '10px', padding: '10px', background: '#f5f5f5', borderRadius: '4px', fontSize: '13px' }}>
                                        <strong style={{ color: '#ee4d2d' }}>Phản Hồi Của Shop:</strong> {review.shopReply}
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>

                {/* Xem thêm */}
                <div style={{ textAlign: 'center', marginTop: '20px' }}>
                    <button style={{ padding: '12px 30px', border: '1px solid #ee4d2d', background: 'white', color: '#ee4d2d', borderRadius: '2px', cursor: 'pointer', fontSize: '14px', fontWeight: '500' }}>
                        Xem Thêm Đánh Giá
                    </button>
                </div>
            </div>
        </div>
    );
}

export default ProductDetailPage;
