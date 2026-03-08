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
    userData?: Record<string, unknown>;
};

type HeatmapFitLevel = 'tight' | 'fitted' | 'comfortable' | 'loose';

export type GarmentFabricKind = 'cotton' | 'denim' | 'knit' | 'linen' | 'satin';
export type GarmentFabricPreset =
    | GarmentFabricKind
    | 'denim-dark'
    | 'denim-washed'
    | 'denim-raw'
    | 'denim-stone-washed'
    | 'denim-black-fade'
    | 'cotton-heavy'
    | 'cotton-soft';

export type GarmentFabricProfile = {
    preset?: GarmentFabricPreset;
    kind?: GarmentFabricKind;
    weaveScale?: number;
    weaveStrength?: number;
    wrinkleScale?: number;
    wrinkleStrength?: number;
    normalScale?: number;
    roughnessBias?: number;
    softness?: number;
    reflectance?: number;
    fuzzStrength?: number;
};

export type GarmentHeatmapZoneKey = 'shoulder' | 'chest' | 'waist' | 'hips' | 'thigh' | 'legOpening';

export type GarmentHeatmapZone = {
    key: GarmentHeatmapZoneKey;
    fit: HeatmapFitLevel;
    delta: number;
    severity?: number;
};

type GarmentHeatmapState = {
    enabled: { value: number };
    shoulder: { value: THREE.Vector4 };
    chest: { value: THREE.Vector4 };
    waist: { value: THREE.Vector4 };
    hips: { value: THREE.Vector4 };
    thigh: { value: THREE.Vector4 };
    legOpening: { value: THREE.Vector4 };
    shoulderLCenter: { value: THREE.Vector3 };
    shoulderRCenter: { value: THREE.Vector3 };
    chestCenter: { value: THREE.Vector3 };
    waistCenter: { value: THREE.Vector3 };
    hipsCenter: { value: THREE.Vector3 };
    thighLCenter: { value: THREE.Vector3 };
    thighRCenter: { value: THREE.Vector3 };
    legLCenter: { value: THREE.Vector3 };
    legRCenter: { value: THREE.Vector3 };
    shoulderRadius: { value: THREE.Vector3 };
    chestRadius: { value: THREE.Vector3 };
    waistRadius: { value: THREE.Vector3 };
    hipsRadius: { value: THREE.Vector3 };
    thighRadius: { value: THREE.Vector3 };
    legOpeningRadius: { value: THREE.Vector3 };
};

type GarmentHeatmapAnchors = {
    shoulderL: THREE.Vector3;
    shoulderR: THREE.Vector3;
    chest: THREE.Vector3;
    waist: THREE.Vector3;
    hips: THREE.Vector3;
    thighL: THREE.Vector3;
    thighR: THREE.Vector3;
    legL: THREE.Vector3;
    legR: THREE.Vector3;
    shoulderRadius: THREE.Vector3;
    chestRadius: THREE.Vector3;
    waistRadius: THREE.Vector3;
    hipsRadius: THREE.Vector3;
    thighRadius: THREE.Vector3;
    legOpeningRadius: THREE.Vector3;
};

type HeatmapUserData = {
    state: GarmentHeatmapState;
};

export type GarmentMaterialTuning = {
    roughness?: number;
    metalness?: number;
    envMapIntensity?: number;
    fabricProfile?: GarmentFabricProfile;
};

/** Fabric-like defaults applied when no per-size override is provided. */
const FABRIC_DEFAULTS: Required<Pick<GarmentMaterialTuning, 'roughness' | 'metalness' | 'envMapIntensity'>> = {
    roughness: 0.8,
    metalness: 0.05,
    envMapIntensity: 0.5,
};

type ResolvedFabricProfile = {
    preset?: GarmentFabricPreset;
    kind: GarmentFabricKind;
    weaveScale: number;
    weaveStrength: number;
    wrinkleScale: number;
    wrinkleStrength: number;
    normalScale: number;
    roughnessBias: number;
    softness: number;
    reflectance: number;
    fuzzStrength: number;
};

