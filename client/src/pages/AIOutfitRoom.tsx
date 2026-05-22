import { Suspense, useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls, Environment, ContactShadows, Html, Grid } from '@react-three/drei';
import { useNavigate } from 'react-router-dom';
import * as THREE from 'three';
import { Avatar } from '../three/controls/avatar/Avatar';
import { useFittingRoom } from '../contexts/FittingRoomContext';
import GarmentModel from '../features/virtual-tryon/GarmentModel';
import FilterPanel from '../components/outfit/FilterPanel';
import OutfitCard from '../components/OutfitCard.tsx';
import CameraPresets from '../features/virtual-tryon/components/CameraPresets';
import type { CameraView } from '../features/virtual-tryon/components/CameraPresets';
import type { AIOutfit, AIOutfitItem } from '../types/aiOutfit';
import type { OutfitFilter } from '../types/outfit';
import '../features/virtual-tryon/VirtualTryOn.css';

const AI_OUTFIT_ROOM_STYLES = `
    /* Left panel — warm cream */
    .ai-outfit-left-container {
        width: 300px;
        border-right: 1px solid rgba(200,168,103,0.18);
        background: linear-gradient(180deg, #fffdf9 0%, #faf5ec 100%);
        display: flex;
        flex-direction: column;
        overflow: hidden;
        flex-shrink: 0;
    }

    /* Right panel — dark luxury */
    .ai-outfit-right-container {
        width: 360px;
        border-left: 1px solid rgba(200,168,103,0.18);
        background: linear-gradient(180deg, #1a1612 0%, #211c17 100%);
        display: flex;
        flex-direction: column;
        overflow: hidden;
        flex-shrink: 0;
    }

    /* Right header */
    .ai-outfit-right-header {
        padding: 18px 20px 14px;
        border-bottom: 1px solid rgba(200,168,103,0.15);
        background: linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%);
        position: relative;
    }

    .ai-outfit-right-header::after {
        content: '';
        position: absolute;
        bottom: 0; left: 20px; right: 20px;
        height: 1px;
        background: linear-gradient(90deg, transparent, rgba(200,168,103,0.3), transparent);
    }

    .ai-outfit-right-eyebrow {
        font-size: 9px;
        font-weight: 800;
        letter-spacing: 0.14em;
        text-transform: uppercase;
        color: rgba(200,168,103,0.7);
        margin: 0 0 5px;
        display: flex;
        align-items: center;
        gap: 6px;
    }

    .ai-outfit-right-eyebrow::before {
        content: '✦';
        font-size: 8px;
        color: rgba(200,168,103,0.55);
    }

    .ai-outfit-right-title {
        margin: 0 0 3px 0;
        font-size: 16px;
        font-weight: 700;
        color: rgba(255,255,255,0.92);
        letter-spacing: -0.01em;
    }

    .ai-outfit-right-subtitle {
        margin: 0;
        font-size: 11px;
        color: rgba(255,255,255,0.38);
        line-height: 1.4;
    }

    /* Right scroll area */
    .ai-outfit-right-scroll {
        flex: 1;
        overflow-y: auto;
        padding: 16px;
        display: flex;
        flex-direction: column;
        gap: 12px;
        scrollbar-width: thin;
        scrollbar-color: rgba(200,168,103,0.25) transparent;
    }

    .ai-outfit-right-scroll::-webkit-scrollbar { width: 5px; }
    .ai-outfit-right-scroll::-webkit-scrollbar-thumb {
        background: rgba(200,168,103,0.25);
        border-radius: 4px;
    }

    /* Empty state */
    .ai-outfit-right-empty {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        min-height: 260px;
        gap: 14px;
        padding: 20px;
    }

    .ai-outfit-right-empty-icon {
        font-size: 36px;
        line-height: 1;
        filter: drop-shadow(0 4px 12px rgba(200,168,103,0.3));
    }

    .ai-outfit-right-empty-title {
        font-size: 14px;
        font-weight: 700;
        color: rgba(255,255,255,0.75);
        text-align: center;
        margin: 0;
    }

    .ai-outfit-right-empty-desc {
        font-size: 12px;
        color: rgba(255,255,255,0.38);
        text-align: center;
        margin: 0;
        line-height: 1.5;
        max-width: 220px;
    }

    /* Loading state */
    .ai-outfit-right-loading {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        min-height: 220px;
        gap: 14px;
    }

    .ai-outfit-right-loading p {
        font-size: 13px;
        color: rgba(255,255,255,0.55);
        margin: 0;
        font-weight: 500;
        letter-spacing: 0.02em;
    }

    /* Gold spinner */
    .ai-outfit-spinner {
        width: 32px;
        height: 32px;
        border: 2.5px solid rgba(200,168,103,0.15);
        border-top-color: rgba(200,168,103,0.8);
        border-radius: 50%;
        animation: aio-spin 0.85s linear infinite;
    }

    @keyframes aio-spin { to { transform: rotate(360deg); } }

    /* Error state */
    .ai-outfit-error {
        margin: 12px 16px 0;
        border: 1px solid rgba(239,68,68,0.25);
        background: rgba(239,68,68,0.08);
        color: rgba(255,160,160,0.9);
        border-radius: 12px;
        padding: 11px 14px;
        font-size: 13px;
        backdrop-filter: blur(8px);
    }

    .ai-outfit-error strong {
        display: block;
        margin-bottom: 4px;
        color: rgba(255,120,120,0.95);
    }

    /* Tab buttons in nav */
    .ai-outfit-nav-tabs {
        display: flex;
        gap: 6px;
        margin-left: 12px;
    }

    .ai-outfit-tab-btn {
        padding: 7px 14px;
        border-radius: 100px;
        border: 1px solid rgba(200,168,103,0.25);
        background: rgba(255,255,255,0.06);
        color: rgba(255,255,255,0.75);
        font-size: 12px;
        font-weight: 700;
        cursor: pointer;
        transition: all 0.18s ease;
        font-family: inherit;
        letter-spacing: 0.01em;
    }

    .ai-outfit-tab-btn:hover {
        background: rgba(200,168,103,0.12);
        border-color: rgba(200,168,103,0.40);
        color: #f5d9a0;
    }

    .ai-outfit-tab-btn--on {
        background: linear-gradient(135deg, rgba(200,168,103,0.22) 0%, rgba(200,168,103,0.14) 100%);
        border-color: rgba(200,168,103,0.50);
        color: #f5d9a0;
        box-shadow: 0 0 14px rgba(200,168,103,0.18);
    }

    @media (max-width: 1024px) {
        .ai-outfit-left-container { width: 270px; }
        .ai-outfit-right-container { width: 300px; }
    }

    @media (max-width: 768px) {
        .ai-outfit-left-container,
        .ai-outfit-right-container { display: none; }
    }

    .vto-canvas-overlay--bottom-left { z-index: 3; }
`;


