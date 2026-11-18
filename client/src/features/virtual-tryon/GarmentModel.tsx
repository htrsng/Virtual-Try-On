import { Suspense, useEffect, useMemo, useRef } from 'react';
import { useFrame, useLoader } from '@react-three/fiber';
import * as THREE from 'three';
import { GLTFLoader, type GLTF } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { clone } from 'three/examples/jsm/utils/SkeletonUtils.js';
import { useAnimations } from '@react-three/drei';

import {
    applyGarmentColor,
    applyGarmentHeatmap,
    bindGarmentToAvatarSkeleton,
    createGarmentMorphBindings,
    type GarmentFabricProfile,
    type GarmentHeatmapZone,
    prepareGarmentMaterialsWithTuning,
    syncGarmentMorphTargets,
    setGarmentTargetColor,
    lerpGarmentColor,
} from './garmentBinding';

import type { FitZone } from './components/sizeRecommendationEngine';
import { staticQaRender } from './qaRender';

import type { GarmentSoftness as GarmentSoftnessConfig, GarmentConfig } from '../../types/garment';
import type { Profile } from '../../contexts/FittingRoomContext';

type ResolvedGarmentConfig = {
    url: string;
    autoNormalize: boolean;
    followAvatarBones: boolean;
    softness: GarmentSoftnessConfig;
    fabric?: GarmentFabricProfile;
    garmentType?: string;
    scale: number;
    translate: [number, number, number];
};

interface GarmentModelProps {
    config?: GarmentConfig;
    wireframeColor?: string;
    ghostOpacity?: number;
    emissiveIntensity?: number;
    selectedSize?: string | null;
    selectedColor?: string;
    fabricOverride?: GarmentFabricProfile;
    avatarScene?: THREE.Group | null;
    heatmapEnabled?: boolean;
    heatmapZones?: FitZone[];
    avatarProfile?: Profile | null;
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
        garmentType: config.measurementProfile?.garmentType,
        scale: typeof sizeConfig.scale === 'number' ? sizeConfig.scale : (typeof config.scale === 'number' ? config.scale : 1),
        translate: Array.isArray(sizeConfig.translate) ? sizeConfig.translate as [number, number, number] : (Array.isArray(config.translate) ? config.translate as [number, number, number] : [0, 0, 0]),
    };
};

type GarmentInstanceProps = {
    garment: ResolvedGarmentConfig;
    selectedColor?: string;
    fabricOverride?: GarmentFabricProfile;
    avatarScene: THREE.Group | null;
    heatmapEnabled: boolean;
    heatmapZones: GarmentHeatmapZone[];
    wireframeColor?: string;
    ghostOpacity?: number;
    emissiveIntensity?: number;
    avatarProfile?: Profile | null;
    config?: GarmentConfig;
    selectedSize?: string | null;
};

