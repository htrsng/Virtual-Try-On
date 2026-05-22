import { Suspense, useState, useRef, useMemo, useEffect, useCallback, type ReactNode } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls, Environment, ContactShadows, Html, useProgress, Grid } from '@react-three/drei';
import { useLocation, useNavigate } from 'react-router-dom';
import { Avatar } from '../../three/controls/avatar/Avatar';
import { useFittingRoom, type GarmentSlot, type Profile, type SilentWearItem } from '../../contexts/FittingRoomContext';
import { MODEL_INJECTION } from '../../data/ThreeDConfig.js';
import GarmentModel from './GarmentModel';
import CameraPresets from './components/CameraPresets';
import type { CameraView } from './components/CameraPresets';
import SizeRecommendation, { recommendSizes } from './components/SizeRecommendation';
import { ColorSelector } from './components/ProductOptions';
import VirtualPersonalClosetDrawer, { type ClosetItem } from './components/VirtualPersonalClosetDrawer';
import OutfitPanel from './components/OutfitPanel';
import AIOutfitChat from '../../components/AIOutfitChat';
import './VirtualTryOn.css';
import * as THREE from 'three';

type LocalGarmentSizeSpec = {
    chest?: number;
    waist?: number;
    hips?: number;
    shoulder?: number;
    thigh?: number;
    legOpening?: number;
    sleeveLength?: number;
    garmentLength?: number;
    stretchWarp?: number;
    stretchWeft?: number;
    fitIntent?: string;
};

type LocalFabricProfile = {
    preset?:
    | 'cotton'
    | 'denim'
    | 'knit'
    | 'linen'
    | 'satin'
    | 'denim-dark'
    | 'denim-washed'
    | 'denim-raw'
    | 'denim-stone-washed'
    | 'denim-black-fade'
    | 'cotton-heavy'
    | 'cotton-soft';
    kind?: 'cotton' | 'denim' | 'knit' | 'linen' | 'satin';
    weaveScale?: number;
    weaveStrength?: number;
    wrinkleScale?: number;
    wrinkleStrength?: number;
    normalScale?: number;
    roughnessBias?: number;
    softness?: number;
    reflectance?: number;
    fuzzStrength?: number;
};

type LocalColorOption = {
    name?: string;
    hex: string;
    fabric?: LocalFabricProfile;
};

type RecommendationResult = ReturnType<typeof recommendSizes>[number];
type RecommendationZone = RecommendationResult['zones'][number];
type RecommendationFitLevel = RecommendationZone['fit'];
const RAW_API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
const API_URL = RAW_API_URL.startsWith(':') ? `http://localhost${RAW_API_URL}` : RAW_API_URL;

/* ─── Accordion ─── */
function Accordion({ title, icon, defaultOpen = false, children, onLayoutChange }: {
    title: string;
    icon: ReactNode;
    defaultOpen?: boolean;
    children: ReactNode;
    onLayoutChange?: () => void;
}) {
    const [isOpen, setIsOpen] = useState(defaultOpen);
    const bodyInnerRef = useRef<HTMLDivElement | null>(null);
    const [contentHeight, setContentHeight] = useState(0);

    useEffect(() => {
        const element = bodyInnerRef.current;
        if (!element) {
            return;
        }

        const updateHeight = () => {
            setContentHeight(element.scrollHeight);
            onLayoutChange?.();
        };

        updateHeight();

        if (typeof ResizeObserver === 'undefined') {
            return;
        }

        const observer = new ResizeObserver(() => {
            updateHeight();
        });

        observer.observe(element);

        return () => {
            observer.disconnect();
        };
    }, [children, onLayoutChange]);

    useEffect(() => {
        onLayoutChange?.();
    }, [isOpen, onLayoutChange]);

    return (
        <div className={`vto-accordion ${isOpen ? 'open' : ''}`}>
            <button
                type="button"
                className="vto-accordion__header"
                onClick={() => setIsOpen((open) => !open)}
                aria-expanded={isOpen}
            >
                <span className="vto-accordion__title">
                    <span className="vto-accordion__title-icon">{icon}</span>
                    {title}
                </span>
                <span className="vto-accordion__chevron">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="6 9 12 15 18 9" /></svg>
                </span>
            </button>
            <div className="vto-accordion__body" style={{ maxHeight: isOpen ? `${contentHeight}px` : '0px' }}>
                <div ref={bodyInnerRef} className="vto-accordion__body-inner">
                    {children}
                </div>
            </div>
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
            fabric?: LocalFabricProfile;
        }>;
        fabric?: LocalFabricProfile;
        colors?: LocalColorOption[];
        measurementProfile?: {
            garmentType?: string;
            sizeSpecs?: Record<string, LocalGarmentSizeSpec>;
        };
    };
};

type SavedOutfit = {
    _id: string;
    name?: string;
    slots?: {
        tops?: { itemId?: string; name?: string; thumbnailUrl?: string };
        bottoms?: { itemId?: string; name?: string; thumbnailUrl?: string };
        outerwear?: { itemId?: string; name?: string; thumbnailUrl?: string };
        dresses?: { itemId?: string; name?: string; thumbnailUrl?: string };
    };
    createdAt?: string;
};

type SizeCompareViewportProps = {
    panelLabel: string;
    productName: string;
    bodyData: Profile;
    modelConfig?: ProductWithModel['model3D'];
    selectedSize: string;
    availableSizes: string[];
    onSelectSize: (size: string) => void;
    selectedColor: string;
    selectedFabric?: LocalFabricProfile;
    fitScore?: number;
    fitZones?: RecommendationZone[];
    heatmapEnabled: boolean;
};

