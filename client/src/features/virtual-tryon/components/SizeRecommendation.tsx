import { useMemo, useState, useEffect } from 'react';
import type { Profile } from '../../../contexts/FittingRoomContext';
import { detectBodyShape } from './BodyPresets';

/* ══════════════════════════════════════════════════════════════
   Size Recommendation Engine
   Maps body measurements → best fitting garment size
   with fit analysis (tight / fit / loose) per zone.
   ══════════════════════════════════════════════════════════════ */

/** Standard Vietnamese/Asian size chart (cm) */
interface SizeSpec {
    chest: [number, number];     // [min, max]
    waist: [number, number];
    hips: [number, number];
    shoulder: [number, number];
    height: [number, number];
    weight: [number, number];
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

export type FitLevel = 'tight' | 'fit' | 'slightly-loose' | 'loose';

export interface FitZone {
    label: string;
    fit: FitLevel;
    delta: number;  // negative = tight, positive = loose (cm)
}

export interface SizeResult {
    size: string;
    score: number;        // 0–100, higher = better fit
    zones: FitZone[];
    isRecommended: boolean;
}

/** Evaluate how well a single measurement fits a size range */
function evalFit(value: number, range: [number, number]): { fit: FitLevel; delta: number } {
    const mid = (range[0] + range[1]) / 2;
    const delta = value - mid;

    if (value < range[0] - 2) return { fit: 'tight', delta: value - range[0] };
    if (value > range[1] + 4) return { fit: 'loose', delta: value - range[1] };
    if (value > range[1]) return { fit: 'slightly-loose', delta };
    if (value < range[0]) return { fit: 'tight', delta: value - range[0] };
    return { fit: 'fit', delta };
}

/** Score a profile against a size (0–100) */
function scoreSize(profile: Profile, spec: SizeSpec): { score: number; zones: FitZone[] } {
    const checks: { label: string; value: number; range: [number, number]; weight: number }[] = [
        { label: 'Ngực', value: profile.chest, range: spec.chest, weight: 3 },
        { label: 'Eo', value: profile.waist, range: spec.waist, weight: 2.5 },
        { label: 'Hông', value: profile.hips, range: spec.hips, weight: 2.5 },
        { label: 'Vai', value: profile.shoulder, range: spec.shoulder, weight: 2 },
    ];

    let totalScore = 0;
    let totalWeight = 0;
    const zones: FitZone[] = [];

    for (const c of checks) {
        const { fit, delta } = evalFit(c.value, c.range);
        const mid = (c.range[0] + c.range[1]) / 2;
        const span = (c.range[1] - c.range[0]) / 2 || 1;
        // Score: 100 at center, drops with distance
        const normalized = Math.abs(c.value - mid) / span;
        const zoneScore = Math.max(0, 100 - normalized * 40);
        totalScore += zoneScore * c.weight;
        totalWeight += c.weight;
        zones.push({ label: c.label, fit, delta: Math.round(delta) });
    }

    return { score: Math.round(totalScore / totalWeight), zones };
}

/** Get all size recommendations sorted by score */
export function recommendSizes(profile: Profile, availableSizes: string[]): SizeResult[] {
    const results: SizeResult[] = [];

    for (const size of SIZE_ORDER) {
        if (!availableSizes.includes(size)) continue;
        const spec = SIZE_CHART[size];
        if (!spec) continue;
        const { score, zones } = scoreSize(profile, spec);
        results.push({ size, score, zones, isRecommended: false });
    }

    // Sort by score descending
    results.sort((a, b) => b.score - a.score);

    // Mark best as recommended
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
    fit: { text: 'Vừa', color: '#22c55e' },
    'slightly-loose': { text: 'Hơi rộng', color: '#f59e0b' },
    loose: { text: 'Rộng', color: '#ef4444' },
};

interface SizeRecommendationProps {
    profile: Profile;
    availableSizes: string[];
    selectedSize: string | null;
    onSelectSize: (size: string) => void;
}

export default function SizeRecommendation({
    profile, availableSizes, selectedSize, onSelectSize
}: SizeRecommendationProps) {
    const [isDetailOpen, setIsDetailOpen] = useState(false);

    const results = useMemo(
        () => recommendSizes(profile, availableSizes),
        [profile, availableSizes]
    );

    const shape = useMemo(() => detectBodyShape(profile), [profile]);

    const bestResult = results.find(r => r.isRecommended);
    const selectedResult = results.find(r => r.size === selectedSize);
    const displayResult = selectedResult || bestResult;

    useEffect(() => {
        setIsDetailOpen(false);
    }, [selectedSize, profile]);

    return (
        <div className="vto-size-rec">
            {/* Recommendation badge */}
            {bestResult && (
                <div className="vto-size-rec__badge">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                        <polyline points="22 4 12 14.01 9 11.01" />
                    </svg>
                    <span>
                        Gợi ý: <strong>{bestResult.size}</strong> — phù hợp {bestResult.score}% · Dáng {shape.label}
                    </span>
                </div>
            )}

            {/* Size buttons with scores */}
            <div className="vto-size-rec__grid">
                {results.map(r => (
                    <button
                        key={r.size}
                        className={`vto-size-rec__btn ${selectedSize === r.size ? 'active' : ''} ${r.isRecommended ? 'recommended' : ''}`}
                        onClick={() => onSelectSize(r.size)}
                    >
                        <span className="vto-size-rec__btn-label">{r.size}</span>
                        <span className="vto-size-rec__btn-score">{r.score}%</span>
                        {r.isRecommended && <span className="vto-size-rec__star">★</span>}
                    </button>
                ))}
            </div>

            {/* Detail toggle */}
            {displayResult && (
                <div className="vto-size-rec__detail-wrap">
                    <button
                        type="button"
                        className={`vto-size-rec__toggle ${isDetailOpen ? 'open' : ''}`}
                        onClick={() => setIsDetailOpen(open => !open)}
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
                            <p className="vto-size-rec__detail-title">
                                Chi tiết size {displayResult.size}
                            </p>
                            <div className="vto-size-rec__zones">
                                {displayResult.zones.map(z => {
                                    const fitInfo = FIT_LABELS[z.fit];
                                    return (
                                        <div key={z.label} className="vto-size-rec__zone">
                                            <span className="vto-size-rec__zone-label">{z.label}</span>
                                            <span
                                                className="vto-size-rec__zone-fit"
                                                style={{ color: fitInfo.color }}
                                            >
                                                {fitInfo.text}
                                            </span>
                                            <span className="vto-size-rec__zone-delta">
                                                {z.delta > 0 ? `+${z.delta}` : z.delta} cm
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