const FABRIC_PROFILE_PRESETS: Record<GarmentFabricPreset, ResolvedFabricProfile> = {
    cotton: {
        kind: 'cotton',
        weaveScale: 24,
        weaveStrength: 0.32,
        wrinkleScale: 4.8,
        wrinkleStrength: 0.12,
        normalScale: 0.34,
        roughnessBias: 0.04,
        softness: 0.58,
        reflectance: -0.02,
        fuzzStrength: 0.12,
    },
    denim: {
        kind: 'denim',
        weaveScale: 16,
        weaveStrength: 0.45,
        wrinkleScale: 3.6,
        wrinkleStrength: 0.16,
        normalScale: 0.5,
        roughnessBias: 0.08,
        softness: 0.42,
        reflectance: 0.05,
        fuzzStrength: 0.1,
    },
    knit: {
        kind: 'knit',
        weaveScale: 30,
        weaveStrength: 0.48,
        wrinkleScale: 6.2,
        wrinkleStrength: 0.1,
        normalScale: 0.42,
        roughnessBias: 0.02,
        softness: 0.66,
        reflectance: -0.04,
        fuzzStrength: 0.2,
    },
    linen: {
        kind: 'linen',
        weaveScale: 20,
        weaveStrength: 0.4,
        wrinkleScale: 4.2,
        wrinkleStrength: 0.2,
        normalScale: 0.38,
        roughnessBias: 0.1,
        softness: 0.5,
        reflectance: -0.06,
        fuzzStrength: 0.16,
    },
    satin: {
        kind: 'satin',
        weaveScale: 12,
        weaveStrength: 0.14,
        wrinkleScale: 2.8,
        wrinkleStrength: 0.06,
        normalScale: 0.16,
        roughnessBias: -0.18,
        softness: 0.36,
        reflectance: 0.16,
        fuzzStrength: 0.02,
    },
    'denim-dark': {
        kind: 'denim',
        weaveScale: 18,
        weaveStrength: 0.5,
        wrinkleScale: 3.2,
        wrinkleStrength: 0.14,
        normalScale: 0.56,
        roughnessBias: 0.03,
        softness: 0.34,
        reflectance: 0.08,
        fuzzStrength: 0.08,
    },
    'denim-washed': {
        kind: 'denim',
        weaveScale: 15,
        weaveStrength: 0.42,
        wrinkleScale: 4,
        wrinkleStrength: 0.2,
        normalScale: 0.48,
        roughnessBias: 0.11,
        softness: 0.68,
        reflectance: -0.03,
        fuzzStrength: 0.2,
    },
    'denim-raw': {
        kind: 'denim',
        weaveScale: 18,
        weaveStrength: 0.54,
        wrinkleScale: 3,
        wrinkleStrength: 0.11,
        normalScale: 0.58,
        roughnessBias: 0.02,
        softness: 0.24,
        reflectance: 0.12,
        fuzzStrength: 0.08,
    },
    'denim-stone-washed': {
        kind: 'denim',
        weaveScale: 14,
        weaveStrength: 0.36,
        wrinkleScale: 4.8,
        wrinkleStrength: 0.22,
        normalScale: 0.38,
        roughnessBias: 0.16,
        softness: 0.8,
        reflectance: -0.08,
        fuzzStrength: 0.24,
    },
    'denim-black-fade': {
        kind: 'denim',
        weaveScale: 16,
        weaveStrength: 0.44,
        wrinkleScale: 3.8,
        wrinkleStrength: 0.16,
        normalScale: 0.46,
        roughnessBias: 0.1,
        softness: 0.62,
        reflectance: 0.01,
        fuzzStrength: 0.17,
    },
    'cotton-heavy': {
        kind: 'cotton',
        weaveScale: 22,
        weaveStrength: 0.4,
        wrinkleScale: 4.6,
        wrinkleStrength: 0.13,
        normalScale: 0.4,
        roughnessBias: 0.07,
        softness: 0.44,
        reflectance: -0.01,
        fuzzStrength: 0.1,
    },
    'cotton-soft': {
        kind: 'cotton',
        weaveScale: 26,
        weaveStrength: 0.24,
        wrinkleScale: 5.1,
        wrinkleStrength: 0.08,
        normalScale: 0.28,
        roughnessBias: -0.04,
        softness: 0.76,
        reflectance: -0.05,
        fuzzStrength: 0.2,
    },
};

const HEATMAP_COLORS: Record<HeatmapFitLevel, THREE.Color> = {
    tight: new THREE.Color('#ef4444'),
    fitted: new THREE.Color('#eab308'),
    comfortable: new THREE.Color('#22c55e'),
    loose: new THREE.Color('#166534'),
};

const HEATMAP_SHADER_KEY = 'vto-heatmap-v1';

const toHeatmapStrength = (fit: HeatmapFitLevel, delta: number, severity?: number) => {
    const normalizedSeverity = typeof severity === 'number'
        ? THREE.MathUtils.clamp(severity, 0, 1)
        : THREE.MathUtils.clamp(Math.abs(delta) / 8, 0, 1);

    if (fit === 'tight') {
        return THREE.MathUtils.clamp(0.72 + normalizedSeverity * 0.28, 0.72, 1);
    }

    if (fit === 'fitted') {
        return THREE.MathUtils.clamp(0.48 + normalizedSeverity * 0.28, 0.45, 0.78);
    }

    if (fit === 'comfortable') {
        return THREE.MathUtils.clamp(0.35 + normalizedSeverity * 0.24, 0.32, 0.68);
    }

    return THREE.MathUtils.clamp(0.5 + normalizedSeverity * 0.32, 0.48, 0.86);
};

const toHeatmapVector = (zone?: GarmentHeatmapZone) => {
    if (!zone) {
        return new THREE.Vector4(0, 0, 0, 0);
    }

    const color = HEATMAP_COLORS[zone.fit];
    const intensity = toHeatmapStrength(zone.fit, zone.delta, zone.severity);
    return new THREE.Vector4(color.r, color.g, color.b, intensity);
};

const getMeshBounds = (mesh: THREE.Mesh) => {
    const geometry = mesh.geometry;
    if (!geometry.boundingBox) {
        geometry.computeBoundingBox();
    }

    const bbox = geometry.boundingBox;
    if (!bbox) {
        const center = new THREE.Vector3();
        const size = new THREE.Vector3(1, 1, 1);
        return {
            min: new THREE.Vector3(-0.5, -0.5, -0.5),
            max: new THREE.Vector3(0.5, 0.5, 0.5),
            center,
            size,
        };
    }

    const center = bbox.getCenter(new THREE.Vector3());
    const size = bbox.getSize(new THREE.Vector3());

    return {
        min: bbox.min.clone(),
        max: bbox.max.clone(),
        center,
        size,
    };
};

