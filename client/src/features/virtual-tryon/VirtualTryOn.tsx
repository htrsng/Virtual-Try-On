import React, { useState, Suspense, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment, Grid, ContactShadows, Loader } from '@react-three/drei';
import { useLocation, useNavigate } from 'react-router-dom';
import { Avatar } from '../../three/Avatar'; // Đảm bảo đường dẫn đúng tới file Avatar
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// --- ĐỊNH NGHĨA KIỂU DỮ LIỆU ---
interface Variant {
    id: string;
    color: string;
    name: string;
    img: string;
    hex: string;
}

// --- HÀM HỖ TRỢ CHUYỂN ĐỔI MORPH (0-1) SANG CM ---
const morphToCm = (morphValue: number, type: 'chest' | 'waist' | 'hips') => {
    // Định nghĩa khoảng giá trị thực tế (Min - Max cm) cho người Việt
    const ranges = {
        chest: { min: 75, max: 110 }, // Ngực: 75cm -> 110cm
        waist: { min: 58, max: 95 },  // Eo: 58cm -> 95cm
        hips: { min: 80, max: 115 }  // Hông: 80cm -> 115cm
    };
    const range = ranges[type];
    // Công thức: Min + (Tỷ lệ * Khoảng dao động)
    return Math.round(range.min + morphValue * (range.max - range.min));
};

