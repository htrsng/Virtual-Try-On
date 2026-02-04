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
    const [showHelp, setShowHelp] = useState(false);
    const [isRotating, setIsRotating] = useState(false);
    const [bodyMeasurements, setBodyMeasurements] = useState({
        height: body?.height || 165,
        weight: body?.weight || 55,
        chest: body?.chest || 85,
        waist: body?.waist || 68,
        hips: body?.hips || 92,
        shoulder: body?.shoulder || 38,
        arm: body?.arm || 26,
        thigh: body?.thigh || 50,
        belly: body?.belly || 70
    });
    const controlsRef = useRef<any>(null);
    const canvasRef = useRef<any>(null);

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

    // Hàm chụp ảnh
    const handleScreenshot = async () => {
        if (canvasRef.current) {
            const canvas = canvasRef.current.querySelector('canvas');
            if (canvas) {
                const link = document.createElement('a');
                link.href = canvas.toDataURL('image/png');
                link.download = `virtual-tryon-${Date.now()}.png`;
                link.click();
            }
        }
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
                    <p className="header-subtitle">Công nghệ thử đồ ảo - Xem từ mọi góc độ</p>
                </div>
            </div>

            {/* Main Canvas Area */}
            <div className="canvas-wrapper" ref={canvasRef}>
                <Canvas
                    shadows
                    camera={{ position: [0, 0.2, 2.8], fov: 45 }}
                    style={{ background: '#ffffff' }}
                >
                    <ambientLight intensity={0.5} />
                    <directionalLight
                        position={[2, 5, 2]}
                        intensity={1.0}
                        castShadow
                        shadow-mapSize={1024}
                    />
                    <pointLight position={[-2, 3, 3]} intensity={0.4} />
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
                                body={bodyMeasurements}
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

                {/* Help Tooltip */}
                {showHelp && (
                    <div className="help-tooltip">
                        <button className="help-close" onClick={() => setShowHelp(false)}>×</button>
                        <h4>💡 Hướng dẫn sử dụng</h4>
                        <ul>
                            <li>🖱️ <strong>Kéo chuột</strong> để xoay mô hình</li>
                            <li>🔍 <strong>Cuộn chuột</strong> để phóng to/thu nhỏ</li>
                            <li>🎯 <strong>Nhấp đúp</strong> để focus</li>
                            <li>📸 Dùng nút <strong>Chụp ảnh</strong> để lưu kết quả</li>
                        </ul>
                    </div>
                )}
            </div>

            {/* Control Panel */}
            <div className="control-panel">
                {/* Control Buttons Section */}
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
                        <button className="control-btn" onClick={handleScreenshot} title="Chụp ảnh">
                            <span className="btn-icon">📸</span>
                            <span className="btn-text">Chụp ảnh</span>
                        </button>
                    </div>
                </div>

                {/* Info Section */}
                <div className="info-section">
                    <h3 className="info-title">📊 Thông tin cơ thể</h3>
                    <div className="info-grid">
                        <div className="info-item">
                            <span className="info-label">Chiều cao:</span>
                            <span className="info-value">{bodyMeasurements?.height ? `${bodyMeasurements.height} cm` : 'N/A'}</span>
                        </div>
                        <div className="info-item">
                            <span className="info-label">Cân nặng:</span>
                            <span className="info-value">{bodyMeasurements?.weight ? `${bodyMeasurements.weight} kg` : 'N/A'}</span>
                        </div>
                        <div className="info-item">
                            <span className="info-label">Vòng ngực:</span>
                            <span className="info-value">{bodyMeasurements?.chest ? `${bodyMeasurements.chest} cm` : 'N/A'}</span>
                        </div>
                        <div className="info-item">
                            <span className="info-label">Vòng eo:</span>
                            <span className="info-value">{bodyMeasurements?.waist ? `${bodyMeasurements.waist} cm` : 'N/A'}</span>
                        </div>
                        <div className="info-item">
                            <span className="info-label">Vòng hông:</span>
                            <span className="info-value">{bodyMeasurements?.hips ? `${bodyMeasurements.hips} cm` : 'N/A'}</span>
                        </div>
                        <div className="info-item full-width">
                            <span className="info-label">Trạng thái:</span>
                            <span className="info-value status-active">✓ Sẵn sàng</span>
                        </div>
                    </div>
                </div>

                {/* Body Customization Section */}
                <div className="body-custom-section">
                    <h3 className="control-title">👕 Chỉnh sửa kích thước</h3>

                    <div className="body-measurements-container">
                        {/* Row 1: Chiều cao, Cân nặng */}
                        <div className="measurement-row">
                            <div className="measurement-item">
                                <label>Chiều cao (cm)</label>
                                <input
                                    type="range"
                                    min="150"
                                    max="200"
                                    value={bodyMeasurements.height}
                                    onChange={(e) => setBodyMeasurements({ ...bodyMeasurements, height: parseInt(e.target.value) })}
                                    className="body-slider"
                                />
                                <span className="measurement-value">{bodyMeasurements.height} cm</span>
                            </div>
                            <div className="measurement-item">
                                <label>Cân nặng (kg)</label>
                                <input
                                    type="range"
                                    min="40"
                                    max="100"
                                    value={bodyMeasurements.weight}
                                    onChange={(e) => setBodyMeasurements({ ...bodyMeasurements, weight: parseInt(e.target.value) })}
                                    className="body-slider"
                                />
                                <span className="measurement-value">{bodyMeasurements.weight} kg</span>
                            </div>
                        </div>

                        {/* Row 2: Vòng ngực, Vòng eo */}
                        <div className="measurement-row">
                            <div className="measurement-item">
                                <label>Vòng ngực (cm)</label>
                                <input
                                    type="range"
                                    min="70"
                                    max="120"
                                    value={bodyMeasurements.chest}
                                    onChange={(e) => setBodyMeasurements({ ...bodyMeasurements, chest: parseInt(e.target.value) })}
                                    className="body-slider"
                                />
                                <span className="measurement-value">{bodyMeasurements.chest} cm</span>
                            </div>
                            <div className="measurement-item">
                                <label>Vòng eo (cm)</label>
                                <input
                                    type="range"
                                    min="55"
                                    max="110"
                                    value={bodyMeasurements.waist}
                                    onChange={(e) => setBodyMeasurements({ ...bodyMeasurements, waist: parseInt(e.target.value) })}
                                    className="body-slider"
                                />
                                <span className="measurement-value">{bodyMeasurements.waist} cm</span>
                            </div>
                        </div>

                        {/* Row 3: Vòng hông, Kiểu vai */}
                        <div className="measurement-row">
                            <div className="measurement-item">
                                <label>Vòng hông (cm)</label>
                                <input
                                    type="range"
                                    min="80"
                                    max="130"
                                    value={bodyMeasurements.hips}
                                    onChange={(e) => setBodyMeasurements({ ...bodyMeasurements, hips: parseInt(e.target.value) })}
                                    className="body-slider"
                                />
                                <span className="measurement-value">{bodyMeasurements.hips} cm</span>
                            </div>
                            <div className="measurement-item">
                                <label>Kiểu vai (cm)</label>
                                <input
                                    type="range"
                                    min="30"
                                    max="50"
                                    value={bodyMeasurements.shoulder}
                                    onChange={(e) => setBodyMeasurements({ ...bodyMeasurements, shoulder: parseInt(e.target.value) })}
                                    className="body-slider"
                                />
                                <span className="measurement-value">{bodyMeasurements.shoulder} cm</span>
                            </div>
                        </div>

                        {/* Row 4: Bắp tay, Đùi */}
                        <div className="measurement-row">
                            <div className="measurement-item">
                                <label>Bắp tay (cm)</label>
                                <input
                                    type="range"
                                    min="20"
                                    max="40"
                                    value={bodyMeasurements.arm}
                                    onChange={(e) => setBodyMeasurements({ ...bodyMeasurements, arm: parseInt(e.target.value) })}
                                    className="body-slider"
                                />
                                <span className="measurement-value">{bodyMeasurements.arm} cm</span>
                            </div>
                            <div className="measurement-item">
                                <label>Đùi (cm)</label>
                                <input
                                    type="range"
                                    min="40"
                                    max="70"
                                    value={bodyMeasurements.thigh}
                                    onChange={(e) => setBodyMeasurements({ ...bodyMeasurements, thigh: parseInt(e.target.value) })}
                                    className="body-slider"
                                />
                                <span className="measurement-value">{bodyMeasurements.thigh} cm</span>
                            </div>
                        </div>

                        {/* Row 5: Bụng */}
                        <div className="measurement-row">
                            <div className="measurement-item full-width-item">
                                <label>Vòng bụng (cm)</label>
                                <input
                                    type="range"
                                    min="60"
                                    max="120"
                                    value={bodyMeasurements.belly}
                                    onChange={(e) => setBodyMeasurements({ ...bodyMeasurements, belly: parseInt(e.target.value) })}
                                    className="body-slider"
                                />
                                <span className="measurement-value">{bodyMeasurements.belly} cm</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Help Button */}
                <button
                    className="help-button"
                    onClick={() => setShowHelp(!showHelp)}
                    title="Hiện/ẩn hướng dẫn"
                >
                    <span>❓</span>
                </button>
            </div>

            {/* Footer Badge */}
            <div className="tryon-badge">
                <span className="badge-icon">✨</span>
                <span className="badge-text">Công nghệ 3D HD</span>
            </div>
        </div>
    );
}