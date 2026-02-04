import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment, Grid, ContactShadows, Loader } from '@react-three/drei';
// Import component Avatar từ đường dẫn mới của bạn
import { Avatar } from '../../three/controls/avatar';

interface TryOnSceneProps {
    scaleY: number;
    fat: number;
    chest: number;
    waist: number;
    hips: number;
    clothingTexture: string | null;
    clothingScale: number;
    pose: string;
}

const TryOnScene: React.FC<TryOnSceneProps> = ({
    scaleY, fat, chest, waist, hips,
    clothingTexture, clothingScale: _clothingScale, pose
}) => {
    return (
        <div style={{ width: '100%', height: '100%', position: 'relative' }}>
            <Canvas
                shadows
                camera={{ position: [0, 1.2, 3.5], fov: 45 }}
                gl={{ preserveDrawingBuffer: true }}
                style={{ width: '100%', height: '100%' }}
            >
                <Environment preset="city" />
                <ambientLight intensity={1.0} />
                <directionalLight position={[2, 5, 5]} intensity={1.5} castShadow />

                <group position={[0, -0.9, 0]}>
                    <Grid args={[10, 10]} cellColor="#999" sectionColor="#555" fadeDistance={20} />
                    <ContactShadows resolution={512} scale={10} blur={1} opacity={0.5} far={1} />
                </group>

                <Suspense fallback={<Loader />}>
                    <Avatar
                        body={{
                            height: scaleY,
                            weight: fat,
                            chest: chest,
                            waist: waist,
                            hips: hips,
                            // Giá trị mặc định cho các thuộc tính bị thiếu
                            shoulder: scaleY * 0.22, // Vai ~22% chiều cao
                            arm: chest * 0.25, // Bắp tay ~25% vòng ngực
                            thigh: hips * 0.55, // Bắp đùi ~55% vòng hông
                            belly: waist * 1.1 // Bụng ~110% vòng eo
                        }}
                        clothingTexture={clothingTexture}
                        pose={pose as 'idle' | 'walking'}
                    />
                </Suspense>

                {/* 👇 CẤU HÌNH "TỰ DO TRONG KHUÔN KHỔ" */}
                <OrbitControls
                    // 1. Giới hạn Zoom (Để không chui tọt vào người nhân vật hoặc zoom quá xa)
                    minDistance={2.0}
                    maxDistance={4.5}

                    // 2. Điểm nhìn trung tâm (Nhìn vào ngực/bụng thay vì chân)
                    target={[0, 0.9, 0]}

                    // 3. KHÓA TRỤC DỌC (Quan trọng nhất)
                    // Chỉ cho phép camera dao động cực nhẹ quanh đường chân trời
                    // Math.PI / 2 là góc 90 độ (nhìn ngang)
                    minPolarAngle={Math.PI / 2 - 0.1} // Không cho nhìn từ trên đỉnh đầu xuống quá nhiều
                    maxPolarAngle={Math.PI / 2 + 0.1} // Không cho nhìn từ dưới đất lên

                    // 4. Khóa di chuyển (Pan) để nhân vật luôn ở giữa màn hình
                    enablePan={false}

                // 5. (Tùy chọn) Tự động xoay nhẹ như trưng bày trong tủ kính
                // autoRotate={true}
                // autoRotateSpeed={2.0}
                />
            </Canvas>
        </div>
    );
};

export default TryOnScene;