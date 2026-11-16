import { useMemo, useState, useEffect } from 'react';
import type { Profile } from '../../../contexts/FittingRoomContext';
import { detectBodyShape } from './BodyPresets';

/* ══════════════════════════════════════════════════════════════
   Size Recommendation Engine
   Uses ease (garment - body) as the primary fit signal.
   ══════════════════════════════════════════════════════════════ */

export type MeasurementZone = 'chest' | 'waist' | 'hips' | 'shoulder' | 'thigh' | 'legOpening';
export type FitLevel = 'tight' | 'fitted' | 'comfortable' | 'loose';
export type GarmentType = 'top' | 'bottom' | 'dress' | 'outerwear' | 'unknown';

interface SizeSpec {
    chest: [number, number];
    waist: [number, number];
    hips: [number, number];
    shoulder: [number, number];
    height: [number, number];
    weight: [number, number];
}

export interface GarmentSizeSpec {
    chest?: number;
    waist?: number;
    hips?: number;
    shoulder?: number;
    thigh?: number;
    legOpening?: number;
    sleeveLength?: number;
    garmentLength?: number;
    stretchWarp?: number;
    stretchWeft?: number;
    fitIntent?: string;
}

export interface RecommendSizeOptions {
    garmentType?: string;
}

export interface FitZone {
    key: MeasurementZone;
    label: string;
    fit: FitLevel;
    delta: number;      // rounded ease in cm (garment - body)
    deltaRaw: number;   // precise ease in cm
    severity: number;   // 0..1 (higher = worse mismatch)
}

export interface SizeResult {
    size: string;
    score: number;      // 0..100, higher = better
    zones: FitZone[];
    isRecommended: boolean;
}

const SIZE_CHART: Record<string, SizeSpec> = {
    XS: {
        chest: [74, 80], waist: [56, 62], hips: [80, 86],
        shoulder: [34, 36], height: [150, 158], weight: [38, 46],
    },
    S: {
        chest: [80, 86], waist: [62, 68], hips: [86, 92],
        shoulder: [36, 38], height: [155, 163], weight: [44, 52],
    },
    M: {
        chest: [86, 92], waist: [68, 74], hips: [92, 98],
        shoulder: [38, 40], height: [160, 168], weight: [50, 60],
    },
    L: {
        chest: [92, 98], waist: [74, 82], hips: [98, 104],
        shoulder: [40, 43], height: [165, 175], weight: [58, 68],
    },
    XL: {
        chest: [98, 106], waist: [82, 90], hips: [104, 112],
        shoulder: [43, 46], height: [170, 182], weight: [66, 80],
    },
    XXL: {
        chest: [106, 114], waist: [90, 100], hips: [112, 120],
        shoulder: [46, 50], height: [175, 190], weight: [78, 95],
    },
};

const SIZE_ORDER = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

const ZONE_LABELS: Record<MeasurementZone, string> = {
    chest: 'Ngực',
    waist: 'Eo',
    hips: 'Hông',
    shoulder: 'Vai',
    thigh: 'Đùi',
    legOpening: 'Ống quần',
};

const ZONE_WEIGHTS: Record<MeasurementZone, number> = {
    chest: 3,
    waist: 2,
    hips: 2.8,
    shoulder: 1.8,
    thigh: 2.4,
    legOpening: 1.3,
};

const IDEAL_EASE_CM: Record<MeasurementZone, number> = {
    chest: 8,
    waist: 8,
    hips: 8,
    shoulder: 3,
    thigh: 5,
    legOpening: 4,
};

const EASE_TOLERANCE_CM: Record<MeasurementZone, number> = {
    chest: 6,
    waist: 7,
    hips: 6,
    shoulder: 2.5,
    thigh: 5,
    legOpening: 4,
};

const ALL_ZONES: MeasurementZone[] = ['chest', 'waist', 'hips', 'shoulder', 'thigh', 'legOpening'];