const RAW_API_URL = import.meta.env.VITE_API_URL || '';
const API_BASE_URL = RAW_API_URL.trim().replace(/\/$/, '');
const AI_OUTFIT_SUGGEST_ENDPOINT = API_BASE_URL
    ? `${API_BASE_URL}/api/ai/outfit-suggest`
    : '/api/ai/outfit-suggest';

const OCCASION_MAP: Record<string, string> = {
    cafe: 'đi cafe',
    office: 'đi làm công sở',
    street: 'dạo phố',
    party: 'đi tiệc',
    travel: 'đi du lịch',
    date: 'hẹn hò',
};

const getToken = () =>
    localStorage.getItem('token') ||
    localStorage.getItem('accessToken') ||
    localStorage.getItem('authToken') ||
    localStorage.getItem('jwt') ||
    sessionStorage.getItem('token') ||
    sessionStorage.getItem('accessToken') ||
    '';

const buildPromptFromFilter = (filter: OutfitFilter) => {
    const parts: string[] = [];

    if (filter.description.trim()) {
        parts.push(filter.description.trim());
    }

    if (filter.occasions.length > 0) {
        parts.push(`Dịp: ${filter.occasions.map((occasion) => OCCASION_MAP[occasion] ?? occasion).join(', ')}`);
    }

    if (filter.styles.length > 0) {
        parts.push(`Phong cách: ${filter.styles.join(', ')}`);
    }

    if (filter.colors.length > 0) {
        parts.push(`Tông màu: ${filter.colors.join(', ')}`);
    }

    parts.push(`Ngân sách tối đa: ${new Intl.NumberFormat('vi-VN').format(filter.budget)}đ`);

    return parts.join('. ') || 'Gợi ý outfit phù hợp cho tôi';
};

