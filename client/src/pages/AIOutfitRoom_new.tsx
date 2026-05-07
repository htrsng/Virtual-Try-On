import { Suspense, useState, useRef, useEffect, useCallback } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls, Environment, ContactShadows, Html, Grid } from '@react-three/drei';
import { useNavigate } from 'react-router-dom';
import * as THREE from 'three';
import { Avatar } from '../three/controls/avatar/Avatar';
import { useFittingRoom } from '../contexts/FittingRoomContext';
import GarmentModel from '../features/virtual-tryon/GarmentModel';
import AIOutfitSidebar from '../components/AIOutfitSidebar.tsx';
import CameraPresets from '../features/virtual-tryon/components/CameraPresets';
import type { CameraView } from '../features/virtual-tryon/components/CameraPresets';
import '../features/virtual-tryon/VirtualTryOn.css';

const AI_OUTFIT_ROOM_STYLES = `
  .ai-outfit-sidebar-container {
    width: 400px;
    border-left: 1px solid #e8e4df;
    background: #fff;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    flex-shrink: 0;
  }

  @media (max-width: 1024px) {
    .ai-outfit-sidebar-container {
      width: 320px;
    }
  }

  @media (max-width: 768px) {
    .ai-outfit-sidebar-container {
      display: none;
    }
  }

  .ai-outfit-room__environment-toggle {
    display: flex;
    align-items: center;
    position: relative;
    padding: 3px;
    background: rgba(255, 255, 255, 0.92);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    border-radius: 999px;
    border: 1px solid rgba(31, 26, 23, 0.08);
    box-shadow: 0 2px 12px rgba(31, 26, 23, 0.08);
    gap: 0;
    transition: border-color 0.4s ease, box-shadow 0.4s ease;
  }

  .ai-outfit-room__env-option {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 7px 12px;
    border: none;
    border-radius: 999px;
    background: transparent;
    color: var(--text-tertiary);
    font-size: 12px;
    font-weight: 600;
    cursor: pointer;
    position: relative;
    z-index: 2;
    transition: color 0.35s ease;
    white-space: nowrap;
    letter-spacing: 0.15px;
  }

  .ai-outfit-room__env-option.selected {
    color: #fff;
  }

  .ai-outfit-room__env-slider {
    position: absolute;
    top: 3px;
    left: 3px;
    width: calc(50% - 3px);
    height: calc(100% - 6px);
    border-radius: 999px;
    background: var(--text-primary);
    z-index: 1;
    transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1), background 0.4s ease;
    pointer-events: none;
  }

  .ai-outfit-room__environment-toggle.city .ai-outfit-room__env-slider {
    transform: translateX(0);
  }

  .ai-outfit-room__environment-toggle.studio .ai-outfit-room__env-slider {
    transform: translateX(100%);
    background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
  }
`;

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

    useEffect(() => {
        posRef.current.set(...targetPosition);
        lookRef.current.set(...targetLookAt);
    }, [targetPosition, targetLookAt]);

    useEffect(() => {
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

            <directionalLight position={[-2, 3, -2]} intensity={0.3} />

            {/* Environment & Background */}
            <color attach="background" args={['#f5f1e8']} />
            <Environment preset={environmentPreset} />
            <ContactShadows position={[0, -1.6, 0]} opacity={0.3} scale={12} blur={2.5} far={20} />

            {/* Grid for reference */}
            <Grid args={[10, 10]} cellSize={0.5} fadeDistance={10} fadeStrength={0.3} />

            {/* Camera animator for smooth transitions */}
            <CameraAnimator targetPosition={cameraPos} targetLookAt={cameraTarget} />

            {/* Avatar Base */}
            <Suspense fallback={<LoadingScreen />}>
                <Avatar
                    body={currentAvatar}
                    pose="T"
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

            {/* Camera Controls */}
            <OrbitControls
                enablePan={true}
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
    const { avatars, currentAvatarId, setCurrentAvatarId } = useFittingRoom();
    const webglContextHandlersRef = useRef<{ handleContextLost?: (e: Event) => void; handleContextRestored?: () => void }>({});

    // Camera controls state
    const [cameraView, setCameraView] = useState('front');
    const [cameraPos, setCameraPos] = useState<[number, number, number]>([0, 0.7, 4.5]);
    const [cameraTarget, setCameraTarget] = useState<[number, number, number]>([0, 0.4, 0]);
    const [isRotating, setIsRotating] = useState(false);

    // Environment state
    const [environmentPreset, setEnvironmentPreset] = useState<'city' | 'studio'>('city');

    const handleBackToHome = useCallback(() => {
        navigate('/');
    }, [navigate]);

    const handleCanvasCreated = useCallback(
        ({ gl }: { gl: THREE.WebGLRenderer }) => {
            if (!gl || !gl.domElement) return;

            // Setup WebGL context loss handlers directly when renderer is ready
            const handleContextLost = (event: Event) => {
                event.preventDefault();
                setIsWebglContextLost(true);
                console.warn('WebGL context lost in AI Outfit Room');
            };

            const handleContextRestored = () => {
                setIsWebglContextLost(false);
                console.log('WebGL context restored in AI Outfit Room');
            };

            const canvas = gl.domElement;
            canvas.addEventListener('webglcontextlost', handleContextLost, false);
            canvas.addEventListener('webglcontextrestored', handleContextRestored, false);

            // Store handlers for cleanup on unmount
            webglContextHandlersRef.current = { handleContextLost, handleContextRestored };
        },
        []
    );

    // Cleanup WebGL context listeners on unmount
    useEffect(() => {
        return () => {
            const handlers = webglContextHandlersRef.current;
            if (handlers.handleContextLost && handlers.handleContextRestored) {
                const canvases = document.querySelectorAll('canvas');
                canvases.forEach((canvas) => {
                    if (handlers.handleContextLost) {
                        canvas.removeEventListener('webglcontextlost', handlers.handleContextLost, false);
                    }
                    if (handlers.handleContextRestored) {
                        canvas.removeEventListener('webglcontextrestored', handlers.handleContextRestored, false);
                    }
                });
            }
        };
    }, []);

    const handleCameraView = useCallback((view: CameraView) => {
        setCameraView(view.id);
        setCameraPos(view.position);
        setCameraTarget(view.target);
        if (isRotating) setIsRotating(false);
    }, [isRotating]);

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

                {/* Main Workspace */}
                <div className="vto-workspace">
                    {/* 3D Canvas Area with Fixed Height */}
                    <div className="vto-canvas-area" style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
                        <Canvas
                            frameloop={isWebglContextLost ? 'never' : 'always'}
                            dpr={[1, 1.5]}
                            camera={{ position: cameraPos, fov: 32 }}
                            shadows
                            gl={{
                                antialias: true,
                                preserveDrawingBuffer: true,
                                powerPreference: 'high-performance',
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

                        {/* Camera Controls Overlay - Bottom Left */}
                        <div className="vto-canvas-overlay vto-canvas-overlay--bottom-left">
                            <CameraPresets
                                activeView={cameraView}
                                isRotating={isRotating}
                                onSelectView={handleCameraView}
                                onToggleRotate={() => setIsRotating(r => !r)}
                            />
                        </div>

                        {/* Environment Toggle Overlay - Top Right */}
                        <div className="vto-canvas-overlay vto-canvas-overlay--top-right">
                            <div className={`ai-outfit-room__environment-toggle ${environmentPreset}`}>
                                <button
                                    type="button"
                                    className={`ai-outfit-room__env-option ${environmentPreset === 'city' ? 'selected' : ''}`}
                                    onClick={() => setEnvironmentPreset('city')}
                                    title="Môi trường thành phố"
                                >
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                                        <polyline points="9 22 9 12 15 12 15 22" />
                                    </svg>
                                    Thành phố
                                </button>
                                <button
                                    type="button"
                                    className={`ai-outfit-room__env-option ${environmentPreset === 'studio' ? 'selected' : ''}`}
                                    onClick={() => setEnvironmentPreset('studio')}
                                    title="Môi trường studio"
                                >
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                        <circle cx="12" cy="12" r="10" />
                                        <path d="M8 14s1.5 2 4 2 4-2 4-2" />
                                        <line x1="9" y1="9" x2="9" y2="9.01" />
                                        <line x1="15" y1="9" x2="15" y2="9.01" />
                                    </svg>
                                    Studio
                                </button>
                                <span className="ai-outfit-room__env-slider" />
                            </div>
                        </div>

                        {/* Closet Button Overlay - Top Left */}
                        <div className="vto-canvas-overlay vto-canvas-overlay--top-left">
                            <button
                                type="button"
                                className="vto-closet-button"
                                aria-label="Mở tủ đồ cá nhân"
                                title="Virtual Personal Closet - Tủ Đồ Cá Nhân"
                            >
                                <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true">
                                    <path d="M20 6h-2.15a2.5 2.5 0 0 0-4.7 0H6.85a2.5 2.5 0 0 0-4.7 0H2a1 1 0 0 0-1 1v11a3 3 0 0 0 3 3h16a3 3 0 0 0 3-3V7a1 1 0 0 0-1-1zm-9-2a.5.5 0 1 1 1 0 .5.5 0 0 1-1 0zm9 13H4a1 1 0 0 1-1-1V8h18v10a1 1 0 0 1-1 1z" />
                                </svg>
                                <span className="vto-closet-button__label">Tủ đồ</span>
                            </button>
                        </div>
                    </div>

                    {/* Right Sidebar: AI Outfit Sidebar */}
                    <div className="ai-outfit-sidebar-container">
                        <AIOutfitSidebar />
                    </div>
                </div>
            </div>

            <style>{AI_OUTFIT_ROOM_STYLES}</style>
        </>
    );
}
