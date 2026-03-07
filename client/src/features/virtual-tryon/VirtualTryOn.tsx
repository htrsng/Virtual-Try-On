import { Suspense, useState, useRef, useMemo, useEffect, useCallback, type ReactNode } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls, Environment, ContactShadows, Html, useProgress, Grid } from '@react-three/drei';
import { useLocation, useNavigate } from 'react-router-dom';
import { Avatar } from '../../three/controls/avatar/Avatar';
import { useFittingRoom } from '../../contexts/FittingRoomContext';
import { MODEL_INJECTION } from '../../data/ThreeDConfig.js';
import GarmentModel from './GarmentModel';
import CameraPresets from './components/CameraPresets';
import type { CameraView } from './components/CameraPresets';
import SizeRecommendation from './components/SizeRecommendation';
import { ColorSelector } from './components/ProductOptions';
import './VirtualTryOn.css';
import * as THREE from 'three';

/* ─── Accordion ─── */
function Accordion({ title, icon, defaultOpen = false, children }: {
    title: string;
    icon: ReactNode;
    defaultOpen?: boolean;
    children: ReactNode;
}) {
    const [isOpen, setIsOpen] = useState(defaultOpen);
    return (
        <div className={`vto-accordion ${isOpen ? 'open' : ''}`}>
            <button type="button" className="vto-accordion__header" onClick={() => setIsOpen(o => !o)}>
                <span className="vto-accordion__title">
                    <span className="vto-accordion__title-icon">{icon}</span>
                    {title}
                </span>
                <span className="vto-accordion__chevron">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="6 9 12 15 18 9" /></svg>
                </span>
            </button>
            <div className="vto-accordion__body">{children}</div>
        </div>
    );
}

interface EmptyAvatarModalProps {
    isOpen: boolean;
    onCreateAvatar: () => void;
    onSkip: () => void;
}

function EmptyAvatarModal({ isOpen, onCreateAvatar, onSkip }: EmptyAvatarModalProps) {
    if (!isOpen) {
        return null;
    }

    return (
        <div className="vto-empty-avatar-modal__backdrop" role="presentation">
            <div className="vto-empty-avatar-modal" role="dialog" aria-modal="true" aria-labelledby="vto-empty-avatar-title">
                <h3 id="vto-empty-avatar-title">Bạn chưa tạo avatar nào</h3>
                <p>
                    Tạo avatar để thử đồ với số đo thật của bạn. Nếu bỏ qua, hệ thống sẽ sử dụng body mặc định tạm thời.
                </p>
                <div className="vto-empty-avatar-modal__actions">
                    <button type="button" className="vto-btn vto-btn--primary" onClick={onCreateAvatar}>
                        Tạo Avatar
                    </button>
                    <button type="button" className="vto-btn vto-btn--ghost" onClick={onSkip}>
                        Bỏ qua
                    </button>
                </div>
            </div>
        </div>
    );
}

/* ─── Loader ─── */
function Loader() {
    const { progress } = useProgress();
    return (
        <Html center>
            <div className="vto-loader">
                <div className="vto-loader__ring" />
                <p className="vto-loader__text">Đang tải mô hình... {progress.toFixed(0)}%</p>
            </div>
        </Html>
    );
}

/* ─── Camera animator (inside Canvas) ─── */
function CameraAnimator({ targetPosition, targetLookAt }: { targetPosition: [number, number, number]; targetLookAt: [number, number, number] }) {
    const { camera } = useThree();
    const posRef = useRef(new THREE.Vector3(...targetPosition));
    const lookRef = useRef(new THREE.Vector3(...targetLookAt));

    useEffect(() => {
        posRef.current.set(...targetPosition);
        lookRef.current.set(...targetLookAt);
    }, [targetPosition, targetLookAt]);

    useEffect(() => {
        // Smooth lerp via requestAnimationFrame
        let frameId: number;
        const animate = () => {
            camera.position.lerp(posRef.current, 0.08);
            camera.lookAt(lookRef.current);
            if (camera.position.distanceTo(posRef.current) > 0.01) {
                frameId = requestAnimationFrame(animate);
            }
        };
        frameId = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(frameId);
    }, [camera, targetPosition, targetLookAt]);

    return null;
}

/* ─── Types ─── */
type TryOnProduct = {
    id: number | string;
    name: string;
    price: number | string;
    img?: string;
    image?: string;
    category?: string;
    [key: string]: unknown;
};

