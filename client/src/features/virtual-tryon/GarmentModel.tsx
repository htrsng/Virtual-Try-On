import { useEffect, useMemo } from 'react';
import { useFrame, useLoader } from '@react-three/fiber';
import * as THREE from 'three';
import { GLTFLoader, type GLTF } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { clone } from 'three/examples/jsm/utils/SkeletonUtils.js';

import {
    applyGarmentColor,
    bindGarmentToAvatarSkeleton,
    createGarmentMorphBindings,
    prepareGarmentMaterials,
    syncGarmentMorphTargets,
} from './garmentBinding';

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

const resolveGarmentConfig = (
    config?: GarmentConfig,
    selectedSize?: string | null
): (GarmentSizeConfig & { autoNormalize: boolean; followAvatarBones: boolean }) | null => {
    if (!config || config.enable === false) {
        return null;
    }

    if (config.sizes && Object.keys(config.sizes).length > 0) {
        const normalizedSize = String(selectedSize || '').trim().toUpperCase();
        const sizeConfig = normalizedSize ? config.sizes[normalizedSize] : config.sizes.S;

        if (!sizeConfig) {
            return null;
        }

        if (!normalizedSize) {
            return {
                ...sizeConfig,
                autoNormalize: sizeConfig.autoNormalize ?? config.autoNormalize ?? true,
                followAvatarBones: sizeConfig.followAvatarBones ?? config.followAvatarBones ?? false,
            };
        }

        return {
            ...sizeConfig,
            autoNormalize: sizeConfig.autoNormalize ?? config.autoNormalize ?? true,
            followAvatarBones: sizeConfig.followAvatarBones ?? config.followAvatarBones ?? false,
        };
    }

    if (!config.url) {
        return null;
    }

    return {
        url: config.url,
        scale: config.scale,
        position: config.position,
        rotation: config.rotation,
        autoNormalize: config.autoNormalize ?? true,
        followAvatarBones: config.followAvatarBones ?? false,
    };
};

type GarmentInstanceProps = {
    garment: GarmentSizeConfig & { autoNormalize: boolean; followAvatarBones: boolean };
    selectedColor: string;
    avatarScene: THREE.Group | null;
};

function GarmentInstance({ garment, selectedColor, avatarScene }: GarmentInstanceProps) {
    const gltf = useLoader(GLTFLoader, garment.url) as GLTF;

    const garmentScene = useMemo(() => {
        const cloned = clone(gltf.scene) as THREE.Group;

        if (garment.autoNormalize) {
            const box = new THREE.Box3().setFromObject(cloned);
            if (!box.isEmpty()) {
                const center = box.getCenter(new THREE.Vector3());
                cloned.position.sub(center);
            }
        }

        prepareGarmentMaterials(cloned);
        return cloned;
    }, [gltf.scene, garment.autoNormalize]);

    useEffect(() => {
        applyGarmentColor(garmentScene, selectedColor);
    }, [garmentScene, selectedColor]);

    useEffect(() => {
        if (!garment.followAvatarBones || !avatarScene) {
            return;
        }

        const bindResult = bindGarmentToAvatarSkeleton(garmentScene, avatarScene);

        if (bindResult.boundMeshCount === 0) {
            console.warn(`[GarmentModel] No skinned mesh found to bind for ${garment.url}`);
            return;
        }

        if (bindResult.missingBoneNames.length > 0) {
            console.warn(
                `[GarmentModel] Missing avatar bones while binding ${garment.url}: ${bindResult.missingBoneNames.join(', ')}`,
            );
        }
    }, [avatarScene, garment.followAvatarBones, garment.url, garmentScene]);

    const morphBindings = useMemo(() => {
        if (!avatarScene) {
            return [];
        }

        const { bindings, mappedChannelCount } = createGarmentMorphBindings(garmentScene, avatarScene);
        if (mappedChannelCount === 0) {
            return [];
        }

        return bindings;
    }, [avatarScene, garmentScene]);

    useFrame(() => {
        if (morphBindings.length === 0) {
            return;
        }

        syncGarmentMorphTargets(morphBindings);
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

export default function GarmentModel({ config, selectedSize, selectedColor = '#f5f5f5', avatarScene = null }: GarmentModelProps) {
    const garment = useMemo(() => resolveGarmentConfig(config, selectedSize), [config, selectedSize]);

    if (!garment?.url) {
        return null;
    }

    return <GarmentInstance garment={garment} selectedColor={selectedColor} avatarScene={avatarScene} />;
}
