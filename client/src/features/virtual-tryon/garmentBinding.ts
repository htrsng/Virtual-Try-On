import * as THREE from 'three';

type AvatarBoneLookup = {
    exact: Map<string, THREE.Bone>;
    normalized: Map<string, THREE.Bone>;
    all: THREE.Bone[];
};

type MaterialWithColor = THREE.Material & {
    color?: THREE.Color;
    transparent?: boolean;
    opacity?: number;
    side?: THREE.Side;
    needsUpdate?: boolean;
};

export type GarmentMaterialTuning = {
    roughness?: number;
    metalness?: number;
    envMapIntensity?: number;
};

/** Fabric-like defaults applied when no per-size override is provided. */
const FABRIC_DEFAULTS: Required<GarmentMaterialTuning> = {
    roughness: 0.8,
    metalness: 0.05,
    envMapIntensity: 0.5,
};

export type GarmentMorphSyncOptions = {
    influenceScale?: number;
    smoothing?: number;
    maxInfluence?: number;
};

type MorphChannelBinding = {
    targetIndex: number;
    sourceIndex: number;
    sourceInfluences: number[];
};

type MorphMeshBinding = {
    targetMesh: THREE.Mesh;
    channels: MorphChannelBinding[];
};

const normalizeBoneName = (name: string) =>
    name
        .toLowerCase()
        .replace(/mixamorig|armature|skeleton|bone/gi, '')
        .replace(/[^a-z0-9]/g, '');

const toMaterialArray = (material: THREE.Material | THREE.Material[]) =>
    Array.isArray(material) ? material : [material];

const buildAvatarBoneLookup = (avatarScene: THREE.Object3D): AvatarBoneLookup => {
    const exact = new Map<string, THREE.Bone>();
    const normalized = new Map<string, THREE.Bone>();
    const all: THREE.Bone[] = [];

    avatarScene.traverse((child) => {
        if (!(child instanceof THREE.Bone)) {
            return;
        }

        all.push(child);
        exact.set(child.name.toLowerCase(), child);
        normalized.set(normalizeBoneName(child.name), child);
    });

    return { exact, normalized, all };
};

const findAvatarBone = (boneName: string, lookup: AvatarBoneLookup): THREE.Bone | null => {
    const exactName = boneName.toLowerCase();
    const normalizedName = normalizeBoneName(boneName);

    const exact = lookup.exact.get(exactName);
    if (exact) {
        return exact;
    }

    const normalized = lookup.normalized.get(normalizedName);
    if (normalized) {
        return normalized;
    }

    return (
        lookup.all.find((avatarBone) => {
            const avatarNormalized = normalizeBoneName(avatarBone.name);
            return avatarNormalized.endsWith(normalizedName) || normalizedName.endsWith(avatarNormalized);
        }) || null
    );
};

/**
 * Convert every mesh material to MeshStandardMaterial (PBR) so that
 * roughness / metalness / envMapIntensity are always available.
 * Preserves color, map (diffuse texture), normalMap and aoMap from the source.
 */
export const prepareGarmentMaterials = (garmentRoot: THREE.Object3D) => {
    garmentRoot.traverse((child) => {
        if (!(child instanceof THREE.Mesh)) {
            return;
        }

        child.castShadow = true;
        child.receiveShadow = true;
        child.frustumCulled = false;

        const currentMaterials = toMaterialArray(child.material);
        const converted = currentMaterials.map((srcMat) => {
            // If already MeshStandardMaterial (or subclass), clone in-place
            if (srcMat instanceof THREE.MeshStandardMaterial) {
                const cloned = srcMat.clone();
                cloned.side = THREE.DoubleSide;
                cloned.transparent = false;
                cloned.opacity = 1;
                // Polygon offset pushes the garment slightly back in depth buffer
                // to prevent z-fighting with the avatar skin surface.
                cloned.polygonOffset = true;
                cloned.polygonOffsetFactor = -1;
                cloned.polygonOffsetUnits = -1;
                // Apply fabric defaults only when the values look like Three.js
                // auto-defaults (roughness 1 / metalness 0) — i.e. the GLB
                // did not provide intentional PBR authoring.
                if (cloned.roughness === 1 && cloned.metalness === 0) {
                    cloned.roughness = FABRIC_DEFAULTS.roughness;
                    cloned.metalness = FABRIC_DEFAULTS.metalness;
                    cloned.envMapIntensity = FABRIC_DEFAULTS.envMapIntensity;
                }
                cloned.needsUpdate = true;
                return cloned;
            }

            // Convert non-PBR material → MeshStandardMaterial
            const srcAny = srcMat as MaterialWithColor & {
                map?: THREE.Texture | null;
                normalMap?: THREE.Texture | null;
                aoMap?: THREE.Texture | null;
            };

            const standard = new THREE.MeshStandardMaterial({
                color: srcAny.color ? srcAny.color.clone() : new THREE.Color(0xffffff),
                map: srcAny.map ?? null,
                normalMap: srcAny.normalMap ?? null,
                aoMap: srcAny.aoMap ?? null,
                roughness: FABRIC_DEFAULTS.roughness,
                metalness: FABRIC_DEFAULTS.metalness,
                envMapIntensity: FABRIC_DEFAULTS.envMapIntensity,
                side: THREE.DoubleSide,
                transparent: false,
                opacity: 1,
                polygonOffset: true,
                polygonOffsetFactor: -1,
                polygonOffsetUnits: -1,
            });
            standard.needsUpdate = true;
            return standard;
        });

        child.material = Array.isArray(child.material) ? converted : converted[0];
    });
};