type ProductWithModel = TryOnProduct & {
    model3D?: {
        enable?: boolean;
        sizes?: Record<string, {
            url: string;
            autoNormalize?: boolean;
            followAvatarBones?: boolean;
            softness?: {
                morphInfluence?: number;
                morphSmoothing?: number;
                maxMorphInfluence?: number;
                roughness?: number;
                metalness?: number;
                envMapIntensity?: number;
            };
        }>;
        colors?: Array<{
            name?: string;
            hex: string;
        }>;
    };
};

interface VirtualTryOnProps {
    product: TryOnProduct;
    outfitItems?: TryOnProduct[];
    onAddToCart: (product: TryOnProduct, size?: string) => void;
    onBuyNow: (product: TryOnProduct, size?: string) => void;
    handleBack: () => void;
    showToast: (message: string, type?: string) => void;
}

/* ─── Category layer helpers ─── */
const CATEGORY_LAYER_ORDER: Record<string, number> = {
    bottom: 0,
    dress: 1,
    top: 2,
    outerwear: 3,
    accessory: 4,
};

const SIZE_ORDER = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL'];

const normalizeSizeKey = (value: string) => value.trim().toUpperCase();

const sortSizeKeys = (sizes: string[]) =>
    [...sizes]
        .map(normalizeSizeKey)
        .filter(Boolean)
        .sort((a, b) => {
            const ai = SIZE_ORDER.indexOf(a);
            const bi = SIZE_ORDER.indexOf(b);
            if (ai === -1 && bi === -1) return a.localeCompare(b);
            if (ai === -1) return 1;
            if (bi === -1) return -1;
            return ai - bi;
        });

const getCategoryOrder = (cat?: string): number => {
    if (!cat) return 2; // default to "top" layer
    const key = cat.toLowerCase().trim();
    for (const [k, v] of Object.entries(CATEGORY_LAYER_ORDER)) {
        if (key.includes(k)) return v;
    }
    return 2;
};

const resolveModel3D = (item: TryOnProduct) => {
    const modelMap = MODEL_INJECTION as Record<string, ProductWithModel['model3D']>;
    const directModel = (item as ProductWithModel)?.model3D;
    if (directModel) return directModel;

    const rawId = item?.id;
    const strId = String(rawId ?? '').trim();
    const numId = Number(rawId);

    if (strId && modelMap[strId]) return modelMap[strId];
    if (Number.isFinite(numId) && modelMap[String(numId)]) return modelMap[String(numId)];
    return undefined;
};

