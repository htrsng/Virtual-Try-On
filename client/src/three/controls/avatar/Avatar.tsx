import React, { useEffect, useMemo, useRef } from 'react';
import { useGLTF, useAnimations } from '@react-three/drei';
import * as THREE from 'three';

import type { AvatarProps } from './types';
import { useAvatarMorph } from './useAvatarMorph';

const MODEL_PATH = '/assets/models/avatar_morph.glb';
const FLOOR_LEVEL = -0.9;

export const Avatar: React.FC<AvatarProps & { skinColor?: string }> = ({
    body,
    pose = 'Idle',
    clothingTexture,
    skinColor = '#E0AC69',
}) => {
    // 1. TẠO REF CHO GROUP
    const group = useRef<THREE.Group>(null);

    const { scene, animations } = useGLTF(MODEL_PATH) as any;

    // 2. GẮN ANIMATION VÀO GROUP REF
    const { actions, names } = useAnimations(animations, group);

    const initialModelInfo = useRef<{ height: number; minY: number } | null>(null);

    // =====================================================================
    // 3. LOGIC ANIMATION
    // =====================================================================
    useEffect(() => {
        let actionName = names.find(n => n.toLowerCase().includes(pose.toLowerCase()));

        if (!actionName && names.length > 0) {
            actionName = names[0];
        }

        if (actionName) {
            const action = actions[actionName];
            if (action) {
                action.reset().fadeIn(0.5).play();
                action.timeScale = 1;
            }
        }

        return () => {
            if (actionName) actions[actionName]?.fadeOut(0.5);
        };
    }, [actions, names, pose]);

    // =====================================================================
    // 4. TÌM BODY MESH & MORPHING
    // =====================================================================
    const targetMesh = useMemo(() => {
        let bestMesh: THREE.SkinnedMesh | undefined;
        let maxKeys = 0;
        scene.traverse((child: any) => {
            if (child.isSkinnedMesh && child.morphTargetDictionary) {
                const keyCount = Object.keys(child.morphTargetDictionary).length;
                if (keyCount > maxKeys) { maxKeys = keyCount; bestMesh = child; }
            }
        });
        return bestMesh;
    }, [scene]);

    useAvatarMorph(targetMesh, body);

    // =====================================================================
    // 5. ĐO ĐẠC & TÍNH VỊ TRÍ
    // =====================================================================
    if (!initialModelInfo.current && targetMesh) {
        targetMesh.updateMatrixWorld(true);
        const box = new THREE.Box3().setFromObject(targetMesh);
        const size = new THREE.Vector3();
        box.getSize(size);

        if (size.y > 0) {
            initialModelInfo.current = {
                height: size.y,
                minY: box.min.y
            };
        }
    }

    const { scale, position } = useMemo(() => {
        // ✅ FIX LỖI TYPE: Thêm 'as [number, number, number]' vào dòng này
        if (!initialModelInfo.current) {
            return {
                scale: 1,
                position: [0, FLOOR_LEVEL, 0] as [number, number, number]
            };
        }

        const desiredHeightMeters = (body?.height || 165) / 100;
        const scaleFactor = desiredHeightMeters / initialModelInfo.current.height;
        const posY = FLOOR_LEVEL - (initialModelInfo.current.minY * scaleFactor);

        return {
            scale: scaleFactor,
            // ✅ Đã ép kiểu chính xác ở đây
            position: [0, posY, 0] as [number, number, number]
        };
    }, [body?.height, targetMesh]);

    // =====================================================================
    // 6. XỬ LÝ VẬT LIỆU
    // =====================================================================
    const isBodyPart = (child: any) => {
        return child.isSkinnedMesh &&
            !['eye', 'teeth', 'tongue', 'hair'].some(k => child.name.toLowerCase().includes(k));
    };

    useEffect(() => {
        scene.traverse((child: any) => {
            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = false;
                if (child.material && isBodyPart(child)) {
                    const mat = Array.isArray(child.material) ? child.material[0] : child.material;
                    mat.roughness = 0.5;
                    mat.metalness = 0.0;
                    mat.transparent = false;
                    mat.depthWrite = true;

                    if (clothingTexture) {
                        const loader = new THREE.TextureLoader();
                        loader.load(clothingTexture, (tex) => {
                            tex.flipY = false;
                            tex.colorSpace = THREE.SRGBColorSpace;
                            mat.map = tex;
                            mat.color.setHex(0xffffff);
                            mat.needsUpdate = true;
                        });
                    } else {
                        mat.map = null;
                        mat.color.set(skinColor);
                        mat.needsUpdate = true;
                    }
                }
            }
        });
    }, [scene, skinColor, clothingTexture]);

    return (
        <group ref={group} dispose={null} position={position} scale={[scale, scale, scale]}>
            <primitive object={scene} />
        </group>
    );
};

useGLTF.preload(MODEL_PATH);