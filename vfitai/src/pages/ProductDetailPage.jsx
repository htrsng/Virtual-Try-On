import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

function ProductDetailPage({ products, onAddToCart, user, showToast }) {
    const { id } = useParams();
    const navigate = useNavigate();

    // Tìm sản phẩm theo ID
    const product = products ? products.find(p => p.id == id) : null;

    // --- STATE QUẢN LÝ ---
    const [selectedSize, setSelectedSize] = useState(null);
    const [selectedVariant, setSelectedVariant] = useState(null);

    // Khi sản phẩm được load, tự động chọn màu đầu tiên làm mặc định
    useEffect(() => {
        if (product && product.variants && product.variants.length > 0) {
            setSelectedVariant(product.variants[0]);
        }
    }, [product]);

    if (!products) return <div style={{ padding: '50px', textAlign: 'center' }}>Đang tải...</div>;
    if (!product) return <div style={{ padding: '50px', textAlign: 'center' }}>Không tìm thấy sản phẩm</div>;

    // Xác định ảnh đang hiển thị (Nếu chọn biến thể thì lấy ảnh biến thể, ko thì lấy ảnh gốc)
    const currentImage = selectedVariant ? selectedVariant.img : product.img;

    // Hàm format giá tiền cho đẹp
    const formatPrice = (price) => {
        if (typeof price === 'string') return price;
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
    };

    // --- HÀM XỬ LÝ MUA HÀNG ---
    const handleAction = (isBuyNow) => {
        if (!user) {
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
            ...product,
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
                    ...product,
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
                        alt={product.name}
                        style={{ width: '100%', objectFit: 'cover', borderRadius: '4px', border: '1px solid #f0f0f0' }}
                    />
                </div>

                {/* CỘT THÔNG TIN */}
                <div style={{ width: '60%' }}>
                    <h2 style={{ fontSize: '20px', fontWeight: '500', margin: '0 0 15px 0', lineHeight: '1.2' }}>{product.name}</h2>

                    <div style={{ background: '#fafafa', padding: '15px 20px', marginBottom: '25px' }}>
                        <span style={{ color: '#ee4d2d', fontSize: '30px', fontWeight: 'bold' }}>
                            {formatPrice(product.price)}
                        </span>
                    </div>

                    {/* --- 1. CHỌN MÀU SẮC / BIẾN THỂ (MỚI) --- */}
                    {product.variants && product.variants.length > 0 && (
                        <div style={{ marginBottom: '25px' }}>
                            <div style={{ marginBottom: '10px', color: '#757575', fontSize: '14px' }}>Màu Sắc</div>
                            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                                {product.variants.map((variant, index) => (
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
                                        padding: '8px 25px',
                                        border: selectedSize === size ? '1px solid #ee4d2d' : '1px solid rgba(0,0,0,.09)',
                                        color: selectedSize === size ? '#ee4d2d' : 'rgba(0,0,0,.8)',
                                        background: 'white',
                                        cursor: 'pointer',
                                        minWidth: '80px'
                                    }}
                                >
                                    {size}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* --- CÁC NÚT BẤM --- */}
                    <div style={{ display: 'flex', gap: '15px', borderBottom: '1px solid #f1f1f1', paddingBottom: '30px', flexWrap: 'wrap' }}>
                        {/* Nút Thêm vào giỏ */}
                        <button
                            onClick={() => handleAction(false)}
                            style={{
                                background: 'rgba(255,87,34,0.1)', border: '1px solid #ee4d2d', color: '#ee4d2d',
                                padding: '15px 25px', cursor: 'pointer', fontWeight: 'bold', borderRadius: '2px',
                                display: 'flex', alignItems: 'center', gap: '8px'
                            }}
                        >
                            <span style={{ fontSize: '18px' }}>🛒</span> Thêm Vào Giỏ Hàng
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

            {/* Chi tiết sản phẩm (Giữ nguyên) */}
            <div style={{ marginTop: '20px', background: 'white', borderTop: '1px solid #f5f5f5' }}>
                <h3 style={{ background: '#f5f5f5', padding: '14px', fontSize: '16px', margin: 0, textTransform: 'uppercase', color: 'rgba(0,0,0,.87)' }}>CHI TIẾT SẢN PHẨM</h3>
                <div className="detail-table" style={{ padding: '15px' }}>
                    <div className="detail-row" style={{ display: 'flex', padding: '10px 0' }}><div style={{ width: '150px', color: 'gray' }}>Danh Mục</div><div style={{ color: '#0055aa' }}>Shopee {'>'} Thời Trang {'>'} {product.category}</div></div>
                    <div className="detail-row" style={{ display: 'flex', padding: '10px 0' }}><div style={{ width: '150px', color: 'gray' }}>Chất liệu</div><div>Denim, Cotton cao cấp</div></div>
                    <div className="detail-row" style={{ display: 'flex', padding: '10px 0' }}><div style={{ width: '150px', color: 'gray' }}>Mẫu</div><div>Trơn / Họa tiết</div></div>
                    <div className="detail-row" style={{ display: 'flex', padding: '10px 0' }}><div style={{ width: '150px', color: 'gray' }}>Xuất xứ</div><div>Việt Nam</div></div>
                </div>
            </div>
        </div>
    );
}

export default ProductDetailPage;