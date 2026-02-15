import React, { useMemo, useRef, useEffect } from 'react';
import { useGLTF, useAnimations } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

import type { AvatarProps } from './types';
import { updateAvatarMorph } from './useAvatarMorph';

const MODEL_PATH = '/assets/models/avatar_morph.glb';

export const Avatar: React.FC<AvatarProps & { skinColor?: string }> = ({
    body,
    pose = 'Idle',
}) => {
    const group = useRef<THREE.Group>(null);
    const { scene, animations } = useGLTF(MODEL_PATH) as any;
    const { actions, names } = useAnimations(animations, group);

    // 1. CHỈ QUÉT MODEL 1 LẦN: Lưu 2 mesh 'Plane003' và 'Plane003_1' vào bộ nhớ
    const avatarData = useMemo(() => {
        const map: { legs: THREE.Bone[], spine: THREE.Bone[], hips: THREE.Bone | null, morphMeshes: THREE.SkinnedMesh[] } = {
            legs: [], spine: [], hips: null, morphMeshes: []
        };
        scene.traverse((child: any) => {
            if (child.isBone) {
                const name = child.name.toLowerCase();
                if (name.includes('upper-leg') || (name.includes('leg') && !name.includes('ctrl'))) map.legs.push(child);
                if (name.includes('spine')) map.spine.push(child);
                if (name === 'hips' || name.includes('pelvis')) map.hips = child;
            }
            // Thu thập TẤT CẢ các Mesh có chứa Shape Keys đã tìm thấy
            if (child.isSkinnedMesh && child.morphTargetDictionary) {
                map.morphMeshes.push(child);
            }
        });
        return map;
    }, [scene]);

    // 2. GHI ĐÈ ANIMATION MỖI KHUNG HÌNH (useFrame)
    useFrame(() => {
        if (!body || avatarData.morphMeshes.length === 0) return;

        // A. Cập nhật Xương (Chân)
        const stdLeg = 95;
        const legScale = body.legLength / stdLeg;
        const torsoScale = (body.height - body.legLength) / (165 - 95);

        avatarData.legs.forEach(b => b.scale.set(1, legScale, 1));
        avatarData.spine.forEach(b => {
            if (b.name.toLowerCase().includes('spine1')) b.scale.set(1, torsoScale, 1);
        });

        if (avatarData.hips) {
            avatarData.hips.position.y = (legScale - 1) * (stdLeg / 100);
        }

        // B. Áp dụng Shape Keys cho Plane003 và Plane003_1 đồng bộ
        avatarData.morphMeshes.forEach(mesh => {
            updateAvatarMorph(mesh, body);
            if (mesh.skeleton) mesh.skeleton.update(); // Ép cập nhật lưới
        });
    });

    // 3. Logic Animation
    useEffect(() => {
        const actionName = names.find(n => n.toLowerCase().includes(pose.toLowerCase())) || names[0];
        if (actionName && actions[actionName]) actions[actionName].reset().fadeIn(0.5).play();
        return () => { actions[actionName]?.fadeOut(0.5); };
    }, [actions, names, pose]);

    const globalScale = (body?.height || 165) / 165;

    return (
        <group ref={group} scale={[globalScale, globalScale, globalScale]}>
            <primitive object={scene} />
        </group>
    );
};