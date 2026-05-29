import { Suspense, useState, useRef, useMemo, useEffect, useCallback, type ReactNode } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls, Environment, ContactShadows, Html, useProgress, Grid, MeshReflectorMaterial } from '@react-three/drei';
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
import TryOnToolbar from './components/TryOnToolbar';
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
    pose?: string;
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
    pose,
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
                <div className="vto-size-room__field vto-size-room__field--pills">
                    <span style={{ marginBottom: '6px', display: 'inline-block' }}>Kích cỡ:</span>
                    <div className="vto-premium-pill-group">
                        {availableSizes.map((size) => (
                            <button
                                key={`${panelLabel}-pill-${size}`}
                                type="button"
                                className={`vto-premium-pill ${size === selectedSize ? 'active' : ''}`}
                                onClick={() => onSelectSize(size)}
                            >
                                {size === selectedSize && (
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '4px' }}>
                                        <polyline points="20 6 9 17 4 12"></polyline>
                                    </svg>
                                )}
                                {size}
                            </button>
                        ))}
                    </div>
                </div>

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
                            {/* Grid và Sàn phản chiếu */}
                            <Grid position={[0, 0, 0]} args={[10, 10]} cellColor="#d1d5db" sectionColor="#9ca3af" fadeDistance={20} />
                            
                            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]}>
                                <planeGeometry args={[10, 10]} />
                                <MeshReflectorMaterial
                                    blur={[300, 100]}
                                    resolution={1024}
                                    mixBlur={1}
                                    mixStrength={40}
                                    roughness={1}
                                    depthScale={1.2}
                                    minDepthThreshold={0.4}
                                    maxDepthThreshold={1.4}
                                    color="#e2e8f0"
                                    metalness={0.5}
                                    mirror={0.5}
                                />
                            </mesh>

                            <Avatar body={bodyData} pose={pose || 'Idle'} skinColor="#F2C9AC" onSceneReady={setAvatarScene} />
                            <GarmentModel
                                config={modelConfig}
                                selectedSize={selectedSize}
                                selectedColor={selectedColor}
                                fabricOverride={selectedFabric}
                                avatarScene={avatarScene}
                                heatmapEnabled={heatmapEnabled}
                                heatmapZones={fitZones}
                            />
                            <ContactShadows position={[0, 0.01, 0]} opacity={0.6} scale={5} blur={2.5} resolution={1024} frames={1} />
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

