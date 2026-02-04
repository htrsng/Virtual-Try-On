import { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Canvas, useFrame } from '@react-three/fiber';
import { useGLTF, Environment, OrbitControls, ContactShadows, Grid } from '@react-three/drei';
import * as THREE from 'three';

// Import Component
import VirtualTryOn from './VirtualTryOn';
import { Avatar } from '../../three/controls/avatar/Avatar';

// --- STYLES ---
const styles = {
    container: { position: 'relative' as 'relative', width: '100%', height: '100vh', backgroundColor: '#f0f2f5', overflow: 'hidden' },
    backButton: {
        position: 'absolute' as 'absolute', top: '20px', left: '20px', zIndex: 100,
        backgroundColor: 'white', padding: '10px 20px', borderRadius: '30px',
        border: '1px solid #ddd', cursor: 'pointer', fontWeight: 'bold' as 'bold',
        boxShadow: '0 4px 10px rgba(0,0,0,0.1)', display: 'flex', alignItems: 'center', gap: '5px'
    },
    sidebar: {
        position: 'absolute' as 'absolute', top: 0, right: 0, bottom: 0,
        width: '400px', backgroundColor: 'white', borderLeft: '1px solid #ddd',
        display: 'flex', flexDirection: 'column' as 'column', zIndex: 50,
        boxShadow: '-10px 0 30px rgba(0,0,0,0.05)'
    },
    content: { flex: 1, overflowY: 'auto' as 'auto', padding: '24px' },
    sectionTitle: { fontSize: '13px', fontWeight: 'bold' as 'bold', color: '#666', textTransform: 'uppercase' as 'uppercase', marginBottom: '15px', marginTop: '25px', letterSpacing: '0.5px' },
    colorOption: (color: string, isSelected: boolean) => ({
        width: '36px', height: '36px', borderRadius: '50%', backgroundColor: color,
        border: isSelected ? '2px solid #ee4d2d' : '1px solid #e5e7eb',
        cursor: 'pointer', marginRight: '10px', display: 'inline-block',
        boxShadow: isSelected ? '0 0 0 2px white, 0 0 0 4px #ee4d2d' : 'none',
        position: 'relative' as 'relative', transition: 'all 0.2s'
    }),
    sizeGrid: { display: 'flex', gap: '10px' },
    sizeButton: (isSelected: boolean) => ({
        flex: 1, padding: '12px', textAlign: 'center' as 'center',
        border: isSelected ? '1px solid #ee4d2d' : '1px solid #e5e7eb',
        backgroundColor: isSelected ? '#fff1f0' : 'white',
        color: isSelected ? '#ee4d2d' : '#333',
        fontWeight: isSelected ? 'bold' : 'normal',
        cursor: 'pointer', borderRadius: '8px', transition: 'all 0.2s'
    }),
    inputRow: { display: 'flex', gap: '15px', marginBottom: '20px' },
    inputGroup: { flex: 1 },
    label: { fontSize: '11px', fontWeight: 'bold' as 'bold', color: '#888', marginBottom: '5px', display: 'block', textTransform: 'uppercase' as 'uppercase' },
    numberInput: { width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '6px', fontWeight: 'bold' as 'bold', fontSize: '14px' },
    sliderContainer: { marginBottom: '20px' },
    sliderHeader: { display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '12px', fontWeight: '600', color: '#444' },
    slider: { width: '100%', accentColor: '#ee4d2d', cursor: 'pointer', height: '4px' },
    footer: { padding: '20px', borderTop: '1px solid #eee', display: 'flex', gap: '10px', backgroundColor: 'white' },
    btnCart: { flex: 1, padding: '14px', border: '1px solid #ee4d2d', color: '#ee4d2d', backgroundColor: '#fff5f1', fontWeight: 'bold' as 'bold', borderRadius: '6px', cursor: 'pointer' },
    btnBuy: { flex: 1, padding: '14px', border: 'none', color: 'white', backgroundColor: '#ee4d2d', fontWeight: 'bold' as 'bold', borderRadius: '6px', cursor: 'pointer' }
};

// --- HELPER COMPONENTS ---
const SliderControl = ({ label, value, min, max, step = 1, onChange }: any) => (
    <div style={styles.sliderContainer}>
        <div style={styles.sliderHeader}><span>{label}</span><span>{value} cm</span></div>
        <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} style={styles.slider} />
    </div>
);

const TShirtModel = ({ modelConfig, activeColor, offset, chestSize }: any) => {
    const { nodes } = useGLTF(modelConfig.url) as any;
    const materialRef = useRef<THREE.MeshStandardMaterial>(null);
    const dynamicScale = modelConfig.scale * (1 + (chestSize - 90) / 450);

    useFrame((_state, delta) => {
        if (materialRef.current) {
            const targetColor = new THREE.Color(activeColor);
            materialRef.current.color.lerp(targetColor, delta * 5);
        }
    });

    const nodeName = modelConfig.nodeName || "Ao_Phong";
    const geometry = nodes[nodeName]?.geometry;
    if (!geometry) return null;

    return (
        <mesh
            geometry={geometry}
            scale={[dynamicScale, dynamicScale, dynamicScale]}
            position={[offset.x, offset.y, offset.z]}
            rotation={[0, 0, 0]}
        >
            <meshStandardMaterial ref={materialRef} color={activeColor} roughness={0.6} metalness={0.0} />
        </mesh>
    );
};

