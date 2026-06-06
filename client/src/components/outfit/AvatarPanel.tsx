import { Suspense, memo, useMemo, useRef, useState, useEffect, useCallback } from 'react'
import { Canvas, useThree } from '@react-three/fiber'
import { OrbitControls, Grid, Html } from '@react-three/drei'
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'
import * as THREE from 'three'
import { Avatar } from '../../three/controls/avatar/Avatar'
import GarmentModel from '../../features/virtual-tryon/GarmentModel'
import TryOnScene from '../tryon/TryOnScene'
import { useFittingRoom } from '../../contexts/FittingRoomContext'
import { OutfitResult, ViewAngle } from '../../types/outfit'

interface AvatarPanelProps {
  selectedOutfit: OutfitResult | null
  isGenerating: boolean
  viewAngle: ViewAngle
  onViewChange: (angle: ViewAngle) => void
  outfits?: OutfitResult[]
  activeOutfitIndex?: number
  onSelectOutfit?: (index: number) => void
}

const CAMERA_PRESETS: Record<ViewAngle, { position: [number, number, number], target: [number, number, number] }> = {
  front: { position: [0, 0.7, 4.2], target: [0, 0.4, 0] },
  back: { position: [0, 0.7, -4.2], target: [0, 0.4, 0] },
  left: { position: [-4.2, 0.7, 0], target: [0, 0.4, 0] },
  right: { position: [4.2, 0.7, 0], target: [0, 0.4, 0] },
}

function LoadingScreen() {
  return (
    <Html center>
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 10,
      }}>
        <div style={{
          width: 34,
          height: 34,
          borderRadius: '50%',
          border: '3px solid rgba(255,255,255,0.4)',
          borderTopColor: '#10b981',
          animation: 'spin 0.8s linear infinite',
        }} />
        <span style={{ color: '#e2e8f0', fontSize: 12 }}>Đang tải avatar...</span>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </Html>
  )
}

function CameraViewController({ view, controlsRef }: { view: ViewAngle, controlsRef: React.RefObject<OrbitControlsImpl | null> }) {
  const { camera } = useThree()

  useEffect(() => {
    const preset = CAMERA_PRESETS[view]
    camera.position.set(...preset.position)
    camera.lookAt(...preset.target)
    controlsRef.current?.target.set(...preset.target)
    controlsRef.current?.update()
  }, [camera, controlsRef, view])

  return null
}

