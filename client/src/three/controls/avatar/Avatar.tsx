import React, { useEffect } from 'react';
import { useGLTF, useAnimations } from '@react-three/drei';
import * as THREE from 'three';

import type { AvatarProps } from './types';
// Tạm tắt các hook logic để tránh lỗi tính toán
// import { useAvatarMorph } from './useAvatarMorph'; 
// import { useAvatarAnimation } from './useAvatarAnimation';

const MODEL_PATH = '/assets/models/avatar_morph.glb';

export const Avatar: React.FC<AvatarProps> = ({
    pose = 'Idle',
}) => {
    // 1. Load Scene nguyên bản
    const { scene, animations } = useGLTF(MODEL_PATH) as any;
    const { actions } = useAnimations(animations, scene);

    // 2. Chạy Animation đơn giản nhất
    useEffect(() => {
        // Log để kiểm tra animation có tồn tại không
        console.log("🎬 Animation List:", actions);

        const action = actions['Idle']; // Đảm bảo tên 'Idle' đúng trong Blender
        if (action) {
            action.reset().fadeIn(0.5).play();
        }
    }, [actions]);

    // 3. Tự động bật bóng đổ cho mọi thứ trong scene
    useEffect(() => {
        scene.traverse((child: any) => {
            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
                // Quan trọng: Fix lỗi X4122 bằng cách không ghi đè material vội
            }
        });
    }, [scene]);

    return (
        <group dispose={null}>
            {/* Render nguyên gốc, không scale, không chỉnh vị trí.
                Scale = 1.0 để xem nó to nhỏ thế nào.
            */}
            <primitive object={scene} scale={[1, 1, 1]} position={[0, -0.9, 0]} />
        </group>
    );
};

useGLTF.preload(MODEL_PATH);