const GARMENT_ZONE_PROFILES: Record<GarmentType, MeasurementZone[]> = {
    top: ['chest', 'waist', 'hips', 'shoulder'],
    bottom: ['waist', 'hips', 'thigh', 'legOpening'],
    dress: ['chest', 'waist', 'hips', 'shoulder'],
    outerwear: ['chest', 'waist', 'hips', 'shoulder'],
    unknown: ['chest', 'waist', 'hips', 'shoulder'],
};

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
const round2 = (value: number) => Math.round(value * 100) / 100;
const normalizeSize = (value: string) => value.trim().toUpperCase();

const normalizeGarmentType = (value?: string): GarmentType => {
    if (!value) {
        return 'unknown';
    }

    const normalized = value.trim().toLowerCase();
    if (normalized === 'top' || normalized === 'bottom' || normalized === 'dress' || normalized === 'outerwear') {
        return normalized;
    }

    return 'unknown';
};

const getBodyMeasurement = (profile: Profile, zone: MeasurementZone) => {
    if (zone === 'chest') return profile.chest;
    if (zone === 'waist') return profile.waist;
    if (zone === 'hips') return profile.hips;
    if (zone === 'shoulder') return profile.shoulder;

    // Derived lower-body estimates used when avatar profile has no direct thigh/calf measures.
    if (zone === 'thigh') {
        return round2(profile.hips * 0.61);
    }

    return round2(profile.hips * 0.56);
};

const getGarmentMeasurement = (spec: GarmentSizeSpec, zone: MeasurementZone): number | null => {
    const value = spec[zone];
    return typeof value === 'number' && Number.isFinite(value) ? value : null;
};

const resolveActiveZones = (garmentType: GarmentType, garmentSpec?: GarmentSizeSpec): MeasurementZone[] => {
    const preferred = GARMENT_ZONE_PROFILES[garmentType] || ALL_ZONES;
    if (!garmentSpec) {
        return preferred;
    }

    const availableInPreferred = preferred.filter((zone) => getGarmentMeasurement(garmentSpec, zone) !== null);
    if (availableInPreferred.length > 0) {
        return availableInPreferred;
    }

    const availableInAll = ALL_ZONES.filter((zone) => getGarmentMeasurement(garmentSpec, zone) !== null);
    return availableInAll.length > 0 ? availableInAll : preferred;
};

const classifyEase = (easeCm: number): FitLevel => {
    if (easeCm < 2) {
        return 'tight';
    }

    if (easeCm <= 6) {
        return 'fitted';
    }

    if (easeCm <= 12) {
        return 'comfortable';
    }

    return 'loose';
};

const computeEaseSeverity = (zone: MeasurementZone, easeCm: number, fit: FitLevel) => {
    const ideal = IDEAL_EASE_CM[zone];
    const tolerance = EASE_TOLERANCE_CM[zone];

    if (fit === 'tight') {
        return round2(clamp(0.7 + (2 - easeCm) / 4, 0.7, 1));
    }

    if (fit === 'loose') {
        return round2(clamp(0.45 + (easeCm - 12) / 18, 0.45, 1));
    }

    const normalized = Math.abs(easeCm - ideal) / tolerance;
    if (fit === 'fitted') {
        return round2(clamp(0.18 + normalized * 0.35, 0.14, 0.62));
    }

    return round2(clamp(0.08 + normalized * 0.3, 0.08, 0.55));
};

const buildFitZone = (zone: MeasurementZone, easeCm: number): FitZone => {
    const fit = classifyEase(easeCm);
    const severity = computeEaseSeverity(zone, easeCm, fit);

    return {
        key: zone,
        label: ZONE_LABELS[zone],
        fit,
        delta: Math.round(easeCm),
        deltaRaw: round2(easeCm),
        severity,
    };
};

const scoreFromZones = (zones: FitZone[]) => {
    let weightedTotal = 0;
    let weightSum = 0;

    zones.forEach((zone) => {
        const weight = ZONE_WEIGHTS[zone.key];
        const zoneScore = Math.max(0, 100 - zone.severity * 88);
        weightedTotal += zoneScore * weight;
        weightSum += weight;
    });

    return weightSum > 0 ? Math.round(weightedTotal / weightSum) : 0;
};