type FabricTextureSet = {
    normal: THREE.DataTexture;
    roughness: THREE.DataTexture;
};

const FABRIC_TEXTURE_SIZE = 96;
const fabricTextureCache = new Map<string, FabricTextureSet>();

const resolveFabricPreset = (profile?: GarmentFabricProfile): GarmentFabricPreset => {
    const presetKey = profile?.preset;
    if (presetKey && presetKey in FABRIC_PROFILE_PRESETS) {
        return presetKey;
    }

    const kind = profile?.kind;
    if (kind && kind in FABRIC_PROFILE_PRESETS) {
        return kind;
    }

    return 'cotton';
};

const normalizeFabricProfile = (profile?: GarmentFabricProfile): ResolvedFabricProfile => {
    const presetKey = resolveFabricPreset(profile);
    const preset = FABRIC_PROFILE_PRESETS[presetKey];

    return {
        preset: presetKey,
        kind: preset.kind,
        weaveScale: THREE.MathUtils.clamp(profile?.weaveScale ?? preset.weaveScale, 8, 42),
        weaveStrength: THREE.MathUtils.clamp(profile?.weaveStrength ?? preset.weaveStrength, 0.06, 0.9),
        wrinkleScale: THREE.MathUtils.clamp(profile?.wrinkleScale ?? preset.wrinkleScale, 1.2, 12),
        wrinkleStrength: THREE.MathUtils.clamp(profile?.wrinkleStrength ?? preset.wrinkleStrength, 0.02, 0.45),
        normalScale: THREE.MathUtils.clamp(profile?.normalScale ?? preset.normalScale, 0.05, 1.2),
        roughnessBias: THREE.MathUtils.clamp(profile?.roughnessBias ?? preset.roughnessBias, -0.35, 0.35),
        softness: THREE.MathUtils.clamp(profile?.softness ?? preset.softness, 0, 1),
        reflectance: THREE.MathUtils.clamp(profile?.reflectance ?? preset.reflectance, -0.25, 0.25),
        fuzzStrength: THREE.MathUtils.clamp(profile?.fuzzStrength ?? preset.fuzzStrength, 0, 0.4),
    };
};

const fabricNoise = (x: number, y: number, seed: number) => {
    const v = Math.sin((x + 37.19 * seed) * 12.9898 + (y + 91.73 * seed) * 78.233) * 43758.5453;
    return v - Math.floor(v);
};

const sampleFabricHeight = (u: number, v: number, profile: ResolvedFabricProfile) => {
    const weaveBase = Math.sin(u * profile.weaveScale * Math.PI * 2) * Math.sin(v * profile.weaveScale * Math.PI * 2);
    const weaveDiag = Math.sin((u + v) * profile.weaveScale * Math.PI * 1.35) * 0.4;
    const wrinkle = Math.sin(u * profile.wrinkleScale * Math.PI * 2.4) * Math.cos(v * profile.wrinkleScale * Math.PI * 1.8);
    const grain = (fabricNoise(u * 93, v * 97, profile.weaveScale) - 0.5) * 0.3;

    let kindAdjust = 1;
    if (profile.kind === 'denim') {
        kindAdjust = 1.15;
    } else if (profile.kind === 'satin') {
        kindAdjust = 0.55;
    } else if (profile.kind === 'knit') {
        kindAdjust = 1.25;
    }

    return (weaveBase * 0.56 + weaveDiag * 0.24 + wrinkle * 0.2 + grain) * kindAdjust;
};

const createDataTexture = (data: Uint8Array, size: number) => {
    const texture = new THREE.DataTexture(data, size, size, THREE.RGBAFormat);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.generateMipmaps = true;
    texture.minFilter = THREE.LinearMipmapLinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.needsUpdate = true;
    return texture;
};

const createFabricTextureSet = (profile: ResolvedFabricProfile): FabricTextureSet => {
    const size = FABRIC_TEXTURE_SIZE;
    const normalData = new Uint8Array(size * size * 4);
    const roughnessData = new Uint8Array(size * size * 4);
    const step = 1 / size;

    for (let y = 0; y < size; y += 1) {
        for (let x = 0; x < size; x += 1) {
            const u = x / size;
            const v = y / size;
            const i = (y * size + x) * 4;

            const h = sampleFabricHeight(u, v, profile);
            const hx = sampleFabricHeight(u + step, v, profile) - h;
            const hy = sampleFabricHeight(u, v + step, profile) - h;

            const softnessNormalFactor = 1 - profile.softness * 0.38;
            const nx = -hx * profile.weaveStrength * 4.2 * softnessNormalFactor;
            const ny = -hy * profile.weaveStrength * 4.2 * softnessNormalFactor;
            const nz = 1;
            const invLen = 1 / Math.sqrt(nx * nx + ny * ny + nz * nz);

            normalData[i + 0] = Math.round((nx * invLen * 0.5 + 0.5) * 255);
            normalData[i + 1] = Math.round((ny * invLen * 0.5 + 0.5) * 255);
            normalData[i + 2] = Math.round((nz * invLen * 0.5 + 0.5) * 255);
            normalData[i + 3] = 255;

            const wrinkleNoise = (fabricNoise(u * 121, v * 119, profile.wrinkleScale) - 0.5) * profile.wrinkleStrength;
            const fuzzNoise = (fabricNoise(u * 211, v * 199, profile.weaveScale + 3.7) - 0.5) * profile.fuzzStrength;
            const softnessLift = profile.softness * 0.08;
            const roughness = THREE.MathUtils.clamp(
                0.62 + profile.roughnessBias + h * 0.1 + wrinkleNoise + fuzzNoise * 0.35 + softnessLift,
                0.12,
                0.96,
            );
            const roughByte = Math.round(roughness * 255);
            roughnessData[i + 0] = roughByte;
            roughnessData[i + 1] = roughByte;
            roughnessData[i + 2] = roughByte;
            roughnessData[i + 3] = 255;
        }
    }

    return {
        normal: createDataTexture(normalData, size),
        roughness: createDataTexture(roughnessData, size),
    };
};