function SizeCompareViewport({
    panelLabel,
    productName,
    bodyData,
    modelConfig,
    selectedSize,
    availableSizes,
    onSelectSize,
    selectedColor,
    selectedFabric,
    fitScore,
    fitZones,
    heatmapEnabled,
}: SizeCompareViewportProps) {
    const [avatarScene, setAvatarScene] = useState<THREE.Group | null>(null);
    const [isSizeSwitching, setIsSizeSwitching] = useState(false);
    const previousSizeRef = useRef(selectedSize);
    const sizeSwitchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const baseQuickSizes = ['S', 'M', 'L'];
    const quickSizeItems = [
        ...baseQuickSizes.map((label) => {
            const matchedSize = availableSizes.find((size) => size.trim().toUpperCase() === label);
            return {
                label,
                value: matchedSize || label,
                disabled: !matchedSize,
            };
        }),
        ...availableSizes
            .filter((size) => {
                const normalized = size.trim().toUpperCase();
                if (COMPARE_HIDDEN_SIZES.has(normalized)) {
                    return false;
                }
                return !baseQuickSizes.includes(normalized);
            })
            .map((size) => ({
                label: size,
                value: size,
                disabled: false,
            })),
    ];

    useEffect(() => {
        if (previousSizeRef.current === selectedSize) {
            return;
        }

        previousSizeRef.current = selectedSize;
        setIsSizeSwitching(true);

        if (sizeSwitchTimerRef.current) {
            clearTimeout(sizeSwitchTimerRef.current);
        }

        sizeSwitchTimerRef.current = setTimeout(() => {
            setIsSizeSwitching(false);
            sizeSwitchTimerRef.current = null;
        }, 250);
    }, [selectedSize]);

    useEffect(() => {
        return () => {
            if (sizeSwitchTimerRef.current) {
                clearTimeout(sizeSwitchTimerRef.current);
            }
        };
    }, []);

    return (
        <section className={`vto-size-room__screen ${isSizeSwitching ? 'is-switching' : ''}`}>
            <header className="vto-size-room__screen-head">
                <div className="vto-size-room__screen-title-wrap">
                    <p className="vto-size-room__screen-label">{panelLabel}</p>
                    <h4 className="vto-size-room__screen-title">{productName}</h4>
                </div>

                <div className="vto-size-room__screen-badges">
                    <span className="vto-size-room__size-badge">{selectedSize}</span>
                    {typeof fitScore === 'number' && (
                        <span className="vto-size-room__score">{fitScore}%</span>
                    )}
                </div>
            </header>

            <div className="vto-size-room__screen-controls">
                <label className="vto-size-room__field">
                    <span>Size</span>
                    <select value={selectedSize} onChange={(event) => onSelectSize(event.target.value)}>
                        {availableSizes.map((size) => (
                            <option key={`${panelLabel}-${size}`} value={size}>{size}</option>
                        ))}
                    </select>
                </label>

                <div className="vto-size-room__quick-switch" role="group" aria-label={`Chuyển size nhanh - ${panelLabel}`}>
                    {quickSizeItems.map((size) => (
                        <button
                            key={`${panelLabel}-quick-${size.label}`}
                            type="button"
                            className={`vto-size-room__quick-size ${size.value === selectedSize ? 'active' : ''}`}
                            onClick={() => onSelectSize(size.value)}
                            disabled={size.disabled}
                        >
                            {size.label}
                        </button>
                    ))}
                </div>
            </div>

            <div className="vto-size-room__canvas-wrap">
                <Canvas className="vto-size-room__canvas" camera={{ position: [0, 0.78, 3.9], fov: 28 }} dpr={[1, 1.5]} shadows>
                    <ambientLight intensity={0.42} />
                    <directionalLight
                        position={[3, 6, 4]}
                        intensity={1.35}
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
                    <directionalLight position={[-2, 3, -2]} intensity={0.3} />

                    <Suspense fallback={<Loader />}>
                        <Environment preset="city" />
                        <group position={[0, -1.08, 0]}>
                            <Grid position={[0, 0, 0]} args={[10, 10]} cellColor="#d1d5db" sectionColor="#9ca3af" fadeDistance={20} />
                            <Avatar body={bodyData} pose={'Idle'} skinColor="#F2C9AC" onSceneReady={setAvatarScene} />
                            <GarmentModel
                                config={modelConfig}
                                selectedSize={selectedSize}
                                selectedColor={selectedColor}
                                fabricOverride={selectedFabric}
                                avatarScene={avatarScene}
                                heatmapEnabled={heatmapEnabled}
                                heatmapZones={fitZones}
                            />
                            <ContactShadows position={[0, 0.01, 0]} opacity={0.3} blur={1.5} resolution={512} frames={1} />
                        </group>
                    </Suspense>

                    <OrbitControls
                        target={[0, 0.55, 0]}
                        enablePan={false}
                        enableDamping
                        dampingFactor={0.08}
                        minDistance={2.2}
                        maxDistance={4.8}
                    />
                </Canvas>
            </div>
        </section>
    );
}

interface VirtualTryOnProps {
    product: TryOnProduct;
    outfitItems?: TryOnProduct[];
    onAddToCart: (product: TryOnProduct, size?: string) => void;
    onBuyNow: (product: TryOnProduct, size?: string) => void;
    showToast: (message: string, type?: string) => void;
}

type CompareWinner = 'left' | 'right' | 'equal';

type CompareZoneRow = {
    label: string;
    left: RecommendationZone;
    right: RecommendationZone;
    winner: CompareWinner;
};

const FIT_LABELS: Record<RecommendationFitLevel, { text: string; color: string }> = {
    tight: { text: 'Chật', color: '#ef4444' },
    fitted: { text: 'Ôm vừa', color: '#eab308' },
    comfortable: { text: 'Thoải mái', color: '#22c55e' },
    loose: { text: 'Rộng', color: '#166534' },
};

const formatDeltaCm = (value: number) => `${value > 0 ? '+' : ''}${value} cm`;

/* ─── Category layer helpers ─── */
const CATEGORY_LAYER_ORDER: Record<string, number> = {
    bottom: 0,
    dress: 1,
    top: 2,
    outerwear: 3,
    accessory: 4,
};

const SIZE_ORDER = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL'];
const COMPARE_HIDDEN_SIZES = new Set(['XS', 'XL']);

const normalizeSizeKey = (value: string) => value.trim().toUpperCase();
const isHiddenCompareSize = (value: string) => COMPARE_HIDDEN_SIZES.has(normalizeSizeKey(value));

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

const resolveModelAvailableSizes = (model3D?: ProductWithModel['model3D']) =>
    model3D?.sizes ? sortSizeKeys(Object.keys(model3D.sizes)) : [];

const resolveMeasurementSpecs = (model3D?: ProductWithModel['model3D']) => {
    const rawSpecs = model3D?.measurementProfile?.sizeSpecs;
    if (!rawSpecs) {
        return undefined;
    }

    const normalized = Object.entries(rawSpecs).reduce<Record<string, LocalGarmentSizeSpec>>((acc, [size, spec]) => {
        const key = normalizeSizeKey(size);
        if (!key || !spec) {
            return acc;
        }
        acc[key] = spec;
        return acc;
    }, {});

    return Object.keys(normalized).length > 0 ? normalized : undefined;
};

const resolveGarmentType = (model3D?: ProductWithModel['model3D']) => {
    const rawType = model3D?.measurementProfile?.garmentType;
    if (!rawType) {
        return undefined;
    }

    const normalized = rawType.trim().toLowerCase();
    return normalized || undefined;
};

const resolveColorConfig = (
    model3D: ProductWithModel['model3D'] | undefined,
    selectedColor: string,
): LocalColorOption | undefined => {
    const colors = model3D?.colors;
    if (!colors || !selectedColor) {
        return undefined;
    }

    const normalizedTarget = selectedColor.trim().toLowerCase();
    return colors.find((color) => color.hex.trim().toLowerCase() === normalizedTarget);
};

