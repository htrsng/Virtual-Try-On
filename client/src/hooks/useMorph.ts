// src/hooks/useMorph.ts
import { useFrame } from '@react-three/fiber';
import { MathUtils, SkinnedMesh } from 'three';
import type { BodyMorph } from '../three/controls/avatar/types';

const MORPH_TARGET_MAP: Record<keyof BodyMorph, string> = {
    height: 'Shape_Height',
    waist: 'Shape_Waist',
    chest: 'Shape_Chest',
    hips: 'Shape_Hips',
    weight: 'Shape_Weight',
};

export const useMorph = (
    meshRef: React.MutableRefObject<SkinnedMesh | null>,
    params: BodyMorph
) => {
    useFrame((_, delta) => {
        const mesh = meshRef.current;
        if (!mesh?.morphTargetInfluences || !mesh.morphTargetDictionary) return;

        (Object.entries(params) as [keyof BodyMorph, number][]).forEach(
            ([paramKey, value]) => {
                const targetName = MORPH_TARGET_MAP[paramKey];
                if (!mesh.morphTargetDictionary) return;
                const targetIndex = mesh.morphTargetDictionary[targetName];

                if (targetIndex === undefined || !mesh.morphTargetInfluences) return;

                mesh.morphTargetInfluences[targetIndex] = MathUtils.lerp(
                    mesh.morphTargetInfluences[targetIndex],
                    value,
                    delta * 5
                );
            }
        );
    });
};
