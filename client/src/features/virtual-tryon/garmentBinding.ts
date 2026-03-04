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

export const prepareGarmentMaterials = (garmentRoot: THREE.Object3D) => {
    garmentRoot.traverse((child) => {
        if (!(child instanceof THREE.Mesh)) {
            return;
        }

        child.castShadow = false;
        child.receiveShadow = false;
        child.frustumCulled = false;

        const currentMaterials = toMaterialArray(child.material);
        const clonedMaterials = currentMaterials.map((material) => {
            const cloned = material.clone() as MaterialWithColor;
            cloned.transparent = false;
            cloned.opacity = 1;
            cloned.side = THREE.DoubleSide;
            cloned.needsUpdate = true;
            return cloned;
        });

        child.material = Array.isArray(child.material) ? clonedMaterials : clonedMaterials[0];
    });
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
): { boundMeshCount: number; missingBoneNames: string[] } => {
    const lookup = buildAvatarBoneLookup(avatarScene);
    const missingBoneNames = new Set<string>();
    let boundMeshCount = 0;

    garmentRoot.traverse((child) => {
        if (!(child instanceof THREE.SkinnedMesh) || !child.skeleton) {
            return;
        }

        const mappedBones = child.skeleton.bones.map((garmentBone) => {
            const avatarBone = findAvatarBone(garmentBone.name, lookup);
            if (!avatarBone) {
                missingBoneNames.add(garmentBone.name);
                return garmentBone;
            }
            return avatarBone;
        });

        const remappedSkeleton = new THREE.Skeleton(
            mappedBones,
            child.skeleton.boneInverses.map((inverse) => inverse.clone()),
        );

        child.bind(remappedSkeleton, child.bindMatrix.clone());
        child.normalizeSkinWeights();
        child.frustumCulled = false;
        boundMeshCount += 1;
    });

    return {
        boundMeshCount,
        missingBoneNames: [...missingBoneNames],
    };
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

export const syncGarmentMorphTargets = (bindings: MorphMeshBinding[]) => {
    bindings.forEach(({ targetMesh, channels }) => {
        const targetInfluences = targetMesh.morphTargetInfluences;
        if (!targetInfluences) {
            return;
        }

        channels.forEach(({ targetIndex, sourceIndex, sourceInfluences }) => {
            const sourceValue = sourceInfluences[sourceIndex] ?? 0;
            targetInfluences[targetIndex] = sourceValue;
        });
    });
};
