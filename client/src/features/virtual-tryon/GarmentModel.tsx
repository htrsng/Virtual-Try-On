import { Suspense, useEffect, useMemo } from 'react';
import { useFrame, useLoader } from '@react-three/fiber';
import * as THREE from 'three';
import { GLTFLoader, type GLTF } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { clone } from 'three/examples/jsm/utils/SkeletonUtils.js';

import {
    applyGarmentColor,
    bindGarmentToAvatarSkeleton,
    createGarmentMorphBindings,
    prepareGarmentMaterialsWithTuning,
    syncGarmentMorphTargets,
} from './garmentBinding';

type GarmentSoftnessConfig = {
    morphInfluence?: number;
    morphSmoothing?: number;
    maxMorphInfluence?: number;
    roughness?: number;
    metalness?: number;
    envMapIntensity?: number;
    /** Small outward offset (in model units) to prevent body-through-cloth clipping. */
    skinOffset?: number;
};

type GarmentSizeConfig = {
    url: string;
    autoNormalize?: boolean;
    followAvatarBones?: boolean;
    softness?: GarmentSoftnessConfig;
};

type GarmentConfig = {
    enable?: boolean;
    sizes?: Record<string, GarmentSizeConfig>;
    autoNormalize?: boolean;
    followAvatarBones?: boolean;
    softness?: GarmentSoftnessConfig;
};

type ResolvedGarmentConfig = {
    url: string;
    autoNormalize: boolean;
    followAvatarBones: boolean;
    softness: GarmentSoftnessConfig;
};

interface GarmentModelProps {
    config?: GarmentConfig;
    selectedSize?: string | null;
    selectedColor?: string;
    avatarScene?: THREE.Group | null;
}

const mergeSoftnessConfig = (
    base?: GarmentSoftnessConfig,
    override?: GarmentSoftnessConfig,
): GarmentSoftnessConfig => ({
    ...(base || {}),
    ...(override || {}),
});

const resolveGarmentConfig = (
    config?: GarmentConfig,
    selectedSize?: string | null
): ResolvedGarmentConfig | null => {
    if (!config || config.enable === false) {
        return null;
    }

    const normalizedSize = String(selectedSize || 'M').trim().toUpperCase();
    const sizeConfig = config.sizes?.[normalizedSize];

    if (!sizeConfig?.url) {
        return null;
    }

    return {
        url: sizeConfig.url,
        autoNormalize: sizeConfig.autoNormalize ?? config.autoNormalize ?? true,
        followAvatarBones: sizeConfig.followAvatarBones ?? config.followAvatarBones ?? false,
        softness: mergeSoftnessConfig(config.softness, sizeConfig.softness),
    };
};

type GarmentInstanceProps = {
    garment: ResolvedGarmentConfig;
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

        prepareGarmentMaterialsWithTuning(cloned, {
            roughness: garment.softness.roughness,
            metalness: garment.softness.metalness,
            envMapIntensity: garment.softness.envMapIntensity,
        });
        return cloned;
    }, [
        gltf.scene,
        garment.autoNormalize,
        garment.softness.envMapIntensity,
        garment.softness.metalness,
        garment.softness.roughness,
    ]);

    useEffect(() => {
        applyGarmentColor(garmentScene, selectedColor);
    }, [garmentScene, selectedColor]);

    useEffect(() => {
        if (!garment.followAvatarBones || !avatarScene) {
            return;
        }

        // Capture all meshes and their original parents before binding.
        // bindGarmentToAvatarSkeleton() may reparent meshes via attach().
        const trackedMeshes: Array<{ mesh: THREE.Mesh; originalParent: THREE.Object3D | null }> = [];
        garmentScene.traverse((child) => {
            if ((child as THREE.Mesh).isMesh) {
                const mesh = child as THREE.Mesh;
                trackedMeshes.push({ mesh, originalParent: mesh.parent });
            }
        });

        const bindResult = bindGarmentToAvatarSkeleton(
            garmentScene,
            avatarScene,
            garment.softness.skinOffset ?? 0,
        );

        if (bindResult.boundMeshCount === 0 && bindResult.attachedMeshCount === 0) {
            console.warn(`[GarmentModel] No mesh found to bind/attach for ${garment.url}`);
        }

        if (bindResult.missingBoneNames.length > 0) {
            console.warn(
                `[GarmentModel] Missing avatar bones while binding ${garment.url}: ${bindResult.missingBoneNames.join(', ')}`,
            );
        }

        // Cleanup: restore meshes to their original parent.
        // This keeps development StrictMode effect re-runs safe.
        return () => {
            for (const { mesh, originalParent } of trackedMeshes) {
                if (!originalParent) {
                    mesh.parent?.remove(mesh);
                    continue;
                }

                if (mesh.parent !== originalParent) {
                    originalParent.attach(mesh);
                }
            }
        };
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

        syncGarmentMorphTargets(morphBindings, {
            influenceScale: garment.softness.morphInfluence,
            smoothing: garment.softness.morphSmoothing,
            maxInfluence: garment.softness.maxMorphInfluence,
        });
    });

    return (
        <primitive
            object={garmentScene}
        />
    );
}

export default function GarmentModel({ config, selectedSize, selectedColor = '#f5f5f5', avatarScene = null }: GarmentModelProps) {
    const garment = useMemo(() => resolveGarmentConfig(config, selectedSize), [config, selectedSize]);

    if (!garment?.url) {
        return null;
    }

    return (
        <Suspense fallback={null}>
            <GarmentInstance key={garment.url} garment={garment} selectedColor={selectedColor} avatarScene={avatarScene} />
        </Suspense>
    );
}
