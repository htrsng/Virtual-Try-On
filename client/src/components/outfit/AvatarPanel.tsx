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
  front: { position: [0, 0.7, 4.5], target: [0, 0.4, 0] },
  back: { position: [0, 0.7, -4.5], target: [0, 0.4, 0] },
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
    background: 'var(--bg-primary)',
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  }

  const badgeStyle: React.CSSProperties = {
    position: 'absolute',
    top: 16,
    left: 16,
    zIndex: 2,
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
    zIndex: 2,
    display: 'flex',
    gap: 8,
    padding: 8,
    borderRadius: 16,
    border: '1px solid rgba(226,232,240,0.95)',
    background: 'rgba(255,255,255,0.9)',
    backdropFilter: 'blur(14px)',
    boxShadow: '0 6px 18px rgba(15,23,42,0.08)',
  }

  const cameraPreset = useMemo(() => CAMERA_PRESETS[viewAngle], [viewAngle])

  const topItem = selectedOutfit?.items.find(i => i.category === 'top')
  const bottomItem = selectedOutfit?.items.find(i => i.category === 'bottom')
  const shoeItem = selectedOutfit?.items.find(i => i.category === 'shoes')

  return (
    <div style={panelStyle}>
      <style>{`
        .ap-grid-overlay {
          position: absolute;
          inset: 0;
          background-image: radial-gradient(circle, rgba(201,150,63,0.04) 1px, transparent 1px);
          background-size: 32px 32px;
          pointer-events: none;
          z-index: 0;
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

      {/* Grid Pattern Overlay */}
      <div className="ap-grid-overlay" />

      <div
        ref={canvasAreaRef}
        style={{ position: 'relative', width: '100%', height: '100%', minHeight: 420, flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}
      >
        {/* Outfit Navigation Tabs */}
        <div style={{
          display: 'flex',
          gap: 6,
          padding: '10px 14px',
          borderBottom: '0.5px solid #e5e7eb',
          overflowX: 'auto',
          backgroundColor: '#fff',
          flexShrink: 0,
        }}>
          {outfits && outfits.length > 0 ? (
            outfits.map((outfit, i) => (
              <button
                key={outfit.id || i}
                onClick={() => onSelectOutfit(i)}
                style={{
                  fontSize: 11,
                  padding: '4px 12px',
                  borderRadius: 20,
                  border: '0.5px solid',
                  cursor: 'pointer',
                  background: activeOutfitIndex === i ? '#1a1a1a' : 'transparent',
                  color: activeOutfitIndex === i ? '#fff' : '#6b7280',
                  borderColor: activeOutfitIndex === i ? '#1a1a1a' : '#e5e7eb',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  if (activeOutfitIndex !== i) {
                    e.currentTarget.style.borderColor = '#d1d5db'
                    e.currentTarget.style.color = '#4b5563'
                  }
                }}
                onMouseLeave={(e) => {
                  if (activeOutfitIndex !== i) {
                    e.currentTarget.style.borderColor = '#e5e7eb'
                    e.currentTarget.style.color = '#6b7280'
                  }
                }}
              >
                Outfit {i + 1}
              </button>
            ))
          ) : (
            <button
              disabled
              style={{
                fontSize: 11,
                padding: '4px 12px',
                borderRadius: 20,
                border: '0.5px solid #e5e7eb',
                background: 'transparent',
                color: '#d1d5db',
                whiteSpace: 'nowrap',
                cursor: 'not-allowed',
              }}
            >
              Outfit 1
            </button>
          )}
        </div>

        {/* Canvas Container */}
        <div style={{ flex: 1, position: 'relative', width: '100%', overflow: 'hidden' }}>
          <Canvas
            key={`canvas-vto-${lossCount}`}
            frameloop={isWebglContextLost ? 'never' : 'always'}
            dpr={fallbackMode ? 1 : [1, 1.2]}
            performance={{ min: fallbackMode ? 0.25 : 0.5 }}
            camera={{ position: cameraPreset.position, fov: 32 }}
            shadows={false}
            gl={{
              antialias: false,
              preserveDrawingBuffer: false,
              powerPreference: 'default',
              stencil: false,
              depth: true,
              alpha: true,
            }}
            onCreated={handleCanvasCreated}
            style={{ width: '100%', height: '100%', display: 'block' }}
          >
            <ambientLight intensity={fallbackMode ? 0.55 : 0.4} />
            <directionalLight
              position={[3, 6, 4]}
              intensity={fallbackMode ? 0.9 : 1.05}
            />
            <directionalLight position={[-2, 3, -2]} intensity={0.3} />
            <hemisphereLight args={['#f5f0e8', '#3a3228', 0.35]} />

            <CameraViewController view={viewAngle} controlsRef={controlsRef} />

            <TryOnScene
              body={currentAvatar}
              onSceneReady={setAvatarScene}
              layeredGarments={layeredGarments}
              showEnvironment={!fallbackMode}
              showContactShadows={!fallbackMode}
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
              borderColor: viewAngle === angle ? '#10b981' : '#dbe2ea',
              background: viewAngle === angle ? '#10b981' : '#fff',
              color: viewAngle === angle ? '#fff' : '#475569',
              cursor: 'pointer',
            }}
          >
            {angle === 'front' && 'Front'}
            {angle === 'back' && 'Back'}
            {angle === 'left' && 'Side'}
          </button>
        ))}
      </div>
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