/* ─── Main Component ─── */
export default function VirtualTryOn({ product, outfitItems, onAddToCart, onBuyNow, handleBack, showToast }: VirtualTryOnProps) {
    const location = useLocation();
    const navigate = useNavigate();

    const {
        avatars,
        currentAvatar,
        currentAvatarId,
        setCurrentAvatarId,
        selectedSize,
        setSelectedSize,
        isHeatmapOpen,
        toggleHeatmap,
    } = useFittingRoom();

    /* ---- Normalise items array ---------------------------------- */
    const items: TryOnProduct[] = useMemo(() => {
        if (outfitItems && outfitItems.length > 0) return outfitItems;
        return product ? [product] : [];
    }, [outfitItems, product]);

    const isMultiProduct = items.length > 1;

    // Active item index for sidebar editing (size / color)
    const [activeItemIdx, setActiveItemIdx] = useState(0);
    const activeItem = items[activeItemIdx] || items[0] || product;

    // Per-item size & color state
    const [itemSizes, setItemSizes] = useState<Record<string, string>>({});
    const [itemColors, setItemColors] = useState<Record<string, string>>({});

    // Initialise per-item defaults
    useEffect(() => {
        const sizes: Record<string, string> = {};
        const colors: Record<string, string> = {};
        items.forEach(it => {
            const key = String(it.id);
            const m3d = resolveModel3D(it);
            const configuredSizes = m3d?.sizes ? sortSizeKeys(Object.keys(m3d.sizes)) : [];
            if (!sizes[key]) sizes[key] = configuredSizes.includes('M') ? 'M' : (configuredSizes[0] || 'M');
            const firstColor = m3d?.colors?.[0]?.hex || '#f5f5f5';
            if (!colors[key]) colors[key] = firstColor;
        });
        setItemSizes(sizes);
        setItemColors(colors);
    }, [items]);

    // Sort items by category layer order for rendering
    const sortedItems = useMemo(() =>
        [...items].sort((a, b) => getCategoryOrder(a.category) - getCategoryOrder(b.category)),
        [items],
    );

    // Resolve models for all items
    const itemModels = useMemo(() =>
        sortedItems.map(it => ({
            item: it,
            model3D: resolveModel3D(it),
            key: String(it.id),
        })),
        [sortedItems],
    );

    // UI state
    const [isRotating, setIsRotating] = useState(false);
    const [hasSkippedAvatarSetup, setHasSkippedAvatarSetup] = useState(false);
    const [showEmptyAvatarModal, setShowEmptyAvatarModal] = useState(false);
    const [avatarScene, setAvatarScene] = useState<THREE.Group | null>(null);
    const [cameraView, setCameraView] = useState('front');
    const [cameraPos, setCameraPos] = useState<[number, number, number]>([0, 0.7, 4.5]);
    const [cameraTarget, setCameraTarget] = useState<[number, number, number]>([0, 0.4, 0]);
    const [savedOutfits, setSavedOutfits] = useState<Array<{ id: number; size: string; color: string; date: string }>>([]);
    const [isWishlisted, setIsWishlisted] = useState(false);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    // Resolve active item's model for sidebar controls
    const activeModel3D = useMemo(() => resolveModel3D(activeItem), [activeItem]);

    const currentBodyData = currentAvatar;

    const colorOptions = useMemo(() => {
        const colors = activeModel3D?.colors;
        if (!colors || colors.length === 0) {
            return [
                { name: 'Trắng', hex: '#f5f5f5' },
                { name: 'Đen', hex: '#222222' },
                { name: 'Xanh Navy', hex: '#1f2a44' },
                { name: 'Be', hex: '#d4c3a3' }
            ];
        }
        return colors;
    }, [activeModel3D]);

    const availableSizes = useMemo(() => {
        const fromConfig = activeModel3D?.sizes ? sortSizeKeys(Object.keys(activeModel3D.sizes)) : [];
        if (fromConfig.length > 0) {
            return fromConfig;
        }
        return ['S', 'M', 'L'];
    }, [activeModel3D]);

    useEffect(() => {
        const key = String(activeItem.id);
        const next = itemSizes[key] || (availableSizes.includes('M') ? 'M' : availableSizes[0]) || 'M';
        if (selectedSize !== next) {
            setSelectedSize(next);
        }
    }, [activeItem, availableSizes, itemSizes, selectedSize, setSelectedSize]);

    useEffect(() => {
        if (avatars.length === 0) {
            setShowEmptyAvatarModal(!hasSkippedAvatarSetup);
            return;
        }

        setShowEmptyAvatarModal(false);
        if (hasSkippedAvatarSetup) {
            setHasSkippedAvatarSetup(false);
        }
    }, [avatars.length, hasSkippedAvatarSetup]);

    // Handlers
    const handleCameraView = useCallback((view: CameraView) => {
        setCameraView(view.id);
        setCameraPos(view.position);
        setCameraTarget(view.target);
        if (isRotating) setIsRotating(false);
    }, [isRotating]);

    const handleOpenAvatarStudio = useCallback(() => {
        navigate('/avatar-studio', {
            state: {
                returnTo: '/try-on',
                returnState: location.state || null,
            },
        });
    }, [navigate, location.state]);

    const handleSkipAvatarSetup = useCallback(() => {
        setHasSkippedAvatarSetup(true);
        setShowEmptyAvatarModal(false);
    }, []);

    const handleItemSizeChange = useCallback((size: string) => {
        const key = String(activeItem.id);
        setItemSizes(prev => ({ ...prev, [key]: size }));
        setSelectedSize(size);
    }, [activeItem, setSelectedSize]);

    const handleItemColorChange = useCallback((color: string) => {
        const key = String(activeItem.id);
        setItemColors(prev => ({ ...prev, [key]: color }));
    }, [activeItem]);

    // Screenshot handler
    const handleScreenshot = useCallback(() => {
        const canvas = document.querySelector('.vto-canvas-area canvas') as HTMLCanvasElement;
        if (!canvas) { showToast('Không thể chụp ảnh', 'error'); return; }
        try {
            const dataUrl = canvas.toDataURL('image/png');
            const link = document.createElement('a');
            link.download = `outfit-${isMultiProduct ? 'mix' : activeItem.name}-${Date.now()}.png`;
            link.href = dataUrl;
            link.click();
            showToast('Đã lưu ảnh outfit!');
        } catch {
            showToast('Không thể chụp — thử lại', 'error');
        }
    }, [activeItem, isMultiProduct, showToast]);

    // Save outfit handler
    const handleSaveOutfit = useCallback(() => {
        const outfit = {
            id: Date.now(),
            size: selectedSize || 'M',
            color: itemColors[String(activeItem.id)] || '#f5f5f5',
            date: new Date().toLocaleDateString('vi-VN'),
        };
        setSavedOutfits(prev => [outfit, ...prev].slice(0, 10));
        const label = isMultiProduct
            ? `outfit ${items.length} sản phẩm`
            : `${activeItem.name} — ${outfit.size}`;
        showToast(`Đã lưu outfit: ${label}`);
    }, [activeItem, items, isMultiProduct, selectedSize, itemColors, showToast]);

    return (
        <div className="vto-container">
            {/* ─── Top Navigation ─── */}
            <header className="vto-nav">
                <button className="vto-nav__back" onClick={handleBack}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="15 18 9 12 15 6" /></svg>
                    <span>Quay lại</span>
                </button>
                <div className="vto-nav__avatar-picker">
                    <span className="vto-nav__avatar-label">Avatar</span>
                    <select
                        className="vto-nav__avatar-select"
                        value={currentAvatarId || ''}
                        onChange={(event) => setCurrentAvatarId(event.target.value)}
                        disabled={avatars.length === 0}
                    >
                        {avatars.length === 0 && (
                            <option value="">Khách mặc định</option>
                        )}
                        {avatars.map((avatar) => (
                            <option key={avatar.id} value={avatar.id}>
                                {avatar.name}
                            </option>
                        ))}
                    </select>
                    <button
                        type="button"
                        className="vto-nav__avatar-add"
                        onClick={handleOpenAvatarStudio}
                        aria-label="Mở Avatar Studio"
                    >
                        +
                    </button>
                </div>
                {isMultiProduct && (
                    <span className="vto-nav__outfit-badge">
                        👗 Outfit {items.length} sản phẩm
                    </span>
                )}
                <div className="vto-nav__spacer" />
            </header>

            {/* ─── Single-item hint ─── */}
            {items.length === 1 && (
                <div className="vto-hint-banner">
                    <span className="vto-hint-banner__icon">💡</span>
                    <span className="vto-hint-banner__text">
                        Thêm 1 sản phẩm để phối outfit — quay lại giỏ hàng và chọn thêm!
                    </span>
                    <button className="vto-hint-banner__btn" onClick={handleBack}>
                        ← Quay lại giỏ
                    </button>
                </div>
            )}

            {/* ─── Workspace ─── */}
            <div className="vto-workspace">
                {/* 3D Preview – renders ALL garments layered by category */}
                <div className="vto-canvas-area">
                    <Canvas
                        ref={canvasRef}
                        dpr={[1, 1.5]}
                        camera={{ position: [0, 0.7, 4.5], fov: 32 }}
                        shadows
                        gl={{ antialias: true, preserveDrawingBuffer: true, powerPreference: 'high-performance' }}
                    >


                        {/* Base fill light */}
                        <ambientLight intensity={0.4} />

                        {/* Key light with shadow map */}
                        <directionalLight
                            position={[3, 6, 4]}
                            intensity={1.4}
                            castShadow
                            shadow-mapSize-width={1024}
                            shadow-mapSize-height={1024}
                            shadow-camera-near={0.5}
                            shadow-camera-far={20}
                            shadow-camera-left={-3}
                            shadow-camera-right={3}
                            shadow-camera-top={4}
                            shadow-camera-bottom={-2}
                            shadow-bias={-0.0005}
                        />

                        {/* Subtle fill light from the opposite side */}
                        <directionalLight position={[-2, 3, -2]} intensity={0.3} />

                        <Environment preset="city" />

                        <CameraAnimator targetPosition={cameraPos} targetLookAt={cameraTarget} />

                        <Suspense fallback={<Loader />}>
                            <group position={[0, -1.15, 0]}>
                                <Grid position={[0, 0, 0]} args={[10, 10]} cellColor="#d1d5db" sectionColor="#9ca3af" fadeDistance={20} />
                                <Avatar body={currentBodyData} pose={'Idle'} skinColor="#F2C9AC" onSceneReady={setAvatarScene} />

                                {/* Render each garment – sorted by category layer order */}
                                {itemModels.map(({ model3D, key }) => (
                                    <GarmentModel
                                        key={key}
                                        config={model3D}
                                        selectedSize={itemSizes[key] || 'M'}
                                        selectedColor={itemColors[key] || '#f5f5f5'}
                                        avatarScene={avatarScene}
                                    />
                                ))}

                                <ContactShadows position={[0, 0.01, 0]} opacity={0.3} blur={1.5} resolution={512} frames={1} />
                            </group>
                        </Suspense>

                        <OrbitControls
                            target={cameraTarget}
                            autoRotate={isRotating}
                            autoRotateSpeed={2}
                            enablePan={false}
                            enableDamping
                            dampingFactor={0.08}
                            minDistance={2.5}
                            maxDistance={5.5}
                        />
                    </Canvas>

                    {/* Camera controls overlay */}
                    <div className="vto-canvas-overlay vto-canvas-overlay--bottom-left">
                        <CameraPresets
                            activeView={cameraView}
                            isRotating={isRotating}
                            onSelectView={handleCameraView}
                            onToggleRotate={() => setIsRotating(r => !r)}
                        />
                    </div>

                    {/* Heatmap toggle switch */}
                    <div className="vto-canvas-overlay vto-canvas-overlay--top-right">
                        <div className={`vto-heatmap-toggle ${isHeatmapOpen ? 'active' : ''}`}>
                            <button
                                type="button"
                                className={`vto-heatmap-toggle__option ${!isHeatmapOpen ? 'selected' : ''}`}
                                onClick={() => isHeatmapOpen && toggleHeatmap()}
                            >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10" /><path d="M2 12h20" /></svg>
                                Normal
                            </button>
                            <button
                                type="button"
                                className={`vto-heatmap-toggle__option ${isHeatmapOpen ? 'selected' : ''}`}
                                onClick={() => !isHeatmapOpen && toggleHeatmap()}
                            >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" /><path d="M12 6v6l4 2" /></svg>
                                Heatmap
                            </button>
                            <span className="vto-heatmap-toggle__slider" />
                        </div>
                    </div>

                    {/* Heatmap legend */}
                    <div className={`vto-heatmap-legend ${isHeatmapOpen ? 'visible' : ''}`}>
                        <span className="vto-heatmap-legend__title">Fit Analysis</span>
                        <div className="vto-heatmap-legend__items">
                            <div className="vto-heatmap-legend__item">
                                <span className="vto-heatmap-legend__dot vto-heatmap-legend__dot--good" />
                                <span>Vừa vặn</span>
                            </div>
                            <div className="vto-heatmap-legend__item">
                                <span className="vto-heatmap-legend__dot vto-heatmap-legend__dot--loose" />
                                <span>Rộng</span>
                            </div>
                            <div className="vto-heatmap-legend__item">
                                <span className="vto-heatmap-legend__dot vto-heatmap-legend__dot--tight" />
                                <span>Chật</span>
                            </div>
                        </div>
                    </div>

                    {/* Active heatmap border glow */}
                    <div className={`vto-heatmap-glow ${isHeatmapOpen ? 'active' : ''}`} />
                </div>

                {/* ─── Sidebar ─── */}
                <aside className="vto-sidebar">
                    <div className="vto-sidebar__scroll">
                        {/* Multi-item list (outfit mode) */}
                        {isMultiProduct && (
                            <div className="vto-sidebar-card">
                                <label className="vto-section-label">Sản phẩm trong outfit</label>
                                <div className="vto-outfit-items__list">
                                    {items.map((it, idx) => (
                                        <button
                                            key={String(it.id)}
                                            className={`vto-outfit-item ${idx === activeItemIdx ? 'active' : ''}`}
                                            onClick={() => setActiveItemIdx(idx)}
                                        >
                                            <img
                                                className="vto-outfit-item__img"
                                                src={it.img || it.image || ''}
                                                alt={it.name}
                                            />
                                            <div className="vto-outfit-item__info">
                                                <span className="vto-outfit-item__name">{it.name}</span>
                                                {it.category && (
                                                    <span className="vto-outfit-item__cat">{it.category}</span>
                                                )}
                                            </div>
                                            {resolveModel3D(it)?.enable && (
                                                <span className="vto-outfit-item__3d">3D</span>
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Active product info */}
                        <div className="vto-product-card">
                            <div className="vto-product-card__image">
                                <img src={activeItem.img || activeItem.image} alt={activeItem.name} />
                            </div>
                            <div className="vto-product-card__info">
                                <span className="vto-badge">
                                    {isMultiProduct ? `Sản phẩm ${activeItemIdx + 1}/${items.length}` : 'Phòng thử đồ'}
                                </span>
                                <h2 className="vto-product-card__name">{activeItem.name}</h2>
                                <p className="vto-product-card__price">{Number(activeItem.price)?.toLocaleString()} đ</p>
                            </div>
                        </div>

                        {/* Color — Accordion */}
                        <Accordion
                            title="Màu sắc"
                            icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10" /><path d="M12 2a7 7 0 0 0 0 14 1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1h1a5 5 0 0 0 5-5C20 4.58 16.42 2 12 2z" /></svg>}
                            defaultOpen={true}
                        >
                            <ColorSelector
                                colors={colorOptions}
                                selectedColor={itemColors[String(activeItem.id)] || '#f5f5f5'}
                                onSelectColor={handleItemColorChange}
                            />
                        </Accordion>

                        {/* Size Recommendation — Accordion */}
                        <Accordion
                            title="Kích cỡ & AI gợi ý"
                            icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" /></svg>}
                            defaultOpen={true}
                        >
                            <SizeRecommendation
                                profile={currentBodyData}
                                availableSizes={availableSizes}
                                selectedSize={itemSizes[String(activeItem.id)] || selectedSize}
                                onSelectSize={handleItemSizeChange}
                            />
                        </Accordion>

                        {/* Quick actions — Accordion */}
                        <Accordion
                            title="Công cụ nhanh"
                            icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /></svg>}
                        >
                            <div className="vto-actions">
                                <button className="vto-action-btn" onClick={handleScreenshot}>
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" /><circle cx="12" cy="13" r="4" /></svg>
                                    <span>Chụp ảnh</span>
                                </button>
                                <button className="vto-action-btn" onClick={handleSaveOutfit}>
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" /></svg>
                                    <span>Lưu outfit</span>
                                </button>
                                <button className={`vto-action-btn ${isHeatmapOpen ? 'active' : ''}`} onClick={toggleHeatmap}>
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" /><path d="M12 6v6l4 2" /></svg>
                                    <span>{isHeatmapOpen ? 'Tắt Heatmap' : 'Bật Heatmap'}</span>
                                </button>
                            </div>
                        </Accordion>

                        {/* Saved outfits */}
                        {savedOutfits.length > 0 && (
                            <div className="vto-sidebar-card">
                                <label className="vto-section-label">Outfit đã lưu</label>
                                <div className="vto-saved-outfits__list">
                                    {savedOutfits.map(o => (
                                        <div key={o.id} className="vto-saved-outfit">
                                            <span className="vto-saved-outfit__color" style={{ backgroundColor: o.color }} />
                                            <span className="vto-saved-outfit__info">Size {o.size}</span>
                                            <span className="vto-saved-outfit__date">{o.date}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Footer CTA */}
                    <div className="vto-cta">
                        <button
                            className="vto-cta__btn vto-cta__btn--outline"
                            onClick={() => onAddToCart(activeItem, itemSizes[String(activeItem.id)] || selectedSize || undefined)}
                        >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" /><path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6" /></svg>
                            <span>Giỏ hàng</span>
                        </button>
                        <button
                            className="vto-cta__btn vto-cta__btn--primary"
                            onClick={() => onBuyNow(activeItem, itemSizes[String(activeItem.id)] || selectedSize || undefined)}
                        >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M20 12v6a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-6" /><polyline points="12 3 12 15" /><polyline points="8 11 12 15 16 11" /></svg>
                            <span>Mua ngay</span>
                        </button>
                        <button
                            className={`vto-cta__btn vto-cta__btn--wishlist ${isWishlisted ? 'liked' : ''}`}
                            onClick={() => { setIsWishlisted(w => !w); showToast(isWishlisted ? 'Đã bỏ yêu thích' : 'Đã thêm vào yêu thích ❤️'); }}
                            aria-label="Yêu thích"
                        >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill={isWishlisted ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" /></svg>
                        </button>
                    </div>
                </aside>
            </div>

            <EmptyAvatarModal
                isOpen={showEmptyAvatarModal}
                onCreateAvatar={handleOpenAvatarStudio}
                onSkip={handleSkipAvatarSetup}
            />
        </div>
    );
}