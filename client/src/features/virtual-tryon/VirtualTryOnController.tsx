import { useState, useEffect } from 'react';
import VirtualTryOn from './VirtualTryOn';
import { useLocation, useNavigate } from 'react-router-dom';

const styles = {
    container: { position: 'relative' as 'relative', width: '100%', height: '100vh', backgroundColor: '#f5f5f5', overflow: 'hidden' },
    backButton: {
        position: 'absolute' as 'absolute', top: '20px', left: '20px', zIndex: 100,
        backgroundColor: 'white', padding: '10px 20px', borderRadius: '30px',
        border: '1px solid #ddd', cursor: 'pointer', fontWeight: 'bold' as 'bold',
        boxShadow: '0 2px 5px rgba(0,0,0,0.1)', display: 'flex', alignItems: 'center', gap: '5px'
    },
    sidebar: {
        position: 'absolute' as 'absolute', top: 0, right: 0, bottom: 0,
        width: '400px', backgroundColor: 'white', borderLeft: '1px solid #ddd',
        display: 'flex', flexDirection: 'column' as 'column', zIndex: 50,
        boxShadow: '-5px 0 15px rgba(0,0,0,0.05)'
    },
    content: { flex: 1, overflowY: 'auto' as 'auto', padding: '24px' },
    sectionTitle: { fontSize: '13px', fontWeight: 'bold' as 'bold', color: '#333', textTransform: 'uppercase' as 'uppercase', marginBottom: '12px', marginTop: '20px' },

    // Sửa lại style color option để nhận diện màu trắng
    colorOption: (color: string, isSelected: boolean) => ({
        width: '32px', height: '32px', borderRadius: '50%', backgroundColor: color,
        border: isSelected ? '2px solid #ee4d2d' : '1px solid #ddd', // Đổi viền cam khi chọn
        cursor: 'pointer', marginRight: '10px', display: 'inline-block',
        boxShadow: isSelected ? '0 0 0 2px white, 0 0 0 4px #ee4d2d' : 'none',
        position: 'relative' as 'relative'
    }),

    sizeGrid: { display: 'flex', gap: '10px' },
    sizeButton: (isSelected: boolean) => ({
        flex: 1, padding: '10px', textAlign: 'center' as 'center',
        border: isSelected ? '1px solid #ee4d2d' : '1px solid #ddd',
        backgroundColor: isSelected ? '#fff5f1' : 'white',
        color: isSelected ? '#ee4d2d' : '#333',
        fontWeight: isSelected ? 'bold' : 'normal',
        cursor: 'pointer', borderRadius: '4px'
    }),
    inputRow: { display: 'flex', gap: '15px', marginBottom: '20px' },
    inputGroup: { flex: 1 },
    label: { fontSize: '12px', fontWeight: 'bold' as 'bold', color: '#666', marginBottom: '5px', display: 'block', textTransform: 'uppercase' as 'uppercase' },
    numberInput: {
        width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px',
        fontWeight: 'bold' as 'bold', fontSize: '14px'
    },
    sliderContainer: { marginBottom: '20px' },
    sliderHeader: { display: 'flex', justifyContent: 'space-between', marginBottom: '5px', fontSize: '13px', fontWeight: '600' },
    slider: { width: '100%', accentColor: '#ee4d2d', cursor: 'pointer' },
    matchScoreBox: {
        backgroundColor: '#f8fff0', border: '1px solid #b7eb8f', borderRadius: '8px',
        padding: '15px', textAlign: 'center' as 'center', marginTop: '20px'
    },
    scoreText: { color: '#52c41a', fontSize: '24px', fontWeight: 'bold' as 'bold' },
    footer: {
        padding: '20px', borderTop: '1px solid #eee', display: 'flex', gap: '10px', backgroundColor: 'white'
    },
    btnCart: {
        flex: 1, padding: '12px', border: '1px solid #ee4d2d', color: '#ee4d2d',
        backgroundColor: '#fff5f1', fontWeight: 'bold' as 'bold', borderRadius: '4px', cursor: 'pointer'
    },
    btnBuy: {
        flex: 1, padding: '12px', border: 'none', color: 'white',
        backgroundColor: '#ee4d2d', fontWeight: 'bold' as 'bold', borderRadius: '4px', cursor: 'pointer'
    }
};

