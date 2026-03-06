import * as THREE from 'three';

export type BodyMeasurementKey =
    | 'height'
    | 'weight'
    | 'chest'
    | 'waist'
    | 'hips'
    | 'shoulder'
    | 'arm'
    | 'thigh'
    | 'belly'
    | 'legLength';

export type BodyMeasurementProfile = Record<BodyMeasurementKey, number>;

export type Range = {
    min: number;
    max: number;
};

type EditableMeasurementKey = Exclude<BodyMeasurementKey, 'height' | 'weight'>;

const HARD_LIMITS: Record<BodyMeasurementKey, Range> = {
    height: { min: 140, max: 200 },
    weight: { min: 35, max: 120 },
    chest: { min: 70, max: 125 },
    waist: { min: 55, max: 110 },
    hips: { min: 78, max: 128 },
    shoulder: { min: 30, max: 52 },
    arm: { min: 20, max: 42 },
    thigh: { min: 40, max: 86 },
    belly: { min: 58, max: 126 },
    legLength: { min: 70, max: 120 },
};

const EDITABLE_FIELDS: EditableMeasurementKey[] = [
    'chest',
    'waist',
    'hips',
    'shoulder',
    'arm',
    'thigh',
    'belly',
    'legLength',
];

const SOFT_EDGE_PADDING: Record<EditableMeasurementKey, number> = {
    chest: 5,
    waist: 4,
    hips: 5,
    shoulder: 2,
    arm: 2,
    thigh: 3,
    belly: 4,
    legLength: 2,
};

const clamp = (value: number, min: number, max: number) => {
    const safeValue = Number.isFinite(value) ? value : min;
    return THREE.MathUtils.clamp(Math.round(safeValue), min, max);
};

const computeRange = (center: number, spread: number, hardRange: Range): Range => {
    const min = clamp(center - spread, hardRange.min, hardRange.max);
    const max = clamp(center + spread, hardRange.min, hardRange.max);

    if (min <= max) {
        return { min, max };
    }

    const fallback = clamp(center, hardRange.min, hardRange.max);
    return { min: fallback, max: fallback };
};

const expandRangeToCurrent = (range: Range, currentValue: number | undefined, bounds: Range, edgePadding: number): Range => {
    if (!Number.isFinite(currentValue)) {
        return range;
    }

    const safeCurrent = clamp(currentValue as number, bounds.min, bounds.max);
    let min = range.min;
    let max = range.max;

    if (safeCurrent <= min + 1) {
        min = clamp(safeCurrent - edgePadding, bounds.min, bounds.max);
    }

    if (safeCurrent >= max - 1) {
        max = clamp(safeCurrent + edgePadding, bounds.min, bounds.max);
    }

    min = Math.min(min, safeCurrent);
    max = Math.max(max, safeCurrent);

    return {
        min: clamp(min, bounds.min, bounds.max),
        max: clamp(max, bounds.min, bounds.max),
    };
};

const getSoftRanges = (height: number, weight: number): Record<BodyMeasurementKey, Range> => {
    const safeHeight = clamp(height, HARD_LIMITS.height.min, HARD_LIMITS.height.max);
    const safeWeight = clamp(weight, HARD_LIMITS.weight.min, HARD_LIMITS.weight.max);
    const bmi = safeWeight / ((safeHeight / 100) ** 2);
    const bmiFlex = THREE.MathUtils.clamp(Math.abs(bmi - 22) * 0.6, 0, 4);
    const estimated = estimateBodyFromHW(safeHeight, safeWeight);

    const legSoftRange: Range = {
        min: Math.max(HARD_LIMITS.legLength.min, Math.round(safeHeight * 0.50)),
        max: Math.min(HARD_LIMITS.legLength.max, Math.round(safeHeight * 0.64)),
    };

    return {
        ...HARD_LIMITS,
        chest: computeRange(estimated.chest, 12 + bmiFlex, HARD_LIMITS.chest),
        waist: computeRange(estimated.waist, 10 + bmiFlex, HARD_LIMITS.waist),
        hips: computeRange(estimated.hips, 12 + bmiFlex, HARD_LIMITS.hips),
        shoulder: computeRange(estimated.shoulder, 3 + bmiFlex * 0.5, HARD_LIMITS.shoulder),
        arm: computeRange(estimated.arm, 4 + bmiFlex * 0.6, HARD_LIMITS.arm),
        thigh: computeRange(estimated.thigh, 6 + bmiFlex * 0.7, HARD_LIMITS.thigh),
        belly: computeRange(estimated.belly, 12 + bmiFlex, HARD_LIMITS.belly),
        legLength: computeRange(estimated.legLength, Math.max(3, safeHeight * 0.03), legSoftRange),
    };
};

