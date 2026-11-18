import { useMemo, useState } from 'react';
import type { Profile } from '../../../contexts/FittingRoomContext';
import { detectBodyShape } from './bodyShape';
import { recommendSizes, type FitLevel, type GarmentSizeSpec } from './sizeRecommendationEngine';

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
    const [detailState, setDetailState] = useState<{ profile: Profile; size: string | null; open: boolean } | null>(null);
    const isDetailOpen = detailState?.profile === profile && detailState?.size === selectedSize && detailState.open;

    const results = useMemo(
        () => recommendSizes(profile, availableSizes, garmentSizeSpecs, { garmentType }),
        [profile, availableSizes, garmentSizeSpecs, garmentType],
    );

    const shape = useMemo(() => detectBodyShape(profile), [profile]);

    const bestResult = results.find((result) => result.isRecommended);
    const selectedResult = results.find((result) => result.size === selectedSize);
    const displayResult = selectedResult || bestResult;

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
                        onClick={() => setDetailState({ profile, size: selectedSize, open: !isDetailOpen })}
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
