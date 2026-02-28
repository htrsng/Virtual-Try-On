import { useEffect, useMemo } from 'react';
import { useGLTF } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

type Vector3Tuple = [number, number, number];

type GarmentSizeConfig = {
    url: string;
    scale?: number | Vector3Tuple;
    position?: Vector3Tuple;
    rotation?: Vector3Tuple;
    autoNormalize?: boolean;
    followAvatarBones?: boolean;
};

type GarmentConfig = {
    enable?: boolean;
    url?: string;
    scale?: number | Vector3Tuple;
    position?: Vector3Tuple;
    rotation?: Vector3Tuple;
    sizes?: Record<string, GarmentSizeConfig>;
    autoNormalize?: boolean;
    followAvatarBones?: boolean;
};

interface GarmentModelProps {
    config?: GarmentConfig;
    selectedSize?: string | null;
    selectedColor?: string;
    avatarScene?: THREE.Group | null;
}

const toScaleVector = (scale?: number | Vector3Tuple): Vector3Tuple => {
    if (Array.isArray(scale) && scale.length === 3) {
        return [scale[0], scale[1], scale[2]];
    }

    if (typeof scale === 'number') {
        return [scale, scale, scale];
    }

    return [1, 1, 1];
};

const normalizeBoneName = (name: string) =>
    name
        .toLowerCase()
        .replace(/mixamorig|armature|skeleton|bone/gi, '')
        .replace(/[^a-z0-9]/g, '');

const resolveGarmentConfig = (
    config?: GarmentConfig,
    selectedSize?: string | null
): GarmentSizeConfig | null => {
    if (!config || config.enable === false) {
        return null;
    }

    if (config.sizes && Object.keys(config.sizes).length > 0) {
        const normalizedSize = String(selectedSize || '').trim().toUpperCase();
        if (!normalizedSize) {
            return config.sizes.S || null;
        }
        return config.sizes[normalizedSize] || null;
    }

    if (!config.url) {
        return null;
    }

    return {
        url: config.url,
        scale: config.scale,
        position: config.position,
        rotation: config.rotation
    };
};

export default function GarmentModel({ config, selectedSize, selectedColor = '#f5f5f5', avatarScene = null }: GarmentModelProps) {
    const garment = resolveGarmentConfig(config, selectedSize);
    const shouldAutoNormalize = garment?.autoNormalize ?? config?.autoNormalize ?? true;
    const shouldFollowAvatarBones = garment?.followAvatarBones ?? config?.followAvatarBones ?? false;

    useEffect(() => {
        if (!config) {
            console.log('🧥 [GarmentModel] Không có config model3D cho sản phẩm này');
            return;
        }

        if (!garment?.url) {
            console.log('🧥 [GarmentModel] Có config nhưng chưa resolve được file GLB', {
                selectedSize,
                config,
            });
            return;
        }

        console.log('🧥 [GarmentModel] Đang load áo', {
            selectedSize,
            url: garment.url,
            selectedColor,
            scale: garment.scale,
            position: garment.position,
            rotation: garment.rotation,
            autoNormalize: shouldAutoNormalize,
            followAvatarBones: shouldFollowAvatarBones,
        });
    }, [config, garment, selectedSize, selectedColor, shouldAutoNormalize, shouldFollowAvatarBones]);

    if (!garment?.url) {
        return null;
    }

    const { scene } = useGLTF(garment.url);

    const garmentScene = useMemo(() => {
        const cloned = scene.clone(true);

        if (shouldAutoNormalize) {
            const box = new THREE.Box3().setFromObject(cloned);
            if (!box.isEmpty()) {
                const center = box.getCenter(new THREE.Vector3());
                cloned.position.sub(center);
            }
        }

        cloned.traverse((child: THREE.Object3D) => {
            if (child instanceof THREE.Mesh) {
                child.castShadow = false;
                child.receiveShadow = false;
                child.frustumCulled = false;

                if (Array.isArray(child.material)) {
                    child.material = child.material.map((mat) => {
                        const clonedMat = mat.clone();
                        if ('color' in clonedMat && clonedMat.color instanceof THREE.Color) {
                            clonedMat.color = new THREE.Color(selectedColor);
                        }
                        if ('transparent' in clonedMat) {
                            clonedMat.transparent = false;
                        }
                        if ('opacity' in clonedMat) {
                            clonedMat.opacity = 1;
                        }
                        if ('side' in clonedMat) {
                            clonedMat.side = THREE.DoubleSide;
                        }
                        return clonedMat;
                    });
                } else if (child.material) {
                    const clonedMat = child.material.clone();
                    if ('color' in clonedMat && clonedMat.color instanceof THREE.Color) {
                        clonedMat.color = new THREE.Color(selectedColor);
                    }
                    if ('transparent' in clonedMat) {
                        clonedMat.transparent = false;
                    }
                    if ('opacity' in clonedMat) {
                        clonedMat.opacity = 1;
                    }
                    if ('side' in clonedMat) {
                        clonedMat.side = THREE.DoubleSide;
                    }
                    child.material = clonedMat;
                }
            }
        });
        return cloned;
    }, [scene, selectedColor, shouldAutoNormalize]);

    const bonePairs = useMemo(() => {
        if (!shouldFollowAvatarBones || !avatarScene) {
            return [] as Array<{ garmentBone: THREE.Bone; avatarBone: THREE.Bone }>;
        }

        const avatarBoneMap = new Map<string, THREE.Bone>();
        const avatarBones: THREE.Bone[] = [];
        avatarScene.traverse((child) => {
            if (child instanceof THREE.Bone) {
                avatarBones.push(child);
                avatarBoneMap.set(child.name.toLowerCase(), child);
                avatarBoneMap.set(normalizeBoneName(child.name), child);
            }
        });

        const pairs: Array<{ garmentBone: THREE.Bone; avatarBone: THREE.Bone }> = [];
        garmentScene.traverse((child) => {
            if (child instanceof THREE.Bone) {
                const exactKey = child.name.toLowerCase();
                const normalizedKey = normalizeBoneName(child.name);

                let matched = avatarBoneMap.get(exactKey) || avatarBoneMap.get(normalizedKey);

                if (!matched) {
                    matched = avatarBones.find((ab) => {
                        const abNorm = normalizeBoneName(ab.name);
                        return abNorm.endsWith(normalizedKey) || normalizedKey.endsWith(abNorm);
                    });
                }

                if (matched) {
                    pairs.push({ garmentBone: child, avatarBone: matched });
                }
            }
        });

        console.log('🧵 [GarmentModel] Bone mapping', {
            followAvatarBones: shouldFollowAvatarBones,
            matchedBones: pairs.length,
        });

        return pairs;
    }, [avatarScene, garmentScene, shouldFollowAvatarBones]);

    useFrame(() => {
        if (!shouldFollowAvatarBones || bonePairs.length === 0) {
            return;
        }

        for (const pair of bonePairs) {
            pair.garmentBone.position.copy(pair.avatarBone.position);
            pair.garmentBone.quaternion.copy(pair.avatarBone.quaternion);
            pair.garmentBone.scale.copy(pair.avatarBone.scale);
        }

        garmentScene.traverse((child) => {
            if (child instanceof THREE.SkinnedMesh && child.skeleton) {
                child.skeleton.update();
            }
        });
    });

    return (
        <primitive
            object={garmentScene}
            position={garment.position || [0, 0, 0]}
            rotation={garment.rotation || [0, 0, 0]}
            scale={toScaleVector(garment.scale)}
        />
    );
}
