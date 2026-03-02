import { useMemo, useState } from 'react';

interface ColorOption {
    name?: string;
    hex: string;
}

interface SizeSelectorProps {
    sizes: string[];
    selectedSize: string | null;
    onSelectSize: (size: string) => void;
    note?: string;
    fitScores?: Record<string, number>;
    recommendedSize?: string;
    outOfStockSizes?: string[];
}

interface ColorSelectorProps {
    colors: ColorOption[];
    selectedColor: string;
    onSelectColor: (hex: string) => void;
}

function getFitColor(score: number): string {
    if (score >= 70) return '#22c55e';
    if (score >= 40) return '#eab308';
    return '#9ca3af';
}

export function SizeSelector({ sizes, selectedSize, onSelectSize, note, fitScores, recommendedSize, outOfStockSizes }: SizeSelectorProps) {
    const [showTooltip, setShowTooltip] = useState(false);
    const oos = useMemo(() => new Set(outOfStockSizes || []), [outOfStockSizes]);

    return (
        <div className="vto-option">
            <div className="vto-size-header">
                <label className="vto-section-label">Kích cỡ</label>
                {fitScores && (
                    <button
                        type="button"
                        className="vto-size-tooltip-trigger"
                        onMouseEnter={() => setShowTooltip(true)}
                        onMouseLeave={() => setShowTooltip(false)}
                        onClick={() => setShowTooltip(t => !t)}
                    >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                            <circle cx="12" cy="12" r="10" />
                            <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                            <line x1="12" y1="17" x2="12.01" y2="17" />
                        </svg>
                        {showTooltip && (
                            <span className="vto-size-tooltip">
                                Phần trăm cho thấy mức độ phù hợp của size với số đo cơ thể bạn. Càng cao càng vừa vặn.
                            </span>
                        )}
                    </button>
                )}
            </div>
            <div className="vto-size-grid">
                {sizes.map(s => {
                    const isOos = oos.has(s);
                    const isRec = recommendedSize === s;
                    const score = fitScores?.[s];
                    const barColor = score != null ? getFitColor(score) : undefined;

                    return (
                        <button
                            key={s}
                            className={[
                                'vto-size-btn',
                                selectedSize === s ? 'active' : '',
                                isRec ? 'recommended' : '',
                                isOos ? 'oos' : '',
                            ].filter(Boolean).join(' ')}
                            onClick={() => !isOos && onSelectSize(s)}
                            disabled={isOos}
                        >
                            <span className="vto-size-btn__label">{s}</span>
                            {isRec && <span className="vto-size-btn__badge">Recommended</span>}
                            {isOos && <span className="vto-size-btn__oos">Hết hàng</span>}
                            {score != null && !isOos && (
                                <span className="vto-size-btn__bar-wrap">
                                    <span
                                        className="vto-size-btn__bar"
                                        style={{ width: `${score}%`, backgroundColor: barColor }}
                                    />
                                </span>
                            )}
                        </button>
                    );
                })}
            </div>
            {note && <p className="vto-option__note">{note}</p>}
        </div>
    );
}

export function ColorSelector({ colors, selectedColor, onSelectColor }: ColorSelectorProps) {
    const displayColors = useMemo(() => {
        if (!colors || colors.length === 0) {
            return [
                { name: 'Trắng', hex: '#f5f5f5' },
                { name: 'Đen', hex: '#222222' },
                { name: 'Xanh Navy', hex: '#1f2a44' },
                { name: 'Be', hex: '#d4c3a3' }
            ];
        }
        return colors;
    }, [colors]);

    return (
        <div className="vto-option">
            <label className="vto-section-label">Màu sắc</label>
            <div className="vto-color-swatches">
                {displayColors.map((color) => {
                    const isActive = selectedColor === color.hex;
                    return (
                        <button
                            key={`${color.name || color.hex}-${color.hex}`}
                            className={`vto-swatch ${isActive ? 'active' : ''}`}
                            onClick={() => onSelectColor(color.hex)}
                            title={color.name || color.hex}
                            type="button"
                        >
                            <span className="vto-swatch__ring">
                                <span
                                    className="vto-swatch__circle"
                                    style={{ backgroundColor: color.hex }}
                                />
                            </span>
                            <span className="vto-swatch__label">{color.name || color.hex}</span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