function GarmentInstance({
    garment,
    selectedColor,
    fabricOverride,
    avatarScene,
    heatmapEnabled,
    heatmapZones,
    wireframeColor,
    ghostOpacity,
    emissiveIntensity,
    avatarProfile,
    config,
    selectedSize,
}: GarmentInstanceProps) {
    const gltf = useLoader(GLTFLoader, garment.url) as GLTF;

    const garmentScaleFactors = useMemo(() => {
        let scaleX = 1;
        let scaleY = 1;
        let scaleZ = 1;

        if (avatarProfile && garment.followAvatarBones) {
            const safeHeight = Number.isFinite(avatarProfile.height) && avatarProfile.height > 0 ? avatarProfile.height : 165;
            const globalScale = Math.min(Math.max(safeHeight / 165, 0.75), 1.45);

            // Width axes (X, Z) map from product size -> Fixed physical width.
            // We must counteract the avatar's global uniform scale so the garment keeps its authored width.
            scaleX = 1 / globalScale;
            scaleZ = 1 / globalScale;
            
            // Length axis (Y) maps from avatar body.
            // The 3D skinning naturally stretches Y to match the avatar's bones.
            scaleY = 1; 
        }

        let sizeRatio = 1;
        let widthRatio = 1;
        const normalizedSize = String(selectedSize || 'M').trim().toUpperCase();
        const sizeSpecs = config?.measurementProfile?.sizeSpecs;
        if (sizeSpecs) {
            // Length Ratio (Y axis)
            const currentLength = sizeSpecs[normalizedSize]?.garmentLength;
            const refLength = sizeSpecs['M']?.garmentLength || Object.values(sizeSpecs)[0]?.garmentLength;
            if (currentLength && refLength) {
                sizeRatio = currentLength / refLength;
            }

            // Width Ratio (X, Z axes)
            // Use waist, hips, or chest to determine the proportional width difference between sizes
            const currentWidth = sizeSpecs[normalizedSize]?.waist || sizeSpecs[normalizedSize]?.hips || sizeSpecs[normalizedSize]?.chest;
            const refWidth = sizeSpecs['M']?.waist || sizeSpecs['M']?.hips || sizeSpecs['M']?.chest || Object.values(sizeSpecs)[0]?.waist || Object.values(sizeSpecs)[0]?.hips || Object.values(sizeSpecs)[0]?.chest;
            
            if (currentWidth && refWidth) {
                widthRatio = currentWidth / refWidth;
            }
        }

        return new THREE.Vector3(scaleX * widthRatio, scaleY * sizeRatio, scaleZ * widthRatio);
    }, [avatarProfile, garment.followAvatarBones, config, selectedSize]);

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

        try {
            if (typeof garment.scale === 'number' && Math.abs(garment.scale - 1) > 1e-6) {
                cloned.scale.multiplyScalar(garment.scale);
            }

            try {
                const t = garment.translate || [0, 0, 0];
                if (Array.isArray(t) && t.length === 3 && (t[0] !== 0 || t[1] !== 0 || t[2] !== 0)) {
                    cloned.position.add(new THREE.Vector3(t[0], t[1], t[2]));
                }
            } catch { /* Ignore only an invalid optional placement override; retain the authored transform. */ }
        } catch (e) {
            console.warn('[GarmentModel] Failed to apply dress scale', e);
        }

        prepareGarmentMaterialsWithTuning(cloned, {
            roughness: garment.softness.roughness,
            metalness: garment.softness.metalness,
            envMapIntensity: garment.softness.envMapIntensity,
            fabricProfile: effectiveFabric,
        });

        if (ghostOpacity !== undefined) {
            cloned.traverse((child) => {
                const mesh = child as THREE.Mesh;
                if (mesh.isMesh) {
                    const originalMat = Array.isArray(mesh.material) ? mesh.material[0] : mesh.material;
                    const newMat = originalMat.clone() as THREE.MeshStandardMaterial;
                    newMat.transparent = true;
                    newMat.opacity = ghostOpacity;
                    newMat.depthWrite = false;
                    
                    if (emissiveIntensity !== undefined && emissiveIntensity > 0) {
                        newMat.emissive = new THREE.Color(wireframeColor || '#FFFFFF');
                        newMat.emissiveIntensity = emissiveIntensity;
                    }
                    
                    mesh.material = newMat;
                }
            });
        }
        return cloned;
    }, [
        fabricOverride,
        gltf.scene,
        garment.autoNormalize,
        garment.fabric,
        garment.scale,
        garment.translate,
        garment.softness.envMapIntensity,
        garment.softness.metalness,
        garment.softness.roughness,
        wireframeColor,
        ghostOpacity,
        emissiveIntensity,
    ]);

    const { actions, names } = useAnimations(gltf.animations, garmentScene);

    useEffect(() => {
        const shared = new Set<THREE.Material | THREE.Texture | THREE.Skeleton>();
        const owned = new Set<THREE.Material | THREE.Texture | THREE.Skeleton>();
        const collect = (root: THREE.Object3D, resources: typeof shared) => root.traverse(child => {
            const mesh = child as THREE.Mesh;
            if (!mesh.isMesh) return;
            if ((mesh as THREE.SkinnedMesh).isSkinnedMesh) resources.add((mesh as THREE.SkinnedMesh).skeleton);
            for (const material of Array.isArray(mesh.material) ? mesh.material : [mesh.material]) {
                resources.add(material);
                for (const value of Object.values(material)) if (value instanceof THREE.Texture) resources.add(value);
            }
        });
        collect(gltf.scene, shared); collect(garmentScene, owned);
        return () => { for (const resource of owned) if (!shared.has(resource)) resource.dispose(); };
    }, [gltf.scene, garmentScene]);

    useEffect(() => {
        if (names.length > 0) {
            const actionName = names[0];
            if (actionName && actions[actionName]) {
                const action = actions[actionName]!;
                action.reset();
                if (staticQaRender()) { action.play(); action.setEffectiveTimeScale(0); action.getMixer().setTime(0); }
                else { action.setEffectiveTimeScale(1); action.fadeIn(0.5).play(); }
            }
            return () => { actions[actionName]?.fadeOut(0.5); };
        }
    }, [actions, names]);

    const initialColorSet = useRef(false);

    useEffect(() => {
        if (!initialColorSet.current) {
            applyGarmentColor(garmentScene, selectedColor);
            initialColorSet.current = true;
        } else {
            setGarmentTargetColor(garmentScene, selectedColor);
        }
    }, [garmentScene, selectedColor]);

    useEffect(() => {
        applyGarmentHeatmap(garmentScene, heatmapEnabled, heatmapZones, avatarScene, garment.garmentType);
    }, [avatarScene, garmentScene, heatmapEnabled, heatmapZones, garment.garmentType]);

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
        const trackedMeshes: Array<{ mesh: THREE.Mesh; originalParent: THREE.Object3D | null;
            originalGeometry: THREE.BufferGeometry; originalSkeleton?: THREE.Skeleton }> = [];
        garmentScene.traverse((child) => {
            if ((child as THREE.Mesh).isMesh) {
                const mesh = child as THREE.Mesh;
                trackedMeshes.push({ mesh, originalParent: mesh.parent, originalGeometry: mesh.geometry,
                    originalSkeleton: (mesh as THREE.SkinnedMesh).isSkinnedMesh ? (mesh as THREE.SkinnedMesh).skeleton : undefined });
            }
        });

        const bindResult = bindGarmentToAvatarSkeleton(
            garmentScene,
            avatarScene,
            adaptiveSkinOffset,
            garmentScaleFactors,
            garment.garmentType
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
            for (const { mesh, originalParent, originalGeometry, originalSkeleton } of trackedMeshes) {
                if (mesh.geometry !== originalGeometry) { mesh.geometry.dispose(); mesh.geometry = originalGeometry; }
                if (originalSkeleton && (mesh as THREE.SkinnedMesh).skeleton !== originalSkeleton) {
                    (mesh as THREE.SkinnedMesh).skeleton.dispose(); (mesh as THREE.SkinnedMesh).skeleton = originalSkeleton;
                }
                if (!originalParent) {
                    mesh.parent?.remove(mesh);
                    continue;
                }

                if (mesh.parent !== originalParent) {
                    originalParent.attach(mesh);
                }
            }
        };
    }, [adaptiveSkinOffset, avatarScene, garment.followAvatarBones, garment.garmentType, garment.url, garmentScene, garmentScaleFactors]);

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

    useFrame((_, delta) => {
        if (morphBindings.length > 0) {
            syncGarmentMorphTargets(morphBindings, {
                influenceScale: garment.softness.morphInfluence,
                smoothing: garment.softness.morphSmoothing,
                maxInfluence: garment.softness.maxMorphInfluence,
            });
        }
        lerpGarmentColor(garmentScene, delta);
    });

    return (
        <primitive
            object={garmentScene}
            userData={{ ...garmentScene.userData, vfitRole: 'garment', vfitAsset: garment.url }}
        />
    );
}

export default function GarmentModel({
    config,
    selectedSize,
    selectedColor,
    fabricOverride,
    avatarScene = null,
    heatmapEnabled = false,
    heatmapZones,
    avatarProfile,
    wireframeColor, ghostOpacity, emissiveIntensity,
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
                wireframeColor={wireframeColor}
                ghostOpacity={ghostOpacity}
                emissiveIntensity={emissiveIntensity}
                avatarProfile={avatarProfile}
                config={config}
                selectedSize={selectedSize}
            />
        </Suspense>
    );
}
