// src/three/Avatar.tsx
import React, { useRef, useEffect } from 'react';
import { useGLTF, useAnimations } from '@react-three/drei';
import type { MorphParams } from '../features/virtual-tryon/types'; // Thêm type
import { useMorph } from '../hooks/useMorph';
import { SkinnedMesh, Object3D } from 'three'; // Bỏ Group

interface AvatarProps {
    params: MorphParams;
    position?: [number, number, number];
}

export const Avatar: React.FC<AvatarProps> = ({ params, position = [0, -1, 0] }) => {
    const { scene, animations } = useGLTF('/assets/models/avatar.glb');
    const { actions } = useAnimations(animations, scene);

    const meshRef = useRef<SkinnedMesh>(null);

    useEffect(() => {
        scene.traverse((child: Object3D) => {
            // Kiểm tra xem child có phải là SkinnedMesh không
            if ((child as SkinnedMesh).isSkinnedMesh && !meshRef.current) {
                const skinnedMesh = child as SkinnedMesh; // Ép kiểu để TS hiểu

                // Logic ưu tiên tìm Body
                if (skinnedMesh.name.includes('Body') || skinnedMesh.name.includes('Avatar')) {
                    meshRef.current = skinnedMesh;
                    console.log("Đã tìm thấy Mesh:", skinnedMesh.name);
                    // Sửa lỗi truy cập morphTargetDictionary
                    console.log("Keys:", Object.keys(skinnedMesh.morphTargetDictionary || {}));
                }
            }
        });
    }, [scene]);

    useMorph(meshRef, params);

    useEffect(() => {
        if (actions['Idle']) {
            actions['Idle'].play();
        }
    }, [actions]);

    return (
        <primitive
            object={scene}
            position={position}
            scale={1.5}
            dispose={null}
        />
    );
};

useGLTF.preload('/assets/models/avatar.glb');