import React, { useRef, useEffect, useMemo } from 'react';
import { useGLTF, useAnimations } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { clone as cloneSkeleton } from 'three/examples/jsm/utils/SkeletonUtils.js';

import type { AvatarProps } from './types';
import { updateAvatarMorph } from './useAvatarMorph';

const MODEL_PATH = '/assets/models/avatar_morph.glb';

// Preload the GLB immediately when this module is imported, so the model
// starts downloading before the component mounts and Suspense triggers.
useGLTF.preload(MODEL_PATH);

export const Avatar: React.FC<AvatarProps & { skinColor?: string; onSceneReady?: (scene: THREE.Group) => void }> = ({
    body,
    pose = 'Idle',
    onSceneReady,
    skinColor,
}) => {
    const group = useRef<THREE.Group>(null);
    const { scene, animations } = useGLTF(MODEL_PATH) as { scene: THREE.Group; animations: THREE.AnimationClip[] };
    // Clone scene per instance because a Three.js Object3D cannot be attached to two parents.
    const avatarScene = useMemo(() => {
        const cloned = cloneSkeleton(scene) as THREE.Group;

        cloned.traverse((child: THREE.Object3D) => {
            if ((child as THREE.Mesh).isMesh) {
                const mesh = child as THREE.Mesh;
                mesh.castShadow = true;
                mesh.receiveShadow = true;

                const applyModestyShader = (mat: THREE.Material) => {
                    const stdMat = mat as THREE.MeshStandardMaterial;
                    stdMat.roughness = 0.6;
                    stdMat.metalness = 0.1;
                    stdMat.customProgramCacheKey = () => 'modesty_suit_v3';

                    stdMat.onBeforeCompile = (shader) => {
                        shader.vertexShader = shader.vertexShader.replace(
                            '#include <common>',
                            '#include <common>\nvarying vec3 vOrigPos;'
                        );
                        shader.vertexShader = shader.vertexShader.replace(
                            '#include <begin_vertex>',
                            '#include <begin_vertex>\nvOrigPos = position;'
                        );

                        shader.fragmentShader = shader.fragmentShader.replace(
                            '#include <common>',
                            '#include <common>\nvarying vec3 vOrigPos;'
                        );

                        shader.fragmentShader = shader.fragmentShader.replace(
                            '#include <color_fragment>',
                            `#include <color_fragment>
                            float y = vOrigPos.y;
                            float x = abs(vOrigPos.x);
                            
                            // Viền mờ để không bị cắt sắc nét (Đẩy phần ngực cao hơn 1.41 - 1.45)
                            float topEdge = smoothstep(1.41, 1.45, y);      // Viền cổ áo ngang ngực cao
                            float bottomEdge = smoothstep(0.62, 0.68, y);   // Viền gấu quần giữa đùi
                            
                            // Loại bỏ cánh tay (Thân thường có x nhỏ hơn 0.22, tay xa hơn 0.25)
                            float armMask = smoothstep(0.28, 0.21, x);
                            
                            // Khoét lỗ nách áo (Armpit hole)
                            float armpit = smoothstep(1.20, 1.30, y) * smoothstep(0.14, 0.18, x);
                            
                            // Tính toán độ bao phủ tổng thể (Alpha)
                            float suitAlpha = bottomEdge * (1.0 - topEdge) * armMask * (1.0 - armpit);
                            float totalAlpha = suitAlpha;
                            
                            if (totalAlpha > 0.02) {
                                // Màu đen xám tối
                                vec3 baseColor = vec3(0.18, 0.18, 0.19);
                                
                                // Tạo texture vải dệt kim dày dặn hơn
                                float knitPattern = sin(vOrigPos.x * 250.0) * sin(vOrigPos.y * 250.0);
                                vec3 suitColor = baseColor - (knitPattern * 0.05);
                                
                                // Làm viền áo tối hằn sâu hơn
                                float isBorder = max(
                                    smoothstep(1.39, 1.41, y) - smoothstep(1.42, 1.44, y), 
                                    smoothstep(0.66, 0.68, y) - smoothstep(0.69, 0.71, y)
                                );
                                suitColor -= isBorder * 0.12;

                                // Trộn mượt mà lớp vải lên da thịt
                                diffuseColor.rgb = mix(diffuseColor.rgb, suitColor, totalAlpha * 0.98);
                            }
                            `
                        );
                    };
                };

                if (Array.isArray(mesh.material)) {
                    mesh.material = mesh.material.map(m => m.clone());
                    mesh.material.forEach(applyModestyShader);
                } else {
                    mesh.material = mesh.material.clone();
                    applyModestyShader(mesh.material);
                }
            }
        });
        return cloned;
    }, [scene]);

    const { actions, names } = useAnimations(animations, group);
    const avatarDataRef = useRef<{ legs: THREE.Bone[]; spine: THREE.Bone[]; hips: THREE.Bone | null; morphMeshes: THREE.SkinnedMesh[] }>({
        legs: [],
        spine: [],
        hips: null,
        morphMeshes: []
    });

    // 1. CHỈ QUÉT MODEL 1 LẦN: Lưu các Bone và Mesh vào bộ nhớ
    useEffect(() => {
        const map: { legs: THREE.Bone[], spine: THREE.Bone[], hips: THREE.Bone | null, morphMeshes: THREE.SkinnedMesh[] } = {
            legs: [], spine: [], hips: null, morphMeshes: []
        };
        avatarScene.traverse((child: THREE.Object3D) => {
            if (child instanceof THREE.Bone) {
                const name = child.name.toLowerCase();
                if (name.includes('upper-leg') || (name.includes('leg') && !name.includes('ctrl'))) map.legs.push(child);
                if (name.includes('spine')) map.spine.push(child);
                if (name === 'hips' || name.includes('pelvis')) map.hips = child;
            }
            // Thu thập TẤT CẢ các Mesh có chứa Shape Keys đã tìm thấy
            if (child instanceof THREE.SkinnedMesh && child.morphTargetDictionary) {
                map.morphMeshes.push(child);
            }
        });
        avatarDataRef.current = map;
    }, [avatarScene]);

    // 1b. Cập nhật màu da (skinColor) một cách an toàn mà không clone lại material
    useEffect(() => {
        if (!skinColor) return;
        const updateColor = (mat: THREE.Material) => {
            if ((mat as THREE.MeshStandardMaterial).color) {
                (mat as THREE.MeshStandardMaterial).color.set(skinColor);
            }
        };
        avatarScene.traverse((child: THREE.Object3D) => {
            if ((child as THREE.Mesh).isMesh) {
                const mesh = child as THREE.Mesh;
                if (Array.isArray(mesh.material)) {
                    mesh.material.forEach(updateColor);
                } else if (mesh.material) {
                    updateColor(mesh.material);
                }
            }
        });
    }, [avatarScene, skinColor]);

    useEffect(() => {
        if (onSceneReady) {
            // Pass the parent group (which includes the global scale/transform)
            // so downstream binding/heatmap calculations see the avatar with
            // the correct world transform applied.
            if (group.current) {
                onSceneReady(group.current);
            } else {
                onSceneReady(avatarScene);
            }
        }
    }, [onSceneReady, avatarScene]);

    // 2. GHI ĐÈ ANIMATION MỖI KHUNG HÌNH (useFrame)
    useFrame(() => {
        const avatarData = avatarDataRef.current;
        if (!body || avatarData.morphMeshes.length === 0) return;

        const safeHeight = Number.isFinite(body.height) && body.height > 0 ? body.height : 165;
        const rawLegLength = Number.isFinite(body.legLength) && body.legLength > 0 ? body.legLength : Math.round(safeHeight * 0.58);
        const safeLegLength = THREE.MathUtils.clamp(rawLegLength, Math.round(safeHeight * 0.35), Math.round(safeHeight * 0.75));

        // A. Cập nhật Xương (Chân)
        const stdLeg = 95;
        const legScale = THREE.MathUtils.clamp(safeLegLength / stdLeg, 0.45, 1.75);
        const torsoScale = THREE.MathUtils.clamp((safeHeight - safeLegLength) / (165 - 95), 0.45, 1.75);

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

    const safeGlobalHeight = Number.isFinite(body?.height) && (body?.height || 0) > 0 ? (body?.height || 165) : 165;
    const globalScale = THREE.MathUtils.clamp(safeGlobalHeight / 165, 0.75, 1.45);

    return (
        <group ref={group} scale={[globalScale, globalScale, globalScale]}>
            <primitive object={avatarScene} />
        </group>
    );
};