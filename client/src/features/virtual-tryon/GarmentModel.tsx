import { Suspense, useEffect, useMemo } from 'react';
import { useFrame, useLoader } from '@react-three/fiber';
import * as THREE from 'three';
import { GLTFLoader, type GLTF } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { clone } from 'three/examples/jsm/utils/SkeletonUtils.js';

import {
    applyGarmentColor,
    applyGarmentHeatmap,
    bindGarmentToAvatarSkeleton,
    createGarmentMorphBindings,
    type GarmentFabricProfile,
    type GarmentHeatmapZone,
    prepareGarmentMaterialsWithTuning,
    syncGarmentMorphTargets,
} from './garmentBinding';

import type { FitZone } from './components/SizeRecommendation';

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
    fabric?: GarmentFabricProfile;
};

type GarmentConfig = {
    enable?: boolean;
    sizes?: Record<string, GarmentSizeConfig>;
    autoNormalize?: boolean;
    followAvatarBones?: boolean;
    softness?: GarmentSoftnessConfig;
    fabric?: GarmentFabricProfile;
};

type ResolvedGarmentConfig = {
    url: string;
    autoNormalize: boolean;
    followAvatarBones: boolean;
    softness: GarmentSoftnessConfig;
    fabric?: GarmentFabricProfile;
};

interface GarmentModelProps {
    config?: GarmentConfig;
    selectedSize?: string | null;
    selectedColor?: string;
    fabricOverride?: GarmentFabricProfile;
    avatarScene?: THREE.Group | null;
    heatmapEnabled?: boolean;
    heatmapZones?: FitZone[];
}

const mergeSoftnessConfig = (
    base?: GarmentSoftnessConfig,
    override?: GarmentSoftnessConfig,
): GarmentSoftnessConfig => ({
    ...(base || {}),
    ...(override || {}),
});

const mergeFabricConfig = (
    base?: GarmentFabricProfile,
    override?: GarmentFabricProfile,
): GarmentFabricProfile | undefined => {
    const merged = {
        ...(base || {}),
        ...(override || {}),
    };

    return Object.keys(merged).length > 0 ? merged : undefined;
};

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
        fabric: mergeFabricConfig(config.fabric, sizeConfig.fabric),
    };
};

type GarmentInstanceProps = {
    garment: ResolvedGarmentConfig;
    selectedColor: string;
    fabricOverride?: GarmentFabricProfile;
    avatarScene: THREE.Group | null;
    heatmapEnabled: boolean;
    heatmapZones: GarmentHeatmapZone[];
};

function GarmentInstance({
    garment,
    selectedColor,
    fabricOverride,
    avatarScene,
    heatmapEnabled,
    heatmapZones,
}: GarmentInstanceProps) {
    const gltf = useLoader(GLTFLoader, garment.url) as GLTF;

    const garmentScene = useMemo(() => {
        const cloned = clone(gltf.scene) as THREE.Group;
        const effectiveFabric = mergeFabricConfig(garment.fabric, fabricOverride);

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
            fabricProfile: effectiveFabric,
        });
        return cloned;
    }, [
        fabricOverride,
        gltf.scene,
        garment.autoNormalize,
        garment.fabric,
        garment.softness.envMapIntensity,
        garment.softness.metalness,
        garment.softness.roughness,
    ]);

    useEffect(() => {
        applyGarmentColor(garmentScene, selectedColor);
    }, [garmentScene, selectedColor]);

    useEffect(() => {
        applyGarmentHeatmap(garmentScene, heatmapEnabled, heatmapZones, avatarScene);
    }, [avatarScene, garmentScene, heatmapEnabled, heatmapZones]);

    const adaptiveSkinOffset = useMemo(() => {
        const baseOffset = garment.softness.skinOffset ?? 0;
        const highestTightSeverity = heatmapZones.reduce((maxSeverity, zone) => {
            if (zone.fit !== 'tight') {
                return maxSeverity;
            }
            const currentSeverity = typeof zone.severity === 'number'
                ? Math.min(1, Math.max(0, zone.severity))
                : Math.min(1, Math.abs(zone.delta) / 8);
            return Math.max(maxSeverity, currentSeverity);
        }, 0);

        // Increase cloth lift slightly in tight zones to reduce body clipping.
        return baseOffset + highestTightSeverity * 0.0022;
    }, [garment.softness.skinOffset, heatmapZones]);

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
            adaptiveSkinOffset,
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
    }, [adaptiveSkinOffset, avatarScene, garment.followAvatarBones, garment.url, garmentScene]);

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

export default function GarmentModel({
    config,
    selectedSize,
    selectedColor = '#f5f5f5',
    fabricOverride,
    avatarScene = null,
    heatmapEnabled = false,
    heatmapZones,
}: GarmentModelProps) {
    const garment = useMemo(() => resolveGarmentConfig(config, selectedSize), [config, selectedSize]);
    const normalizedHeatmapZones = useMemo<GarmentHeatmapZone[]>(() => {
        const normalized: GarmentHeatmapZone[] = [];

        (heatmapZones || []).forEach((zone) => {
            if (!zone?.key) {
                return;
            }

            normalized.push({
                key: zone.key,
                fit: zone.fit,
                delta: zone.delta,
                severity: zone.severity,
            });
        });

        return normalized;
    }, [heatmapZones]);

    if (!garment?.url) {
        return null;
    }

    return (
        <Suspense fallback={null}>
            <GarmentInstance
                key={garment.url}
                garment={garment}
                selectedColor={selectedColor}
                fabricOverride={fabricOverride}
                avatarScene={avatarScene}
                heatmapEnabled={Boolean(heatmapEnabled)}
                heatmapZones={normalizedHeatmapZones}
            />
        </Suspense>
    );
}
