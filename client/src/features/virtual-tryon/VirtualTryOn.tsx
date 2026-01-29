import { Suspense, useState, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment, ContactShadows, Html, useProgress } from '@react-three/drei';
import { Avatar } from '../../three/controls/avatar/Avatar';
import './VirtualTryOn.css';

// Component hiển thị loading đẹp hơn
function Loader() {
    const { progress } = useProgress();
    return (
        <Html center>
            <div className="loader-container">
                <div className="loader-spinner"></div>
                <div className="loader-text">Đang tải mô hình 3D</div>
                <div className="loader-progress">
                    <div className="progress-bar">
                        <div className="progress-fill" style={{ width: `${progress}%` }}></div>
                    </div>
                    <span className="progress-percentage">{progress.toFixed(0)}%</span>
                </div>
            </div>
        </Html>
    );
}

export default function VirtualTryOn({ body, clothingTexture, skinColor }: any) {
    const [showHelp, setShowHelp] = useState(true);
    const [isRotating, setIsRotating] = useState(false);
    const controlsRef = useRef<any>(null);

    // Hàm reset camera về vị trí ban đầu
    const handleResetCamera = () => {
        if (controlsRef.current) {
            controlsRef.current.reset();
        }
    };

    // Hàm bật/tắt tự động xoay
    const toggleAutoRotate = () => {
        setIsRotating(!isRotating);
    };

    return (
        <div className="virtual-tryon-container">
            {/* Header */}
            <div className="tryon-header">
                <div className="header-content">
                    <h2 className="header-title">
                        <span className="title-icon">👔</span>
                        Phòng Thử Đồ 3D
                    </h2>
                    <p className="header-subtitle">Trải nghiệm thử đồ ảo với công nghệ hiện đại</p>
                </div>
            </div>

            {/* Main Canvas Area */}
            <div className="canvas-wrapper">
                <Canvas shadows camera={{ position: [0, 0.2, 2.8], fov: 45 }}>
                    <ambientLight intensity={0.7} />
                    <directionalLight
                        position={[2, 5, 2]}
                        intensity={1.0}
                        castShadow
                        shadow-mapSize={1024}
                    />
                    <Environment preset="city" />

                    <Suspense fallback={<Loader />}>
                        <group>
                            <gridHelper args={[10, 10, '#cccccc', '#eeeeee']} position={[0, -0.9, 0]} />
                            <ContactShadows
                                position={[0, -0.9, 0]}
                                resolution={1024}
                                scale={10}
                                blur={1.5}
                                opacity={0.4}
                                far={10}
                                color="#000000"
                            />
                            <Avatar
                                body={body}
                                clothingTexture={clothingTexture}
                                pose={'Idle'}
                                skinColor={skinColor}
                            />
                        </group>
                    </Suspense>

                    <OrbitControls
                        ref={controlsRef}
                        target={[0, 0.0, 0]}
                        minPolarAngle={Math.PI / 4}
                        maxPolarAngle={Math.PI / 2}
                        minDistance={1.5}
                        maxDistance={4}
                        enablePan={false}
                        autoRotate={isRotating}
                        autoRotateSpeed={2}
                    />
                </Canvas>

                {/* Help Tooltip - Hiển thị khi lần đầu vào */}
                {showHelp && (
                    <div className="help-tooltip">
                        <button className="help-close" onClick={() => setShowHelp(false)}>×</button>
                        <h4>💡 Hướng dẫn sử dụng</h4>
                        <ul>
                            <li>🖱️ <strong>Kéo chuột</strong> để xoay mô hình</li>
                            <li>🔍 <strong>Cuộn chuột</strong> để phóng to/thu nhỏ</li>
                            <li>🎯 <strong>Nhấp đúp</strong> để focus</li>
                        </ul>
                    </div>
                )}
            </div>

            {/* Control Panel */}
            <div className="control-panel">
                <div className="control-section">
                    <h3 className="control-title">⚙️ Điều khiển</h3>
                    <div className="control-buttons">
                        <button className="control-btn primary" onClick={handleResetCamera} title="Đặt lại góc nhìn">
                            <span className="btn-icon">🔄</span>
                            <span className="btn-text">Reset Camera</span>
                        </button>
                        <button
                            className={`control-btn ${isRotating ? 'active' : ''}`}
                            onClick={toggleAutoRotate}
                            title="Tự động xoay mô hình"
                        >
                            <span className="btn-icon">{isRotating ? '⏸️' : '▶️'}</span>
                            <span className="btn-text">{isRotating ? 'Dừng xoay' : 'Tự động xoay'}</span>
                        </button>
                        <button className="control-btn" onClick={() => setShowHelp(!showHelp)} title="Hiện hướng dẫn">
                            <span className="btn-icon">❓</span>
                            <span className="btn-text">Trợ giúp</span>
                        </button>
                    </div>
                </div>

                {/* Info Section */}
                <div className="info-section">
                    <h3 className="info-title">📊 Thông tin</h3>
                    <div className="info-grid">
                        <div className="info-item">
                            <span className="info-label">Chiều cao:</span>
                            <span className="info-value">{body?.height ? `${body.height} cm` : 'N/A'}</span>
                        </div>
                        <div className="info-item">
                            <span className="info-label">Cân nặng:</span>
                            <span className="info-value">{body?.weight ? `${body.weight} kg` : 'N/A'}</span>
                        </div>
                        <div className="info-item">
                            <span className="info-label">Vòng ngực:</span>
                            <span className="info-value">{body?.chest ? `${body.chest} cm` : 'N/A'}</span>
                        </div>
                        <div className="info-item">
                            <span className="info-label">Vòng eo:</span>
                            <span className="info-value">{body?.waist ? `${body.waist} cm` : 'N/A'}</span>
                        </div>
                        <div className="info-item">
                            <span className="info-label">Vòng hông:</span>
                            <span className="info-value">{body?.hips ? `${body.hips} cm` : 'N/A'}</span>
                        </div>
                        <div className="info-item full-width">
                            <span className="info-label">Trạng thái:</span>
                            <span className="info-value status-active">✓ Đã tải xong</span>
                        </div>
                    </div>
                </div>

                {/* Tips Section */}
                <div className="tips-section">
                    <h4 className="tips-title">💡 Mẹo:</h4>
                    <p className="tips-text">Bạn có thể xoay mô hình để xem từ nhiều góc độ khác nhau!</p>
                </div>
            </div>

            {/* Footer Badge */}
            <div className="tryon-badge">
                <span className="badge-icon">✨</span>
                <span className="badge-text">Công nghệ 3D</span>
            </div>
        </div>
    );
}