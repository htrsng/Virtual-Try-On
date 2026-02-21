import { Suspense, useState, useRef, useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment, ContactShadows, Html, useProgress, Grid } from '@react-three/drei';
import { Avatar } from '../../three/controls/avatar/Avatar';
import { useFittingRoom } from '../../contexts/FittingRoomContext';
import type { Profile } from '../../contexts/FittingRoomContext';
import './VirtualTryOn.css';

function Loader() {
    const { progress } = useProgress();
    return (
        <Html center>
            <div className="loader-studio">
                <div className="spinner"></div>
                <div className="text">Đang cân bằng tỷ lệ cơ thể... {progress.toFixed(0)}%</div>
            </div>
        </Html>
    );
}

interface SidebarSliderProps {
    label: string;
    value: number;
    min: number;
    max: number;
    onChange: (value: number) => void;
}

type TryOnProduct = {
    id: number | string;
    name: string;
    price: number | string;
    img?: string;
    image?: string;
    [key: string]: unknown;
};

interface VirtualTryOnProps {
    product: TryOnProduct;
    onAddToCart: (product: TryOnProduct, size?: string) => void;
    onBuyNow: (product: TryOnProduct, size?: string) => void;
    handleBack: () => void;
    showToast: (message: string, type?: string) => void;
}

const SidebarSlider = ({ label, value, min, max, onChange }: SidebarSliderProps) => (
    <div className="custom-slider-block">
        <div className="slider-text"><span>{label}</span><b>{value}cm</b></div>
        <input
            type="range" min={min} max={max} value={value}
            onChange={(e) => onChange(Number(e.target.value))}
            className="modern-range"
        />
    </div>
);

const toEditableProfile = (profile: Profile): Profile => ({
    ...profile,
    legLength: profile.legLength || Math.round(profile.height * 0.58)
});