const mapLayerToCategory = (layer?: string): AIOutfitItem['layer'] => {
    const normalized = (layer || '').toLowerCase();

    if (normalized.includes('bottom')) return 'bottoms';
    if (normalized.includes('shoe')) return 'shoes';
    if (normalized.includes('outer')) return 'outerwear';
    if (normalized.includes('dress')) return 'dresses';
    if (normalized.includes('access')) return 'outerwear';
    return 'tops';
};

const normalizeOutfitItem = (item: any): AIOutfitItem => ({
    productId: String(item.productId ?? item.id ?? crypto.randomUUID()),
    type: item.type === 'closet' ? 'closet' : 'shop',
    layer: mapLayerToCategory(item.layer ?? item.slot ?? item.category),
    model3DUrl: item.model3DUrl ?? item.model3dUrl ?? item.model3D?.url ?? '',
    thumbnail: item.thumbnail ?? item.thumbnailUrl ?? item.imageUrl ?? item.img ?? '',
    name: item.name ?? 'Sản phẩm',
    price: typeof item.price === 'number' ? item.price : Number(item.price) || undefined,
    source: item.source,
});

const normalizeOutfits = (data: any): AIOutfit[] => {
    const outfitsSource = Array.isArray(data?.outfits) && data.outfits.length > 0
        ? data.outfits
        : [{
            name: data?.outfitName ?? 'Outfit AI',
            description: data?.explanation ?? data?.message ?? '',
            occasion: data?.occasion,
            items: Array.isArray(data?.outfit) ? data.outfit : Array.isArray(data?.suggestions) ? data.suggestions : [],
        }];

    return outfitsSource.slice(0, 3).map((outfit: any, index: number) => ({
        id: `ai-outfit-${Date.now()}-${index}`,
        name: outfit.name ?? `Outfit ${index + 1}`,
        description: outfit.description ?? data?.explanation ?? '',
        occasion: outfit.occasion ?? data?.occasion,
        items: Array.isArray(outfit.items)
            ? outfit.items.map(normalizeOutfitItem)
            : [],
    })).filter((outfit: AIOutfit) => outfit.items.length > 0);
};

function LoadingScreen() {
    return (
        <Html center>
            <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '12px',
            }}>
                <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    border: '3px solid rgba(255,255,255,0.2)',
                    borderTopColor: 'white',
                    animation: 'spin 0.8s linear infinite',
                }} />
                <span style={{ color: 'white', fontSize: '14px' }}>Đang tải...</span>
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
        </Html>
    );
}

// Camera animator for smooth transitions between views
function CameraAnimator({ targetPosition, targetLookAt }: { targetPosition: [number, number, number]; targetLookAt: [number, number, number] }) {
    const { camera } = useThree();
    const posRef = useRef(new THREE.Vector3(...targetPosition));
    const lookRef = useRef(new THREE.Vector3(...targetLookAt));
    const isAnimatingRef = useRef(false);

    useEffect(() => {
        posRef.current.set(...targetPosition);
        lookRef.current.set(...targetLookAt);
    }, [targetPosition, targetLookAt]);

    useEffect(() => {
        let frameId: number;
        isAnimatingRef.current = true;

        const animate = () => {
            const distToCam = camera.position.distanceTo(posRef.current);
            if (distToCam > 0.05) {
                camera.position.lerp(posRef.current, 0.1);
                camera.lookAt(lookRef.current);
                frameId = requestAnimationFrame(animate);
            } else {
                isAnimatingRef.current = false;
            }
        };

        frameId = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(frameId);
    }, [camera, targetPosition, targetLookAt]);

    return null;
}

interface SceneContentProps {
    environmentPreset: 'city' | 'studio';
    cameraPos: [number, number, number];
    cameraTarget: [number, number, number];
    isRotating: boolean;
}

