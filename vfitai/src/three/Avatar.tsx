import React, { useEffect, useRef, useMemo } from 'react';
// 👇 Thêm useAnimations để xử lý cử động
import { useGLTF, useTexture, Decal, useAnimations } from '@react-three/drei';
import * as THREE from 'three';

type AvatarProps = {
    height?: number;
    weight?: number;
    chest?: number;
    waist?: number;
    hips?: number;
    clothingTexture?: string | null;
    clothingScale?: number;
    pose?: string; // 👈 1. Thêm prop pose nhận từ VirtualTryOn
};

const ClothingLayer = ({ textureUrl, scale, position }: { textureUrl: string, scale: [number, number, number], position: [number, number, number] }) => {
    // Dùng useTexture ở đây để React quản lý cache tốt hơn
    const texture = useTexture(textureUrl);
    return (
        <Decal
            position={position}
            rotation={[0, 0, 0]}
            scale={scale}
            map={texture}
            depthTest={true}
        />
    );
};

export function Avatar({
    height = 1,
    weight = 0,
    chest = 0,
    waist = 0,
    hips = 0,
    clothingTexture,
    clothingScale = 4,
    pose = 'idle' // 👈 2. Mặc định là đứng yên
}: AvatarProps) {
    // 👇 3. Lấy thêm animations từ file GLB
    // LƯU Ý: Đảm bảo đường dẫn file đúng (/assets/models/ hay /models/)
    const { nodes, materials, animations } = useGLTF('/assets/models/avatar_morph.glb') as any;

    // 👇 4. Hook quản lý Animation
    const { actions } = useAnimations(animations, nodes.Body || nodes.mixamorigHips || nodes.Scene);
    const meshRef = useRef<THREE.Mesh>(null);

    // --- XỬ LÝ ANIMATION (ĐI BỘ / ĐỨNG) ---
    useEffect(() => {
        // Tên animation phải khớp với trong file Blender/Mixamo (thường là 'mixamo.com', 'Idle', 'Walking')
        // Bạn hãy check console.log(actions) để xem tên chính xác nếu không chạy
        const actionName = pose === 'walking' ? 'Walking' : 'Idle';

        // Fallback: Nếu không tìm thấy tên 'Walking', thử tìm animation đầu tiên
        const action = actions[actionName] || Object.values(actions)[0];

        if (action) {
            action.reset().fadeIn(0.5).play(); // Chuyển động mượt mà (fade)
        }

        return () => {
            if (action) action.fadeOut(0.5);
        };
    }, [pose, actions]);

    // --- XỬ LÝ MORPH TARGET (GIỮ NGUYÊN LOGIC CỦA BẠN - RẤT TỐT) ---
    const targetMesh = useMemo(() => {
        const allNodes = Object.values(nodes);
        const found = allNodes.find((n: any) => n.isMesh && n.morphTargetDictionary && Object.keys(n.morphTargetDictionary).length > 0);
        return found as THREE.Mesh;
    }, [nodes]);

    useEffect(() => {
        if (meshRef.current && targetMesh) {
            const dictionary = targetMesh.morphTargetDictionary;
            const influences = meshRef.current.morphTargetInfluences;

            if (dictionary && influences) {
                const setMorph = (key: string, value: number) => {
                    const idx = dictionary[key];
                    if (idx !== undefined) {
                        influences[idx] = Math.max(0, Math.min(1, value));
                    }
                };

                // Logic điều chỉnh morph thông minh của bạn
                let weightAdjust = weight;
                if (weight < 0.6) weightAdjust = 0.8;
                else if (weight > 0.8) weightAdjust = 1.2;
                setMorph('Fat_Full', weightAdjust);

                let chestAdjust = chest;
                if (chest < 0.5) chestAdjust = 0.9;
                setMorph('Chest_Big', chestAdjust);

                let waistAdjust = waist;
                if (waist < 0.7) waistAdjust = 0.8;
                else if (waist > 0.8) waistAdjust = 1.2;
                setMorph('Waist_Big', waistAdjust);

                let hipsAdjust = hips;
                if (hips > 0.8) hipsAdjust = 1.1;
                setMorph('Hips_Wide', hipsAdjust);
            }
        }
    }, [weight, chest, waist, hips, targetMesh]);

    if (!targetMesh) return null;

    return (
        <group dispose={null}>
            <mesh
                ref={meshRef}
                geometry={targetMesh.geometry}
                // Giữ nguyên vật liệu da của bạn
                material={materials.Skin || materials['Material.001'] || new THREE.MeshStandardMaterial({ color: '#ffdbac', roughness: 0.4 })}
                morphTargetDictionary={targetMesh.morphTargetDictionary}
                morphTargetInfluences={targetMesh.morphTargetInfluences}

                // Scale động theo cân nặng
                scale={[0.085 * (1 + weight * 0.1), height * 0.085 * (1 + weight * 0.1), 0.085 * (1 + weight * 0.1)]}
                position={[0, 0, 0]}
                castShadow
                receiveShadow
            >
                {clothingTexture && (
                    <ClothingLayer
                        textureUrl={clothingTexture}
                        // Logic scale quần áo động theo morph (RẤT HAY!)
                        scale={[7 + waist * 0.5, 7 + chest * 0.5, 3 + hips * 0.5]}
                        // Logic vị trí động theo chiều cao
                        position={[0, 15.5 + height * 0.1, 0.8]}
                    />
                )}
            </mesh>
        </group>
    );
}

// Preload đúng đường dẫn file của bạn
useGLTF.preload('/assets/models/avatar_morph.glb');