function AvatarPanel({
  selectedOutfit,
  isGenerating,
  viewAngle,
  onViewChange,
  outfits = [],
  activeOutfitIndex = 0,
  onSelectOutfit = () => { },
}: AvatarPanelProps) {
  const { currentAvatar, layeredGarments } = useFittingRoom()
  const [avatarScene, setAvatarScene] = useState<THREE.Group | null>(null)
  const [isWebglContextLost, setIsWebglContextLost] = useState(false)
  const [lossCount, setLossCount] = useState(0)
  const [fallbackMode, setFallbackMode] = useState(false)
  const [bgTheme, setBgTheme] = useState<'dark' | 'light'>('dark')
  const controlsRef = useRef<OrbitControlsImpl | null>(null)
  const canvasAreaRef = useRef<HTMLDivElement | null>(null)
  const canvasElementRef = useRef<HTMLCanvasElement | null>(null)
  const webglContextHandlersRef = useRef<{
    handleContextLost?: (event: Event) => void
    handleContextRestored?: () => void
  }>({})

  const handleCanvasCreated = useCallback(({ gl }: { gl: THREE.WebGLRenderer }) => {
    if (!gl || !gl.domElement) return
    setIsWebglContextLost(false)

    const handleContextLost = (event: Event) => {
      event.preventDefault()
      setIsWebglContextLost(true)
      setLossCount((n) => {
        const next = n + 1
        // if we lose context multiple times, enable fallback low-fidelity mode
        if (next >= 2) {
          setFallbackMode(true)
          console.warn('[WebGL] multiple context lost events — enabling fallback mode')
        }
        return next
      })
    }

    const handleContextRestored = () => {
      setIsWebglContextLost(false)
      // keep fallbackMode if it was engaged; otherwise reset lossCount
      setLossCount((n) => (fallbackMode ? n : 0))
      console.info('[WebGL] context restored')
    }

    const canvas = gl.domElement
    canvasElementRef.current = canvas
    webglContextHandlersRef.current = { handleContextLost, handleContextRestored }
    canvas.addEventListener('webglcontextlost', handleContextLost, false)
    canvas.addEventListener('webglcontextrestored', handleContextRestored, false)
  }, [])

  useEffect(() => {
    return () => {
      const canvas = canvasElementRef.current
      const { handleContextLost, handleContextRestored } = webglContextHandlersRef.current

      if (canvas && handleContextLost && handleContextRestored) {
        canvas.removeEventListener('webglcontextlost', handleContextLost, false)
        canvas.removeEventListener('webglcontextrestored', handleContextRestored, false)
      }

      canvasElementRef.current = null
      webglContextHandlersRef.current = {}
    }
  }, [])

  const panelStyle: React.CSSProperties = {
    flex: 1,
    minWidth: 0,
    background: 'var(--vfit-bg-canvas, #1A1625)',
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    transition: 'background-color 0.3s ease',
  }

  const badgeStyle: React.CSSProperties = {
    position: 'absolute',
    top: 64,
    left: 16,
    zIndex: 101,
    fontSize: 12,
    borderRadius: 999,
    padding: '8px 12px',
    fontWeight: 700,
    border: '1px solid rgba(148,163,184,0.35)',
    background: isGenerating ? '#ecfdf5' : 'rgba(255,255,255,0.92)',
    color: isGenerating ? '#047857' : '#334155',
  }

  const controlsStyle: React.CSSProperties = {
    position: 'absolute',
    right: 16,
    bottom: 16,
    zIndex: 101,
    display: 'flex',
    gap: 8,
    padding: 8,
    borderRadius: 16,
    border: '1px solid var(--vfit-border)',
    background: 'var(--vfit-bg-panel)',
    backdropFilter: 'blur(14px)',
    boxShadow: '0 6px 18px rgba(0,0,0,0.15)',
  }

  const cameraPreset = useMemo(() => CAMERA_PRESETS[viewAngle], [viewAngle])

  const topItem = selectedOutfit?.items.find(i => i.category === 'top')
  const bottomItem = selectedOutfit?.items.find(i => i.category === 'bottom')
  const shoeItem = selectedOutfit?.items.find(i => i.category === 'shoes')

  return (
    <div style={panelStyle} className="vfit-container" data-theme={bgTheme}>
      <style>{`
        .vfit-container {
          --vfit-bg-canvas: #1A1625;
          --vfit-bg-floor: #211D30;
          --vfit-bg-panel: rgba(26, 22, 37, 0.92);
          --vfit-floor-fade: linear-gradient(to top, #211D30 0%, transparent 100%);
          --vfit-text-primary: rgba(255,255,255,0.90);
          --vfit-text-secondary: rgba(255,255,255,0.50);
          --vfit-border: rgba(255,255,255,0.10);
          --vfit-bubble-default: #F0C040;
          --vfit-bubble-done: #1D9E75;
          --vfit-bubble-badge: #E25C5C;
          --vfit-accent: #7C6FCD;
          --vfit-vignette: rgba(0,0,0,0.35);
          --vfit-rim-glow: rgba(160,130,255,0.18);
          --vfit-podium-bg: rgba(40, 35, 55, 0.85);
          --vfit-podium-border: rgba(124, 111, 205, 0.35);
          --vfit-podium-side: rgba(20, 15, 30, 0.9);
          --vfit-podium-shadow: rgba(0, 0, 0, 0.5);
        }
        .vfit-container[data-theme="light"] {
          --vfit-bg-canvas: #E4DFF5;
          --vfit-bg-floor: #D6CFF0;
          --vfit-bg-panel: rgba(237, 234, 248, 0.92);
          --vfit-floor-fade: linear-gradient(to top, #D6CFF0 0%, transparent 100%);
          --vfit-text-primary: rgba(20,15,40,0.90);
          --vfit-text-secondary: rgba(20,15,40,0.50);
          --vfit-border: rgba(100,80,180,0.15);
          --vfit-vignette: rgba(160, 140, 210, 0.40);
          --vfit-rim-glow: rgba(100, 80, 180, 0.18);
          --vfit-podium-bg: rgba(235, 230, 245, 0.9);
          --vfit-podium-border: rgba(124, 111, 205, 0.25);
          --vfit-podium-side: rgba(190, 180, 210, 0.9);
          --vfit-podium-shadow: rgba(0, 0, 0, 0.15);
        }
        .vfit-bg-canvas {
          background-color: var(--vfit-bg-canvas);
          transition: background-color 0.3s ease;
        }
        .vfit-canvas-floor {
          position: absolute;
          bottom: 0; left: 0; right: 0;
          height: 55px;
          background: var(--vfit-floor-fade);
          z-index: 1;
          pointer-events: none;
        }
        .vfit-canvas-vignette {
          position: absolute;
          inset: 0;
          background: radial-gradient(ellipse 70% 70% at 50% 50%, transparent 30%, var(--vfit-vignette) 100%);
          z-index: 2;
          pointer-events: none;
        }
        .vfit-canvas-podium {
          position: absolute;
          bottom: 12px; left: 50%;
          transform: translateX(-50%);
          width: 220px; height: 60px;
          border-radius: 50%;
          background: var(--vfit-podium-bg);
          border: 1px solid var(--vfit-podium-border);
          box-shadow: 
            0 6px 0 var(--vfit-podium-side),
            0 12px 15px var(--vfit-podium-shadow),
            inset 0 -4px 10px rgba(0,0,0,0.15),
            inset 0 2px 4px rgba(255,255,255,0.08);
          z-index: 1;
          pointer-events: none;
        }
        .vfit-canvas-spotlight {
          position: absolute;
          top: 0; left: 0; right: 0; bottom: 0;
          background: radial-gradient(ellipse 320px 320px at 50% 45%, rgba(255, 255, 255, 0.12) 0%, rgba(255, 255, 255, 0.03) 45%, transparent 70%);
          z-index: 2;
          pointer-events: none;
        }
        .vfit-canvas-shadow {
          position: absolute;
          bottom: 18px; left: 50%;
          transform: translateX(-50%);
          width: 100px; height: 14px;
          background: rgba(0,0,0,0.25);
          border-radius: 50%;
          z-index: 3;
          pointer-events: none;
        }
        .vfit-canvas-rim-light {
          position: absolute;
          bottom: 18px; left: 50%;
          transform: translateX(-50%);
          width: 130px; height: 18px;
          background: var(--vfit-rim-glow);
          border-radius: 50%;
          filter: blur(8px);
          z-index: 3;
          pointer-events: none;
        }
        @keyframes avatarPulse {
          0%, 100% { opacity: 0.4; transform: scale(1); }
          50% { opacity: 0.7; transform: scale(1.02); }
        }
        .ap-silhouette {
          width: 120px;
          height: 200px;
          background: linear-gradient(180deg, var(--gold-light) 0%, transparent 100%);
          border-radius: 60px 60px 40px 40px;
          border: 1px dashed var(--gold-border);
          margin: 0 auto 24px;
          position: relative;
          animation: avatarPulse 3s ease-in-out infinite;
        }
        .ap-head {
          position: absolute;
          top: -20px;
          left: 50%;
          transform: translateX(-50%);
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: var(--gold-light);
          border: 1px dashed var(--gold-border);
        }
      `}</style>
      
      {/* Background Theme Controls */}
      <div style={{
        position: 'absolute',
        left: 16,
        top: 16,
        zIndex: 101,
        display: 'flex',
        gap: 10,
        padding: '10px 14px',
        borderRadius: 16,
        border: '1px solid var(--vfit-border)',
        background: 'var(--vfit-bg-panel)',
        backdropFilter: 'blur(14px)',
        boxShadow: '0 6px 18px rgba(0,0,0,0.15)',
        alignItems: 'center',
      }}>
        <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--vfit-text-secondary)', letterSpacing: '0.04em', paddingRight: '4px' }}>NỀN</div>
        <button onClick={() => setBgTheme('light')} title="Sáng" style={{ width: 18, height: 18, borderRadius: '50%', background: '#E4DFF5', border: bgTheme === 'light' ? '2px solid var(--vfit-accent)' : '1px solid var(--vfit-border)', cursor: 'pointer' }} />
        <button onClick={() => setBgTheme('dark')} title="Tối" style={{ width: 18, height: 18, borderRadius: '50%', background: '#1A1625', border: bgTheme === 'dark' ? '2px solid var(--vfit-accent)' : '1px solid var(--vfit-border)', cursor: 'pointer' }} />
      </div>

      {/* Badge */}
      <div style={badgeStyle}>
        {isGenerating ? 'Generating outfit...' : `Current Outfit: ${selectedOutfit?.name ?? 'Default Preview'}`}
      </div>

      {/* Empty State */}
      {!currentAvatar && !selectedOutfit && (
        <div style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1,
          pointerEvents: 'none'
        }}>
          <div className="ap-silhouette">
            <div className="ap-head" />
          </div>
          <div style={{
            fontSize: '15px',
            fontWeight: '500',
            color: 'var(--text-primary)',
            opacity: 0.6,
            marginBottom: '6px',
            textAlign: 'center'
          }}>
            Chưa có avatar của bạn
          </div>
          <div style={{
            fontSize: '12px',
            color: 'var(--text-secondary)',
            opacity: 0.45,
            textAlign: 'center',
            lineHeight: 1.5,
            whiteSpace: 'pre-wrap'
          }}>
            Nhập mô tả ở panel trái{'\n'}rồi bấm Tạo outfit với AI
          </div>
        </div>
      )}

      {/* Background Pattern Overlay removed */}

      <div
        ref={canvasAreaRef}
        className="vfit-bg-canvas"
        style={{ position: 'relative', width: '100%', height: '100%', minHeight: 420, flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}
      >
        <div className="vfit-canvas-floor" />
        <div className="vfit-canvas-podium" />
        <div className="vfit-canvas-vignette" />
        <div className="vfit-canvas-spotlight" />
        <div className="vfit-canvas-shadow" />
        <div className="vfit-canvas-rim-light" />

        {/* Canvas Container */}
        <div style={{ flex: 1, position: 'relative', width: '100%', overflow: 'hidden', zIndex: 4 }}>
          <Canvas
            key={`canvas-vto-${lossCount}`}
            frameloop={isWebglContextLost ? 'never' : 'always'}
            dpr={fallbackMode ? 1 : [1.5, 2]}
            performance={{ min: fallbackMode ? 0.25 : 0.5 }}
            camera={{ position: cameraPreset.position, fov: 32 }}
            shadows={false}
            gl={{
              antialias: true,
              preserveDrawingBuffer: false,
              powerPreference: 'high-performance',
              stencil: false,
              depth: true,
              alpha: true,
            }}
            onCreated={handleCanvasCreated}
            style={{ width: '100%', height: '100%', display: 'block' }}
          >
            <ambientLight intensity={fallbackMode ? 0.6 : 0.55} />
            <directionalLight
              position={[3, 6, 4]}
              intensity={fallbackMode ? 1.0 : 1.25}
            />
            <directionalLight position={[-2, 3, -2]} intensity={0.4} />
            <hemisphereLight args={['#f5f0e8', '#3a3228', 0.5]} />

            <CameraViewController view={viewAngle} controlsRef={controlsRef} />

            <TryOnScene
              body={currentAvatar}
              onSceneReady={setAvatarScene}
              layeredGarments={layeredGarments}
              showEnvironment={!fallbackMode}
              showContactShadows={!fallbackMode}
              showGrid={false}
            />

            <OrbitControls
              ref={controlsRef}
              enablePan={false}
              enableZoom
              enableDamping
              dampingFactor={0.08}
              minDistance={2.5}
              maxDistance={5.5}
            />
          </Canvas>


        </div>

        {/* Loading Overlay */}
        {isGenerating && (
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.18)', zIndex: 3, pointerEvents: 'none' }} />
        )}
      </div>

      {/* View Controls */}
      <div style={controlsStyle}>
        {(['front', 'back', 'left'] as ViewAngle[]).map(angle => (
          <button
            key={angle}
            onClick={() => onViewChange(angle)}
            style={{
              fontSize: 12,
              padding: '8px 12px',
              borderRadius: 10,
              border: '1px solid',
              borderColor: viewAngle === angle ? 'var(--gold-primary)' : 'rgba(212,169,66,0.3)',
              background: viewAngle === angle ? 'var(--gold-primary)' : 'rgba(255,255,255,0.8)',
              color: viewAngle === angle ? 'var(--vfit-text-primary)' : 'var(--vfit-text-secondary)',
              cursor: 'pointer',
            }}
          >
            {angle === 'front' && 'Front'}
            {angle === 'back' && 'Back'}
            {angle === 'left' && 'Side'}
          </button>
        ))}
      </div>

      {/* Background Theme Controls Removed */}
    </div>
  )
}

export default memo(AvatarPanel, (prevProps, nextProps) => {
  return (
    prevProps.selectedOutfit?.id === nextProps.selectedOutfit?.id &&
    prevProps.isGenerating === nextProps.isGenerating &&
    prevProps.viewAngle === nextProps.viewAngle &&
    prevProps.activeOutfitIndex === nextProps.activeOutfitIndex &&
    prevProps.outfits?.length === nextProps.outfits?.length
  )
})
