import { OrbitControls } from '@react-three/drei';

export const CameraControls = () => {
    return (
        <OrbitControls
            enablePan={false} // Không cho kéo trượt
            minPolarAngle={Math.PI / 4} // Giới hạn góc nhìn lên
            maxPolarAngle={Math.PI / 1.8} // Giới hạn góc nhìn xuống (không nhìn dưới chân)
            minDistance={2}
            maxDistance={6}
            target={[0, 1, 0]} // Xoay quanh ngực nhân vật
        />
    );
};