const getSafetyRanges = (height: number, weight: number): Record<BodyMeasurementKey, Range> => {
    const safeHeight = clamp(height, HARD_LIMITS.height.min, HARD_LIMITS.height.max);
    const safeWeight = clamp(weight, HARD_LIMITS.weight.min, HARD_LIMITS.weight.max);
    const bmi = safeWeight / ((safeHeight / 100) ** 2);
    const bmiFlex = THREE.MathUtils.clamp(Math.abs(bmi - 22) * 0.9, 0, 8);
    const estimated = estimateBodyFromHW(safeHeight, safeWeight);

    const legSafetyRange: Range = {
        min: Math.max(HARD_LIMITS.legLength.min, Math.round(safeHeight * 0.47)),
        max: Math.min(HARD_LIMITS.legLength.max, Math.round(safeHeight * 0.67)),
    };

    return {
        ...HARD_LIMITS,
        chest: computeRange(estimated.chest, 20 + bmiFlex, HARD_LIMITS.chest),
        waist: computeRange(estimated.waist, 18 + bmiFlex, HARD_LIMITS.waist),
        hips: computeRange(estimated.hips, 20 + bmiFlex, HARD_LIMITS.hips),
        shoulder: computeRange(estimated.shoulder, 6 + bmiFlex * 0.5, HARD_LIMITS.shoulder),
        arm: computeRange(estimated.arm, 8 + bmiFlex * 0.6, HARD_LIMITS.arm),
        thigh: computeRange(estimated.thigh, 10 + bmiFlex * 0.7, HARD_LIMITS.thigh),
        belly: computeRange(estimated.belly, 20 + bmiFlex, HARD_LIMITS.belly),
        legLength: computeRange(estimated.legLength, Math.max(6, safeHeight * 0.06), legSafetyRange),
    };
};

export const estimateBodyFromHW = (height: number, weight: number): Omit<BodyMeasurementProfile, 'height' | 'weight'> => {
    const safeHeight = clamp(height, HARD_LIMITS.height.min, HARD_LIMITS.height.max);
    const safeWeight = clamp(weight, HARD_LIMITS.weight.min, HARD_LIMITS.weight.max);
    const bmi = safeWeight / ((safeHeight / 100) ** 2);
    const bmiDelta = bmi - 22;

    const chest = Math.round(78 + safeHeight * 0.04 + bmiDelta * 1.6);
    const waist = Math.round(58 + safeHeight * 0.02 + bmiDelta * 2.0);
    const hips = Math.round(82 + safeHeight * 0.04 + bmiDelta * 1.4);
    const shoulder = Math.round(30 + safeHeight * 0.05 + bmiDelta * 0.4);
    const arm = Math.round(18 + safeHeight * 0.02 + bmiDelta * 0.8);
    const thigh = Math.round(38 + safeHeight * 0.03 + bmiDelta * 1.0);
    const belly = Math.round(waist + bmiDelta * 0.8);
    const legLength = Math.round(safeHeight * 0.58);

    return { chest, waist, hips, shoulder, arm, thigh, belly, legLength };
};

export const getBodyMeasurementRanges = (
    height: number,
    weight: number,
    currentProfile?: Partial<BodyMeasurementProfile>,
): Record<BodyMeasurementKey, Range> => {
    const softRanges = getSoftRanges(height, weight);
    const safetyRanges = getSafetyRanges(height, weight);

    if (!currentProfile) {
        return softRanges;
    }

    const adjustedRanges = { ...softRanges };
    EDITABLE_FIELDS.forEach((field) => {
        adjustedRanges[field] = expandRangeToCurrent(
            softRanges[field],
            currentProfile[field],
            safetyRanges[field],
            SOFT_EDGE_PADDING[field],
        );
    });

    return adjustedRanges;
};

export const sanitizeBodyMeasurements = <T extends BodyMeasurementProfile>(profile: T): T => {
    const safeHeight = clamp(profile.height, HARD_LIMITS.height.min, HARD_LIMITS.height.max);
    const safeWeight = clamp(profile.weight, HARD_LIMITS.weight.min, HARD_LIMITS.weight.max);
    const safetyRanges = getSafetyRanges(safeHeight, safeWeight);

    const clamped: BodyMeasurementProfile = {
        height: safeHeight,
        weight: safeWeight,
        chest: clamp(profile.chest, safetyRanges.chest.min, safetyRanges.chest.max),
        waist: clamp(profile.waist, safetyRanges.waist.min, safetyRanges.waist.max),
        hips: clamp(profile.hips, safetyRanges.hips.min, safetyRanges.hips.max),
        shoulder: clamp(profile.shoulder, safetyRanges.shoulder.min, safetyRanges.shoulder.max),
        arm: clamp(profile.arm, safetyRanges.arm.min, safetyRanges.arm.max),
        thigh: clamp(profile.thigh, safetyRanges.thigh.min, safetyRanges.thigh.max),
        belly: clamp(profile.belly, safetyRanges.belly.min, safetyRanges.belly.max),
        legLength: clamp(profile.legLength, safetyRanges.legLength.min, safetyRanges.legLength.max),
    };

    // Keep belly near waist to avoid unrealistic clipping in cloth meshes.
    clamped.belly = clamp(
        clamped.belly,
        Math.max(safetyRanges.belly.min, clamped.waist - 12),
        Math.min(safetyRanges.belly.max, clamped.waist + 30),
    );

    return {
        ...profile,
        ...clamped,
    };
};

export const updateMeasurementField = <T extends BodyMeasurementProfile>(
    profile: T,
    field: BodyMeasurementKey,
    value: number,
): T => {
    const nextValue = Number.isFinite(value) ? value : profile[field];
    const draft: BodyMeasurementProfile = {
        ...profile,
        [field]: Math.round(nextValue),
    };

    if (field === 'height') {
        const ratio = profile.height > 0 ? profile.legLength / profile.height : 0.58;
        draft.legLength = Math.round(draft.height * ratio);
    }

    return sanitizeBodyMeasurements(draft as T);
};
