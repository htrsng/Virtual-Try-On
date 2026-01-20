// src/three/Scene.tsx
import { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { Avatar } from './controls/avatar/Avatar';
import { Lighting } from './Lighting';
import { CameraControls } from './controls/CameraControls';
import { Html, Loader } from '@react-three/drei';

export const Scene = () => {
  const morphParams = {
    height: 0.5,
    chest: 0.5,
    waist: 0.5,
    hips: 0.5,
  };

  return (
    <div style={{ width: '100%', height: '100vh', background: '#111' }}>
      <Canvas shadows camera={{ position: [0, 1.5, 4], fov: 45 }} dpr={[1, 2]}>
        <Lighting />

        <Suspense fallback={<Html center>Đang tải 3D...</Html>}>
          <Avatar
            body={{
              height: morphParams.height,
              weight: 0.5,
              chest: morphParams.chest,
              waist: morphParams.waist,
              hips: morphParams.hips,
            }}
          />
        </Suspense>

        <CameraControls />

        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1, 0]} receiveShadow>
          <planeGeometry args={[10, 10]} />
          <meshStandardMaterial color="#333" roughness={0.8} />
        </mesh>
      </Canvas>
      <Loader />
    </div>
  );
};