const resolveFitScopeLabel = (garmentType?: string) => {
    if (garmentType === 'bottom') {
        return 'Eo, hông';
    }

    if (garmentType === 'top') {
        return 'Ngực, eo, hông, vai';
    }

    if (garmentType === 'dress' || garmentType === 'outerwear') {
        return 'Ngực, eo, hông, vai';
    }

    return 'Toàn thân';
};

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
export default function VirtualTryOn({ product, outfitItems, onAddToCart, onBuyNow, showToast }: VirtualTryOnProps) {
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
        layeredGarments,
        lastSilentWear,
        applySilentWear,
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

    // Initialise per-item selection state without preselecting defaults.
    useEffect(() => {
        setItemSizes((prev) => {
            const next: Record<string, string> = {};
            items.forEach((it) => {
                const key = String(it.id);
                next[key] = prev[key] || '';
            });
            return next;
        });

        setItemColors((prev) => {
            const next: Record<string, string> = {};
            items.forEach((it) => {
                const key = String(it.id);
                next[key] = prev[key] || '';
            });
            return next;
        });
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
    const [savedOutfits, setSavedOutfits] = useState<SavedOutfit[]>([]);
    const [isWishlisted, setIsWishlisted] = useState(false);
    const [selectedSidebarProduct, setSelectedSidebarProduct] = useState<TryOnProduct | null>(null);
    const [productSpecCache, setProductSpecCache] = useState<Record<string, TryOnProduct>>({});
    const [isTryOnGuideOpen, setIsTryOnGuideOpen] = useState(false);
    const [isSizeCompareRoomOpen, setIsSizeCompareRoomOpen] = useState(false);
    const [sizeComparePair, setSizeComparePair] = useState({ left: '', right: '' });
    const [hasSidebarScrollFade, setHasSidebarScrollFade] = useState(false);
    const [isClosetOpen, setIsClosetOpen] = useState(false);
    const [isWebglContextLost, setIsWebglContextLost] = useState(false);
    const sidebarScrollRef = useRef<HTMLDivElement | null>(null);
    const [canvasEventSource, setCanvasEventSource] = useState<HTMLElement | undefined>(undefined);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
    const [rendererReady, setRendererReady] = useState(false);
    const savedOutfitsLoadedRef = useRef(false);
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    const rightSidebarProduct = selectedSidebarProduct || activeItem;

    useEffect(() => {
        if (!token) {
            savedOutfitsLoadedRef.current = false;
            setSavedOutfits([]);
        }
    }, [token]);

    useEffect(() => {
        const renderer = rendererRef.current;
        if (!renderer) {
            return;
        }

        const handleContextLost = (event: Event) => {
            event.preventDefault();
            setIsWebglContextLost(true);
            console.warn('[WebGL] Context lost - pausing render loop');
        };

        const handleContextRestored = () => {
            setIsWebglContextLost(false);
            console.info('[WebGL] Context restored - resuming');
        };

        renderer.domElement.addEventListener('webglcontextlost', handleContextLost, false);
        renderer.domElement.addEventListener('webglcontextrestored', handleContextRestored, false);

        return () => {
            renderer.domElement.removeEventListener('webglcontextlost', handleContextLost);
            renderer.domElement.removeEventListener('webglcontextrestored', handleContextRestored);
        };
    }, [rendererReady]);

    useEffect(() => () => {
        if (rendererRef.current) {
            rendererRef.current.dispose();
            rendererRef.current = null;
        }
    }, []);

    const resolveClosetSlot = useCallback((category?: string): GarmentSlot => {
        const lowered = String(category || '').toLowerCase();
        if (lowered.includes('outer') || lowered.includes('coat') || lowered.includes('jacket')) {
            return 'outerwear';
        }
        if (lowered.includes('dress') || lowered.includes('dam') || lowered.includes('vay')) {
            return 'dresses';
        }
        if (lowered.includes('bottom') || lowered.includes('pant') || lowered.includes('jean') || lowered.includes('quan')) {
            return 'bottoms';
        }
        return 'tops';
    }, []);

    const findItemIndexForClosetItem = useCallback((closetItem: ClosetItem) => {
        const normalizedClosetId = String(closetItem.productId || closetItem.id || '').replace(/^closet-/, '');
        return items.findIndex((item) => {
            if (String(item.id) === normalizedClosetId) {
                return true;
            }

            if (closetItem.productId && String(item.id) === String(closetItem.productId)) {
                return true;
            }

            return String(item.name || '').trim().toLowerCase() === closetItem.name.trim().toLowerCase();
        });
    }, [items]);

    const resolvePurchasedColorHex = useCallback((model3D: ProductWithModel['model3D'] | undefined, purchasedColor?: string) => {
        const rawColor = String(purchasedColor || '').trim();
        if (!rawColor) {
            return '';
        }

        const normalized = rawColor.toLowerCase();
        const palette = model3D?.colors || [];
        const matched = palette.find((color) => {
            const hex = String(color.hex || '').trim().toLowerCase();
            const name = String(color.name || '').trim().toLowerCase();
            return hex === normalized || name === normalized;
        });

        if (matched?.hex) {
            return matched.hex;
        }

        if (normalized.startsWith('#')) {
            return rawColor;
        }

        if (normalized.includes('đen') || normalized.includes('black')) return '#222222';
        if (normalized.includes('trắng') || normalized.includes('white')) return '#f5f5f5';
        if (normalized.includes('navy') || normalized.includes('xanh navy')) return '#1f2a44';
        if (normalized.includes('be') || normalized.includes('beige')) return '#d4c3a3';
        if (normalized.includes('xám') || normalized.includes('gray') || normalized.includes('grey')) return '#9ca3af';
        if (normalized.includes('đỏ') || normalized.includes('red')) return '#dc2626';
        if (normalized.includes('xanh lá') || normalized.includes('green')) return '#16a34a';
        if (normalized.includes('xanh dương') || normalized.includes('blue')) return '#2563eb';

        return '';
    }, []);

    const closetGarmentModels = useMemo(() => {
        const wornClosetItems = Object.values(layeredGarments).filter((item): item is SilentWearItem => Boolean(item?.itemId));

        return wornClosetItems
            .filter((closetItem) => !items.some((product) => String(product.id) === String(closetItem.productId || closetItem.itemId)))
            .map((closetItem) => {
                const sourceProduct = {
                    id: closetItem.productId || closetItem.itemId,
                    name: closetItem.name,
                    price: 0,
                    category: closetItem.category,
                    model3D: closetItem.model3D,
                } as TryOnProduct;

                const model3D = (closetItem.model3D as ProductWithModel['model3D'] | undefined) || resolveModel3D(sourceProduct);
                const selectedSize = String(closetItem.purchasedSize || '').trim().toUpperCase();
                const selectedColor = resolvePurchasedColorHex(model3D, closetItem.purchasedColor) || String(closetItem.purchasedColor || '').trim();

                return {
                    key: `closet-${closetItem.itemId}`,
                    model3D,
                    selectedSize,
                    selectedColor,
                };
            })
            .filter((entry) => Boolean(entry.model3D));
    }, [items, layeredGarments, resolveModel3D, resolvePurchasedColorHex]);

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
        const fromConfig = resolveModelAvailableSizes(activeModel3D);
        if (fromConfig.length > 0) {
            return fromConfig;
        }
        return ['S', 'M', 'L'];
    }, [activeModel3D]);

    const activeGarmentSizeSpecs = useMemo(() => {
        return resolveMeasurementSpecs(activeModel3D);
    }, [activeModel3D]);

    const activeGarmentType = useMemo(() => {
        return resolveGarmentType(activeModel3D);
    }, [activeModel3D]);

    const activeItemKey = String(activeItem.id);
    const activeSelectedSize = (itemSizes[activeItemKey] || '').trim();
    const activeSelectedColor = (itemColors[activeItemKey] || '').trim();

    const activeFitScopeLabel = useMemo(() => resolveFitScopeLabel(activeGarmentType), [activeGarmentType]);
    const isActiveItemReadyToWear = activeSelectedSize.length > 0 && activeSelectedColor.length > 0;
    const activeSelectedColorConfig = useMemo(
        () => resolveColorConfig(activeModel3D, activeSelectedColor),
        [activeModel3D, activeSelectedColor],
    );

    const activeFabricKind = useMemo(() => {
        const selectedConfig = activeSelectedSize ? activeModel3D?.sizes?.[activeSelectedSize] : undefined;
        const colorFabric = activeSelectedColorConfig?.fabric;
        const resolved = colorFabric?.preset || colorFabric?.kind || selectedConfig?.fabric?.preset || selectedConfig?.fabric?.kind || activeModel3D?.fabric?.preset || activeModel3D?.fabric?.kind;
        return resolved || 'cotton';
    }, [activeModel3D, activeSelectedColorConfig, activeSelectedSize]);

    const hasConfigurable3DModel = Boolean(activeModel3D?.sizes && Object.keys(activeModel3D.sizes).length > 0);
    const comparePreviewColor = activeSelectedColor || '#f5f5f5';
    const comparePreviewColorName = activeSelectedColorConfig?.name || 'Trắng trung tính';
    const comparePreviewFabric = activeSelectedColorConfig?.fabric;

    const sizeCompareResults = useMemo<RecommendationResult[]>(
        () => recommendSizes(currentBodyData, availableSizes, activeGarmentSizeSpecs, { garmentType: activeGarmentType }),
        [currentBodyData, availableSizes, activeGarmentSizeSpecs, activeGarmentType],
    );

    const itemFitZonesByKey = useMemo<Record<string, RecommendationZone[]>>(() => {
        const fitMap: Record<string, RecommendationZone[]> = {};

        itemModels.forEach(({ key, model3D }) => {
            const selectedSizeForItem = normalizeSizeKey(itemSizes[key] || '');
            if (!selectedSizeForItem) {
                return;
            }

            const modelSizes = resolveModelAvailableSizes(model3D);
            const candidateSizes = modelSizes.length > 0 ? modelSizes : [selectedSizeForItem];
            const measurementSpecs = resolveMeasurementSpecs(model3D);
            const garmentType = resolveGarmentType(model3D);

            const recommendationResults: RecommendationResult[] = recommendSizes(
                currentBodyData,
                candidateSizes,
                measurementSpecs,
                { garmentType },
            );
            const selectedResult = recommendationResults.find((result: RecommendationResult) => result.size === selectedSizeForItem);

            if (selectedResult) {
                fitMap[key] = selectedResult.zones;
            }
        });

        return fitMap;
    }, [currentBodyData, itemModels, itemSizes]);

    const comparableSizes = useMemo(
        () => sortSizeKeys(
            sizeCompareResults
                .map((result) => result.size)
                .filter((size) => !isHiddenCompareSize(size)),
        ),
        [sizeCompareResults],
    );

    const sizeCompareResultMap = useMemo(
        () => new Map(sizeCompareResults.map((result) => [result.size, result])),
        [sizeCompareResults],
    );

    const resolveAlternativeComparableSize = useCallback((excludedSize: string) => {
        return comparableSizes.find((size) => size !== excludedSize) || excludedSize;
    }, [comparableSizes]);

    const compareLeftResult: RecommendationResult | null = sizeComparePair.left
        ? sizeCompareResultMap.get(sizeComparePair.left) || null
        : null;
    const compareRightResult: RecommendationResult | null = sizeComparePair.right
        ? sizeCompareResultMap.get(sizeComparePair.right) || null
        : null;

    const sizeCompareRows = useMemo<CompareZoneRow[]>(() => {
        if (!compareLeftResult || !compareRightResult) {
            return [];
        }

        return compareLeftResult.zones.map((leftZone: RecommendationZone) => {
            const rightZone = compareRightResult.zones.find((zone: RecommendationZone) => zone.key === leftZone.key) || leftZone;
            const leftSeverity = leftZone.severity;
            const rightSeverity = rightZone.severity;

            let winner: CompareWinner = 'equal';
            if (leftSeverity + 0.03 < rightSeverity) {
                winner = 'left';
            } else if (rightSeverity + 0.03 < leftSeverity) {
                winner = 'right';
            }

            return {
                label: leftZone.label,
                left: leftZone,
                right: rightZone,
                winner,
            };
        });
    }, [compareLeftResult, compareRightResult]);

    const sizeCompareScoreDiff = compareLeftResult && compareRightResult
        ? compareRightResult.score - compareLeftResult.score
        : 0;

    const canOpenSizeCompareRoom = hasConfigurable3DModel && comparableSizes.length >= 2;

    const updateSidebarScrollFade = useCallback(() => {
        const scrollEl = sidebarScrollRef.current;
        if (!scrollEl) {
            return;
        }

        const computedStyle = window.getComputedStyle(scrollEl);
        const bottomPadding = Number.parseFloat(computedStyle.paddingBottom) || 0;
        const remaining = scrollEl.scrollHeight - scrollEl.clientHeight - scrollEl.scrollTop;
        const shouldShowFade = remaining > bottomPadding + 2;
        setHasSidebarScrollFade((prev) => (prev === shouldShowFade ? prev : shouldShowFade));
    }, []);

    useEffect(() => {
        const scrollEl = sidebarScrollRef.current;
        if (!scrollEl) {
            return;
        }

        let frameId: number | null = null;
        const queueUpdate = () => {
            if (frameId !== null) {
                return;
            }

            frameId = window.requestAnimationFrame(() => {
                frameId = null;
                updateSidebarScrollFade();
            });
        };

        const onScroll = () => queueUpdate();
        const onWindowResize = () => queueUpdate();
        const onTransitionEnd = (event: Event) => {
            const target = event.target;
            if (!(target instanceof HTMLElement)) {
                return;
            }

            if (target.classList.contains('vto-accordion__body')) {
                queueUpdate();
            }
        };

        scrollEl.addEventListener('scroll', onScroll, { passive: true });
        scrollEl.addEventListener('transitionend', onTransitionEnd, true);
        window.addEventListener('resize', onWindowResize);

        const resizeObserver = typeof ResizeObserver !== 'undefined'
            ? new ResizeObserver(() => queueUpdate())
            : null;
        resizeObserver?.observe(scrollEl);

        queueUpdate();

        return () => {
            scrollEl.removeEventListener('scroll', onScroll);
            scrollEl.removeEventListener('transitionend', onTransitionEnd, true);
            window.removeEventListener('resize', onWindowResize);
            resizeObserver?.disconnect();
            if (frameId !== null) {
                window.cancelAnimationFrame(frameId);
            }
        };
    }, [updateSidebarScrollFade]);

    useEffect(() => {
        const key = String(activeItem.id);
        const next = (itemSizes[key] || '').trim() || null;
        if (selectedSize !== next) {
            setSelectedSize(next);
        }
    }, [activeItem, itemSizes, selectedSize, setSelectedSize]);

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

    useEffect(() => {
        if (comparableSizes.length < 2) {
            setSizeComparePair({ left: comparableSizes[0] || '', right: '' });
            setIsSizeCompareRoomOpen(false);
            return;
        }

        const preferredLeft = activeSelectedSize && comparableSizes.includes(activeSelectedSize)
            ? activeSelectedSize
            : (selectedSize && comparableSizes.includes(selectedSize) ? selectedSize : comparableSizes[0]);
        const preferredRight = comparableSizes.find((size) => size !== preferredLeft) || comparableSizes[1];

        setSizeComparePair((prev) => {
            const hasValidLeft = comparableSizes.includes(prev.left);
            const hasValidRight = comparableSizes.includes(prev.right);

            if (hasValidLeft && hasValidRight && prev.left !== prev.right) {
                return prev;
            }

            return {
                left: preferredLeft,
                right: preferredRight,
            };
        });
    }, [activeSelectedSize, comparableSizes, selectedSize]);

    useEffect(() => {
        if (!isSizeCompareRoomOpen) {
            return;
        }

        const handleEscape = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                setIsSizeCompareRoomOpen(false);
            }
        };

        window.addEventListener('keydown', handleEscape);
        return () => {
            window.removeEventListener('keydown', handleEscape);
        };
    }, [isSizeCompareRoomOpen]);

    useEffect(() => {
        if (!isTryOnGuideOpen) {
            return;
        }

        const handleEscape = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                setIsTryOnGuideOpen(false);
            }
        };

        window.addEventListener('keydown', handleEscape);
        return () => {
            window.removeEventListener('keydown', handleEscape);
        };
    }, [isTryOnGuideOpen]);

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

    const handleBackToHome = useCallback(() => {
        navigate('/');
    }, [navigate]);

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

    const handleWearClosetItem = useCallback(async (closetItem: ClosetItem, selectedColor?: string, selectedSize?: string) => {
        applySilentWear({
            itemId: closetItem.itemId || closetItem.id,
            productId: closetItem.productId,
            name: closetItem.name,
            category: closetItem.slotCategory,
            purchasedSize: selectedSize || closetItem.purchasedSize,
            purchasedColor: selectedColor || closetItem.purchasedColor,
            model3D: closetItem.model3D,
            thumbnail: closetItem.thumbnail,
            source: closetItem.source,
        });

        const token = localStorage.getItem('token');
        if (token && closetItem.itemId) {
            try {
                await fetch(`${API_URL}/api/virtual-closet/wear/${closetItem.itemId}`, {
                    method: 'POST',
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });
            } catch (err) {
                console.error('Wear tracking failed:', err);
            }
        }

        showToast(`SmartFit da mac ${closetItem.name} (Silent Wear).`, 'success');
    }, [applySilentWear, showToast]);

    const handleViewClosetItemDetails = useCallback(async (closetItem: ClosetItem) => {
        const targetIdx = findItemIndexForClosetItem(closetItem);
        if (targetIdx >= 0) {
            setActiveItemIdx(targetIdx);
        }

        const cacheKey = String(closetItem.productId || closetItem.id || closetItem.name).trim().toLowerCase();
        const cached = productSpecCache[cacheKey];
        if (cached) {
            setSelectedSidebarProduct(cached);
            showToast(`Da cap nhat chi tiet cho ${closetItem.name}.`, 'success');
            return;
        }

        try {
            const response = await fetch(`${API_URL}/api/products`);
            if (!response.ok) {
                throw new Error('Unable to fetch product specs');
            }

            const products = await response.json();
            const list = Array.isArray(products) ? products : [];
            const matched = list.find((candidate: TryOnProduct) => {
                if (closetItem.productId && String(candidate.id) === String(closetItem.productId)) {
                    return true;
                }
                const normalizedCandidateId = String(candidate.id || '').trim().toLowerCase();
                const normalizedClosetId = String(closetItem.id || '').replace(/^closet-/, '').trim().toLowerCase();
                if (normalizedCandidateId && normalizedCandidateId === normalizedClosetId) {
                    return true;
                }
                return String(candidate.name || '').trim().toLowerCase() === closetItem.name.trim().toLowerCase();
            }) as TryOnProduct | undefined;

            const resolvedProduct: TryOnProduct = matched || {
                id: closetItem.productId || closetItem.id,
                name: closetItem.name,
                category: closetItem.category,
                price: 0,
                img: closetItem.thumbnail,
            };

            setSelectedSidebarProduct(resolvedProduct);
            setProductSpecCache((prev) => ({
                ...prev,
                [cacheKey]: resolvedProduct,
            }));
            showToast(`Da cap nhat chi tiet cho ${closetItem.name}.`, 'success');
        } catch {
            setSelectedSidebarProduct({
                id: closetItem.productId || closetItem.id,
                name: closetItem.name,
                category: closetItem.category,
                price: 0,
                img: closetItem.thumbnail,
            });
            showToast('Khong tai duoc thong so chi tiet, dang hien thi du lieu co san.', 'warning');
        }
    }, [findItemIndexForClosetItem, productSpecCache, showToast]);

    useEffect(() => {
        if (!lastSilentWear) {
            return;
        }

        const targetIdx = findItemIndexForClosetItem({
            id: lastSilentWear.itemId,
            itemId: lastSilentWear.itemId,
            productId: lastSilentWear.productId,
            name: lastSilentWear.name,
            thumbnail: lastSilentWear.thumbnail || '',
            category: lastSilentWear.category,
            categoryKey: String(lastSilentWear.category || '').trim().toLowerCase(),
            slotCategory: resolveClosetSlot(lastSilentWear.category),
            purchasedSize: lastSilentWear.purchasedSize,
            purchasedColor: lastSilentWear.purchasedColor,
            isOwned: true,
            source: lastSilentWear.source || 'order',
        });

        if (targetIdx < 0) {
            return;
        }

        const targetItem = items[targetIdx];
        if (!targetItem) {
            return;
        }

        const targetModel3D = resolveModel3D(targetItem);

        const key = String(targetItem.id);
        if (lastSilentWear.purchasedSize) {
            setItemSizes((prev) => ({ ...prev, [key]: lastSilentWear.purchasedSize || '' }));
            setSelectedSize(lastSilentWear.purchasedSize || null);
        }

        if (lastSilentWear.purchasedColor) {
            const purchasedColorHex = resolvePurchasedColorHex(targetModel3D, lastSilentWear.purchasedColor) || lastSilentWear.purchasedColor;
            setItemColors((prev) => ({ ...prev, [key]: purchasedColorHex }));
        }
    }, [findItemIndexForClosetItem, items, lastSilentWear, resolveModel3D, resolvePurchasedColorHex, setSelectedSize]);

    const handleSizeCompareLeftChange = useCallback((nextLeft: string) => {
        setSizeComparePair((prev) => {
            if (nextLeft !== prev.right) {
                return { ...prev, left: nextLeft };
            }

            const nextRight = comparableSizes.find((size) => size !== nextLeft && size !== prev.left)
                || resolveAlternativeComparableSize(nextLeft);

            return { left: nextLeft, right: nextRight };
        });
    }, [comparableSizes, resolveAlternativeComparableSize]);

    const handleSizeCompareRightChange = useCallback((nextRight: string) => {
        setSizeComparePair((prev) => {
            if (nextRight !== prev.left) {
                return { ...prev, right: nextRight };
            }

            const nextLeft = comparableSizes.find((size) => size !== nextRight && size !== prev.right)
                || resolveAlternativeComparableSize(nextRight);

            return { left: nextLeft, right: nextRight };
        });
    }, [comparableSizes, resolveAlternativeComparableSize]);

    const handleOpenSizeCompareRoom = useCallback(() => {
        if (!canOpenSizeCompareRoom) {
            showToast('Sản phẩm chưa đủ dữ liệu size 3D để so sánh.', 'warning');
            return;
        }

        setIsTryOnGuideOpen(false);
        setIsSizeCompareRoomOpen(true);
    }, [canOpenSizeCompareRoom, showToast]);

    const handleCloseSizeCompareRoom = useCallback(() => {
        setIsSizeCompareRoomOpen(false);
    }, []);

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

    const refreshSavedOutfits = useCallback(async (signal?: AbortSignal) => {
        const authToken = localStorage.getItem('token');
        if (!authToken) {
            setSavedOutfits([]);
            return;
        }

        try {
            const response = await fetch(`${API_URL}/api/saved-outfits`, {
                headers: {
                    Authorization: `Bearer ${authToken}`,
                },
                signal,
            });
            if (!response.ok) {
                console.warn(`[saved-outfits] API returned ${response.status}, using empty list`);
                setSavedOutfits([]);
                return;
            }

            const data = await response.json();
            setSavedOutfits(Array.isArray(data?.outfits) ? data.outfits : []);
        } catch (err) {
            if (err instanceof Error && err.name === 'AbortError') {
                return;
            }
            console.error('Failed to load saved outfits:', err);
            setSavedOutfits([]);
        }
    }, []);

    useEffect(() => {
        if (savedOutfitsLoadedRef.current) {
            return;
        }
        if (!token) {
            return;
        }

        savedOutfitsLoadedRef.current = true;
        const controller = new AbortController();
        refreshSavedOutfits(controller.signal);

        return () => {
            controller.abort();
        };
    }, [refreshSavedOutfits, token]);

    const handleApplySavedOutfit = useCallback((outfit: SavedOutfit) => {
        const slots = outfit.slots || {};
        (['tops', 'bottoms', 'outerwear', 'dresses'] as const).forEach((slot) => {
            const item = slots[slot];
            if (!item?.itemId) {
                return;
            }

            applySilentWear({
                itemId: item.itemId,
                name: item.name || 'Saved item',
                category: slot,
                thumbnail: item.thumbnailUrl,
                source: 'import',
            });
        });

        showToast(`Đã áp dụng outfit: ${outfit.name || 'Outfit chưa đặt tên'}`, 'success');
    }, [applySilentWear, showToast]);

    // Save outfit handler
    const handleSaveOutfit = useCallback(async (name: string) => {
        if (!isActiveItemReadyToWear) {
            showToast('Chọn đủ màu và size trước khi lưu outfit.', 'error');
            return;
        }

        const token = localStorage.getItem('token');
        if (!token) {
            showToast('Vui lòng đăng nhập để lưu outfit.', 'warning');
            return;
        }

        const slotsPayload = (['tops', 'bottoms', 'outerwear', 'dresses'] as const).reduce((acc, slot) => {
            const wornItem = layeredGarments[slot];
            if (wornItem) {
                acc[slot] = {
                    itemId: wornItem.itemId,
                    name: wornItem.name,
                    thumbnailUrl: wornItem.thumbnail,
                };
            }
            return acc;
        }, {} as Record<string, { itemId: string; name: string; thumbnailUrl?: string }>);

        try {
            const response = await fetch(`${API_URL}/api/saved-outfits`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    name,
                    slots: slotsPayload,
                }),
            });

            if (!response.ok) {
                throw new Error('Unable to save outfit');
            }

            await refreshSavedOutfits();
            showToast(`Đã lưu outfit: ${name}`, 'success');
        } catch (err) {
            console.error('Save outfit failed:', err);
            showToast('Không thể lưu outfit, thử lại sau.', 'error');
        }
    }, [isActiveItemReadyToWear, layeredGarments, refreshSavedOutfits, showToast]);

    return (
        <div className="vto-container">
            {/* ─── Top Navigation ─── */}
            <header className="vto-nav">
                <button className="vto-nav__back" onClick={handleBackToHome}>
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
                <button
                    type="button"
                    className={`vto-nav__help-btn ${isTryOnGuideOpen ? 'active' : ''}`}
                    onClick={() => setIsTryOnGuideOpen((prev) => !prev)}
                    aria-label="Mở hướng dẫn phòng thử đồ"
                    aria-expanded={isTryOnGuideOpen}
                >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <circle cx="12" cy="12" r="10" />
                        <path d="M9.1 9a3 3 0 1 1 5.8 1c-.3.8-.9 1.3-1.6 1.7-.7.4-1.3.9-1.3 1.8" />
                        <circle cx="12" cy="17" r="1" fill="currentColor" stroke="none" />
                    </svg>
                    <span>Hướng dẫn</span>
                </button>
                <div className="vto-nav__spacer" />
                <span className="vto-nav__room-label">✦ Virtual Fitting Studio</span>
                <div className="vto-nav__spacer" />

            </header>

            {/* ─── Workspace ─── */}
            <div className="vto-workspace">
                {/* ─── Virtual Personal Closet Drawer (Left Sidebar) ─── */}
                <VirtualPersonalClosetDrawer
                    viewedProduct={activeItem}
                    onWearItem={handleWearClosetItem}
                    onViewDetails={handleViewClosetItemDetails}
                    onApplySavedOutfit={handleApplySavedOutfit}
                    savedOutfitsCount={savedOutfits.length}
                    isOpen={isClosetOpen}
                    onClose={() => setIsClosetOpen(false)}
                />

                {/* 3D Preview – renders ALL garments layered by category */}
                <div ref={(node) => setCanvasEventSource(node || undefined)} className="vto-canvas-area">
                    <Canvas
                        ref={canvasRef}
                        eventSource={canvasEventSource}
                        frameloop={isWebglContextLost ? 'never' : 'always'}
                        dpr={[1, 1.5]}
                        camera={{ position: [0, 0.7, 4.5], fov: 32 }}
                        shadows
                        gl={{ antialias: true, preserveDrawingBuffer: true, powerPreference: 'high-performance' }}
                        onCreated={({ gl }) => {
                            rendererRef.current = gl;
                            setRendererReady(true);
                        }}
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

                        {/* Hemisphere light for soft ambient occlusion feel at garment intersection */}
                        <hemisphereLight args={['#f5f0e8', '#3a3228', 0.35]} />

                        <CameraAnimator targetPosition={cameraPos} targetLookAt={cameraTarget} />

                        <Suspense fallback={<Loader />}>
                            <Environment preset="city" />
                            <group position={[0, -1.15, 0]}>
                                <Grid position={[0, 0, 0]} args={[10, 10]} cellColor="#d1d5db" sectionColor="#9ca3af" fadeDistance={20} />
                                <Avatar body={currentBodyData} pose={'Idle'} skinColor="#F2C9AC" onSceneReady={setAvatarScene} />

                                {/* Render each garment – sorted by category layer order */}
                                {itemModels.map(({ model3D, key }) => {
                                    const selectedSizeForItem = (itemSizes[key] || '').trim();
                                    const selectedColorForItem = (itemColors[key] || '').trim();
                                    const selectedColorConfigForItem = resolveColorConfig(model3D, selectedColorForItem);
                                    const canRenderGarment = selectedSizeForItem.length > 0 && selectedColorForItem.length > 0;

                                    if (!canRenderGarment) {
                                        return null;
                                    }

                                    return (
                                        <GarmentModel
                                            key={key}
                                            config={model3D}
                                            selectedSize={selectedSizeForItem}
                                            selectedColor={selectedColorForItem}
                                            fabricOverride={selectedColorConfigForItem?.fabric}
                                            avatarScene={avatarScene}
                                            heatmapEnabled={isHeatmapOpen}
                                            heatmapZones={itemFitZonesByKey[key]}
                                        />
                                    );
                                })}

                                {closetGarmentModels.map(({ key, model3D, selectedSize, selectedColor }) => {
                                    const selectedColorConfigForItem = resolveColorConfig(model3D, selectedColor);
                                    const canRenderGarment = selectedSize.length > 0 && selectedColor.length > 0;

                                    if (!canRenderGarment) {
                                        return null;
                                    }

                                    return (
                                        <GarmentModel
                                            key={key}
                                            config={model3D}
                                            selectedSize={selectedSize}
                                            selectedColor={selectedColor}
                                            fabricOverride={selectedColorConfigForItem?.fabric}
                                            avatarScene={avatarScene}
                                            heatmapEnabled={isHeatmapOpen}
                                            heatmapZones={[]}
                                        />
                                    );
                                })}

                                <ContactShadows position={[0, 0.01, 0]} opacity={0.45} blur={1.8} resolution={512} frames={1} far={3} />
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

                    {/* AI Outfit Chat */}
                    <AIOutfitChat
                        closetItems={Object.values(layeredGarments).filter((item): item is SilentWearItem => Boolean(item?.itemId))}
                        avatarData={currentBodyData}
                        token={localStorage.getItem('token') || ''}
                        onWearOutfit={(items) => {
                            items.forEach(item => {
                                const wornItem = Object.values(layeredGarments).find(c => c?.itemId === item.itemId);
                                if (wornItem) {
                                    applySilentWear(wornItem);
                                }
                            });
                        }}
                        onAddToCart={(productId) => {
                            navigate(`/product/${productId}`);
                        }}
                    />

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
                                Mặc định
                            </button>
                            <button
                                type="button"
                                className={`vto-heatmap-toggle__option ${isHeatmapOpen ? 'selected' : ''}`}
                                onClick={() => !isHeatmapOpen && toggleHeatmap()}
                            >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" /><path d="M12 6v6l4 2" /></svg>
                                Nhiệt đồ
                            </button>
                            <span className="vto-heatmap-toggle__slider" />
                        </div>
                    </div>

                    <div className="vto-canvas-overlay vto-canvas-overlay--top-left">
                        <button
                            type="button"
                            className="vto-closet-button"
                            onClick={() => setIsClosetOpen(true)}
                            aria-label="Mở tủ đồ cá nhân"
                            title="Virtual Personal Closet"
                            data-testid="open-closet-btn"
                        >
                            <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true">
                                <path d="M20 6h-2.15a2.5 2.5 0 0 0-4.7 0H6.85a2.5 2.5 0 0 0-4.7 0H2a1 1 0 0 0-1 1v11a3 3 0 0 0 3 3h16a3 3 0 0 0 3-3V7a1 1 0 0 0-1-1zm-9-2a.5.5 0 1 1 1 0 .5.5 0 0 1-1 0zm9 13H4a1 1 0 0 1-1-1V8h18v10a1 1 0 0 1-1 1z" />
                            </svg>
                            <span className="vto-closet-button__label">Tủ đồ</span>
                        </button>
                    </div>

                    {/* Heatmap legend */}
                    <div className={`vto-heatmap-legend ${isHeatmapOpen ? 'visible' : ''}`}>
                        <span className="vto-heatmap-legend__title">Phân tích độ vừa</span>
                        <div className="vto-heatmap-legend__items">
                            <div className="vto-heatmap-legend__item">
                                <span className="vto-heatmap-legend__dot vto-heatmap-legend__dot--tight" />
                                <span>Chật (&lt; 2cm)</span>
                            </div>
                            <div className="vto-heatmap-legend__item">
                                <span className="vto-heatmap-legend__dot vto-heatmap-legend__dot--fitted" />
                                <span>Ôm vừa (2-6cm)</span>
                            </div>
                            <div className="vto-heatmap-legend__item">
                                <span className="vto-heatmap-legend__dot vto-heatmap-legend__dot--comfortable" />
                                <span>Thoải mái (6-12cm)</span>
                            </div>
                            <div className="vto-heatmap-legend__item">
                                <span className="vto-heatmap-legend__dot vto-heatmap-legend__dot--loose" />
                                <span>Rộng (&gt; 12cm)</span>
                            </div>
                        </div>
                    </div>

                    {/* Active heatmap border glow */}
                    <div className={`vto-heatmap-glow ${isHeatmapOpen ? 'active' : ''}`} />

                    <OutfitPanel
                        layeredGarments={layeredGarments}
                        onSave={handleSaveOutfit}
                    />
                </div>

                {/* ─── Sidebar ─── */}
                <aside className={`vto-sidebar ${hasSidebarScrollFade ? 'has-scroll-fade' : ''}`} data-testid="product-panel">
                    <div className="vto-sidebar__scroll" ref={sidebarScrollRef}>
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
                                            <span className="vto-outfit-item__active-dot">
                                                <svg width="10" height="10" viewBox="0 0 24 24" fill="#fff" stroke="none"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" /></svg>
                                            </span>
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
                                <img src={rightSidebarProduct.img || rightSidebarProduct.image} alt={rightSidebarProduct.name} />
                            </div>
                            <div className="vto-product-card__info">
                                <span className="vto-badge">
                                    {isMultiProduct ? `Sản phẩm ${activeItemIdx + 1}/${items.length}` : 'Phòng thử đồ'}
                                </span>
                                <h2 className="vto-product-card__name">{rightSidebarProduct.name}</h2>
                                <p className="vto-product-card__price">{Number(rightSidebarProduct.price)?.toLocaleString()} đ</p>
                            </div>
                        </div>

                        {/* Color — Accordion */}
                        <Accordion
                            title="Màu sắc"
                            icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10" /><path d="M12 2a7 7 0 0 0 0 14 1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1h1a5 5 0 0 0 5-5C20 4.58 16.42 2 12 2z" /></svg>}
                            defaultOpen={true}
                            onLayoutChange={updateSidebarScrollFade}
                        >
                            <ColorSelector
                                colors={colorOptions}
                                selectedColor={itemColors[activeItemKey] || ''}
                                onSelectColor={handleItemColorChange}
                            />
                        </Accordion>

                        {/* Size Recommendation — Accordion */}
                        <Accordion
                            title="Kích cỡ & AI gợi ý"
                            icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" /></svg>}
                            defaultOpen={true}
                            onLayoutChange={updateSidebarScrollFade}
                        >
                            <SizeRecommendation
                                profile={currentBodyData}
                                availableSizes={availableSizes}
                                selectedSize={itemSizes[activeItemKey] || null}
                                onSelectSize={handleItemSizeChange}
                                garmentSizeSpecs={activeGarmentSizeSpecs}
                                garmentType={activeGarmentType}
                            />

                            <p className="vto-option__note">
                                AI đang chấm theo vùng: {activeFitScopeLabel}. Vải mô phỏng: {activeFabricKind}.
                            </p>
                        </Accordion>

                        {!isActiveItemReadyToWear && (
                            <p className="vto-option__note">
                                Chọn cả màu sắc và kích cỡ để hiện trang phục lên avatar.
                            </p>
                        )}

                        {/* Quick actions — Accordion */}
                        <Accordion
                            title="Công cụ nhanh"
                            icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /></svg>}
                            onLayoutChange={updateSidebarScrollFade}
                        >
                            <div className="vto-actions">
                                <button className="vto-action-btn" onClick={handleScreenshot}>
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" /><circle cx="12" cy="13" r="4" /></svg>
                                    <span>Chụp ảnh</span>
                                </button>
                                <button className="vto-action-btn" onClick={() => handleSaveOutfit('Outfit nhanh')}>
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" /></svg>
                                    <span>Lưu outfit</span>
                                </button>
                                <button className={`vto-action-btn ${isRotating ? 'active' : ''}`} onClick={() => setIsRotating(r => !r)}>
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                        <polyline points="23 4 23 10 17 10" />
                                        <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
                                    </svg>
                                    <span>{isRotating ? 'Dừng xoay' : 'Tự xoay'}</span>
                                </button>
                            </div>

                            <button
                                type="button"
                                className="vto-size-rec__compare-toggle vto-size-room__open-btn"
                                onClick={handleOpenSizeCompareRoom}
                                disabled={!canOpenSizeCompareRoom}
                            >
                                <span className="vto-size-rec__compare-toggle-main">
                                    <svg
                                        className="vto-size-rec__compare-toggle-leading-icon"
                                        width="18"
                                        height="18"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="1.8"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        aria-hidden="true"
                                    >
                                        <rect x="2.5" y="4" width="8" height="14" rx="1.8" />
                                        <rect x="13.5" y="6" width="8" height="14" rx="1.8" />
                                        <path d="M10.5 11h3" />
                                        <path d="M11.8 9.8 13 11l-1.2 1.2" />
                                    </svg>
                                    <span className="vto-size-rec__compare-toggle-text">So sánh size trên 2 màn hình</span>
                                </span>
                                <svg
                                    className="vto-size-rec__compare-toggle-arrow"
                                    width="16"
                                    height="16"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    aria-hidden="true"
                                >
                                    <polyline points="9 18 15 12 9 6" />
                                </svg>
                            </button>
                        </Accordion>

                    </div>

                    {/* Footer CTA */}
                    <div className="vto-cta">
                        <button
                            className="vto-cta__btn vto-cta__btn--outline"
                            onClick={() => onAddToCart(activeItem, activeSelectedSize || undefined)}
                        >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" /><path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6" /></svg>
                            <span>Giỏ hàng</span>
                        </button>
                        <button
                            className="vto-cta__btn vto-cta__btn--primary"
                            onClick={() => onBuyNow(activeItem, activeSelectedSize || undefined)}
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

            {isTryOnGuideOpen && (
                <div
                    className="vto-guide-overlay"
                    role="presentation"
                    onClick={() => setIsTryOnGuideOpen(false)}
                >
                    <div
                        className="vto-guide-card"
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="vto-guide-title"
                        onClick={(event) => event.stopPropagation()}
                    >
                        <div className="vto-guide-card__header">
                            <div>
                                <h3 id="vto-guide-title">Hướng dẫn nhanh phòng thử đồ</h3>
                                <p>Làm theo 6 bước để thử đồ chính xác và dễ nhìn nhất.</p>
                            </div>
                            <button
                                type="button"
                                className="vto-guide-card__close"
                                onClick={() => setIsTryOnGuideOpen(false)}
                                aria-label="Đóng hướng dẫn"
                            >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                    <line x1="18" y1="6" x2="6" y2="18" />
                                    <line x1="6" y1="6" x2="18" y2="18" />
                                </svg>
                            </button>
                        </div>

                        <ol className="vto-guide-list">
                            <li><strong>Chọn Avatar:</strong> dùng ô chọn Avatar phía trên cùng để chọn mẫu người mặc.</li>
                            <li><strong>Chọn màu và size:</strong> trong sidebar, chọn màu trước rồi chọn size.</li>
                            <li><strong>Xem AI gợi ý:</strong> kiểm tra phần Kích cỡ & AI gợi ý để biết mức phù hợp theo %.</li>
                            <li><strong>Bật nhiệt đồ khi cần:</strong> chỉ bật nhiệt đồ để xem vùng chật/rộng chi tiết.</li>
                            <li><strong>So sánh 2 size:</strong> bấm "So sánh size trên 2 màn hình" để đối chiếu trực tiếp.</li>
                            <li><strong>Lưu kết quả:</strong> dùng Chụp ảnh hoặc Lưu outfit để lưu lựa chọn của bạn.</li>
                        </ol>
                    </div>
                </div>
            )}

            {isSizeCompareRoomOpen && compareLeftResult && compareRightResult && (
                <div
                    className="vto-size-room__backdrop"
                    role="presentation"
                    onClick={handleCloseSizeCompareRoom}
                >
                    <div
                        className="vto-size-room"
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="vto-size-room-title"
                        onClick={(event) => event.stopPropagation()}
                    >
                        <header className="vto-size-room__header">
                            <div className="vto-size-room__header-left">
                                <div className="vto-size-room__header-top">
                                    <span className="vto-size-room__header-icon" aria-hidden="true">📏</span>
                                    <span className="vto-size-room__header-feature-badge">Real-time comparison</span>
                                </div>
                                <h3 id="vto-size-room-title" className="compare-title">Phòng so sánh size</h3>
                                <p className="compare-subtitle">So sánh trực tiếp 2 size trên cùng avatar để thấy độ khác nhau khi mặc.</p>
                            </div>
                            <button
                                type="button"
                                className="vto-size-room__close"
                                onClick={handleCloseSizeCompareRoom}
                                aria-label="Đóng phòng so sánh size"
                            >
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                    <line x1="18" y1="6" x2="6" y2="18" />
                                    <line x1="6" y1="6" x2="18" y2="18" />
                                </svg>
                            </button>
                        </header>

                        <div className="vto-size-room__screens">
                            <SizeCompareViewport
                                panelLabel="Màn hình trái"
                                productName={activeItem.name}
                                bodyData={currentBodyData}
                                modelConfig={activeModel3D}
                                selectedSize={sizeComparePair.left}
                                availableSizes={comparableSizes}
                                onSelectSize={handleSizeCompareLeftChange}
                                selectedColor={comparePreviewColor}
                                selectedFabric={comparePreviewFabric}
                                fitScore={compareLeftResult.score}
                                fitZones={compareLeftResult.zones}
                                heatmapEnabled={false}
                            />

                            <div className="vto-size-room__connector" aria-hidden="true">
                                <span className="compare-arrow">⇄</span>
                            </div>

                            <SizeCompareViewport
                                panelLabel="Màn hình phải"
                                productName={activeItem.name}
                                bodyData={currentBodyData}
                                modelConfig={activeModel3D}
                                selectedSize={sizeComparePair.right}
                                availableSizes={comparableSizes}
                                onSelectSize={handleSizeCompareRightChange}
                                selectedColor={comparePreviewColor}
                                selectedFabric={comparePreviewFabric}
                                fitScore={compareRightResult.score}
                                fitZones={compareRightResult.zones}
                                heatmapEnabled={false}
                            />
                        </div>

                        <div className="vto-size-room__summary">
                            <p className="vto-size-room__color-note">Chế độ màu áo: <strong>{comparePreviewColorName}</strong></p>

                            <div className="vto-size-rec__compare-panel">
                                <div className="vto-size-rec__compare-scores">
                                    <span>{sizeComparePair.left}: <strong>{compareLeftResult.score}%</strong></span>
                                    <span>{sizeComparePair.right}: <strong>{compareRightResult.score}%</strong></span>
                                    <span className={`vto-size-rec__compare-diff ${sizeCompareScoreDiff > 0 ? 'positive' : sizeCompareScoreDiff < 0 ? 'negative' : ''}`}>
                                        Chênh lệch: {sizeCompareScoreDiff > 0 ? '+' : ''}{sizeCompareScoreDiff}%
                                    </span>
                                </div>

                                <div className="vto-size-rec__compare-rows">
                                    <div className="vto-size-rec__compare-columns" aria-hidden="true">
                                        <span className="vto-size-rec__compare-col vto-size-rec__compare-col--zone">Vùng đo</span>
                                        <span className="vto-size-rec__compare-col">{sizeComparePair.left}</span>
                                        <span className="vto-size-rec__compare-col">{sizeComparePair.right}</span>
                                    </div>

                                    {sizeCompareRows.map((row) => {
                                        const leftFit = FIT_LABELS[row.left.fit];
                                        const rightFit = FIT_LABELS[row.right.fit];

                                        return (
                                            <div key={row.label} className="vto-size-rec__compare-row">
                                                <span className="vto-size-rec__compare-zone">{row.label}</span>
                                                <span className={`vto-size-rec__compare-cell ${row.winner === 'left' ? 'winner' : ''}`}>
                                                    <em style={{ color: leftFit.color }}>{leftFit.text}</em>
                                                    <small>{formatDeltaCm(row.left.deltaRaw)}</small>
                                                </span>
                                                <span className={`vto-size-rec__compare-cell ${row.winner === 'right' ? 'winner' : ''}`}>
                                                    <em style={{ color: rightFit.color }}>{rightFit.text}</em>
                                                    <small>{formatDeltaCm(row.right.deltaRaw)}</small>
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <EmptyAvatarModal
                isOpen={showEmptyAvatarModal}
                onCreateAvatar={handleOpenAvatarStudio}
                onSkip={handleSkipAvatarSetup}
            />
        </div>
    );
}