// --- MAIN CONTROLLER ---
const VirtualTryOnController = ({ body, setBody, products, onAddToCart, onBuyNow, showToast }: any) => {
    const location = useLocation();
    const navigate = useNavigate();

    const [shirtOffset, setShirtOffset] = useState({ x: 0, y: 0.95, z: 0.03 });

    const passedProduct = location.state?.product;
    const defaultProduct = products?.length > 0 ? (products.find((p: any) => p.model3D?.enable) || products[0]) : null;
    const currentProduct = passedProduct || defaultProduct;

    const [selectedSize, setSelectedSize] = useState<string | null>(null);
    const [selectedColor, setSelectedColor] = useState<string | null>(null);
    const [clothingTexture, setClothingTexture] = useState<string | null>(null);

    const productColors = currentProduct?.variants?.map((v: any) => v.hex) || ['#333333', '#FFFFFF', '#1E90FF'];

    useEffect(() => {
        if (currentProduct) {
            setClothingTexture(currentProduct.img || currentProduct.image);
            setSelectedColor(productColors[0]);
        }
    }, [currentProduct]);

    const handleAction = (isBuyNow: boolean) => {
        if (!selectedSize) return alert('Vui lòng chọn Size!');
        const productToAdd = { ...currentProduct, color: selectedColor, size: selectedSize };
        if (isBuyNow) onBuyNow(productToAdd, selectedSize);
        else { onAddToCart(productToAdd); showToast('Đã thêm vào giỏ!'); }
    };

    if (!currentProduct) return <div>Đang tải dữ liệu...</div>;
    const is3DEnabled = currentProduct.model3D?.enable;

    return (
        <div style={styles.container}>
            <button style={styles.backButton} onClick={() => navigate(-1)}>← Quay lại Shop</button>

            {/* --- 3D VIEW --- */}
            <div style={{ position: 'absolute', top: 0, left: 0, right: '400px', height: '100%', background: is3DEnabled ? '#eef0f2' : '#f5f5f5' }}>
                {is3DEnabled ? (
                    /* 📷 CAMERA: Lùi xa (z=4.0) và hạ điểm nhìn ngang thắt lưng (y=0.2) */
                    <Canvas camera={{ position: [0, 0.2, 4.0], fov: 35 }} shadows>
                        <ambientLight intensity={0.6} />
                        <directionalLight position={[2, 5, 2]} intensity={1.2} castShadow />
                        <Environment preset="city" />

                        {/* 💃 GẮN VÀO SÀN: 
                           - group hạ xuống -1.05 để chân đứng đúng vạch sàn.
                        */}
                        <group position={[0, -1.05, 0]}>
                            <Grid position={[0, 0, 0]} args={[10, 10]} cellColor="#d1d5db" sectionColor="#9ca3af" fadeDistance={20} />

                            <Avatar body={body} clothingTexture={null} skinColor="#F2C9AC" pose="Idle" />

                            {selectedSize && (
                                <TShirtModel
                                    modelConfig={currentProduct.model3D}
                                    activeColor={selectedColor}
                                    offset={shirtOffset}
                                    chestSize={body.chest}
                                />
                            )}
                            <ContactShadows position={[0, 0, 0]} opacity={0.4} blur={2.5} />
                        </group>

                        {/* 🎯 TARGET: Nhìn vào tâm tọa độ để nhân vật cân đối */}
                        <OrbitControls target={[0, 0, 0]} minPolarAngle={Math.PI / 4} maxPolarAngle={Math.PI / 2} minDistance={1.5} maxDistance={6} enablePan={false} />
                    </Canvas>
                ) : (
                    <VirtualTryOn body={body} clothingTexture={clothingTexture} />
                )}

                {/* 🗑️ ĐÃ XOÁ HOÀN TOÀN DÒNG CHỮ HƯỚNG DẪN Ở ĐÂY */}
            </div>

            {/* --- SIDEBAR --- */}
            <div style={styles.sidebar}>
                <div style={styles.content}>
                    <div style={{ display: 'flex', gap: '15px', marginBottom: '20px', paddingBottom: '20px', borderBottom: '1px solid #f0f0f0' }}>
                        <img src={currentProduct.img || currentProduct.image} style={{ width: '60px', height: '80px', objectFit: 'cover', borderRadius: '6px', border: '1px solid #eee' }} alt="" />
                        <div>
                            <div style={{ fontSize: '14px', fontWeight: 'bold' }}>{currentProduct.name}</div>
                            {is3DEnabled && <span style={{ fontSize: '10px', background: 'black', color: 'white', padding: '2px 6px', borderRadius: '4px', marginTop: '5px', display: 'inline-block' }}>3D MODE</span>}
                            <div style={{ color: '#ee4d2d', fontWeight: 'bold', marginTop: '5px' }}>{currentProduct.priceDisplay || currentProduct.price?.toLocaleString() + ' đ'}</div>
                        </div>
                    </div>

                    <div style={styles.sectionTitle}>1. CẤU HÌNH CƠ THỂ</div>
                    <div style={{ background: '#f9f9f9', padding: '15px', borderRadius: '10px', marginBottom: '20px', border: '1px solid #f0f0f0' }}>
                        <div style={styles.inputRow}>
                            <div style={styles.inputGroup}><label style={styles.label}>CAO (CM)</label><input type="number" value={body.height} onChange={(e) => setBody({ ...body, height: Number(e.target.value) })} style={styles.numberInput} /></div>
                            <div style={styles.inputGroup}><label style={styles.label}>NẶNG (KG)</label><input type="number" value={body.weight} onChange={(e) => setBody({ ...body, weight: Number(e.target.value) })} style={styles.numberInput} /></div>
                        </div>
                        <SliderControl label="Ngực" value={body.chest} min={70} max={120} onChange={(v: any) => setBody({ ...body, chest: v })} />
                        <SliderControl label="Eo" value={body.waist} min={55} max={100} onChange={(v: any) => setBody({ ...body, waist: v })} />
                        <SliderControl label="Hông" value={body.hips} min={80} max={120} onChange={(v: any) => setBody({ ...body, hips: v })} />

                        <details style={{ marginTop: '15px', borderTop: '1px dashed #ddd', paddingTop: '10px' }}>
                            <summary style={{ fontSize: '11px', color: '#888', cursor: 'pointer', fontWeight: 'bold' }}>🔻 Chỉnh chi tiết (Vai, Đùi, Bắp tay...)</summary>
                            <div style={{ marginTop: '10px' }}>
                                <SliderControl label="Vai" value={body.shoulder || 40} min={30} max={60} onChange={(v: any) => setBody({ ...body, shoulder: v })} />
                                <SliderControl label="Đùi" value={body.thigh || 55} min={40} max={80} onChange={(v: any) => setBody({ ...body, thigh: v })} />
                                <SliderControl label="Bắp tay" value={body.arm || 28} min={20} max={50} onChange={(v: any) => setBody({ ...body, arm: v })} />
                                <SliderControl label="Vòng bụng" value={body.belly || 70} min={60} max={120} onChange={(v: any) => setBody({ ...body, belly: v })} />
                            </div>
                        </details>
                    </div>

                    <div style={styles.sectionTitle}>2. CHỌN SIZE ĐỂ THỬ</div>
                    <div style={styles.sizeGrid}>
                        {['S', 'M', 'L', 'XL'].map(size => (
                            <button key={size} style={styles.sizeButton(selectedSize === size)} onClick={() => setSelectedSize(size)}>{size}</button>
                        ))}
                    </div>

                    <div style={{ ...styles.sectionTitle, marginTop: '25px' }}>3. CHỌN MÀU SẮC</div>
                    <div style={{ marginBottom: '20px', display: 'flex', flexWrap: 'wrap' }}>
                        {productColors.map((color: string, index: number) => (
                            <div key={index} style={styles.colorOption(color, selectedColor === color)} onClick={() => setSelectedColor(color)} />
                        ))}
                    </div>

                    <details open style={{ marginTop: '30px', padding: '10px', background: '#fff1f0', borderRadius: '8px', border: '1px solid #ffccc7' }}>
                        <summary style={{ fontSize: '11px', fontWeight: 'bold', color: '#cf1322', cursor: 'pointer' }}>🛠 CĂN CHỈNH VỊ TRÍ ÁO (Dành cho Demo)</summary>
                        <div style={{ marginTop: '10px' }}>
                            <SliderControl label="Lên/Xuống (Y)" value={shirtOffset.y} min={-1} max={2} step={0.01} onChange={(v: any) => setShirtOffset({ ...shirtOffset, y: v })} />
                            <SliderControl label="Trước/Sau (Z)" value={shirtOffset.z} min={-0.2} max={0.2} step={0.01} onChange={(v: any) => setShirtOffset({ ...shirtOffset, z: v })} />
                            <SliderControl label="Trái/Phải (X)" value={shirtOffset.x} min={-0.2} max={0.2} step={0.01} onChange={(v: any) => setShirtOffset({ ...shirtOffset, x: v })} />
                        </div>
                    </details>

                    <div style={styles.footer}>
                        <button style={styles.btnCart} onClick={() => handleAction(false)}>🛒 Thêm Giỏ</button>
                        <button style={styles.btnBuy} onClick={() => handleAction(true)}>MUA NGAY</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default VirtualTryOnController;