const getFabricTextureSet = (profile: ResolvedFabricProfile): FabricTextureSet => {
    const key = [
        profile.preset || profile.kind,
        profile.kind,
        profile.weaveScale.toFixed(3),
        profile.weaveStrength.toFixed(3),
        profile.wrinkleScale.toFixed(3),
        profile.wrinkleStrength.toFixed(3),
        profile.roughnessBias.toFixed(3),
        profile.softness.toFixed(3),
        profile.reflectance.toFixed(3),
        profile.fuzzStrength.toFixed(3),
    ].join('|');

    const existing = fabricTextureCache.get(key);
    if (existing) {
        return existing;
    }

    const next = createFabricTextureSet(profile);
    fabricTextureCache.set(key, next);
    return next;
};

const computeFabricRepeat = (mesh: THREE.Mesh, profile: ResolvedFabricProfile) => {
    const bounds = getMeshBounds(mesh);
    const width = Math.max(bounds.size.x, 0.25);
    const height = Math.max(bounds.size.y, 0.25);

    const repeatX = THREE.MathUtils.clamp(width * profile.weaveScale * 1.05, 6, 92);
    const repeatY = THREE.MathUtils.clamp(height * profile.weaveScale * 1.3, 8, 128);

    return new THREE.Vector2(repeatX, repeatY);
};

const cloneFabricTextureWithRepeat = (texture: THREE.DataTexture, repeat: THREE.Vector2) => {
    const next = texture.clone();
    next.wrapS = THREE.RepeatWrapping;
    next.wrapT = THREE.RepeatWrapping;
    next.repeat.copy(repeat);
    next.needsUpdate = true;
    return next;
};

const applyFabricProfileToMaterial = (
    material: THREE.MeshStandardMaterial,
    mesh: THREE.Mesh,
    profile?: GarmentFabricProfile,
) => {
    const resolved = normalizeFabricProfile(profile);
    const textures = getFabricTextureSet(resolved);
    const repeat = computeFabricRepeat(mesh, resolved);

    if (!material.normalMap) {
        material.normalMap = cloneFabricTextureWithRepeat(textures.normal, repeat);
    }

    if (!material.roughnessMap) {
        material.roughnessMap = cloneFabricTextureWithRepeat(textures.roughness, repeat);
    }

    if (material.normalScale) {
        const softenedNormal = resolved.normalScale * (1 - resolved.softness * 0.28);
        material.normalScale.set(softenedNormal, softenedNormal);
    } else {
        const softenedNormal = resolved.normalScale * (1 - resolved.softness * 0.28);
        material.normalScale = new THREE.Vector2(softenedNormal, softenedNormal);
    }

    const baseRoughness = material.roughness ?? FABRIC_DEFAULTS.roughness;
    const baseEnv = material.envMapIntensity ?? FABRIC_DEFAULTS.envMapIntensity;
    const baseMetalness = material.metalness ?? FABRIC_DEFAULTS.metalness;

    material.roughness = THREE.MathUtils.clamp(
        baseRoughness + resolved.roughnessBias + resolved.softness * 0.06 - resolved.reflectance * 0.08,
        0.08,
        1,
    );
    material.envMapIntensity = THREE.MathUtils.clamp(baseEnv + resolved.reflectance - resolved.softness * 0.12, 0, 3);
    material.metalness = THREE.MathUtils.clamp(baseMetalness * (1 - resolved.softness * 0.4), 0, 1);
    material.needsUpdate = true;
};

const buildFallbackAnchors = (mesh: THREE.Mesh): GarmentHeatmapAnchors => {
    const bounds = getMeshBounds(mesh);
    const { min, center, size } = bounds;

    const shoulderY = min.y + size.y * 0.86;
    const chestY = min.y + size.y * 0.68;
    const waistY = min.y + size.y * 0.5;
    const hipsY = min.y + size.y * 0.33;
    const thighY = min.y + size.y * 0.2;
    const legY = min.y + size.y * 0.09;

    const shoulderOffsetX = Math.max(size.x * 0.22, 0.06);
    const legOffsetX = Math.max(size.x * 0.16, 0.05);
    const depth = Math.max(size.z, size.x * 0.45, 0.08);

    return {
        shoulderL: new THREE.Vector3(center.x - shoulderOffsetX, shoulderY, center.z),
        shoulderR: new THREE.Vector3(center.x + shoulderOffsetX, shoulderY, center.z),
        chest: new THREE.Vector3(center.x, chestY, center.z),
        waist: new THREE.Vector3(center.x, waistY, center.z),
        hips: new THREE.Vector3(center.x, hipsY, center.z),
        thighL: new THREE.Vector3(center.x - legOffsetX, thighY, center.z),
        thighR: new THREE.Vector3(center.x + legOffsetX, thighY, center.z),
        legL: new THREE.Vector3(center.x - legOffsetX, legY, center.z),
        legR: new THREE.Vector3(center.x + legOffsetX, legY, center.z),
        shoulderRadius: new THREE.Vector3(Math.max(size.x * 0.15, 0.04), Math.max(size.y * 0.1, 0.04), Math.max(depth * 0.22, 0.04)),
        chestRadius: new THREE.Vector3(Math.max(size.x * 0.24, 0.06), Math.max(size.y * 0.13, 0.05), Math.max(depth * 0.28, 0.05)),
        waistRadius: new THREE.Vector3(Math.max(size.x * 0.2, 0.05), Math.max(size.y * 0.13, 0.05), Math.max(depth * 0.25, 0.05)),
        hipsRadius: new THREE.Vector3(Math.max(size.x * 0.21, 0.05), Math.max(size.y * 0.14, 0.05), Math.max(depth * 0.27, 0.05)),
        thighRadius: new THREE.Vector3(Math.max(size.x * 0.16, 0.05), Math.max(size.y * 0.1, 0.05), Math.max(depth * 0.2, 0.05)),
        legOpeningRadius: new THREE.Vector3(Math.max(size.x * 0.14, 0.04), Math.max(size.y * 0.09, 0.04), Math.max(depth * 0.18, 0.04)),
    };
};

