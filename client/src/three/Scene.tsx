// src/three/Scene.tsx
import { Suspense, useState } from 'react'; // Bỏ React, chỉ lấy Suspense, useState
import { Canvas } from '@react-three/fiber';
import { Avatar } from './Avatar';
import { Lighting } from './Lighting';
import { CameraControls } from './controls/CameraControls';
import { DEFAULT_MORPHS } from '../features/virtual-tryon/types';
import type { MorphParams } from '../features/virtual-tryon/types'; // Thêm type
import { Html, Loader } from '@react-three/drei';

export const Scene = () => {
  const [morphParams] = useState<MorphParams>({
    ...DEFAULT_MORPHS,
    waist: 1,
    height: 0
  });

  return (
    <div style={{ width: '100%', height: '100vh', background: '#111' }}>
      <Canvas shadows camera={{ position: [0, 1.5, 4], fov: 45 }} dpr={[1, 2]}>
        <Lighting />

        <Suspense fallback={<Html center>Đang tải 3D...</Html>}>
          <Avatar params={morphParams} />
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