export default function VirtualTryOn({ product, onAddToCart, onBuyNow, handleBack, showToast }: VirtualTryOnProps) {
    const {
        profiles, activeProfile, activeProfileId, setActiveProfileId,
        selectedSize, setSelectedSize, isHeatmapOpen, toggleHeatmap, updateProfile
    } = useFittingRoom();

    const [isRotating, setIsRotating] = useState(false);
    const [isBodyRoomOpen, setIsBodyRoomOpen] = useState(false);
    const [tempProfile, setTempProfile] = useState<Profile | null>(() => (activeProfile ? toEditableProfile(activeProfile) : null));
    const canvasRef = useRef<HTMLCanvasElement>(null);

    const editableProfile = tempProfile || (activeProfile ? toEditableProfile(activeProfile) : null);

    // CHỐT DỮ LIỆU: Luôn ưu tiên tempProfile khi đang ở chế độ chỉnh sửa
    const currentBodyData = useMemo(() => {
        return isBodyRoomOpen ? editableProfile : activeProfile;
    }, [isBodyRoomOpen, editableProfile, activeProfile]);

    if (!activeProfile || !editableProfile || !currentBodyData) return null;

    const handleSaveAndExit = () => {
        updateProfile(activeProfileId, editableProfile);
        setIsBodyRoomOpen(false);
        showToast("Đã lưu cấu trúc xương mới!");
    };

    return (
        <div className={`studio-master-container ${isBodyRoomOpen ? 'body-room-active' : 'tryon-room-active'}`}>
            <div className="studio-top-nav">
                <button className="nav-back-btn" onClick={handleBack}>⬅ Shop</button>
                <div className="profile-switcher">
                    {profiles.map(p => (
                        <button key={p.id} className={`profile-pill ${activeProfileId === p.id ? 'active' : ''}`}
                            onClick={() => {
                                setActiveProfileId(p.id);
                                setTempProfile(toEditableProfile(p));
                                setIsBodyRoomOpen(false);
                            }}>
                            👤 {p.name}
                        </button>
                    ))}
                    <button
                        className="nav-add-btn"
                        onClick={() => {
                            if (activeProfile) {
                                setTempProfile(toEditableProfile(activeProfile));
                            }
                            setIsBodyRoomOpen(true);
                        }}
                    >
                        +
                    </button>
                </div>
            </div>

            <div className="studio-workspace">
                <div className="studio-preview-area">
                    {/* TRỌNG YẾU: Không dùng 'key' ngẫu nhiên ở Canvas để tránh Context Lost */}
                    <Canvas
                        ref={canvasRef}
                        dpr={[1, 1.5]}
                        camera={{ position: [0, 0.7, 4.5], fov: 32 }}
                        shadows={false}
                        gl={{ antialias: true, preserveDrawingBuffer: false, powerPreference: 'high-performance' }}
                    >
                        <ambientLight intensity={0.6} />
                        <directionalLight position={[2, 5, 2]} intensity={1.2} />
                        <Environment preset="city" />

                        <Suspense fallback={<Loader />}>
                            {/* Khóa gót chân tại y=0 trên sàn lưới */}
                            <group position={[0, -1.15, 0]}>
                                <Grid position={[0, 0, 0]} args={[10, 10]} cellColor="#d1d5db" sectionColor="#9ca3af" fadeDistance={20} />
                                <Avatar body={currentBodyData} pose={'Idle'} skinColor="#F2C9AC" />
                                <ContactShadows position={[0, 0.01, 0]} opacity={0.3} blur={1.5} resolution={512} frames={1} />
                            </group>
                        </Suspense>

                        <OrbitControls
                            target={[0, 0.4, 0]}
                            autoRotate={isRotating}
                            enablePan={false}
                            enableDamping={true}
                            minDistance={2.5} maxDistance={5.5}
                        />
                    </Canvas>
                    <div className="view-tools">
                        <button className={`tool-btn ${isRotating ? 'active' : ''}`} onClick={() => setIsRotating(!isRotating)}>
                            {isRotating ? '⏸ Dừng xoay' : '▶ Tự động xoay'}
                        </button>
                    </div>
                </div>

                <div className="studio-sidebar">
                    {isBodyRoomOpen ? (
                        <div className="body-room-panel fade-in">
                            <div className="panel-header-sticky">
                                <span className="badge yellow">CÂN BẰNG TỶ LỆ XƯƠNG</span>
                                <h3>Hồ sơ: {editableProfile.name}</h3>
                                <button className="save-exit-btn" onClick={handleSaveAndExit}>Xác nhận ✓</button>
                            </div>
                            <div className="scrollable-body-controls">
                                <div className="stat-card">
                                    <label className="stat-title">📐 KÍCH THƯỚC TỔNG</label>
                                    <div className="stat-row">
                                        <div className="stat-col"><label>CAO (CM)</label><input type="number" value={editableProfile.height} onChange={(e) => setTempProfile({ ...editableProfile, height: Number(e.target.value) })} /></div>
                                        <div className="stat-col"><label>NẶNG (KG)</label><input type="number" value={editableProfile.weight} onChange={(e) => setTempProfile({ ...editableProfile, weight: Number(e.target.value) })} /></div>
                                    </div>
                                </div>

                                <div className="stat-card highlighted-box">
                                    <label className="stat-title">🦵 ĐIỀU CHỈNH XƯƠNG (BONES)</label>
                                    <SidebarSlider
                                        label="Chiều dài chân"
                                        value={editableProfile.legLength}
                                        min={Math.round(editableProfile.height * 0.45)}
                                        max={Math.round(editableProfile.height * 0.65)}
                                        onChange={(v: number) => setTempProfile({ ...editableProfile, legLength: v })}
                                    />
                                    <div className="proportion-hint">
                                        <span>Tỷ lệ chân: {((editableProfile.legLength / editableProfile.height) * 100).toFixed(1)}%</span>
                                    </div>
                                </div>

                                <div className="stat-card">
                                    <label className="stat-title">📏 CHI TIẾT HÌNH THỂ (SHAPE KEYS)</label>
                                    <SidebarSlider label="Vòng Ngực" value={editableProfile.chest} min={70} max={120} onChange={(v: number) => setTempProfile({ ...editableProfile, chest: v })} />
                                    <SidebarSlider label="Vòng Eo" value={editableProfile.waist} min={55} max={100} onChange={(v: number) => setTempProfile({ ...editableProfile, waist: v })} />
                                    <SidebarSlider label="Vòng Hông" value={editableProfile.hips} min={80} max={120} onChange={(v: number) => setTempProfile({ ...editableProfile, hips: v })} />
                                    <SidebarSlider label="Chiều rộng Vai" value={editableProfile.shoulder} min={30} max={50} onChange={(v: number) => setTempProfile({ ...editableProfile, shoulder: v })} />
                                    <SidebarSlider label="Vòng Bắp tay" value={editableProfile.arm} min={20} max={40} onChange={(v: number) => setTempProfile({ ...editableProfile, arm: v })} />
                                    <SidebarSlider label="Vòng Đùi" value={editableProfile.thigh} min={40} max={80} onChange={(v: number) => setTempProfile({ ...editableProfile, thigh: v })} />
                                    <SidebarSlider label="Vòng Bụng" value={editableProfile.belly} min={60} max={120} onChange={(v: number) => setTempProfile({ ...editableProfile, belly: v })} />
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="tryon-panel fade-in">
                            <div className="panel-header">
                                <span className="badge">PHÒNG THỬ ĐỒ</span>
                                <h3>{product.name}</h3>
                            </div>
                            <div className="panel-body">
                                <div className="product-preview-card">
                                    <img src={product.img || product.image} alt="" />
                                    <div className="price-tag">{product.price?.toLocaleString()} đ</div>
                                </div>
                                <div className="option-section">
                                    <label>KÍCH CỠ HIỆN TẠI</label>
                                    <div className="full-width-size-grid">
                                        {['S', 'M', 'L', 'XL'].map(s => (
                                            <button key={s} className={selectedSize === s ? 'selected' : ''} onClick={() => setSelectedSize(s)}>{s}</button>
                                        ))}
                                    </div>
                                </div>
                                <div className="utility-buttons">
                                    <button className="util-btn-white" onClick={() => alert("Tính năng so sánh size đang phát triển")}>⚖️ So sánh Size</button>
                                    <button className={`util-btn-white ${isHeatmapOpen ? 'active' : ''}`} onClick={toggleHeatmap}>🔥 Xem Heatmap</button>
                                    <button
                                        className="util-btn-dark"
                                        onClick={() => {
                                            if (activeProfile) {
                                                setTempProfile(toEditableProfile(activeProfile));
                                            }
                                            setIsBodyRoomOpen(true);
                                        }}
                                    >
                                        ⚙️ Chỉnh sửa cơ thể
                                    </button>
                                </div>
                            </div>
                            <div className="panel-footer">
                                <button className="add-to-cart-btn" onClick={() => onAddToCart(product)}>🛒 Giỏ hàng</button>
                                <button className="buy-now-btn" onClick={() => onBuyNow(product, selectedSize || undefined)}>MUA NGAY</button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}