const getZoneIcon = (label: string) => {
    const l = label.toLowerCase();
    if (l.includes('ngực') || l.includes('chest') || l.includes('bust')) return '🧥';
    if (l.includes('eo') || l.includes('waist')) return '📏';
    if (l.includes('hông') || l.includes('mông') || l.includes('hip')) return '👖';
    if (l.includes('vai') || l.includes('shoulder')) return '📐';
    if (l.includes('dài') || l.includes('length')) return '↕️';
    if (l.includes('tay') || l.includes('sleeve')) return '💪';
    if (l.includes('đùi') || l.includes('thigh')) return '🦵';
    return '📏';
};

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
    // const [isWishlisted, setIsWishlisted] = useState(false);
    const [selectedSidebarProduct, setSelectedSidebarProduct] = useState<TryOnProduct | null>(null);
    const [productSpecCache, setProductSpecCache] = useState<Record<string, TryOnProduct>>({});
    const [isTryOnGuideOpen, setIsTryOnGuideOpen] = useState(false);
    const [isSizeCompareRoomOpen, setIsSizeCompareRoomOpen] = useState(false);
    const [comparePose, setComparePose] = useState<string>('Idle');
    const [sizeComparePair, setSizeComparePair] = useState({ left: '', right: '' });
    // const [hasSidebarScrollFade, setHasSidebarScrollFade] = useState(false);
    const [isClosetOpen, setIsClosetOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<'size'|'fit'|'tools'>('size');
    const [showMeasurements, setShowMeasurements] = useState(false);
    const [lightingMode, setLightingMode] = useState<'studio'|'warm'|'cool'|'outdoor'>('studio');
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

    // const activeFitScopeLabel = useMemo(() => resolveFitScopeLabel(activeGarmentType), [activeGarmentType]);
    const isActiveItemReadyToWear = activeSelectedSize.length > 0 && activeSelectedColor.length > 0;
    const activeSelectedColorConfig = useMemo(
        () => resolveColorConfig(activeModel3D, activeSelectedColor),
        [activeModel3D, activeSelectedColor],
    );

    // const activeFabricKind = useMemo(() => {
    //     const selectedConfig = activeSelectedSize ? activeModel3D?.sizes?.[activeSelectedSize] : undefined;
    //     const colorFabric = activeSelectedColorConfig?.fabric;
    //     const resolved = colorFabric?.preset || colorFabric?.kind || selectedConfig?.fabric?.preset || selectedConfig?.fabric?.kind || activeModel3D?.fabric?.preset || activeModel3D?.fabric?.kind;
    //     return resolved || 'cotton';
    // }, [activeModel3D, activeSelectedColorConfig, activeSelectedSize]);

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

        if (currentBodyData) {
            setComparePose('Idle');
        }

        setIsTryOnGuideOpen(false);
        setIsSizeCompareRoomOpen(true);
    }, [canOpenSizeCompareRoom, showToast, currentBodyData]);

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
        <div className="tryon-layout">
            {/* ─── Top Navigation (Topbar) ─── */}
            <div className="tryon-topbar" style={{
              background: 'rgba(255,255,255,0.97)',
              borderBottom: '1px solid rgba(201,150,63,0.15)',
              backdropFilter: 'blur(12px)',
              display: 'flex',
              alignItems: 'center',
              padding: '0 16px',
              gap: '10px',
              position: 'sticky', top: 0, zIndex: 100
            }}>
                <button
                  onClick={handleBackToHome}
                  style={{
                    background: 'transparent',
                    border: '1px solid rgba(0,0,0,0.1)',
                    borderRadius: '20px', padding: '5px 14px',
                    fontSize: '11px', color: 'rgba(0,0,0,0.6)',
                    cursor: 'pointer'
                  }}
                >
                    ← Quay lại
                </button>
                <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                    <span style={{
                      fontSize: '10px', letterSpacing: '0.14em',
                      color: 'rgba(201,150,63,0.8)', marginRight: '10px', fontWeight: 600
                    }}>
                        ✦ VIRTUAL FITTING STUDIO
                    </span>
                    <div style={{
                      background: 'rgba(201,150,63,0.08)',
                      border: '1px solid rgba(201,150,63,0.25)',
                      borderRadius: '20px', padding: '4px 14px',
                      fontSize: '11px', color: '#2C1F0E', fontWeight: 500,
                      display: 'flex', alignItems: 'center', gap: '6px'
                    }}>
                        <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#C9963F' }} />
                        {activeItem.name} · Size {activeSelectedSize || '-'}
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '5px' }}>
                    <button style={{
                      background: 'rgba(201,150,63,0.12)',
                      border: '1px solid rgba(201,150,63,0.3)',
                      borderRadius: '20px', padding: '5px 12px',
                      fontSize: '10px', color: '#C9963F', cursor: 'pointer', fontWeight: 600
                    }}>Mặc định</button>
                    <button style={{
                      background: 'rgba(0,0,0,0.03)',
                      border: '1px solid rgba(0,0,0,0.08)',
                      borderRadius: '20px', padding: '5px 12px',
                      fontSize: '10px', color: 'rgba(0,0,0,0.6)', cursor: 'pointer'
                    }} onClick={() => toggleHeatmap()}>Nhiệt độ</button>
                    <button style={{
                      background: 'rgba(0,0,0,0.03)',
                      border: '1px solid rgba(0,0,0,0.08)',
                      borderRadius: '20px', padding: '5px 12px',
                      fontSize: '10px', color: 'rgba(0,0,0,0.6)', cursor: 'pointer'
                    }} onClick={() => setIsTryOnGuideOpen(true)}>Hướng dẫn</button>
                </div>
            </div>

            {/* ─── Vertical Toolbar (Left) ─── */}
            <TryOnToolbar
              showMeasurements={showMeasurements}
              onOpenAvatar={handleOpenAvatarStudio}
              onToggleCloset={() => setIsClosetOpen(true)}
              onToggleMeasurements={() => setShowMeasurements(s => !s)}
              onTakeScreenshot={handleScreenshot}
              onOpenSizeCompare={handleOpenSizeCompareRoom}
              onReset={() => {
                setCameraView('front');
                setCameraPos([0, 0.7, 4.5]);
                setCameraTarget([0, 0.4, 0]);
                setIsRotating(false);
              }}
              onChangeBackground={() => {}}
              onChangeLighting={() => {
                 const modes: ('studio'|'warm'|'cool'|'outdoor')[] = ['studio', 'warm', 'cool', 'outdoor'];
                 const nextIdx = (modes.indexOf(lightingMode) + 1) % modes.length;
                 setLightingMode(modes[nextIdx]);
              }}
            />

            {/* ─── Workspace Canvas ─── */}
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
                <div ref={(node) => setCanvasEventSource(node || undefined)} className={`canvas-studio-wrap light-${lightingMode}`}>
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

                {/* ─── Sidebar (Right Panel) ─── */}
                <aside className="vto-aside panel-scroll" style={{ background: '#FFFFFF', borderLeft: '1px solid rgba(201,150,63,0.15)', display: 'flex', flexDirection: 'column' }}>
                    {/* Header cố định */}
                    <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
                        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                            <img src={rightSidebarProduct.img || rightSidebarProduct.image} alt={rightSidebarProduct.name} style={{ width: '60px', height: '60px', borderRadius: '8px', objectFit: 'cover', border: '1px solid rgba(201,150,63,0.3)' }} />
                            <div>
                                <h2 style={{ fontSize: '16px', fontWeight: 600, color: '#2C1F0E', margin: '0 0 4px 0' }}>{rightSidebarProduct.name}</h2>
                                <p style={{ fontSize: '14px', color: '#C9963F', fontWeight: 500, margin: 0 }}>{Number(rightSidebarProduct.price)?.toLocaleString()} đ</p>
                            </div>
                        </div>
                        {/* Tabs */}
                        <div style={{ display: 'flex', gap: '20px', marginTop: '20px', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
                            {(['size', 'fit', 'tools'] as const).map(t => (
                                <button
                                  key={t}
                                  onClick={() => setActiveTab(t)}
                                  style={{
                                      background: 'none', border: 'none',
                                      padding: '8px 0', fontSize: '12px',
                                      fontWeight: 600, cursor: 'pointer',
                                      color: activeTab === t ? '#C9963F' : 'rgba(0,0,0,0.4)',
                                      borderBottom: activeTab === t ? '2px solid #C9963F' : '2px solid transparent'
                                  }}
                                >
                                    {t === 'size' ? 'MÀU & SIZE' : t === 'fit' ? 'ĐỘ VỪA VẶN' : 'CÔNG CỤ'}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Nội dung Tab cuộn được */}
                    <div className="panel-scroll" style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
                        {activeTab === 'size' && (
                            <div>
                                <h4 style={{ fontSize: '12px', color: 'rgba(0,0,0,0.5)', marginBottom: '12px', textTransform: 'uppercase' }}>Màu sắc</h4>
                                <ColorSelector
                                    colors={colorOptions}
                                    selectedColor={itemColors[activeItemKey] || ''}
                                    onSelectColor={handleItemColorChange}
                                />
                                <h4 style={{ fontSize: '12px', color: 'rgba(0,0,0,0.5)', marginTop: '24px', marginBottom: '12px', textTransform: 'uppercase' }}>Kích cỡ</h4>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                                    {availableSizes.map(sz => (
                                        <button
                                            key={sz}
                                            onClick={() => handleItemSizeChange(sz)}
                                            style={{
                                                padding: '10px',
                                                borderRadius: '6px',
                                                background: selectedSize === sz ? 'rgba(201,150,63,0.1)' : '#F9F9F9',
                                                border: selectedSize === sz ? '1px solid #C9963F' : '1px solid rgba(0,0,0,0.08)',
                                                color: selectedSize === sz ? '#C9963F' : '#2C1F0E',
                                                cursor: 'pointer',
                                                fontWeight: 500
                                            }}
                                        >
                                            {sz}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {activeTab === 'fit' && (
                            <div>
                                <SizeRecommendation
                                    profile={currentBodyData}
                                    availableSizes={availableSizes}
                                    selectedSize={itemSizes[activeItemKey] || null}
                                    onSelectSize={handleItemSizeChange}
                                    garmentSizeSpecs={activeGarmentSizeSpecs}
                                    garmentType={activeGarmentType}
                                />
                                <button
                                    onClick={handleOpenSizeCompareRoom}
                                    disabled={!canOpenSizeCompareRoom}
                                    style={{
                                        width: '100%', padding: '12px', marginTop: '16px',
                                        background: '#F9F9F9', border: '1px solid rgba(0,0,0,0.08)',
                                        color: '#2C1F0E', borderRadius: '6px', cursor: 'pointer', fontWeight: 500
                                    }}
                                >
                                    So sánh 2 size
                                </button>
                            </div>
                        )}

                        {activeTab === 'tools' && (
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                <button className="tool-btn-item" onClick={handleScreenshot} style={{ padding: '16px', background: '#F9F9F9', border: '1px solid rgba(0,0,0,0.08)', borderRadius: '8px', color: '#2C1F0E', cursor: 'pointer', fontWeight: 500 }}>
                                    📸 Chụp ảnh
                                </button>
                                <button className="tool-btn-item" onClick={() => handleSaveOutfit('Outfit')} style={{ padding: '16px', background: '#F9F9F9', border: '1px solid rgba(0,0,0,0.08)', borderRadius: '8px', color: '#2C1F0E', cursor: 'pointer', fontWeight: 500 }}>
                                    💾 Lưu Outfit
                                </button>
                                <button className="tool-btn-item" onClick={() => setIsRotating(r => !r)} style={{ padding: '16px', background: isRotating ? 'rgba(201,150,63,0.1)' : '#F9F9F9', border: isRotating ? '1px solid #C9963F' : '1px solid rgba(0,0,0,0.08)', borderRadius: '8px', color: isRotating ? '#C9963F' : '#2C1F0E', cursor: 'pointer', fontWeight: 500 }}>
                                    🔄 Xoay 360
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Footer CTA cố định */}
                    <div style={{ padding: '24px', borderTop: '1px solid rgba(0,0,0,0.05)', display: 'flex', gap: '12px' }}>
                        <button
                            onClick={() => onAddToCart(activeItem, activeSelectedSize || undefined)}
                            style={{ flex: 1, padding: '14px', background: 'transparent', border: '1px solid #C9963F', borderRadius: '30px', color: '#C9963F', fontWeight: 600, cursor: 'pointer' }}
                        >
                            GIỎ HÀNG
                        </button>
                        <button
                            onClick={() => onBuyNow(activeItem, activeSelectedSize || undefined)}
                            style={{ flex: 1, padding: '14px', background: '#C9963F', border: 'none', borderRadius: '30px', color: '#FFFFFF', fontWeight: 600, cursor: 'pointer' }}
                        >
                            MUA NGAY
                        </button>
                    </div>
                </aside>

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
                    style={{ background: 'rgba(15,11,7,0.4)', backdropFilter: 'blur(8px)' }}
                >
                    <div
                        className="vto-size-room vto-size-room--premium"
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="vto-size-room-title"
                        onClick={(event) => event.stopPropagation()}
                        style={{ background: '#FFFFFF', border: '1px solid rgba(201,150,63,0.2)', boxShadow: '0 24px 60px rgba(0,0,0,0.15)', color: '#2C1F0E' }}
                    >
                        <header className="vto-size-room__header" style={{ borderBottom: '1px solid rgba(0,0,0,0.08)' }}>
                            <div className="vto-size-room__header-left">
                                <div className="vto-size-room__header-top">
                                    <span className="vto-size-room__header-icon" aria-hidden="true">📏</span>
                                    <span className="vto-size-room__header-step">Công cụ tính năng cao cấp</span>
                                </div>
                                <div className="compare-title-wrapper" style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '4px' }}>
                                    <h3 id="vto-size-room-title" className="compare-title" style={{ color: '#2C1F0E', margin: 0, fontSize: '18px' }}>So sánh Size - Thử ngay trên người mẫu</h3>
                                    <span className="ar-ready-badge" style={{ background: 'linear-gradient(135deg, #C9963F 0%, #E8DCC8 100%)', color: '#fff', padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px', boxShadow: '0 4px 10px rgba(201,150,63,0.3)' }}>Real-time 3D</span>
                                </div>
                                <p className="compare-subtitle" style={{ color: 'rgba(0,0,0,0.5)', marginTop: '6px' }}>Quan sát trực quan độ vừa vặn trên Avatar 3D tỷ lệ thực của bạn.</p>
                            </div>
                            <button
                                type="button"
                                className="vto-size-room__close"
                                onClick={handleCloseSizeCompareRoom}
                                aria-label="Đóng phòng so sánh size"
                                style={{ color: '#2C1F0E' }}
                            >
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                    <line x1="18" y1="6" x2="6" y2="18" />
                                    <line x1="6" y1="6" x2="18" y2="18" />
                                </svg>
                            </button>
                        </header>

                        <div className="vto-size-room__toolbar">
                            <div className="vto-toolbar-group">
                                <span className="vto-toolbar-label">Tư thế:</span>
                                <button className={`vto-toolbar-btn ${comparePose === 'Idle' ? 'active' : ''}`} onClick={() => setComparePose('Idle')}>Đứng</button>
                                <button className={`vto-toolbar-btn ${comparePose === 'Walk' ? 'active' : ''}`} onClick={() => setComparePose('Walk')}>Đi bộ</button>
                                <button className={`vto-toolbar-btn ${comparePose === 'Pose' ? 'active' : ''}`} onClick={() => setComparePose('Pose')}>Tạo dáng</button>
                            </div>
                        </div>

                        <div className="vto-size-room__screens" style={{ background: '#FDFBF7' }}>
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
                                pose={comparePose}
                            />

                            <div className="vto-size-room__connector" aria-hidden="true" style={{ background: 'rgba(201,150,63,0.1)', color: '#C9963F' }}>
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
                                pose={comparePose}
                            />
                        </div>

                        <div className="vto-size-room__summary">
                            <p className="vto-size-room__color-note">Chế độ màu áo: <strong>{comparePreviewColorName}</strong></p>

                            <div className="vto-size-rec__compare-panel">
                                <div className="vto-size-rec__compare-scores">
                                    <div style={{ flex: 1 }}>
                                        <span style={{ display: 'block', fontSize: '11px', color: 'rgba(0,0,0,0.5)', marginBottom: '4px' }}>Size {sizeComparePair.left}</span>
                                        <div className="vto-fit-progress-wrapper">
                                            <div className="vto-fit-progress-bar">
                                                <div className="vto-fit-progress-fill" style={{ width: `${compareLeftResult.score}%`, background: compareLeftResult.score > 80 ? '#22c55e' : compareLeftResult.score > 60 ? '#eab308' : '#ef4444' }}></div>
                                            </div>
                                            <strong style={{ fontSize: '16px' }}>{compareLeftResult.score}%</strong>
                                        </div>
                                    </div>
                                    <div style={{ flex: 1, textAlign: 'right' }}>
                                        <span style={{ display: 'block', fontSize: '11px', color: 'rgba(0,0,0,0.5)', marginBottom: '4px' }}>Size {sizeComparePair.right}</span>
                                        <div className="vto-fit-progress-wrapper" style={{ justifyContent: 'flex-end' }}>
                                            <strong style={{ fontSize: '16px' }}>{compareRightResult.score}%</strong>
                                            <div className="vto-fit-progress-bar vto-fit-progress-bar--right">
                                                <div className="vto-fit-progress-fill" style={{ width: `${compareRightResult.score}%`, background: compareRightResult.score > 80 ? '#22c55e' : compareRightResult.score > 60 ? '#eab308' : '#ef4444' }}></div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="vto-size-rec__compare-diff-row" style={{ textAlign: 'center', marginBottom: '16px' }}>
                                    <span className={`vto-size-rec__compare-diff ${sizeCompareScoreDiff > 0 ? 'positive' : sizeCompareScoreDiff < 0 ? 'negative' : ''}`} style={{ background: sizeCompareScoreDiff > 0 ? 'rgba(34, 197, 94, 0.1)' : sizeCompareScoreDiff < 0 ? 'rgba(239, 68, 68, 0.1)' : 'rgba(0,0,0,0.05)', padding: '4px 12px', borderRadius: '12px', display: 'inline-block' }}>
                                        Chênh lệch: {sizeCompareScoreDiff > 0 ? '+' : ''}{sizeCompareScoreDiff}%
                                    </span>
                                </div>

                                <div className="vto-size-rec__compare-cards-container">
                                    {sizeCompareRows.map((row) => {
                                        const leftFit = FIT_LABELS[row.left.fit];
                                        const rightFit = FIT_LABELS[row.right.fit];

                                        return (
                                            <div key={row.label} className="vto-zone-card">
                                                <div className="vto-zone-card__header">
                                                    <span className="vto-zone-card__icon">{getZoneIcon(row.label)}</span>
                                                    <span className="vto-zone-card__title">{row.label}</span>
                                                </div>
                                                <div className="vto-zone-card__body">
                                                    <div className={`vto-zone-card__side ${row.winner === 'left' ? 'winner' : ''}`}>
                                                        <span className="vto-zone-card__size-label">Size {sizeComparePair.left}</span>
                                                        <div className="vto-zone-card__fit-status" style={{ color: leftFit.color, background: `${leftFit.color}15` }}>
                                                            <em>{leftFit.text}</em>
                                                            <small>{formatDeltaCm(row.left.deltaRaw)}</small>
                                                        </div>
                                                    </div>
                                                    <div className="vto-zone-card__divider"></div>
                                                    <div className={`vto-zone-card__side ${row.winner === 'right' ? 'winner' : ''}`}>
                                                        <span className="vto-zone-card__size-label">Size {sizeComparePair.right}</span>
                                                        <div className="vto-zone-card__fit-status" style={{ color: rightFit.color, background: `${rightFit.color}15` }}>
                                                            <em>{rightFit.text}</em>
                                                            <small>{formatDeltaCm(row.right.deltaRaw)}</small>
                                                        </div>
                                                    </div>
                                                </div>
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