/**
 * Apply PBR tuning to every mesh material.
 * Materials are guaranteed to be MeshStandardMaterial after prepareGarmentMaterials().
 */
export const tuneGarmentMaterials = (
    garmentRoot: THREE.Object3D,
    tuning: GarmentMaterialTuning = {},
) => {
    const roughness = typeof tuning.roughness === 'number'
        ? THREE.MathUtils.clamp(tuning.roughness, 0, 1)
        : undefined;
    const metalness = typeof tuning.metalness === 'number'
        ? THREE.MathUtils.clamp(tuning.metalness, 0, 1)
        : undefined;
    const envMapIntensity = typeof tuning.envMapIntensity === 'number'
        ? THREE.MathUtils.clamp(tuning.envMapIntensity, 0, 3)
        : undefined;

    garmentRoot.traverse((child) => {
        if (!(child instanceof THREE.Mesh)) {
            return;
        }

        const materials = toMaterialArray(child.material);
        materials.forEach((mat) => {
            // After prepareGarmentMaterials, all materials are MeshStandardMaterial
            const stdMat = mat as THREE.MeshStandardMaterial;

            if (roughness !== undefined) stdMat.roughness = roughness;
            if (metalness !== undefined) stdMat.metalness = metalness;
            if (envMapIntensity !== undefined) stdMat.envMapIntensity = envMapIntensity;

            stdMat.needsUpdate = true;
        });
    });
};

export const prepareGarmentMaterialsWithTuning = (
    garmentRoot: THREE.Object3D,
    tuning: GarmentMaterialTuning = {},
) => {
    prepareGarmentMaterials(garmentRoot);
    tuneGarmentMaterials(garmentRoot, tuning);
};

export const applyGarmentColor = (garmentRoot: THREE.Object3D, color: THREE.ColorRepresentation) => {
    const nextColor = new THREE.Color(color);

    garmentRoot.traverse((child) => {
        if (!(child instanceof THREE.Mesh)) {
            return;
        }

        const materials = toMaterialArray(child.material);
        materials.forEach((material) => {
            const mutableMaterial = material as MaterialWithColor;
            if (mutableMaterial.color) {
                mutableMaterial.color.copy(nextColor);
                mutableMaterial.needsUpdate = true;
            }
        });
    });
};

export const bindGarmentToAvatarSkeleton = (
    garmentRoot: THREE.Object3D,
    avatarScene: THREE.Object3D,
    skinOffset = 0,
): { boundMeshCount: number; attachedMeshCount: number; missingBoneNames: string[] } => {
    const lookup = buildAvatarBoneLookup(avatarScene);
    const missingBoneNames = new Set<string>();
    let boundMeshCount = 0;
    let attachedMeshCount = 0;

    // Collect meshes BEFORE processing — calling attach() during traverse()
    // mutates the scene graph and causes nodes to be skipped or revisited.
    const skinnedMeshes: THREE.SkinnedMesh[] = [];
    const staticMeshes: THREE.Mesh[] = [];

    garmentRoot.traverse((child) => {
        if (child instanceof THREE.SkinnedMesh && child.skeleton) {
            skinnedMeshes.push(child);
        } else if (child instanceof THREE.Mesh) {
            staticMeshes.push(child);
        }
    });

    // ── SkinnedMesh: remap skeleton to avatar bones ──
    for (const mesh of skinnedMeshes) {
        const mappedBones = mesh.skeleton.bones.map((garmentBone) => {
            const avatarBone = findAvatarBone(garmentBone.name, lookup);
            if (!avatarBone) {
                missingBoneNames.add(garmentBone.name);
                return garmentBone;
            }
            return avatarBone;
        });

        const remappedSkeleton = new THREE.Skeleton(
            mappedBones,
            mesh.skeleton.boneInverses.map((inverse) => inverse.clone()),
        );

        mesh.bind(remappedSkeleton, mesh.bindMatrix.clone());
        mesh.normalizeSkinWeights();
        mesh.frustumCulled = false;
        boundMeshCount += 1;

        // Clone geometry then push vertices outward along normals to avoid
        // z-fighting and body-through-cloth clipping.
        if (skinOffset > 0) {
            mesh.geometry = mesh.geometry.clone();
            inflateGeometryAlongNormals(mesh.geometry, skinOffset);
        }
    }

    // ── Regular Mesh (no skinning): attach to nearest avatar bone ──
    const bonePos = new THREE.Vector3();
    const worldPos = new THREE.Vector3();

    for (const mesh of staticMeshes) {
        mesh.getWorldPosition(worldPos);

        let closest: THREE.Bone | null = null;
        let bestDist = Infinity;

        for (const bone of lookup.all) {
            bone.getWorldPosition(bonePos);
            const d = worldPos.distanceTo(bonePos);
            if (d < bestDist) {
                bestDist = d;
                closest = bone;
            }
        }

        if (closest) {
            closest.attach(mesh);
            mesh.frustumCulled = false;
            attachedMeshCount += 1;
        }
    }

    return {
        boundMeshCount,
        attachedMeshCount,
        missingBoneNames: [...missingBoneNames],
    };
};

