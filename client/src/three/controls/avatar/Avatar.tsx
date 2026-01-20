import React, { useMemo, useRef } from 'react';
import { useGLTF, useAnimations } from '@react-three/drei';
import * as THREE from 'three';
import type { AnimationAction } from 'three';

// Import type đúng chuẩn
import type { AvatarProps } from './types';
import { useAvatarMorph } from './useAvatarMorph';
import { useAvatarAnimation } from './useAvatarAnimation';
import { ClothingLayer } from './ClothingLayer';

export const Avatar: React.FC<AvatarProps> = ({
    body,
    clothingTexture,
    pose = 'idle',
}) => {
    // 1. Load Model
    const { nodes, animations } = useGLTF('/assets/models/avatar_morph.glb') as any;
    const meshRef = useRef<THREE.Mesh>(null);

    // 2. Tìm Mesh chính (Body) chứa Morph Targets
    const targetMesh = useMemo(() => {
        return Object.values(nodes).find(
            (n: any) => n.isMesh && n.morphTargetDictionary
        ) as THREE.Mesh;
    }, [nodes]);

    // 3. Setup Animations (Đi bộ / Đứng yên)
    const { actions } = useAnimations(animations, meshRef);
    useAvatarAnimation(actions as Record<string, AnimationAction | undefined>, pose);

    // 4. Setup Morphing (Biến đổi hình dáng béo/gầy/ngực/eo/hông)
    useAvatarMorph(meshRef.current, body);

    if (!targetMesh) return null;

    // 5. Cấu hình màu da (Skin Material) - Giúp avatar hồng hào, rõ nét
    const skinMaterial = new THREE.MeshStandardMaterial({
        color: '#E0AC69', // Màu da cam nâu khỏe khoắn (hoặc #F1C27D)
        roughness: 0.6,   // Giảm độ bóng để giống da thật
        metalness: 0.1
    });

    return (
        <group dispose={null}>
            <mesh
                ref={meshRef}
                geometry={targetMesh.geometry}
                material={skinMaterial} // Sử dụng material mới
                morphTargetDictionary={targetMesh.morphTargetDictionary}
                morphTargetInfluences={targetMesh.morphTargetInfluences}

                // 👇 [QUAN TRỌNG] FIX LỖI SCALE CHIỀU CAO TẠI ĐÂY
                // Logic cũ: body.height * (1 + body.weight) -> Sai vì béo làm tăng chiều cao
                // Logic mới: Tách biệt hoàn toàn.
                scale={[
                    0.085,                // X: Giữ nguyên (Việc to bề ngang để Morph Target Fat_Full lo)
                    body.height * 0.085,  // Y: CHỈ phụ thuộc vào chiều cao người dùng nhập
                    0.085                 // Z: Giữ nguyên
                ]}

                castShadow
                receiveShadow
            >
                {/* Lớp quần áo (Texture) */}
                {clothingTexture && (
                    <ClothingLayer
                        textureUrl={clothingTexture}
                        // Logic vị trí/kích thước áo cũng phải tách biệt
                        scale={[
                            7 + body.waist * 0.5, // Áo to theo eo
                            7 + body.chest * 0.5, // Áo to theo ngực
                            3 + body.hips * 0.5,  // Áo to theo hông
                        ]}
                        // Vị trí áo chỉ thay đổi theo chiều cao (Y)
                        position={[0, 15.5 + body.height * 0.1, 0.8]}
                    />
                )}
            </mesh>
        </group>
    );
};

// Preload model
useGLTF.preload('/assets/models/avatar_morph.glb');