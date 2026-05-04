import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import ProductRecommendations from '../components/ProductRecommendations';
import './ProductDetailPage.css';
import axios from 'axios';

const DEFAULT_SIZE_OPTIONS = ['S', 'M', 'L', 'XL'];

const normalizeProductVariants = (product) => {
    const rawVariants = Array.isArray(product?.variants) ? product.variants : [];

    if (rawVariants.length > 0) {
        return rawVariants.map((variant) => ({
            colorName: variant?.color?.name || variant?.name || variant?.color || 'Mặc định',
            colorHex: variant?.color?.hex || variant?.hex || '#ffffff',
            colorImage: variant?.color?.image || variant?.image || variant?.img || '',
            sizes: Array.isArray(variant?.sizes) && variant.sizes.length > 0
                ? variant.sizes.map((size) => ({
                    size: size?.size || size?.label || 'M',
                    stock: Number(size?.stock) || 0,
                    sku: size?.sku || ''
                }))
                : DEFAULT_SIZE_OPTIONS.map((size, index) => ({
                    size,
                    stock: index === 1 ? Number(product?.totalStock ?? product?.stock) || 0 : 0,
                    sku: ''
                }))
        }));
    }

    if (product?.color || product?.hex || product?.img) {
        return [{
            colorName: product?.color || 'Mặc định',
            colorHex: product?.hex || '#ffffff',
            colorImage: product?.img || '',
            sizes: DEFAULT_SIZE_OPTIONS.map((size, index) => ({
                size,
                stock: index === 1 ? Number(product?.totalStock ?? product?.stock) || 0 : 0,
                sku: ''
            }))
        }];
    }

    return [];
};