const scoreGarmentSizeByEase = (
    profile: Profile,
    garmentSpec: GarmentSizeSpec,
    activeZones: MeasurementZone[],
): { score: number; zones: FitZone[] } => {
    const zones: FitZone[] = activeZones.flatMap((zone) => {
        const body = getBodyMeasurement(profile, zone);
        const garment = getGarmentMeasurement(garmentSpec, zone);
        if (garment === null) {
            return [];
        }
        const easeCm = garment - body;
        return [buildFitZone(zone, easeCm)];
    });

    return {
        score: scoreFromZones(zones),
        zones,
    };
};

// Fallback when product-specific garment measurements are unavailable.
const estimateEaseFromRange = (bodyValue: number, range: [number, number]) => {
    const [min, max] = range;

    if (bodyValue > max) {
        return 2 - (bodyValue - max);
    }

    if (bodyValue < min) {
        const gap = min - bodyValue;
        if (gap <= 4) {
            return 6 + gap * 1.2;
        }
        return 12 + (gap - 4) * 1.1;
    }

    const t = (bodyValue - min) / Math.max(max - min, 1);
    return 8 - t * 4.5;
};

const scoreFallbackRangeSize = (
    profile: Profile,
    spec: SizeSpec,
    activeZones: MeasurementZone[],
): { score: number; zones: FitZone[] } => {
    const deriveLowerRangeFromHips = (
        hipsRange: [number, number],
        kind: 'thigh' | 'legOpening',
    ): [number, number] => {
        if (kind === 'thigh') {
            return [round2(hipsRange[0] * 0.58), round2(hipsRange[1] * 0.66)];
        }

        return [round2(hipsRange[0] * 0.5), round2(hipsRange[1] * 0.58)];
    };

    const rangeByZone: Record<MeasurementZone, [number, number]> = {
        chest: spec.chest,
        waist: spec.waist,
        hips: spec.hips,
        shoulder: spec.shoulder,
        thigh: deriveLowerRangeFromHips(spec.hips, 'thigh'),
        legOpening: deriveLowerRangeFromHips(spec.hips, 'legOpening'),
    };

    const zones: FitZone[] = activeZones.map((zone) => {
        const body = getBodyMeasurement(profile, zone);
        const estimatedEase = estimateEaseFromRange(body, rangeByZone[zone]);
        const zoneFit = buildFitZone(zone, estimatedEase);

        // Fallback path is less precise than true garment measurements.
        return {
            ...zoneFit,
            severity: round2(clamp(zoneFit.severity + 0.08, 0, 1)),
        };
    });

    return {
        score: scoreFromZones(zones),
        zones,
    };
};

export function recommendSizes(
    profile: Profile,
    availableSizes: string[],
    garmentSizeSpecs?: Record<string, GarmentSizeSpec>,
    options: RecommendSizeOptions = {},
): SizeResult[] {
    const results: SizeResult[] = [];
    const garmentType = normalizeGarmentType(options.garmentType);

    const normalizedAvailableSizes = [...new Set(availableSizes.map(normalizeSize).filter(Boolean))];
    const orderedAvailableSizes = [
        ...SIZE_ORDER.filter((size) => normalizedAvailableSizes.includes(size)),
        ...normalizedAvailableSizes.filter((size) => !SIZE_ORDER.includes(size)),
    ];

    const normalizedGarmentSpecs = garmentSizeSpecs
        ? Object.entries(garmentSizeSpecs).reduce<Record<string, GarmentSizeSpec>>((acc, [size, spec]) => {
            const key = normalizeSize(size);
            if (!key || !spec) {
                return acc;
            }
            acc[key] = spec;
            return acc;
        }, {})
        : undefined;

    orderedAvailableSizes.forEach((size) => {
        const garmentSpec = normalizedGarmentSpecs?.[size];
        const activeZones = resolveActiveZones(garmentType, garmentSpec);
        const result = garmentSpec
            ? scoreGarmentSizeByEase(profile, garmentSpec, activeZones)
            : (SIZE_CHART[size] ? scoreFallbackRangeSize(profile, SIZE_CHART[size], activeZones) : null);

        if (!result) {
            return;
        }

        results.push({
            size,
            score: result.score,
            zones: result.zones,
            isRecommended: false,
        });
    });

    results.sort((a, b) => b.score - a.score);

    if (results.length > 0) {
        results[0].isRecommended = true;
    }

    return results;
}

