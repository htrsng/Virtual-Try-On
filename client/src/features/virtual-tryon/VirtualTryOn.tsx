import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { useBodyCalculator } from './useBodyCalculator';
import TryOnScene from './TryOnScene';
import BodyForm from './BodyForm';
import type { Variant, ProductData } from './types';

const VirtualTryOn = () => {
    const navigate = useNavigate();
    const location = useLocation();

    // 1. STATE & DATA
    const [showGenderModal, setShowGenderModal] = useState(true);
    const productData = location.state?.selectedProduct as ProductData;
    const initialVariant = location.state?.selectedProduct?.currentVariant || (productData?.variants ? productData.variants[0] : null);

    // Dữ liệu variants (Fallback nếu null)
    const variants: Variant[] = productData?.variants && productData.variants.length > 0
        ? productData.variants
        : [{ id: 'default', color: 'default', name: 'Mặc định', img: productData?.img || '', hex: '#eee' }];

    const [selectedSize, setSelectedSize] = useState<string | null>(null);
    const [selectedVariant, setSelectedVariant] = useState<Variant>(initialVariant || variants[0]);
    const [pose, setPose] = useState('idle');

    // Hook tính toán body
    const bodyCalc = useBodyCalculator();

    useEffect(() => {
        // Khởi chạy tính toán lần đầu
        bodyCalc.calculateBody(selectedSize);
    }, []);

    // Logic scale quần áo (Giả lập)
    const getClothingScale = () => {
        switch (selectedSize) {
            case 'S': return 3.8;
            case 'M': return 4.0;
            case 'L': return 4.3;
            case 'XL': return 4.6;
            default: return 4.0;
        }
    };

    // 2. HANDLERS (Xử lý sự kiện)
    const handleAddToCart = () => {
        if (!selectedSize) {
            toast.error("⚠️ Bạn chưa chọn Size!");
            return;
        }
        toast.success(`🛒 Đã thêm "${productData.name}" (Size ${selectedSize}, Màu ${selectedVariant.name}) vào giỏ hàng!`);
    };

    const handleBuyNow = () => {
        if (!selectedSize) {
            toast.error("⚠️ Bạn chưa chọn Size!");
            return;
        }
        // Điều hướng sang trang thanh toán (Ví dụ)
        toast.info("Chuyển đến trang thanh toán...");
    };

    const handleExport = () => {
        const canvas = document.querySelector('canvas');
        if (canvas) {
            const link = document.createElement('a');
            link.download = `VFit_Look_${productData.id}.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();
            toast.success('📸 Đã lưu ảnh thành công!');
        }
    };

    // 3. RENDER MODAL GIỚI TÍNH
    if (showGenderModal) {
        return (
            <div style={{
                position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
                background: 'rgba(0,0,0,0.9)', zIndex: 9999,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                backdropFilter: 'blur(5px)' // Hiệu ứng làm mờ nền
            }}>
                <div style={{ background: 'white', padding: '40px', borderRadius: '16px', textAlign: 'center', maxWidth: '600px', boxShadow: '0 20px 50px rgba(0,0,0,0.3)' }}>
                    <h2 style={{ fontSize: '28px', marginBottom: '10px', fontWeight: '800', color: '#333' }}>Chọn người mẫu</h2>
                    <p style={{ color: '#666', marginBottom: '40px', fontSize: '16px' }}>Chọn giới tính người mẫu để chúng tôi hiển thị avatar phù hợp nhất với bạn.</p>

                    <div style={{ display: 'flex', gap: '30px', justifyContent: 'center' }}>
                        {/* Nữ */}
                        <div
                            onClick={() => setShowGenderModal(false)}
                            style={{
                                cursor: 'pointer', border: '2px solid #ee4d2d', borderRadius: '12px', padding: '30px', width: '220px', background: '#fff9f7',
                                transition: 'transform 0.2s', transform: 'scale(1)'
                            }}
                            onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                            onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
                        >
                            <img src="https://cdn-icons-png.flaticon.com/512/6997/6997662.png" alt="Female" style={{ width: '80px', marginBottom: '15px' }} />
                            <h3 style={{ fontWeight: 'bold', color: '#ee4d2d', fontSize: '18px' }}>NỮ (Female)</h3>
                        </div>

                        {/* Nam */}
                        <div
                            onClick={() => toast.info('🚀 Tính năng đang phát triển! Mời bạn thử mẫu Nữ trước.')}
                            style={{
                                cursor: 'not-allowed', border: '2px solid #eee', borderRadius: '12px', padding: '30px', width: '220px', background: '#f5f5f5', opacity: 0.6
                            }}
                        >
                            <div style={{ position: 'relative', display: 'inline-block' }}>
                                <img src="https://cdn-icons-png.flaticon.com/512/3048/3048122.png" alt="Male" style={{ width: '80px', marginBottom: '15px', filter: 'grayscale(100%)' }} />
                                <span style={{ position: 'absolute', top: -5, right: -15, background: '#666', color: 'white', fontSize: '10px', padding: '4px 8px', borderRadius: '10px', fontWeight: 'bold' }}>SOON</span>
                            </div>
                            <h3 style={{ fontWeight: 'bold', color: '#999', fontSize: '18px' }}>NAM (Male)</h3>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // 4. RENDER GIAO DIỆN CHÍNH (FULLSCREEN)
    return (
        // 👇 QUAN TRỌNG: position fixed + zIndex cực cao để đè Header
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            zIndex: 99999, // Đảm bảo cao hơn Header của Shopee
            display: 'flex',
            background: '#f0f0f0',
            overflow: 'hidden' // Ngăn thanh cuộn thừa
        }}>

            {/* Nút Quay lại (Nổi lên trên góc trái) */}
            <button
                onClick={() => navigate(-1)}
                style={{
                    position: 'absolute', top: 20, left: 20, zIndex: 100,
                    padding: '10px 20px', background: 'white', border: 'none', borderRadius: '30px',
                    cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px',
                    boxShadow: '0 4px 15px rgba(0,0,0,0.1)', color: '#333', fontSize: '13px'
                }}
            >
                ⬅ Quay lại Shop
            </button>

            {/* KHU VỰC 3D (Bên Trái - Chiếm hết chỗ trống) */}
            <div style={{
                flex: 1,
                position: 'relative',
                height: '100%',
                background: 'radial-gradient(circle at center, #ffffff 0%, #e8e8e8 100%)'
            }}>
                <TryOnScene
                    scaleY={bodyCalc.scaleY}
                    fat={bodyCalc.fat}
                    chest={bodyCalc.chest}
                    waist={bodyCalc.waist}
                    hips={bodyCalc.hips}
                    clothingTexture={selectedSize ? selectedVariant.img : null}
                    clothingScale={getClothingScale()}
                    pose={pose}
                />
            </div>

            {/* KHU VỰC SIDEBAR (Bên Phải - Cố định kích thước) */}
            <div style={{
                width: '420px',
                height: '100%',
                background: 'white',
                boxShadow: '-5px 0 20px rgba(0,0,0,0.05)',
                zIndex: 50
            }}>
                <BodyForm
                    variants={variants}
                    selectedVariant={selectedVariant}
                    setSelectedVariant={setSelectedVariant}
                    selectedSize={selectedSize}
                    setSelectedSize={setSelectedSize}
                    {...bodyCalc}
                    handleExport={handleExport}
                    onAddToCart={handleAddToCart}
                    onBuyNow={handleBuyNow}
                    pose={pose}
                    setPose={setPose}
                />
            </div>
        </div>
    );
};

export default VirtualTryOn;