function ProductDetailPage({ products, flashSaleProducts = [], onAddToCart, onBuyNow, showToast }) {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user, isAuthenticated } = useAuth();
    const { t } = useLanguage();

    // Tìm sản phẩm theo ID - tìm trong cả products và flashSaleProducts
    // Chuyển id về string để so sánh chính xác giữa MongoDB _id và id số
    const product = products ? products.find(p => String(p.id) === String(id)) : null;
    const flashProduct = !product && flashSaleProducts ? flashSaleProducts.find(p => String(p.id) === String(id)) : null;
    const finalProduct = product || flashProduct;

    // --- STATE QUẢN LÝ ---
    const [selectedSize, setSelectedSize] = useState(null);
    const [selectedVariant, setSelectedVariant] = useState(null);
    const [selectedColorIdx, setSelectedColorIdx] = useState(0);
    const [activeImgIdx, setActiveImgIdx] = useState(0);
    const [reviewFilter, setReviewFilter] = useState('all');
    const [sizeFilter, setSizeFilter] = useState('Tất cả');
    const [userReviews, setUserReviews] = useState([]);
    const [newReview, setNewReview] = useState({ rating: 5, comment: '', images: [] });
    const [aiConfidenceScore] = useState(user ? Math.floor(70 + Math.random() * 28) : 0);

    // Review eligibility state
    const [reviewEligibility, setReviewEligibility] = useState({
        canReview: false,
        hasPurchased: false,
        hasReviewed: false,
        status: null,
        message: ''
    });
    const [loadingEligibility, setLoadingEligibility] = useState(false);

    // Sample reviews data
    const [allReviews] = useState([
        { id: 1, user: 'Nguyễn Thị Mai', avatar: 'N', rating: 5, date: '2024-01-15', variant: 'Trắng, Size M', purchasedSize: 'M', purchasedColor: 'Trắng', comment: 'Sản phẩm rất đẹp, chất liệu vải mềm mại, đúng như mô tả. Form dáng chuẩn, mặc vừa vặn. Shop giao hàng nhanh, đóng gói cẩn thận. Mình rất hài lòng và sẽ ủng hộ shop lâu dài! 💕', images: ['https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=100&h=100&fit=crop', 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=100&h=100&fit=crop'], shopReply: 'Cảm ơn bạn đã tin tưởng shop! Chúc bạn luôn xinh đẹp và mua sắm vui vẻ ❤️', gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' },
        { id: 2, user: 'Lê Văn Tùng', avatar: 'L', rating: 5, date: '2024-01-10', variant: 'Đen, Size L', purchasedSize: 'L', purchasedColor: 'Đen', comment: 'Hàng chất lượng tốt, đúng với giá tiền. Giao hàng nhanh, đóng gói kỹ càng. Mình đã mua lần thứ 2 rồi và vẫn rất hài lòng!', images: [], shopReply: null, gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' },
        { id: 3, user: 'Trần Hương Giang', avatar: 'T', rating: 4, date: '2024-01-08', variant: 'Be, Size S', purchasedSize: 'S', purchasedColor: 'Be', comment: 'Đẹp nha mọi người, chất vải mát, form chuẩn. Mình cao 1m58 nặng 48kg mặc size S vừa vặn. Giá hơi cao nhưng chất lượng xứng đáng!', images: ['https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=100&h=100&fit=crop'], shopReply: null, gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' },
        { id: 4, user: 'Hoàng Thị Lan', avatar: 'H', rating: 5, date: '2024-01-02', variant: 'Hồng Pastel, Size M', purchasedSize: 'M', purchasedColor: 'Hồng Pastel', comment: 'Đồ đẹp lắm ạ! Chất vải mềm mịn, mặc rất thoải mái. Form dáng đẹp, phù hợp đi làm và đi chơi. Mình đã giới thiệu cho nhiều bạn bè rồi. 5 sao cho shop! 🌟', images: ['https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=100&h=100&fit=crop', 'https://images.unsplash.com/photo-1566174053879-31528523f8ae?w=100&h=100&fit=crop'], shopReply: null, gradient: 'linear-gradient(135deg, #30cfd0 0%, #330867 100%)' }
    ]);

    // Khi sản phẩm được load, tự động chọn màu đầu tiên làm mặc định
    useEffect(() => {
        const productVariants = normalizeProductVariants(finalProduct);
        if (productVariants.length > 0) {
            setSelectedVariant((currentVariant) => {
                if (!currentVariant) return productVariants[0];

                const matchedVariant = productVariants.find((variant) =>
                    variant.colorName === currentVariant.colorName &&
                    variant.colorHex === currentVariant.colorHex
                );

                return matchedVariant || productVariants[0];
            });
        }
    }, [finalProduct]);

    useEffect(() => {
        const productVariants = normalizeProductVariants(finalProduct);
        const activeVariant = selectedVariant || productVariants[0];

        if (!activeVariant) return;

        const nextSizes = activeVariant.sizes || [];
        if (nextSizes.length === 0) return;

        setSelectedSize((currentSize) => {
            const matchedSize = currentSize
                ? nextSizes.find((size) => size.size === currentSize)
                : null;

            if (matchedSize) return currentSize;

            const firstAvailableSize = nextSizes.find((size) => size.stock > 0);
            return firstAvailableSize?.size || nextSizes[0].size || null;
        });
    }, [selectedVariant, finalProduct]);

    // Ghi lịch sử xem để gợi ý sản phẩm
    useEffect(() => {
        if (finalProduct) {
            const token = localStorage.getItem('token');
            if (token) {
                axios.post('http://localhost:3000/api/view-history', {
                    productId: String(finalProduct.id),
                    category: finalProduct.category || 'Khác',
                }, {
                    headers: { Authorization: `Bearer ${token}` }
                }).catch(() => { });
            }
        }
    }, [finalProduct]);

    // ✅ Check if user already reviewed this product
    useEffect(() => {
        if (!user || !finalProduct?.id) {
            setReviewEligibility({
                canReview: false,
                hasPurchased: false,
                hasReviewed: false,
                status: null,
                message: ''
            });
            return;
        }

        // Fetch reviews to check if user already reviewed
        axios.get(`http://localhost:3000/api/reviews/${finalProduct.id}`)
            .then(res => {
                const userReview = res.data.reviews?.find(r => r.userId === user.id);
                setReviewEligibility({
                    canReview: true,
                    hasPurchased: true,
                    hasReviewed: !!userReview,
                    status: null,
                    message: userReview ? "Đã đánh giá" : "Có thể đánh giá"
                });
            })
            .catch(err => {
                console.error('Error checking review status:', err);
                setReviewEligibility({
                    canReview: true,
                    hasPurchased: true,
                    hasReviewed: false,
                    status: null,
                    message: 'Có thể đánh giá'
                });
            })
            .finally(() => setLoadingEligibility(false));
    }, [user, finalProduct?.id]);

    // Filter reviews based on selected criteria
    const filteredReviews = [...allReviews, ...userReviews].filter(review => {
        // ✅ Filter theo size
        const matchSize = sizeFilter === 'Tất cả' || review.purchasedSize === sizeFilter;

        // Filter theo sao/loại
        let matchFilter = true;
        if (reviewFilter === 'all') matchFilter = true;
        else if (reviewFilter === '5') matchFilter = review.rating === 5;
        else if (reviewFilter === '4') matchFilter = review.rating === 4;
        else if (reviewFilter === 'comment') matchFilter = review.comment.length > 0;
        else if (reviewFilter === 'images') matchFilter = review.images.length > 0;

        return matchSize && matchFilter;
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
                showToast(t('please_login_review'), 'error');
            } else {
                alert(t('please_login_review'));
            }
            setTimeout(() => navigate('/login'), 1500);
            return;
        }

        if (!newReview.comment.trim()) {
            if (showToast) {
                showToast(t('please_enter_review'), 'error');
            } else {
                alert(t('please_enter_review'));
            }
            return;
        }

        const review = {
            id: Date.now(),
            user: user?.fullName || user?.email || 'Người dùng',
            avatar: (user?.fullName?.[0] || user?.email?.[0] || 'U').toUpperCase(),
            rating: newReview.rating,
            date: new Date().toISOString().split('T')[0],
            variant: activeVariant ? `${activeVariant.colorName}, Size ${selectedSize || 'M'}` : t('not_selected'),
            comment: newReview.comment,
            images: newReview.images,
            shopReply: null,
            gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
        };

        console.log('Adding review:', review);
        setUserReviews([review, ...userReviews]);
        setNewReview({ rating: 5, comment: '', images: [] });

        if (showToast) {
            showToast(`✅ ${t('review_submitted')}`, 'success');
        } else {
            alert(`✅ ${t('review_submitted')}`);
        }
    };

    if (!products && !flashSaleProducts) return <div style={{ padding: '50px', textAlign: 'center' }}>{t('loading')}</div>;
    if (!finalProduct) return <div style={{ padding: '50px', textAlign: 'center' }}>{t('product_not_found')}</div>;

    const productVariants = normalizeProductVariants(finalProduct);
    const activeVariant = selectedVariant || productVariants[0] || null;
    const availableSizes = activeVariant?.sizes?.length > 0
        ? activeVariant.sizes
        : DEFAULT_SIZE_OPTIONS.map((size, index) => ({
            size,
            stock: index === 1 ? Number(finalProduct?.totalStock ?? finalProduct?.stock) || 0 : 0,
            sku: ''
        }));
    const selectedSizeStock = selectedSize
        ? (availableSizes.find((size) => size.size === selectedSize)?.stock || 0)
        : (availableSizes.reduce((total, size) => total + (Number(size.stock) || 0), 0));
    const totalAvailableStock = availableSizes.reduce((total, size) => total + (Number(size.stock) || 0), 0);

    // Xác định ảnh đang hiển thị (Nếu chọn biến thể thì lấy ảnh biến thể, ko thì lấy ảnh gốc)
    const currentImage = activeVariant?.colorImage || activeVariant?.color?.image || finalProduct.img;

    // ✅ TÍNH NĂNG 1: Gallery ảnh đổi theo màu
    const displayImages = (() => {
        const colorImage = activeVariant?.colorImage || activeVariant?.color?.image;
        const fallbackImages = Array.isArray(finalProduct?.images) ? finalProduct.images : [];

        if (colorImage) {
            return [colorImage, ...fallbackImages];
        }
        return fallbackImages.length > 0 ? fallbackImages : [finalProduct?.img || finalProduct?.imageUrl || ''];
    })();

    const currentDisplayImage = displayImages[activeImgIdx] || displayImages[0] || currentImage;

    // Hàm format giá tiền cho đẹp
    const formatPrice = (price) => {
        if (typeof price === 'string') return price;
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
    };

    // --- HÀM XỬ LÝ MUA HÀNG ---
    const handleAction = (isBuyNow) => {
        if (!isAuthenticated) {
            showToast(t('need_login_buy'), "warning");
            setTimeout(() => navigate('/login'), 1000);
            return;
        }

        if (!selectedSize) {
            showToast(t('please_select_size'), "warning");
            return;
        }

        if (selectedSizeStock <= 0) {
            showToast('Size này đã hết hàng', 'warning');
            return;
        }

        // Tạo object sản phẩm để thêm vào giỏ (gộp thông tin màu đã chọn)
        const productToAdd = {
            ...finalProduct,
            img: currentImage, // Lưu ảnh đúng màu
            color: activeVariant ? activeVariant.colorName : 'Mặc định',
            selectedColor: activeVariant ? activeVariant.colorName : 'Mặc định',
            selectedSize,
            stock: selectedSizeStock,
            variant: activeVariant
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
                    currentVariant: activeVariant
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
                        <div className="product-gallery">
                            {/* Main image */}
                            <div className="gallery-main">
                                <img
                                    src={currentDisplayImage}
                                    alt={finalProduct.name}
                                    className="gallery-main-img"
                                    onError={(e) => { e.target.style.display = 'none'; }}
                                />
                            </div>

                            {/* Thumbnails */}
                            {displayImages.length > 1 && (
                                <div className="gallery-thumbs">
                                    {displayImages.map((img, i) => (
                                        <button
                                            key={i}
                                            className={`gallery-thumb ${activeImgIdx === i ? 'gallery-thumb--active' : ''}`}
                                            onClick={() => setActiveImgIdx(i)}
                                            onError={(e) => { e.style.display = 'none'; }}
                                        >
                                            <img src={img} alt={`${finalProduct.name} ${i + 1}`} />
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
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
                        {productVariants.length > 0 && (
                            <div className="product-detail-section">
                                <div className="section-label">{t('color_label')}</div>
                                <div className="option-list">
                                    {productVariants.map((variant, index) => (
                                        <button
                                            key={index}
                                            onClick={() => {
                                                setSelectedVariant(variant);
                                                setSelectedSize(null);
                                                setSelectedColorIdx(index);
                                                setActiveImgIdx(0); // ✅ Reset ảnh khi đổi màu
                                            }}
                                            className={`option-button ${activeVariant?.colorName === variant.colorName && activeVariant?.colorHex === variant.colorHex ? 'selected' : ''}`}
                                        >
                                            {variant.colorImage ? (
                                                <img src={variant.colorImage} alt="" className="option-swatch" />
                                            ) : (
                                                <div
                                                    className="option-swatch"
                                                    style={{ background: variant.colorHex }}
                                                ></div>
                                            )}
                                            <span>{variant.colorName}</span>
                                        </button>
                                    ))}
                                </div>
                                <div style={{ marginTop: '8px', fontSize: '13px', color: '#6b7280' }}>
                                    Tổng tồn kho theo màu đang chọn: <strong>{totalAvailableStock}</strong>
                                </div>
                            </div>
                        )}

                        {/* --- 2. CHỌN SIZE --- */}
                        <div className="product-detail-section">
                            <div className="size-selector-header">
                                <div className="size-label">{t('size_label')}</div>
                                <a href="#size-guide" className="size-guide-link">Hướng dẫn chọn kích cỡ</a>
                            </div>
                            <div className="size-buttons">
                                {availableSizes.map(sizeItem => {
                                    const stock = sizeItem.stock ?? 0;
                                    const isSelected = selectedSize === sizeItem.size;
                                    const isOut = stock === 0;
                                    const isLow = stock > 0 && stock <= 5;

                                    return (
                                        <button
                                            key={sizeItem.size}
                                            className={[
                                                'size-btn',
                                                isSelected ? 'size-btn--on' : '',
                                                isOut ? 'size-btn--out' : '',
                                                isLow ? 'size-btn--low' : '',
                                            ].filter(Boolean).join(' ')}
                                            onClick={() => !isOut && setSelectedSize(sizeItem.size)}
                                            disabled={isOut}
                                            title={isOut ? 'Hết hàng' : `Còn ${stock} sản phẩm`}
                                        >
                                            {sizeItem.size}
                                            {isLow && !isOut && <span className="size-low-dot" />}
                                        </button>
                                    );
                                })}
                            </div>

                            {/* ✅ TÍNH NĂNG 2: Stock status message */}
                            {selectedSize && (() => {
                                const stock = availableSizes.find(s => s.size === selectedSize)?.stock ?? 0;
                                if (stock === 0) return (
                                    <div className="stock-msg stock-msg--out">
                                        Hết hàng size {selectedSize}
                                    </div>
                                );
                                if (stock <= 3) return (
                                    <div className="stock-msg stock-msg--critical">
                                        ⚡ Chỉ còn {stock} sản phẩm — mua nhanh kẻo hết!
                                    </div>
                                );
                                if (stock <= 5) return (
                                    <div className="stock-msg stock-msg--low">
                                        📦 Còn {stock} sản phẩm size {selectedSize}
                                    </div>
                                );
                                return (
                                    <div className="stock-msg stock-msg--ok">
                                        ✓ Còn {stock} sản phẩm
                                    </div>
                                );
                            })()}
                        </div>

                        {/* AI CONFIDENCE SCORE */}
                        {user && selectedSize && aiConfidenceScore > 0 && (
                            <div className="ai-confidence-bar">
                                <div className="ai-confidence-left">
                                    <span className="ai-confidence-icon">✦</span>
                                    <div>
                                        <div className="ai-confidence-title">Độ tự tin mua hàng</div>
                                        <div className="ai-confidence-sub">Dựa trên thông tin và lịch sử mua của bạn</div>
                                    </div>
                                </div>
                                <div className="ai-confidence-score">
                                    <span className="ai-score-num">{aiConfidenceScore}%</span>
                                    <div className="ai-score-bar">
                                        <div className="ai-score-fill" style={{ width: `${aiConfidenceScore}%` }} />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* CÁC NÚT HÀNH ĐỘNG */}
                        <div className="product-detail-actions">
                            <button
                                onClick={() => handleAction(false)}
                                className="action-btn primary"
                            >
                                {t('add_to_cart_btn')}
                            </button>

                            <button
                                onClick={() => handleAction(true)}
                                className="action-btn outline"
                            >
                                {t('buy_now_btn')}
                            </button>

                            <button
                                onClick={handleTryOn}
                                className="action-btn tryon"
                            >
                                <span className="action-icon">🕴️</span> {t('try_3d_btn')}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Chi tiết sản phẩm */}
            <div className="product-detail-block">
                <h3 className="product-detail-block-title">{t('product_specs')}</h3>
                <div className="product-specs">
                    <div className="product-spec-row">
                        <div className="product-spec-label">{t('category_label')}</div>
                        <div className="product-spec-value">VFitAI {'>'} {t('fashion_breadcrumb')} {'>'} {finalProduct.category}</div>
                    </div>
                    {finalProduct?.ai_attributes?.material && (
                        <div className="product-spec-row">
                            <div className="product-spec-label">Chất liệu</div>
                            <div className="product-spec-value">{finalProduct.ai_attributes.material}</div>
                        </div>
                    )}
                    {finalProduct?.ai_attributes?.fit && (
                        <div className="product-spec-row">
                            <div className="product-spec-label">Form dáng</div>
                            <div className="product-spec-value">{finalProduct.ai_attributes.fit}</div>
                        </div>
                    )}
                    {finalProduct?.ai_attributes?.style && Array.isArray(finalProduct.ai_attributes.style) && (
                        <div className="product-spec-row">
                            <div className="product-spec-label">Phong cách</div>
                            <div className="product-spec-value">{finalProduct.ai_attributes.style.join(', ')}</div>
                        </div>
                    )}
                    {finalProduct?.ai_attributes?.occasion && Array.isArray(finalProduct.ai_attributes.occasion) && (
                        <div className="product-spec-row">
                            <div className="product-spec-label">Phù hợp dịp</div>
                            <div className="product-spec-value">{finalProduct.ai_attributes.occasion.join(', ')}</div>
                        </div>
                    )}
                    {finalProduct?.ai_attributes?.weather && Array.isArray(finalProduct.ai_attributes.weather) && (
                        <div className="product-spec-row">
                            <div className="product-spec-label">Thời tiết</div>
                            <div className="product-spec-value">{finalProduct.ai_attributes.weather.join(', ')}</div>
                        </div>
                    )}
                    <div className="product-spec-row">
                        <div className="product-spec-label">{t('origin_label')}</div>
                        <div className="product-spec-value">Việt Nam</div>
                    </div>
                </div>
            </div>

            {/* ĐÁNH GIÁ VÀ BÌNH LUẬN */}
            <div className="product-detail-block reviews-block">
                <h3 className="product-detail-block-title">{t('product_reviews_title')}</h3>

                {/* Tổng quan đánh giá */}
                <div className="review-summary">
                    <div className="review-score">
                        <div className="review-score-value">4.8</div>
                        <div className="review-stars">⭐⭐⭐⭐⭐</div>
                        <div className="review-count">(1.2k {t('review_count_label')})</div>
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

                {/* ✅ TÍNH NĂNG 3A: AI Review Summary */}
                {allReviews.length >= 3 && (
                    <div className="ai-review-summary">
                        <div className="ai-review-summary-header">
                            <span className="ai-summary-icon">✦</span>
                            <span className="ai-summary-title">AI tóm tắt đánh giá</span>
                            <span className="ai-summary-badge">Dựa trên {allReviews.length} đánh giá</span>
                        </div>
                        <p className="ai-summary-text">
                            Sản phẩm được yêu thích với 80% khách hàng hài lòng về chất lượng vải và form dáng. Size chuẩn, phù hợp cho mọi dáng người. Chất liệu mát mẻ, phù hợp mặc trong mùa hè. Giao hàng nhanh và đóng gói cẩn thận.
                        </p>
                    </div>
                )}

                {/* ✅ TÍNH NĂNG 3B: Filter chips theo size */}
                {(() => {
                    const availableSizeFilters = ['Tất cả', ...new Set(allReviews.map(r => r.purchasedSize).filter(Boolean))];
                    const filteredReviews = allReviews.filter(r => {
                        const matchSize = sizeFilter === 'Tất cả' || r.purchasedSize === sizeFilter;
                        return matchSize;
                    });

                    return (
                        <div className="review-filters-section">
                            <div className="filter-group">
                                <span className="filter-group-label">Lọc theo size:</span>
                                <div className="filter-chips">
                                    {availableSizeFilters.map(size => (
                                        <button
                                            key={size}
                                            className={`filter-chip ${sizeFilter === size ? 'filter-chip--on' : ''}`}
                                            onClick={() => setSizeFilter(size)}
                                        >
                                            {size === 'Tất cả' ? `Tất cả (${allReviews.length})` : `Size ${size}`}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {sizeFilter !== 'Tất cả' && (
                                <div className="filter-result-info">
                                    📍 {filteredReviews.length} đánh giá từ người mặc size {sizeFilter}
                                </div>
                            )}
                        </div>
                    );
                })()}

                {/* Bộ lọc đánh giá */}
                <div className="review-filters">
                    <button
                        onClick={() => setReviewFilter('all')}
                        className={`review-filter-btn ${reviewFilter === 'all' ? 'active' : ''}`}
                    >
                        {t('all_filter')} ({reviewCounts.all})
                    </button>
                    <button
                        onClick={() => setReviewFilter('5')}
                        className={`review-filter-btn ${reviewFilter === '5' ? 'active' : ''}`}
                    >
                        5 {t('star_label')} ({reviewCounts[5]})
                    </button>
                    <button
                        onClick={() => setReviewFilter('4')}
                        className={`review-filter-btn ${reviewFilter === '4' ? 'active' : ''}`}
                    >
                        4 {t('star_label')} ({reviewCounts[4]})
                    </button>
                    <button
                        onClick={() => setReviewFilter('comment')}
                        className={`review-filter-btn ${reviewFilter === 'comment' ? 'active' : ''}`}
                    >
                        {t('has_comments')} ({reviewCounts.comment})
                    </button>
                    <button
                        onClick={() => setReviewFilter('images')}
                        className={`review-filter-btn ${reviewFilter === 'images' ? 'active' : ''}`}
                    >
                        {t('has_images')} ({reviewCounts.images})
                    </button>
                </div>

                {/* ✅ REVIEW FORM - 2 STATES */}
                {!isAuthenticated ? (
                    // STATE 1: Not logged in
                    <div className="review-login-gate">
                        <div className="review-gate-icon">🔒</div>
                        <h4 className="review-gate-title">{t('login_to_review')}</h4>
                        <p className="review-gate-text">{t('login_to_review_desc')}</p>
                        <button
                            onClick={() => navigate('/login')}
                            className="review-gate-btn primary"
                        >
                            {t('login_now')}
                        </button>
                    </div>
                ) : reviewEligibility.hasReviewed ? (
                    // STATE 2: Already reviewed
                    <div className="review-success-message">
                        <div className="review-success-icon">✅</div>
                        <h4 className="review-success-title">Cảm ơn bạn!</h4>
                        <p className="review-success-text">Bạn đã đánh giá sản phẩm này. Cảm ơn vì đã chia sẻ trải nghiệm của bạn với cộng đồng.</p>
                    </div>
                ) : (
                    // STATE 5: Can review - Show form
                    <div className="review-form">
                        <h4 className="review-form-title">{t('write_your_review')}</h4>
                        <form onSubmit={handleSubmitReview}>
                            <div className="review-form-group">
                                <label className="review-form-label">{t('your_rating')}</label>
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
                                <label className="review-form-label">{t('your_comment')}</label>
                                <textarea
                                    value={newReview.comment}
                                    onChange={(e) => setNewReview({ ...newReview, comment: e.target.value })}
                                    placeholder={t('share_experience')}
                                    className="review-textarea"
                                    required
                                />
                            </div>

                            <button type="submit" className="review-submit-btn">
                                {t('submit_review_btn')}
                            </button>
                        </form>
                    </div>
                )}

                {/* Danh sách đánh giá */}
                <div className="review-list">
                    {filteredReviews.length === 0 ? (
                        <div className="review-empty">
                            <div className="review-empty-icon">📝</div>
                            <div>{t('no_matching_reviews')}</div>
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
                                    {review.date} | {t('classification')} {review.variant}
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
                                        <strong>{t('shop_reply')}</strong> {review.shopReply}
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>

                {/* Xem thêm */}
                <div className="review-more">
                    <button className="review-more-btn">{t('view_more_reviews')}</button>
                </div>
            </div>

            {/* GỢI Ý SẢN PHẨM */}
            <ProductRecommendations currentProductId={String(finalProduct.id)} />
        </div>
    );
}

export default ProductDetailPage;