/* ─────────────────────────────────────────────────────────────
   UI Component
   ───────────────────────────────────────────────────────────── */

const FIT_LABELS: Record<FitLevel, { text: string; color: string }> = {
    tight: { text: 'Chật', color: '#ef4444' },
    fitted: { text: 'Ôm vừa', color: '#eab308' },
    comfortable: { text: 'Thoải mái', color: '#22c55e' },
    loose: { text: 'Rộng', color: '#166534' },
};

interface SizeRecommendationProps {
    profile: Profile;
    availableSizes: string[];
    selectedSize: string | null;
    onSelectSize: (size: string) => void;
    garmentSizeSpecs?: Record<string, GarmentSizeSpec>;
    garmentType?: string;
}

export default function SizeRecommendation({
    profile, availableSizes, selectedSize, onSelectSize, garmentSizeSpecs, garmentType,
}: SizeRecommendationProps) {
    const [isDetailOpen, setIsDetailOpen] = useState(false);

    const results = useMemo(
        () => recommendSizes(profile, availableSizes, garmentSizeSpecs, { garmentType }),
        [profile, availableSizes, garmentSizeSpecs, garmentType],
    );

    const shape = useMemo(() => detectBodyShape(profile), [profile]);

    const bestResult = results.find((result) => result.isRecommended);
    const selectedResult = results.find((result) => result.size === selectedSize);
    const displayResult = selectedResult || bestResult;

    useEffect(() => {
        setIsDetailOpen(false);
    }, [selectedSize, profile]);

    return (
        <div className="vto-size-rec">
            {bestResult && (
                <div className="vto-size-rec__badge">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                        <polyline points="22 4 12 14.01 9 11.01" />
                    </svg>
                    <span>
                        Gợi ý: <strong>{bestResult.size}</strong> - phù hợp {bestResult.score}% · Dáng {shape.label}
                    </span>
                </div>
            )}

            <div className="vto-size-rec__grid">
                {results.map((result) => (
                    <button
                        key={result.size}
                        className={`vto-size-rec__btn ${selectedSize === result.size ? 'active' : ''} ${result.isRecommended ? 'recommended' : ''}`}
                        onClick={() => onSelectSize(result.size)}
                    >
                        <span className="vto-size-rec__btn-label">{result.size}</span>
                        <span className="vto-size-rec__btn-score">{result.score}%</span>
                        {result.isRecommended && <span className="vto-size-rec__star">★</span>}
                    </button>
                ))}
            </div>

            {displayResult && (
                <div className="vto-size-rec__detail-wrap">
                    <button
                        type="button"
                        className={`vto-size-rec__toggle ${isDetailOpen ? 'open' : ''}`}
                        onClick={() => setIsDetailOpen((open) => !open)}
                    >
                        <span className="vto-size-rec__toggle-text">
                            {isDetailOpen ? 'Ẩn chi tiết' : `Xem chi tiết size ${displayResult.size}`}
                        </span>
                        <svg className="vto-size-rec__toggle-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                            <polyline points="6 9 12 15 18 9" />
                        </svg>
                    </button>

                    {isDetailOpen && (
                        <div className="vto-size-rec__detail">
                            <p className="vto-size-rec__detail-title">Chi tiết size {displayResult.size}</p>
                            <div className="vto-size-rec__zones">
                                {displayResult.zones.map((zone) => {
                                    const fitInfo = FIT_LABELS[zone.fit];
                                    return (
                                        <div key={zone.key} className="vto-size-rec__zone">
                                            <span className="vto-size-rec__zone-label">{zone.label}</span>
                                            <span className="vto-size-rec__zone-fit" style={{ color: fitInfo.color }}>
                                                {fitInfo.text}
                                            </span>
                                            <span className="vto-size-rec__zone-delta">
                                                {zone.deltaRaw > 0 ? '+' : ''}{zone.deltaRaw} cm
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
