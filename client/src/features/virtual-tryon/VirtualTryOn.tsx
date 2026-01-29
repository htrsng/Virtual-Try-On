import { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment, ContactShadows, Html, useProgress } from '@react-three/drei';
import { Avatar } from '../../three/controls/avatar/Avatar'; // Đảm bảo đường dẫn đúng

// Component hiển thị % khi đang tải
function Loader() {
    const { progress } = useProgress();
    return <Html center><span style={{ color: '#333', fontWeight: 'bold' }}>Loading {progress.toFixed(0)}%</span></Html>;
}

export default function VirtualTryOn({ body, clothingTexture, skinColor }: any) {
    return (
        <div style={{ width: '100%', height: '100%', background: '#ffffff' }}> {/* Nền trắng sạch */}

            {/* Cấu hình Camera: FOV 45 cho góc nhìn chuẩn, vị trí gần hơn để thấy rõ người */}
            <Canvas shadows camera={{ position: [0, 0.2, 2.8], fov: 45 }}>

                {/* 1. Ánh sáng Studio */}
                <ambientLight intensity={0.7} /> {/* Ánh sáng môi trường dịu */}
                <directionalLight
                    position={[2, 5, 2]}
                    intensity={1.0}
                    castShadow
                    shadow-mapSize={1024}
                />
                <Environment preset="city" /> {/* Môi trường phản chiếu tự nhiên */}

                <Suspense fallback={<Loader />}>
                    <group>
                        {/* 2. Sàn lưới (Grid) giống ảnh mẫu */}
                        {/* args: [kích thước, số ô, màu kẻ đậm, màu kẻ nhạt] */}
                        {/* position y=-0.9 để khớp với vị trí chân của Avatar */}
                        <gridHelper args={[10, 10, '#cccccc', '#eeeeee']} position={[0, -0.9, 0]} />

                        {/* 3. Bóng đổ dưới chân */}
                        <ContactShadows
                            position={[0, -0.9, 0]}
                            resolution={1024}
                            scale={10}
                            blur={1.5}
                            opacity={0.4}
                            far={10}
                            color="#000000"
                        />

                        {/* 4. Nhân vật */}
                        {/* Avatar sẽ tự động tính toán để chân chạm vào y=-0.9 */}
                        <Avatar
                            body={body}
                            clothingTexture={clothingTexture}
                            pose={'Idle'}
                            skinColor={skinColor}
                        />
                    </group>
                </Suspense>

                {/* 5. Điều khiển Camera */}
                <OrbitControls
                    target={[0, 0.0, 0]} /* Nhìn thẳng vào phần hông/bụng (trung tâm cơ thể) */
                    minPolarAngle={Math.PI / 4} /* Không cho xoay xuống quá thấp */
                    maxPolarAngle={Math.PI / 2} /* Không cho xoay xuống dưới sàn */
                    minDistance={1.5} /* Zoom gần tối đa */
                    maxDistance={4}   /* Zoom xa tối đa */
                    enablePan={false} /* Khóa kéo trượt để nhân vật luôn ở giữa */
                />
            </Canvas>
        </div>
    );
}