function SceneContent({ environmentPreset, cameraPos, cameraTarget, isRotating }: SceneContentProps) {
    const { currentAvatar, layeredGarments } = useFittingRoom();
    const [avatarScene, setAvatarScene] = useState<THREE.Group | null>(null);

    return (
        <>
            {/* Lighting Setup */}
            <ambientLight intensity={0.4} />

            <directionalLight
                position={[3, 6, 4]}
                intensity={1.15}
                castShadow
                shadow-mapSize-width={512}
                shadow-mapSize-height={512}
                shadow-camera-near={0.5}
                shadow-camera-far={20}
                shadow-camera-left={-3}
                shadow-camera-right={3}
                shadow-camera-top={4}
                shadow-camera-bottom={-2}
                shadow-bias={-0.0005}
            />
            <directionalLight position={[-2, 3, -2]} intensity={0.3} />
            {/* Hemisphere light for soft ambient occlusion feel */}
            <hemisphereLight args={['#f5f0e8', '#3a3228', 0.35]} />

            {/* Environment & Background */}
            <color attach="background" args={['#f5f1e8']} />
            <Environment preset={environmentPreset} />
            <ContactShadows position={[0, 0.01, 0]} opacity={0.32} blur={1.6} resolution={256} frames={1} far={3} />

            {/* Camera animator for smooth transitions */}
            <CameraAnimator targetPosition={cameraPos} targetLookAt={cameraTarget} />

            {/* Avatar Base with Grid */}
            <group position={[0, -1.15, 0]}>
                <Grid position={[0, 0, 0]} args={[10, 10]} cellColor="#d1d5db" sectionColor="#9ca3af" fadeDistance={20} />
                <Suspense fallback={<LoadingScreen />}>
                    <Avatar
                        body={currentAvatar}
                        pose="Idle"
                        skinColor="#F2C9AC"
                        onSceneReady={setAvatarScene}
                    />
                </Suspense>

                {/* Render Garments */}
                {Object.entries(layeredGarments).map(([slot, garment]) => {
                    if (!garment || !garment.model3D || !garment.model3D.url) {
                        return null;
                    }

                    const config = {
                        enable: true,
                        sizes: {
                            M: {
                                url: String((garment as any).model3D.url),
                                autoNormalize: true,
                                followAvatarBones: false,
                            },
                        },
                    };

                    return (
                        <Suspense key={`${slot}-${garment.itemId}`} fallback={null}>
                            <GarmentModel
                                config={config}
                                selectedSize="M"
                                selectedColor={garment.purchasedColor || '#f5f1e8'}
                                avatarScene={avatarScene}
                                heatmapEnabled={false}
                            />
                        </Suspense>
                    );
                })}
            </group>

            {/* Camera Controls */}
            <OrbitControls
                enablePan={false}
                enableZoom={true}
                autoRotate={isRotating}
                autoRotateSpeed={2}
                enableDamping
                dampingFactor={0.08}
                minDistance={2.5}
                maxDistance={5.5}
            />
        </>
    );
}

