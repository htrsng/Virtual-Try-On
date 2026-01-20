import React from 'react';
import { morphToCm } from './useBodyCalculator';
import type { Variant } from './types';

// Thêm prop mới cho các nút chức năng
interface BodyFormProps {
    variants: Variant[];
    selectedVariant: Variant;
    setSelectedVariant: (v: Variant) => void;
    selectedSize: string | null;
    setSelectedSize: (s: string) => void;

    // Body props
    realHeight: number; setRealHeight: (n: number) => void;
    realWeight: number; setRealWeight: (n: number) => void;
    fat: number; setFat: (n: number) => void;
    chest: number; setChest: (n: number) => void;
    waist: number; setWaist: (n: number) => void;
    hips: number; setHips: (n: number) => void;

    // Actions
    calculateBody: (size: string | null) => void;
    handleExport: () => void;

    // 👇 Thêm 2 props mới để xử lý nút bấm
    onAddToCart: () => void;
    onBuyNow: () => void;

    fitScore: number;
    pose: string;
    setPose: (p: string) => void;
}

const BodyForm: React.FC<BodyFormProps> = ({
    variants, selectedVariant, setSelectedVariant,
    selectedSize, setSelectedSize,
    realHeight, setRealHeight, realWeight, setRealWeight,
    fat, setFat, chest, setChest, waist, setWaist, hips, setHips,
    calculateBody, handleExport,
    onAddToCart, onBuyNow, // Nhận function từ cha
    fitScore, pose, setPose
}) => {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#fff', borderLeft: '1px solid #ddd' }}>

            {/* PHẦN 1: NỘI DUNG CUỘN (Scrollable) */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '25px' }}>

                {/* Chọn Màu */}
                <div style={{ marginBottom: '20px' }}>
                    <h3 style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '10px', textTransform: 'uppercase' }}>1. Màu sắc</h3>
                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                        {variants.map((variant, index) => (
                            <button
                                key={index}
                                onClick={() => setSelectedVariant(variant)}
                                style={{
                                    width: '36px', height: '36px', borderRadius: '50%',
                                    backgroundColor: variant.hex || '#eee',
                                    border: selectedVariant.name === variant.name ? '2px solid #333' : '1px solid #ddd',
                                    cursor: 'pointer', padding: 0,
                                    backgroundImage: variant.hex ? 'none' : `url(${variant.img})`,
                                    backgroundSize: 'cover',
                                    boxShadow: selectedVariant.name === variant.name ? '0 0 0 2px white, 0 0 0 4px #ee4d2d' : 'none',
                                    transition: 'all 0.2s'
                                }}
                                title={variant.name}
                            />
                        ))}
                    </div>
                    <p style={{ fontSize: '12px', color: '#666', marginTop: '8px' }}>Đang chọn: <strong>{selectedVariant.name}</strong></p>
                </div>

                {/* Chọn Size */}
                <div style={{ marginBottom: '20px' }}>
                    <h3 style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '10px', textTransform: 'uppercase' }}>2. Kích thước</h3>
                    <div style={{ display: 'flex', gap: '8px' }}>
                        {['S', 'M', 'L', 'XL'].map(size => (
                            <button
                                key={size}
                                onClick={() => setSelectedSize(size)}
                                style={{
                                    flex: 1, padding: '8px 0', textAlign: 'center',
                                    border: selectedSize === size ? '1px solid #ee4d2d' : '1px solid #ddd',
                                    color: selectedSize === size ? '#ee4d2d' : '#333',
                                    backgroundColor: selectedSize === size ? '#fff5f1' : 'white',
                                    borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer', fontSize: '13px'
                                }}
                            >
                                {size}
                            </button>
                        ))}
                    </div>
                </div>

                <hr style={{ border: 'none', borderTop: '1px dashed #ddd', margin: '20px 0' }} />

                {/* Form Nhập Số Đo */}
                <div>
                    <h3 style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '15px', color: '#ee4d2d', textTransform: 'uppercase' }}>3. Số đo cơ thể</h3>

                    <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
                        <div style={{ flex: 1 }}>
                            <label style={{ fontSize: '11px', fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>CAO (CM)</label>
                            <input type="number" value={realHeight} onChange={(e) => setRealHeight(Number(e.target.value))} style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }} />
                        </div>
                        <div style={{ flex: 1 }}>
                            <label style={{ fontSize: '11px', fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>NẶNG (KG)</label>
                            <input type="number" value={realWeight} onChange={(e) => setRealWeight(Number(e.target.value))} style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }} />
                        </div>
                    </div>

                    <button onClick={() => calculateBody(selectedSize)} style={{ width: '100%', padding: '10px', background: '#333', color: 'white', border: 'none', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer', marginBottom: '20px', fontSize: '13px' }}>
                        CẬP NHẬT DÁNG NGƯỜI ↻
                    </button>

                    {/* Các thanh Slider */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                        {[
                            { label: 'Độ đầy đặn', val: fat, set: setFat, display: `${Math.round(fat * 100)}%` },
                            { label: 'Ngực', val: chest, set: setChest, display: `${morphToCm(chest, 'chest')} cm` },
                            { label: 'Eo', val: waist, set: setWaist, display: `${morphToCm(waist, 'waist')} cm` },
                            { label: 'Hông', val: hips, set: setHips, display: `${morphToCm(hips, 'hips')} cm` }
                        ].map((item, idx) => (
                            <div key={idx}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                                    <label style={{ fontSize: '12px', color: '#555' }}>{item.label}</label>
                                    <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#333' }}>{item.display}</span>
                                </div>
                                <input type="range" min="0" max="1" step="0.01" value={item.val} onChange={(e) => item.set(parseFloat(e.target.value))} style={{ width: '100%', accentColor: '#ee4d2d' }} />
                            </div>
                        ))}
                    </div>
                </div>

                {/* Kết quả & Pose */}
                <div style={{ marginTop: '25px', padding: '15px', background: '#f8f9fa', borderRadius: '8px', textAlign: 'center' }}>
                    <div style={{ fontSize: '12px', color: '#666', marginBottom: '5px' }}>Độ phù hợp (AI Suggestion)</div>
                    <div style={{ fontSize: '24px', fontWeight: 'bold', color: fitScore > 70 ? '#28a745' : '#ffc107' }}>{fitScore}/100</div>

                    <div style={{ display: 'flex', gap: '8px', marginTop: '15px', justifyContent: 'center' }}>
                        <button onClick={() => setPose('idle')} style={{ flex: 1, padding: '6px', background: pose === 'idle' ? '#333' : '#fff', color: pose === 'idle' ? '#fff' : '#333', border: '1px solid #ccc', borderRadius: '4px', fontSize: '12px', cursor: 'pointer' }}>Đứng</button>
                        <button onClick={() => setPose('walking')} style={{ flex: 1, padding: '6px', background: pose === 'walking' ? '#333' : '#fff', color: pose === 'walking' ? '#fff' : '#333', border: '1px solid #ccc', borderRadius: '4px', fontSize: '12px', cursor: 'pointer' }}>Đi bộ</button>
                        <button onClick={handleExport} style={{ flex: 1, padding: '6px', background: '#17a2b8', color: 'white', border: 'none', borderRadius: '4px', fontSize: '12px', cursor: 'pointer' }}>📷 Ảnh</button>
                    </div>
                </div>
            </div>

            {/* PHẦN 2: FOOTER CỐ ĐỊNH (Nút Mua) */}
            <div style={{ padding: '20px', borderTop: '1px solid #eee', background: 'white', boxShadow: '0 -2px 10px rgba(0,0,0,0.05)' }}>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <button
                        onClick={onAddToCart}
                        style={{ flex: 1, padding: '12px', background: '#fff5f1', color: '#ee4d2d', border: '1px solid #ee4d2d', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}
                    >
                        🛒 Thêm Giỏ
                    </button>
                    <button
                        onClick={onBuyNow}
                        style={{ flex: 1, padding: '12px', background: '#ee4d2d', color: 'white', border: 'none', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer' }}
                    >
                        MUA NGAY
                    </button>
                </div>
            </div>
        </div>
    );
};

export default BodyForm;