/**
 * Push every vertex of a BufferGeometry outward along its normal.
 * Used to create a slight "inflation" so the cloth sits just above the skin.
 */
const inflateGeometryAlongNormals = (geometry: THREE.BufferGeometry, offset: number) => {
    const posAttr = geometry.getAttribute('position');
    const normalAttr = geometry.getAttribute('normal');
    if (!posAttr || !normalAttr) return;

    for (let i = 0; i < posAttr.count; i++) {
        posAttr.setXYZ(
            i,
            posAttr.getX(i) + normalAttr.getX(i) * offset,
            posAttr.getY(i) + normalAttr.getY(i) * offset,
            posAttr.getZ(i) + normalAttr.getZ(i) * offset,
        );
    }
    posAttr.needsUpdate = true;
    geometry.computeBoundingSphere();
    geometry.computeBoundingBox();
};

export const createGarmentMorphBindings = (
    garmentRoot: THREE.Object3D,
    avatarScene: THREE.Object3D,
): { bindings: MorphMeshBinding[]; mappedChannelCount: number } => {
    const sourceChannelsByName = new Map<string, { sourceIndex: number; sourceInfluences: number[] }>();

    avatarScene.traverse((child) => {
        if (!(child instanceof THREE.Mesh) || !child.morphTargetDictionary || !child.morphTargetInfluences) {
            return;
        }

        Object.entries(child.morphTargetDictionary).forEach(([morphName, sourceIndex]) => {
            if (!sourceChannelsByName.has(morphName)) {
                sourceChannelsByName.set(morphName, {
                    sourceIndex,
                    sourceInfluences: child.morphTargetInfluences as number[],
                });
            }
        });
    });

    const bindings: MorphMeshBinding[] = [];
    let mappedChannelCount = 0;

    garmentRoot.traverse((child) => {
        if (!(child instanceof THREE.Mesh) || !child.morphTargetDictionary || !child.morphTargetInfluences) {
            return;
        }

        const channels: MorphChannelBinding[] = [];
        Object.entries(child.morphTargetDictionary).forEach(([morphName, targetIndex]) => {
            const source = sourceChannelsByName.get(morphName);
            if (!source) {
                return;
            }

            channels.push({
                targetIndex,
                sourceIndex: source.sourceIndex,
                sourceInfluences: source.sourceInfluences,
            });
        });

        if (channels.length > 0) {
            bindings.push({ targetMesh: child, channels });
            mappedChannelCount += channels.length;
        }
    });

    return { bindings, mappedChannelCount };
};

export const syncGarmentMorphTargets = (
    bindings: MorphMeshBinding[],
    options: GarmentMorphSyncOptions = {},
) => {
    const influenceScale = THREE.MathUtils.clamp(options.influenceScale ?? 1, 0, 1.5);
    const smoothing = THREE.MathUtils.clamp(options.smoothing ?? 1, 0, 1);
    const maxInfluence = THREE.MathUtils.clamp(options.maxInfluence ?? 1, 0, 1);

    bindings.forEach(({ targetMesh, channels }) => {
        const targetInfluences = targetMesh.morphTargetInfluences;
        if (!targetInfluences) {
            return;
        }

        channels.forEach(({ targetIndex, sourceIndex, sourceInfluences }) => {
            const sourceValue = sourceInfluences[sourceIndex] ?? 0;
            const targetValue = THREE.MathUtils.clamp(sourceValue * influenceScale, 0, maxInfluence);

            if (smoothing >= 0.999) {
                targetInfluences[targetIndex] = targetValue;
                return;
            }

            const currentValue = targetInfluences[targetIndex] ?? 0;
            targetInfluences[targetIndex] = THREE.MathUtils.lerp(currentValue, targetValue, smoothing);
        });
    });
};
