// src/hooks/useMorph.ts
import { useFrame } from '@react-three/fiber';
import type { SkinnedMesh } from 'three'; // Thêm type
import type { MorphParams } from '../features/virtual-tryon/types'; // Thêm type
import * as THREE from 'three';

const MORPH_TARGET_DICTIONARY: Record<keyof MorphParams, string> = {
    height: 'Shape_Height',
    waist: 'Shape_Waist',
    chest: 'Shape_Chest',
    hips: 'Shape_Hips',
    muscle: 'Shape_Muscle',
};

export const useMorph = (
    meshRef: React.MutableRefObject<SkinnedMesh | undefined | null>,
    params: MorphParams
) => {
    // Thay state bằng _ để báo hiệu biến này không dùng
    useFrame((_, delta) => {
        if (!meshRef.current || !meshRef.current.morphTargetInfluences || !meshRef.current.morphTargetDictionary) return;

        Object.keys(params).forEach((key) => {
            const paramKey = key as keyof MorphParams;
            const targetName = MORPH_TARGET_DICTIONARY[paramKey];
            const targetIndex = meshRef.current!.morphTargetDictionary![targetName];

            if (targetIndex !== undefined) {
                meshRef.current!.morphTargetInfluences![targetIndex] = THREE.MathUtils.lerp(
                    meshRef.current!.morphTargetInfluences![targetIndex],
                    params[paramKey],
                    5 * delta
                );
            }
        });
    });
};