export default function AIOutfitRoom() {
    const navigate = useNavigate();
    const [isWebglContextLost, setIsWebglContextLost] = useState(false);
    const { avatars, currentAvatarId, setCurrentAvatarId, currentAvatar, layeredGarments } = useFittingRoom();
    const canvasAreaRef = useRef<HTMLDivElement | null>(null);
    const canvasElementRef = useRef<HTMLCanvasElement | null>(null);
    const webglContextHandlersRef = useRef<{
        handleContextLost?: (event: Event) => void;
        handleContextRestored?: () => void;
    }>({});

    const [activeTab, setActiveTab] = useState<'describe' | 'occasion'>('describe');
    const [filter, setFilter] = useState<OutfitFilter>({
        occasions: [],
        styles: [],
        colors: [],
        budget: 2000000,
        description: '',
    });
    const [outfits, setOutfits] = useState<AIOutfit[]>([]);
    const [isGenerating, setIsGenerating] = useState(false);
    const [error, setError] = useState<string>('');
    const [closetItems, setClosetItems] = useState<any[]>([]);

    // Camera controls state
    const [cameraView, setCameraView] = useState('front');
    const [cameraPos, setCameraPos] = useState<[number, number, number]>([0, 0.7, 4.5]);
    const [cameraTarget, setCameraTarget] = useState<[number, number, number]>([0, 0.4, 0]);
    const [isRotating, setIsRotating] = useState(false);

    // Keep a single environment to reduce UI/logic complexity.
    const environmentPreset: 'city' | 'studio' = 'city';

    const avatarData = useMemo(
        () => ({
            currentAvatar,
            layeredGarments,
        }),
        [currentAvatar, layeredGarments],
    );

    useEffect(() => {
        const token = getToken();
        if (!token) return;

        fetch('/api/virtual-closet', {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        })
            .then((response) => response.json())
            .then((data) => setClosetItems(Array.isArray(data?.items) ? data.items : []))
            .catch(() => setClosetItems([]));
    }, []);

    const handleBackToHome = useCallback(() => {
        navigate('/');
    }, [navigate]);

    const handleGenerateOutfit = useCallback(async () => {
        const token = getToken();
        if (!token) {
            setError('Vui lòng đăng nhập để sử dụng AI Stylist');
            return;
        }

        setIsGenerating(true);
        setError('');
        setOutfits([]);

        try {
            const response = await fetch(AI_OUTFIT_SUGGEST_ENDPOINT, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    userPrompt: buildPromptFromFilter(filter),
                    filter,
                    closetItems: closetItems.slice(0, 10),
                    avatarData,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData?.message || errorData?.error || `API Error: ${response.status}`);
            }

            const data = await response.json();
            setOutfits(normalizeOutfits(data));
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Không thể tạo gợi ý phối đồ');
        } finally {
            setIsGenerating(false);
        }
    }, [avatarData, closetItems, filter]);

    const handleCanvasCreated = useCallback(
        ({ gl }: { gl: THREE.WebGLRenderer }) => {
            if (!gl || !gl.domElement) return;

            const handleContextLost = (event: Event) => {
                event.preventDefault();
                setIsWebglContextLost(true);
            };

            const handleContextRestored = () => {
                setIsWebglContextLost(false);
            };

            const canvas = gl.domElement;
            canvasElementRef.current = canvas;
            webglContextHandlersRef.current = { handleContextLost, handleContextRestored };
            canvas.addEventListener('webglcontextlost', handleContextLost, false);
            canvas.addEventListener('webglcontextrestored', handleContextRestored, false);
        },
        []
    );

    // Cleanup WebGL context listeners on unmount
    useEffect(() => {
        return () => {
            const canvas = canvasElementRef.current;
            const { handleContextLost, handleContextRestored } = webglContextHandlersRef.current;

            if (canvas && handleContextLost && handleContextRestored) {
                canvas.removeEventListener('webglcontextlost', handleContextLost, false);
                canvas.removeEventListener('webglcontextrestored', handleContextRestored, false);
            }

            canvasElementRef.current = null;
            webglContextHandlersRef.current = {};
        };
    }, []);

    const handleCameraView = useCallback((view: CameraView) => {
        setCameraView(view.id);
        setCameraPos(view.position);
        setCameraTarget(view.target);
        if (isRotating) setIsRotating(false);
    }, [isRotating]);

    const Avatar3DCanvas = () => (
        <div ref={canvasAreaRef} className="vto-canvas-area" style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
            <Canvas
                eventSource={canvasAreaRef}
                frameloop={isWebglContextLost ? 'never' : 'always'}
                dpr={[1, 1.2]}
                camera={{ position: cameraPos, fov: 32 }}
                shadows
                gl={{
                    antialias: false,
                    preserveDrawingBuffer: false,
                    powerPreference: 'default',
                }}
                onCreated={handleCanvasCreated}
                style={{ width: '100%', height: '100%', display: 'block' }}
            >
                <SceneContent
                    environmentPreset={environmentPreset}
                    cameraPos={cameraPos}
                    cameraTarget={cameraTarget}
                    isRotating={isRotating}
                />
            </Canvas>

            <div className="vto-canvas-overlay vto-canvas-overlay--bottom-left">
                <CameraPresets
                    activeView={cameraView}
                    isRotating={isRotating}
                    onSelectView={handleCameraView}
                    onToggleRotate={() => setIsRotating((value) => !value)}
                />
            </div>

            {isWebglContextLost && (
                <div style={{
                    position: 'absolute',
                    inset: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'rgba(255,255,255,0.55)',
                    color: '#111827',
                    fontSize: 14,
                    fontWeight: 600,
                }}>
                    Đang khôi phục 3D canvas...
                </div>
            )}
        </div>
    );

    return (
        <>
            <div className="vto-container">
                {/* Top Navigation */}
                <header className="vto-nav">
                    <button className="vto-nav__back" onClick={handleBackToHome}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                            <polyline points="15 18 9 12 15 6" />
                        </svg>
                        <span>Quay lại</span>
                    </button>

                    <div className="vto-nav__avatar-picker">
                        <span className="vto-nav__avatar-label">Avatar</span>
                        <select
                            className="vto-nav__avatar-select"
                            value={currentAvatarId || ''}
                            onChange={(e) => setCurrentAvatarId(e.target.value)}
                            disabled={avatars.length === 0}
                        >
                            {avatars.length === 0 && <option value="">Khách mặc định</option>}
                            {avatars.map((avatar) => (
                                <option key={avatar.id} value={avatar.id}>
                                    {avatar.name}
                                </option>
                            ))}
                        </select>
                        <button
                            type="button"
                            className="vto-nav__avatar-add"
                            onClick={() => navigate('/avatar-studio', { state: { returnTo: '/ai-outfit' } })}
                            aria-label="Tạo avatar mới"
                            title="Tạo avatar mới"
                        >
                            +
                        </button>
                    </div>

                    {/* Tab buttons in nav */}
                    <div className="ai-outfit-nav-tabs">
                        <button
                            type="button"
                            className={`ai-outfit-tab-btn${activeTab === 'describe' ? ' ai-outfit-tab-btn--on' : ''}`}
                            onClick={() => setActiveTab('describe')}
                        >
                            Gợi ý theo mô tả
                        </button>
                        <button
                            type="button"
                            className={`ai-outfit-tab-btn${activeTab === 'occasion' ? ' ai-outfit-tab-btn--on' : ''}`}
                            onClick={() => setActiveTab('occasion')}
                        >
                            Chọn theo dịp
                        </button>
                    </div>

                    <span className="vto-nav__help-btn" style={{ marginLeft: 'auto' }} title="Phòng AI Gợi Ý Phối Đồ">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10" />
                            <path d="M9.1 9a3 3 0 1 1 5.8 1c-.3.8-.9 1.3-1.6 1.7-.7.4-1.3.9-1.3 1.8" />
                            <circle cx="12" cy="17" r="1" fill="currentColor" stroke="none" />
                        </svg>
                        <span>AI Phối Đồ</span>
                    </span>

                    <span className="vto-nav__spacer" />
                </header>

                {error && (
                    <div className="ai-outfit-error">
                        <strong>Lỗi AI Outfit</strong>
                        <span>{error}</span>
                    </div>
                )}

                {/* Main Workspace */}
                <div className="vto-workspace">
                    <div className="ai-outfit-left-container">
                        <FilterPanel
                            activeTab={activeTab}
                            filter={filter}
                            onChange={setFilter}
                            onGenerate={handleGenerateOutfit}
                            isGenerating={isGenerating}
                        />
                    </div>

                    <div className="vto-canvas-area" style={{ flex: 2, minWidth: 0, position: 'relative', overflow: 'hidden' }}>
                        <Avatar3DCanvas />
                    </div>

                    <div className="ai-outfit-right-container">
                        <div className="ai-outfit-right-header">
                            <p className="ai-outfit-right-eyebrow">Gemini AI Stylist</p>
                            <h2 className="ai-outfit-right-title">Gợi ý AI</h2>
                            <p className="ai-outfit-right-subtitle">Outfit được tạo riêng cho bạn</p>
                        </div>

                        <div className="ai-outfit-right-scroll">
                            {isGenerating ? (
                                <div className="ai-outfit-right-loading">
                                    <div className="ai-outfit-spinner" />
                                    <p>Đang tạo gợi ý outfit...</p>
                                </div>
                            ) : outfits.length === 0 ? (
                                <div className="ai-outfit-right-empty">
                                    <span className="ai-outfit-right-empty-icon">✨</span>
                                    <p className="ai-outfit-right-empty-title">Chưa có gợi ý nào</p>
                                    <p className="ai-outfit-right-empty-desc">Nhập mô tả ở panel bên trái rồi bấm <strong style={{color:'rgba(200,168,103,0.85)'}}>Tạo outfit với AI</strong></p>
                                </div>
                            ) : (
                                outfits.map((outfit) => (
                                    <OutfitCard key={outfit.id} outfit={outfit} />
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <style>{AI_OUTFIT_ROOM_STYLES}</style>
        </>
    );
}