const getHeatmapState = (material: THREE.MeshStandardMaterial, mesh: THREE.Mesh): GarmentHeatmapState => {
    const userData = material.userData as Record<string, unknown>;
    const existing = userData.vtoHeatmap as HeatmapUserData | undefined;
    if (existing?.state) {
        return existing.state;
    }

    const anchors = buildFallbackAnchors(mesh);
    const state: GarmentHeatmapState = {
        enabled: { value: 0 },
        shoulder: { value: new THREE.Vector4(0, 0, 0, 0) },
        chest: { value: new THREE.Vector4(0, 0, 0, 0) },
        waist: { value: new THREE.Vector4(0, 0, 0, 0) },
        hips: { value: new THREE.Vector4(0, 0, 0, 0) },
        thigh: { value: new THREE.Vector4(0, 0, 0, 0) },
        legOpening: { value: new THREE.Vector4(0, 0, 0, 0) },
        shoulderLCenter: { value: anchors.shoulderL },
        shoulderRCenter: { value: anchors.shoulderR },
        chestCenter: { value: anchors.chest },
        waistCenter: { value: anchors.waist },
        hipsCenter: { value: anchors.hips },
        thighLCenter: { value: anchors.thighL },
        thighRCenter: { value: anchors.thighR },
        legLCenter: { value: anchors.legL },
        legRCenter: { value: anchors.legR },
        shoulderRadius: { value: anchors.shoulderRadius },
        chestRadius: { value: anchors.chestRadius },
        waistRadius: { value: anchors.waistRadius },
        hipsRadius: { value: anchors.hipsRadius },
        thighRadius: { value: anchors.thighRadius },
        legOpeningRadius: { value: anchors.legOpeningRadius },
    };

    material.onBeforeCompile = (shader) => {
        shader.uniforms.uVtoHeatEnabled = state.enabled;
        shader.uniforms.uVtoHeatShoulder = state.shoulder;
        shader.uniforms.uVtoHeatChest = state.chest;
        shader.uniforms.uVtoHeatWaist = state.waist;
        shader.uniforms.uVtoHeatHips = state.hips;
        shader.uniforms.uVtoHeatThigh = state.thigh;
        shader.uniforms.uVtoHeatLegOpening = state.legOpening;
        shader.uniforms.uVtoHeatShoulderL = state.shoulderLCenter;
        shader.uniforms.uVtoHeatShoulderR = state.shoulderRCenter;
        shader.uniforms.uVtoHeatChestCenter = state.chestCenter;
        shader.uniforms.uVtoHeatWaistCenter = state.waistCenter;
        shader.uniforms.uVtoHeatHipsCenter = state.hipsCenter;
        shader.uniforms.uVtoHeatThighL = state.thighLCenter;
        shader.uniforms.uVtoHeatThighR = state.thighRCenter;
        shader.uniforms.uVtoHeatLegL = state.legLCenter;
        shader.uniforms.uVtoHeatLegR = state.legRCenter;
        shader.uniforms.uVtoHeatShoulderRadius = state.shoulderRadius;
        shader.uniforms.uVtoHeatChestRadius = state.chestRadius;
        shader.uniforms.uVtoHeatWaistRadius = state.waistRadius;
        shader.uniforms.uVtoHeatHipsRadius = state.hipsRadius;
        shader.uniforms.uVtoHeatThighRadius = state.thighRadius;
        shader.uniforms.uVtoHeatLegOpeningRadius = state.legOpeningRadius;

        shader.vertexShader = shader.vertexShader
            .replace('#include <common>', '#include <common>\nvarying vec3 vVtoHeatPos;')
            .replace('#include <begin_vertex>', '#include <begin_vertex>\nvVtoHeatPos = transformed;');

        shader.fragmentShader = shader.fragmentShader
            .replace(
                '#include <common>',
                `#include <common>
varying vec3 vVtoHeatPos;
uniform float uVtoHeatEnabled;
uniform vec4 uVtoHeatShoulder;
uniform vec4 uVtoHeatChest;
uniform vec4 uVtoHeatWaist;
uniform vec4 uVtoHeatHips;
uniform vec4 uVtoHeatThigh;
uniform vec4 uVtoHeatLegOpening;
uniform vec3 uVtoHeatShoulderL;
uniform vec3 uVtoHeatShoulderR;
uniform vec3 uVtoHeatChestCenter;
uniform vec3 uVtoHeatWaistCenter;
uniform vec3 uVtoHeatHipsCenter;
uniform vec3 uVtoHeatThighL;
uniform vec3 uVtoHeatThighR;
uniform vec3 uVtoHeatLegL;
uniform vec3 uVtoHeatLegR;
uniform vec3 uVtoHeatShoulderRadius;
uniform vec3 uVtoHeatChestRadius;
uniform vec3 uVtoHeatWaistRadius;
uniform vec3 uVtoHeatHipsRadius;
uniform vec3 uVtoHeatThighRadius;
uniform vec3 uVtoHeatLegOpeningRadius;

float vtoEllipsoidWeight(vec3 p, vec3 center, vec3 radius) {
    vec3 safeRadius = max(radius, vec3(0.0001));
    vec3 q = (p - center) / safeRadius;
    float d2 = dot(q, q);
    return exp(-d2 * 2.4);
}`,
            )
            .replace(
                '#include <opaque_fragment>',
                `if (uVtoHeatEnabled > 0.5) {
    float shoulderW = max(
        vtoEllipsoidWeight(vVtoHeatPos, uVtoHeatShoulderL, uVtoHeatShoulderRadius),
        vtoEllipsoidWeight(vVtoHeatPos, uVtoHeatShoulderR, uVtoHeatShoulderRadius)
    );
    float chestW = vtoEllipsoidWeight(vVtoHeatPos, uVtoHeatChestCenter, uVtoHeatChestRadius);
    float waistW = vtoEllipsoidWeight(vVtoHeatPos, uVtoHeatWaistCenter, uVtoHeatWaistRadius);
    float hipsW = vtoEllipsoidWeight(vVtoHeatPos, uVtoHeatHipsCenter, uVtoHeatHipsRadius);
    float thighW = max(
        vtoEllipsoidWeight(vVtoHeatPos, uVtoHeatThighL, uVtoHeatThighRadius),
        vtoEllipsoidWeight(vVtoHeatPos, uVtoHeatThighR, uVtoHeatThighRadius)
    );
    float legW = max(
        vtoEllipsoidWeight(vVtoHeatPos, uVtoHeatLegL, uVtoHeatLegOpeningRadius),
        vtoEllipsoidWeight(vVtoHeatPos, uVtoHeatLegR, uVtoHeatLegOpeningRadius)
    );

    chestW *= (1.0 - shoulderW * 0.35);
    waistW *= (1.0 - shoulderW * 0.2);
    hipsW *= (1.0 - shoulderW * 0.1);
    thighW *= (1.0 - shoulderW * 0.08);

    float shoulderI = shoulderW * uVtoHeatShoulder.a;
    float chestI = chestW * uVtoHeatChest.a;
    float waistI = waistW * uVtoHeatWaist.a;
    float hipsI = hipsW * uVtoHeatHips.a;
    float thighI = thighW * uVtoHeatThigh.a;
    float legI = legW * uVtoHeatLegOpening.a;

    float influence = shoulderI + chestI + waistI + hipsI + thighI + legI;
    if (influence > 0.0001) {
        vec3 overlay = (
            uVtoHeatShoulder.rgb * shoulderI +
            uVtoHeatChest.rgb * chestI +
            uVtoHeatWaist.rgb * waistI +
            uVtoHeatHips.rgb * hipsI +
            uVtoHeatThigh.rgb * thighI +
            uVtoHeatLegOpening.rgb * legI
        ) / influence;

        float blend = clamp(influence, 0.0, 1.0) * 0.78;
        outgoingLight = mix(outgoingLight, overlay, blend);
    }
}

#include <opaque_fragment>`,
            );
    };

    material.customProgramCacheKey = () => HEATMAP_SHADER_KEY;
    material.needsUpdate = true;

    userData.vtoHeatmap = { state };
    return state;
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
    const fabricProfile = tuning.fabricProfile;

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

            if (fabricProfile) {
                applyFabricProfileToMaterial(stdMat, child, fabricProfile);
            }

            const userData = stdMat.userData as Record<string, unknown>;
            userData.vtoBaseRoughness = stdMat.roughness;
            userData.vtoBaseEnvMapIntensity = stdMat.envMapIntensity;

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

const HEATMAP_BONE_HINTS = {
    shoulderLeft: ['LeftShoulder', 'LeftArm', 'LeftUpperArm'],
    shoulderRight: ['RightShoulder', 'RightArm', 'RightUpperArm'],
    chest: ['UpperChest', 'Spine2', 'Chest'],
    waist: ['Spine1', 'Spine', 'Hips'],
    hips: ['Hips', 'LeftUpLeg', 'RightUpLeg'],
    thighLeft: ['LeftUpLeg', 'LeftLeg'],
    thighRight: ['RightUpLeg', 'RightLeg'],
    legLeft: ['LeftLeg', 'LeftFoot'],
    legRight: ['RightLeg', 'RightFoot'],
};

const averageBoneWorldPosition = (lookup: AvatarBoneLookup, hints: string[]): THREE.Vector3 | null => {
    const points: THREE.Vector3[] = [];

    hints.forEach((hint) => {
        const bone = findAvatarBone(hint, lookup);
        if (!bone) {
            return;
        }

        points.push(bone.getWorldPosition(new THREE.Vector3()));
    });

    if (points.length === 0) {
        return null;
    }

    const sum = points.reduce((acc, point) => acc.add(point), new THREE.Vector3());
    return sum.multiplyScalar(1 / points.length);
};

const worldToMeshLocal = (mesh: THREE.Mesh, worldPoint: THREE.Vector3) => mesh.worldToLocal(worldPoint.clone());

const blendVec3 = (from: THREE.Vector3, to: THREE.Vector3, alpha: number) => from.clone().lerp(to, alpha);

const buildAnchorsFromAvatar = (mesh: THREE.Mesh, avatarScene: THREE.Object3D): GarmentHeatmapAnchors => {
    const fallback = buildFallbackAnchors(mesh);
    const lookup = buildAvatarBoneLookup(avatarScene);

    const leftShoulderWorld = averageBoneWorldPosition(lookup, HEATMAP_BONE_HINTS.shoulderLeft);
    const rightShoulderWorld = averageBoneWorldPosition(lookup, HEATMAP_BONE_HINTS.shoulderRight);
    const chestWorld = averageBoneWorldPosition(lookup, HEATMAP_BONE_HINTS.chest);
    const waistWorld = averageBoneWorldPosition(lookup, HEATMAP_BONE_HINTS.waist);
    const hipsWorld = averageBoneWorldPosition(lookup, HEATMAP_BONE_HINTS.hips);
    const thighLeftWorld = averageBoneWorldPosition(lookup, HEATMAP_BONE_HINTS.thighLeft);
    const thighRightWorld = averageBoneWorldPosition(lookup, HEATMAP_BONE_HINTS.thighRight);
    const legLeftWorld = averageBoneWorldPosition(lookup, HEATMAP_BONE_HINTS.legLeft);
    const legRightWorld = averageBoneWorldPosition(lookup, HEATMAP_BONE_HINTS.legRight);

    const shoulderL = leftShoulderWorld ? worldToMeshLocal(mesh, leftShoulderWorld) : fallback.shoulderL.clone();
    const shoulderR = rightShoulderWorld ? worldToMeshLocal(mesh, rightShoulderWorld) : fallback.shoulderR.clone();
    const chest = chestWorld ? worldToMeshLocal(mesh, chestWorld) : fallback.chest.clone();
    const waist = waistWorld ? worldToMeshLocal(mesh, waistWorld) : fallback.waist.clone();
    const hips = hipsWorld ? worldToMeshLocal(mesh, hipsWorld) : fallback.hips.clone();
    const thighL = thighLeftWorld ? worldToMeshLocal(mesh, thighLeftWorld) : fallback.thighL.clone();
    const thighR = thighRightWorld ? worldToMeshLocal(mesh, thighRightWorld) : fallback.thighR.clone();
    const legL = legLeftWorld ? worldToMeshLocal(mesh, legLeftWorld) : fallback.legL.clone();
    const legR = legRightWorld ? worldToMeshLocal(mesh, legRightWorld) : fallback.legR.clone();

    const bounds = getMeshBounds(mesh);
    const shoulderSpan = Math.max(shoulderL.distanceTo(shoulderR), bounds.size.x * 0.25, 0.08);
    const lowerSpan = Math.max(thighL.distanceTo(thighR), bounds.size.x * 0.2, 0.08);
    const torsoHeight = Math.max(Math.abs(chest.y - hips.y), Math.abs(waist.y - hips.y), bounds.size.y * 0.2, 0.08);
    const legHeight = Math.max(Math.abs(thighL.y - legL.y), Math.abs(thighR.y - legR.y), bounds.size.y * 0.12, 0.06);
    const depth = Math.max(bounds.size.z, shoulderSpan * 0.42, 0.08);

    const anchorBlend = 0.82;
    const blendedShoulderL = blendVec3(fallback.shoulderL, shoulderL, anchorBlend);
    const blendedShoulderR = blendVec3(fallback.shoulderR, shoulderR, anchorBlend);
    const blendedChest = blendVec3(fallback.chest, chest, anchorBlend);
    const blendedWaist = blendVec3(fallback.waist, waist, anchorBlend);
    const blendedHips = blendVec3(fallback.hips, hips, anchorBlend);
    const blendedThighL = blendVec3(fallback.thighL, thighL, anchorBlend);
    const blendedThighR = blendVec3(fallback.thighR, thighR, anchorBlend);
    const blendedLegL = blendVec3(fallback.legL, legL, anchorBlend);
    const blendedLegR = blendVec3(fallback.legR, legR, anchorBlend);

    return {
        shoulderL: blendedShoulderL,
        shoulderR: blendedShoulderR,
        chest: blendedChest,
        waist: blendedWaist,
        hips: blendedHips,
        thighL: blendedThighL,
        thighR: blendedThighR,
        legL: blendedLegL,
        legR: blendedLegR,
        shoulderRadius: new THREE.Vector3(
            Math.max(shoulderSpan * 0.18, fallback.shoulderRadius.x),
            Math.max(torsoHeight * 0.12, fallback.shoulderRadius.y),
            Math.max(depth * 0.2, fallback.shoulderRadius.z),
        ),
        chestRadius: new THREE.Vector3(
            Math.max(shoulderSpan * 0.28, fallback.chestRadius.x),
            Math.max(torsoHeight * 0.18, fallback.chestRadius.y),
            Math.max(depth * 0.28, fallback.chestRadius.z),
        ),
        waistRadius: new THREE.Vector3(
            Math.max(shoulderSpan * 0.24, fallback.waistRadius.x),
            Math.max(torsoHeight * 0.17, fallback.waistRadius.y),
            Math.max(depth * 0.24, fallback.waistRadius.z),
        ),
        hipsRadius: new THREE.Vector3(
            Math.max(shoulderSpan * 0.25, fallback.hipsRadius.x),
            Math.max(torsoHeight * 0.18, fallback.hipsRadius.y),
            Math.max(depth * 0.27, fallback.hipsRadius.z),
        ),
        thighRadius: new THREE.Vector3(
            Math.max(lowerSpan * 0.2, fallback.thighRadius.x),
            Math.max(legHeight * 0.55, fallback.thighRadius.y),
            Math.max(depth * 0.2, fallback.thighRadius.z),
        ),
        legOpeningRadius: new THREE.Vector3(
            Math.max(lowerSpan * 0.17, fallback.legOpeningRadius.x),
            Math.max(legHeight * 0.5, fallback.legOpeningRadius.y),
            Math.max(depth * 0.17, fallback.legOpeningRadius.z),
        ),
    };
};

export const applyGarmentHeatmap = (
    garmentRoot: THREE.Object3D,
    enabled: boolean,
    zones: GarmentHeatmapZone[] = [],
    avatarScene: THREE.Object3D | null = null,
) => {
    const zoneMap = zones.reduce<Partial<Record<GarmentHeatmapZoneKey, GarmentHeatmapZone>>>((acc, zone) => {
        acc[zone.key] = zone;
        return acc;
    }, {});

    const getFitSeverity = (fit: HeatmapFitLevel) => zones.reduce((maxSeverity, zone) => {
        if (zone.fit !== fit) {
            return maxSeverity;
        }

        const severity = typeof zone.severity === 'number'
            ? THREE.MathUtils.clamp(zone.severity, 0, 1)
            : THREE.MathUtils.clamp(Math.abs(zone.delta) / 8, 0, 1);
        return Math.max(maxSeverity, severity);
    }, 0);

    const tightSeverity = getFitSeverity('tight');
    const looseSeverity = getFitSeverity('loose');

    garmentRoot.traverse((child) => {
        if (!(child instanceof THREE.Mesh)) {
            return;
        }

        const materials = toMaterialArray(child.material);
        materials.forEach((material) => {
            if (!(material instanceof THREE.MeshStandardMaterial)) {
                return;
            }

            const userData = material.userData as Record<string, unknown>;
            const existing = userData.vtoHeatmap as HeatmapUserData | undefined;
            if (!enabled && !existing?.state && zones.length === 0) {
                return;
            }

            const state = existing?.state || getHeatmapState(material, child);
            state.enabled.value = enabled ? 1 : 0;

            const anchors = avatarScene
                ? buildAnchorsFromAvatar(child, avatarScene)
                : buildFallbackAnchors(child);

            state.shoulderLCenter.value.copy(anchors.shoulderL);
            state.shoulderRCenter.value.copy(anchors.shoulderR);
            state.chestCenter.value.copy(anchors.chest);
            state.waistCenter.value.copy(anchors.waist);
            state.hipsCenter.value.copy(anchors.hips);
            state.thighLCenter.value.copy(anchors.thighL);
            state.thighRCenter.value.copy(anchors.thighR);
            state.legLCenter.value.copy(anchors.legL);
            state.legRCenter.value.copy(anchors.legR);
            state.shoulderRadius.value.copy(anchors.shoulderRadius);
            state.chestRadius.value.copy(anchors.chestRadius);
            state.waistRadius.value.copy(anchors.waistRadius);
            state.hipsRadius.value.copy(anchors.hipsRadius);
            state.thighRadius.value.copy(anchors.thighRadius);
            state.legOpeningRadius.value.copy(anchors.legOpeningRadius);

            state.shoulder.value.copy(toHeatmapVector(zoneMap.shoulder));
            state.chest.value.copy(toHeatmapVector(zoneMap.chest));
            state.waist.value.copy(toHeatmapVector(zoneMap.waist));
            state.hips.value.copy(toHeatmapVector(zoneMap.hips));
            state.thigh.value.copy(toHeatmapVector(zoneMap.thigh));
            state.legOpening.value.copy(toHeatmapVector(zoneMap.legOpening));

            const baseRoughness = typeof userData.vtoBaseRoughness === 'number'
                ? (userData.vtoBaseRoughness as number)
                : material.roughness;
            const baseEnv = typeof userData.vtoBaseEnvMapIntensity === 'number'
                ? (userData.vtoBaseEnvMapIntensity as number)
                : material.envMapIntensity;

            if (typeof userData.vtoBaseRoughness !== 'number') {
                userData.vtoBaseRoughness = baseRoughness;
            }

            if (typeof userData.vtoBaseEnvMapIntensity !== 'number') {
                userData.vtoBaseEnvMapIntensity = baseEnv;
            }

            // Tight cloth tends to look smoother and slightly shinier; loose cloth does the opposite.
            material.roughness = THREE.MathUtils.clamp(baseRoughness - tightSeverity * 0.18 + looseSeverity * 0.06, 0.08, 1);
            material.envMapIntensity = THREE.MathUtils.clamp(baseEnv + tightSeverity * 0.28 - looseSeverity * 0.08, 0, 3);
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