const VirtualTryOnController = ({ body, setBody, products, onAddToCart, onBuyNow, showToast }: any) => {
    const location = useLocation();
    const navigate = useNavigate();

    const passedProduct = location.state?.product;
    const defaultProduct = products && products.length > 0 ? products[0] : null;
    const currentProduct = passedProduct || defaultProduct;

    const [selectedSize, setSelectedSize] = useState('M');

    // ✅ FIX: State màu sắc (Khởi tạo là null hoặc màu đầu tiên nếu có variants)
    const [selectedColor, setSelectedColor] = useState<string | null>(null);

    const [clothingTexture, setClothingTexture] = useState<string | null>(null);

    // Danh sách màu mặc định nếu sản phẩm không có variants
    const defaultColors = ['#333333', '#808080', '#FFFFFF', '#1E90FF'];
    const productColors = currentProduct?.variants?.map((v: any) => v.hex) || defaultColors;

    useEffect(() => {
        if (currentProduct) {
            setClothingTexture(currentProduct.img || currentProduct.image);
            // Reset màu chọn khi đổi sản phẩm
            setSelectedColor(productColors[0]);
        }
    }, [currentProduct]);

    if (!currentProduct) return <div>Đang tải dữ liệu...</div>;

    return (
        <div style={styles.container}>
            <button style={styles.backButton} onClick={() => navigate(-1)}>
                ← Quay lại Shop
            </button>

            <div style={{ position: 'absolute', top: 0, left: 0, right: '400px', height: '100%' }}>
                <VirtualTryOn body={body} clothingTexture={clothingTexture} />
            </div>

            <div style={styles.sidebar}>
                <div style={styles.content}>
                    <div style={{ display: 'flex', gap: '15px', marginBottom: '20px', borderBottom: '1px solid #eee', paddingBottom: '20px' }}>
                        <img src={currentProduct.img || currentProduct.image} style={{ width: '60px', height: '80px', objectFit: 'cover', borderRadius: '4px' }} alt="" />
                        <div>
                            <div style={{ fontSize: '14px', fontWeight: 'bold' }}>{currentProduct.name}</div>
                            <div style={{ color: '#ee4d2d', fontWeight: 'bold', marginTop: '5px' }}>
                                {currentProduct.priceDisplay || currentProduct.price?.toLocaleString() + ' đ'}
                            </div>
                        </div>
                    </div>

                    <div style={styles.sectionTitle}>1. MÀU SẮC</div>
                    <div style={{ marginBottom: '20px', display: 'flex', flexWrap: 'wrap' }}>
                        {/* ✅ FIX: Render danh sách màu động */}
                        {productColors.map((color: string, index: number) => (
                            <div
                                key={index}
                                style={styles.colorOption(color, selectedColor === color)}
                                onClick={() => {
                                    setSelectedColor(color);
                                    // Ở đây bạn có thể thêm logic đổi texture áo theo màu nếu có dữ liệu
                                    // setClothingTexture(variants[index].img)
                                }}
                            />
                        ))}
                    </div>

                    <div style={styles.sectionTitle}>2. KÍCH THƯỚC</div>
                    <div style={styles.sizeGrid}>
                        {['S', 'M', 'L', 'XL'].map(size => (
                            <button
                                key={size}
                                style={styles.sizeButton(selectedSize === size)}
                                onClick={() => setSelectedSize(size)}
                            >
                                {size}
                            </button>
                        ))}
                    </div>

                    <div style={styles.sectionTitle}>3. SỐ ĐO CƠ THỂ</div>
                    <div style={styles.inputRow}>
                        <div style={styles.inputGroup}>
                            <label style={styles.label}>CAO (CM)</label>
                            <input type="number" value={body.height}
                                onChange={(e) => setBody({ ...body, height: Number(e.target.value) })}
                                style={styles.numberInput} />
                        </div>
                        <div style={styles.inputGroup}>
                            <label style={styles.label}>NẶNG (KG)</label>
                            <input type="number" value={body.weight}
                                onChange={(e) => setBody({ ...body, weight: Number(e.target.value) })}
                                style={styles.numberInput} />
                        </div>
                    </div>

                    <SliderControl label="Ngực" value={body.chest} min={70} max={120}
                        onChange={(v: number) => setBody({ ...body, chest: v })} />

                    <SliderControl label="Eo" value={body.waist} min={55} max={100}
                        onChange={(v: number) => setBody({ ...body, waist: v })} />

                    <SliderControl label="Hông" value={body.hips} min={80} max={120}
                        onChange={(v: number) => setBody({ ...body, hips: v })} />

                    <details style={{ marginTop: '10px', fontSize: '13px', color: '#666', cursor: 'pointer' }}>
                        <summary>Chỉnh chi tiết khác (Vai, Đùi, Bắp tay...)</summary>
                        <div style={{ marginTop: '15px' }}>
                            <SliderControl label="Vai" value={body.shoulder} min={30} max={50}
                                onChange={(v: number) => setBody({ ...body, shoulder: v })} />

                            <SliderControl label="Đùi" value={body.thigh || 50} min={40} max={70}
                                onChange={(v: number) => setBody({ ...body, thigh: v })} />

                            {/* ✅ Đã thay thế "Tỷ lệ chân" bằng "Bắp tay" */}
                            <SliderControl label="Bắp tay" value={body.arm || 26} min={20} max={40}
                                onChange={(v: number) => setBody({ ...body, arm: v })} />
                        </div>
                    </details>

                    <div style={styles.matchScoreBox}>
                        <div style={{ fontSize: '12px', color: '#666' }}>Độ phù hợp (AI Suggestion)</div>
                        <div style={styles.matchScoreBox}>
                            <div style={styles.scoreText}>95/100</div>
                        </div>
                    </div>
                </div>

                <div style={styles.footer}>
                    <button style={styles.btnCart} onClick={() => {
                        // Thêm sản phẩm vào giỏ với màu và size đã chọn
                        const productToAdd = { ...currentProduct, color: selectedColor, size: selectedSize };
                        onAddToCart(productToAdd);
                        showToast('Đã thêm vào giỏ!');
                    }}>
                        🛒 Thêm Giỏ
                    </button>
                    <button style={styles.btnBuy} onClick={() => {
                        // Mua ngay: chỉ mua sản phẩm này
                        const productToAdd = { ...currentProduct, color: selectedColor, size: selectedSize };
                        onBuyNow(productToAdd, selectedSize);
                    }}>
                        MUA NGAY
                    </button>
                </div>
            </div>
        </div>
    );
};

interface SliderProps {
    label: string;
    value: number;
    min: number;
    max: number;
    onChange: (val: number) => void;
}

const SliderControl = ({ label, value, min, max, onChange }: SliderProps) => (
    <div style={styles.sliderContainer}>
        <div style={styles.sliderHeader}>
            <span>{label}</span>
            <span>{value} cm</span>
        </div>
        <input
            type="range" min={min} max={max} value={value}
            onChange={(e) => onChange(Number(e.target.value))}
            style={styles.slider}
        />
    </div>
);

export default VirtualTryOnController;