const VirtualTryOn = () => {
    const navigate = useNavigate();
    const location = useLocation();

    // 1. NHẬN DỮ LIỆU SẢN PHẨM
    const productData = location.state?.selectedProduct;

    const initialVariant = location.state?.selectedProduct?.currentVariant || (productData?.variants ? productData.variants[0] : null);

    // Xử lý danh sách màu sắc (Variants)
    const variants: Variant[] = productData?.variants && productData.variants.length > 0
        ? productData.variants
        : [{ id: 'default', color: 'default', name: 'Mặc định', img: productData?.img, hex: '#eee' }];

    // 2. STATE QUẢN LÝ
    const [selectedSize, setSelectedSize] = useState<string | null>(null);
    const [selectedVariant, setSelectedVariant] = useState<Variant>(initialVariant || variants[0]);

    // State Body
    const [realHeight, setRealHeight] = useState(170);
    const [realWeight, setRealWeight] = useState(60);
    const [scaleY, setScaleY] = useState(1.0);

    // Morph Targets (Giá trị từ 0 đến 1)
    const [fat, setFat] = useState(0);
    const [chest, setChest] = useState(0);
    const [waist, setWaist] = useState(0);
    const [hips, setHips] = useState(0);

    // State UX
    const [errorMsg, setErrorMsg] = useState('');
    const [fitScore, setFitScore] = useState(0);
    const [pose, setPose] = useState('idle'); // 'idle' hoặc 'walking'

    // Hàm tính toán scale áo theo Size
    const getClothingScale = () => {
        switch (selectedSize) {
            case 'S': return 3.8;
            case 'M': return 4.0;
            case 'L': return 4.3;
            case 'XL': return 4.6;
            default: return 4.0;
        }
    };

    // Hàm tính toán BMI và tự động tạo dáng người
    const calculateBody = () => {
        // Validation
        if (realHeight < 140 || realHeight > 200) {
            setErrorMsg('Chiều cao phải từ 140cm - 200cm');
            toast.error('Chiều cao không hợp lệ!');
            return;
        }
        if (realWeight < 40 || realWeight > 120) {
            setErrorMsg('Cân nặng phải từ 40kg - 120kg');
            toast.error('Cân nặng không hợp lệ!');
            return;
        }
        setErrorMsg('');

        // 1. Tính chiều cao model
        const newScale = 1 + (realHeight - 170) * 0.005;
        setScaleY(newScale);

        // 2. Tính BMI
        const h_meter = realHeight / 100;
        const bmi = realWeight / (h_meter * h_meter);

        // 3. Quy đổi BMI sang độ béo (0-1)
        let estimatedFat = (bmi - 18.5) / (30 - 18.5);
        estimatedFat = Math.max(0, Math.min(1, estimatedFat));
        setFat(estimatedFat);

        // 4. Ước lượng các vòng dựa trên độ béo (Logic thực tế hơn)
        // Eo tăng nhanh hơn ngực/mông khi béo lên
        let waistAdjust = estimatedFat * 0.9;
        if (waistAdjust < 0.2) waistAdjust = 0.1; // Gầy thì eo rất nhỏ

        let chestAdjust = estimatedFat * 0.6;
        let hipsAdjust = estimatedFat * 0.7;

        setWaist(Math.min(1, waistAdjust));
        setChest(Math.min(1, chestAdjust));
        setHips(Math.min(1, hipsAdjust));

        // 5. Tính điểm Fit Score (Vui vẻ)
        let score = 100 - Math.abs(bmi - 22) * 4; // BMI 22 là chuẩn 100 điểm
        if (selectedSize === 'S' && bmi > 24) score -= 20; // Béo mà chọn S thì trừ điểm
        if (selectedSize === 'XL' && bmi < 19) score -= 20; // Gầy mà chọn XL thì trừ điểm

        score = Math.max(50, Math.min(100, score));
        setFitScore(Math.round(score));

        toast.success(`Đã cập nhật body! Điểm phù hợp: ${Math.round(score)}/100`);
    };

    // Tự động tính 1 lần khi vào trang
    useEffect(() => {
        calculateBody();
        // Cleanup function (nếu cần)
        return () => { };
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    // Logic Texture & Scale
    const currentTexture = selectedSize ? selectedVariant.img : null;
    const currentScale = getClothingScale();

    // Redirect nếu không có dữ liệu
    if (!productData) {
        return (
            <div style={{ padding: 50, textAlign: 'center' }}>
                <h2>Chưa chọn sản phẩm!</h2>
                <button onClick={() => navigate('/')}>Về trang chủ</button>
            </div>
        );
    }

    // Hàm tải ảnh Canvas
    const handleExport = () => {
        const canvas = document.querySelector('canvas');
        if (canvas) {
            const link = document.createElement('a');
            link.download = `tryon_${productData.id}_${selectedVariant.name}.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();
            toast.success('Đã tải ảnh thử đồ!');
        }
    };

    return (
        <div style={{ width: '100%', height: '100vh', display: 'flex', fontFamily: 'Arial, sans-serif', background: 'linear-gradient(to bottom, #f0f0f0, #d0d0d0)' }}>

            {/* Nút Quay lại */}
            <div style={{ position: 'absolute', top: 20, left: 20, zIndex: 10 }}>
                <button onClick={() => navigate(-1)} style={{ padding: '10px 20px', background: 'white', border: '1px solid #ccc', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold', boxShadow: '0 2px 5px rgba(0,0,0,0.1)' }}>
                    ⬅ Quay lại
                </button>
            </div>

            {/* Thông tin sản phẩm góc phải */}
            <div style={{ position: 'absolute', top: 20, right: 350, zIndex: 10, background: 'white', padding: '10px 20px', borderRadius: '8px', boxShadow: '0 4px 10px rgba(0,0,0,0.1)', display: 'flex', alignItems: 'center', gap: '15px' }}>
                <img src={selectedVariant?.img || productData.img} alt="" style={{ width: '50px', height: '50px', objectFit: 'cover', borderRadius: '4px', border: '1px solid #eee' }} />
                <div>
                    <div style={{ fontSize: '12px', color: '#888' }}>Đang thử:</div>
                    <div style={{ fontWeight: 'bold' }}>{productData.name}</div>
                    <div style={{ color: '#ee4d2d', fontWeight: 'bold', fontSize: '14px' }}>
                        {selectedVariant?.name}
                    </div>
                </div>
            </div>

            {/* --- KHUNG NHÌN 3D --- */}
            <div style={{ flex: 3, position: 'relative', background: '#e0e0e0', boxShadow: 'inset 0 0 20px rgba(0,0,0,0.05)' }}>
                <Canvas
                    shadows
                    camera={{ position: [0, 1.2, 3.5], fov: 45 }}
                    gl={{ preserveDrawingBuffer: true }} // Quan trọng để tải ảnh được
                >
                    <Environment preset="city" />
                    <ambientLight intensity={0.7} />
                    <directionalLight position={[2, 5, 5]} intensity={1.5} castShadow />
                    <group position={[0, -0.9, 0]}>
                        <Grid args={[10, 10]} cellColor="#999" sectionColor="#555" fadeDistance={20} />
                        <ContactShadows resolution={512} scale={10} blur={1} opacity={0.5} far={1} />
                    </group>

                    <Suspense fallback={<Loader />}>
                        <Avatar
                            height={scaleY}
                            weight={fat}
                            chest={chest}
                            waist={waist}
                            hips={hips}
                            clothingTexture={currentTexture}
                            clothingScale={currentScale}
                            pose={pose} // Truyền pose xuống Avatar
                        />
                    </Suspense>
                    <OrbitControls minDistance={1.5} maxDistance={6} target={[0, 0.8, 0]} />
                </Canvas>
            </div>

            {/* --- THANH ĐIỀU KHIỂN --- */}
            <div style={{ flex: 1, padding: '25px', background: '#fff', overflowY: 'auto', borderLeft: '1px solid #ddd', display: 'flex', flexDirection: 'column', gap: '25px', boxShadow: '0 0 10px rgba(0,0,0,0.05)' }}>

                {/* 1. Chọn Màu */}
                <div>
                    <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '10px' }}>Màu sắc có sẵn</h3>
                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                        {variants.map((variant, index) => (
                            <button
                                key={index}
                                onClick={() => setSelectedVariant(variant)}
                                style={{
                                    width: '40px', height: '40px', borderRadius: '50%',
                                    backgroundColor: variant.hex || '#eee',
                                    border: selectedVariant.name === variant.name ? '3px solid #333' : '1px solid #ccc',
                                    cursor: 'pointer', padding: 0,
                                    backgroundImage: variant.hex ? 'none' : `url(${variant.img})`,
                                    backgroundSize: 'cover',
                                    position: 'relative',
                                    transform: selectedVariant.name === variant.name ? 'scale(1.1)' : 'scale(1)',
                                    transition: 'transform 0.2s'
                                }}
                                title={variant.name}
                            />
                        ))}
                    </div>
                    <p style={{ fontSize: '13px', color: '#666', marginTop: '5px' }}>
                        Đang chọn: <strong>{selectedVariant.name}</strong>
                    </p>
                </div>

                {/* 2. Chọn Size */}
                <div>
                    <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '10px' }}>Chọn Kích thước (Size)</h3>
                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                        {['S', 'M', 'L', 'XL'].map(size => (
                            <button
                                key={size}
                                onClick={() => setSelectedSize(size)}
                                style={{
                                    padding: '10px 20px',
                                    border: selectedSize === size ? '2px solid #ee4d2d' : '1px solid #ccc',
                                    color: selectedSize === size ? '#ee4d2d' : '#333',
                                    backgroundColor: 'white',
                                    borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold',
                                    minWidth: '60px',
                                    transition: 'transform 0.2s',
                                    transform: selectedSize === size ? 'scale(1.05)' : 'scale(1)'
                                }}
                            >
                                {size}
                            </button>
                        ))}
                    </div>
                    {!selectedSize && <p style={{ color: 'red', fontSize: '12px', marginTop: '5px' }}>* Hãy chọn size để thử đồ</p>}
                </div>

                <hr style={{ border: 'none', borderTop: '1px solid #eee', width: '100%', margin: 0 }} />

                {/* 3. Tùy chỉnh Dáng (Dùng số đo CM) */}
                <div>
                    <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '15px', color: '#ee4d2d' }}>Tuỳ chỉnh dáng người</h3>

                    {/* Nhập Cao/Nặng */}
                    <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
                        <div style={{ flex: 1 }}>
                            <label style={{ fontSize: '12px', fontWeight: 'bold' }}>Cao (cm)</label>
                            <input type="number" value={realHeight} onChange={(e) => setRealHeight(Number(e.target.value))} style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }} />
                        </div>
                        <div style={{ flex: 1 }}>
                            <label style={{ fontSize: '12px', fontWeight: 'bold' }}>Nặng (kg)</label>
                            <input type="number" value={realWeight} onChange={(e) => setRealWeight(Number(e.target.value))} style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }} />
                        </div>
                    </div>
                    <button onClick={calculateBody} style={{ width: '100%', padding: '10px', background: '#ee4d2d', color: 'white', border: 'none', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer', marginBottom: '15px', transition: 'background 0.2s' }}>
                        Áp dụng & Tính BMI
                    </button>
                    {errorMsg && <p style={{ color: 'red', fontSize: '12px', marginBottom: '10px' }}>{errorMsg}</p>}

                    {/* Slider điều chỉnh (Hiển thị CM) */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>

                        {/* Độ mập */}
                        <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <label style={{ fontSize: '13px', fontWeight: 'bold' }}>Độ đầy đặn</label>
                                <span style={{ fontSize: '12px', color: '#666' }}>{Math.round(fat * 100)}%</span>
                            </div>
                            <input type="range" min="0" max="1" step="0.01" value={fat} onChange={(e) => setFat(parseFloat(e.target.value))} style={{ width: '100%' }} />
                        </div>

                        {/* Ngực */}
                        <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <label style={{ fontSize: '13px', fontWeight: 'bold' }}>Vòng 1 (Ngực)</label>
                                <span style={{ fontSize: '13px', color: '#ee4d2d', fontWeight: 'bold' }}>{morphToCm(chest, 'chest')} cm</span>
                            </div>
                            <input type="range" min="0" max="1" step="0.01" value={chest} onChange={(e) => setChest(parseFloat(e.target.value))} style={{ width: '100%' }} />
                        </div>

                        {/* Eo */}
                        <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <label style={{ fontSize: '13px', fontWeight: 'bold' }}>Vòng 2 (Eo)</label>
                                <span style={{ fontSize: '13px', color: '#ee4d2d', fontWeight: 'bold' }}>{morphToCm(waist, 'waist')} cm</span>
                            </div>
                            <input type="range" min="0" max="1" step="0.01" value={waist} onChange={(e) => setWaist(parseFloat(e.target.value))} style={{ width: '100%' }} />
                        </div>

                        {/* Hông */}
                        <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <label style={{ fontSize: '13px', fontWeight: 'bold' }}>Vòng 3 (Hông)</label>
                                <span style={{ fontSize: '13px', color: '#ee4d2d', fontWeight: 'bold' }}>{morphToCm(hips, 'hips')} cm</span>
                            </div>
                            <input type="range" min="0" max="1" step="0.01" value={hips} onChange={(e) => setHips(parseFloat(e.target.value))} style={{ width: '100%' }} />
                        </div>
                    </div>

                    {/* Các nút chức năng cuối */}
                    <button onClick={() => { setRealHeight(170); setRealWeight(60); calculateBody(); }} style={{ width: '100%', padding: '10px', background: '#e0e0e0', color: '#333', border: 'none', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer', marginTop: '15px' }}>
                        Reset mặc định
                    </button>

                    <div style={{ marginTop: '20px', textAlign: 'center' }}>
                        <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: '#28a745' }}>Fit Score: {fitScore}/100</h3>

                        {/* Nút Tải ảnh */}
                        <button onClick={handleExport} style={{ padding: '8px 15px', background: '#17a2b8', color: 'white', border: 'none', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer', marginTop: '10px', marginRight: '10px' }}>
                            📸 Tải Ảnh Về
                        </button>

                        {/* Nút Pose */}
                        <div style={{ display: 'flex', gap: '10px', marginTop: '15px', justifyContent: 'center' }}>
                            <button onClick={() => setPose('idle')} style={{ padding: '8px 15px', background: pose === 'idle' ? '#333' : '#ccc', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Đứng</button>
                            <button onClick={() => setPose('walking')} style={{ padding: '8px 15px', background: pose === 'walking' ? '#333' : '#ccc', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Đi bộ</button>
                        </div>

                        {/* Nút Mua ngay */}
                        <button
                            onClick={() => navigate('/cart', { state: { selectedSize, selectedVariant } })}
                            style={{ width: '100%', padding: '12px', background: '#ffc107', color: '#333', border: 'none', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer', marginTop: '20px', fontSize: '16px' }}
                        >
                            MUA NGAY (Size {selectedSize || '?'})
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default VirtualTryOn;