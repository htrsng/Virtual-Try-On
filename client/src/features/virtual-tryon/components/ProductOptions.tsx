import { useMemo } from 'react';

interface ColorOption {
    name?: string;
    hex: string;
}

interface SizeSelectorProps {
    sizes: string[];
    selectedSize: string | null;
    onSelectSize: (size: string) => void;
    note?: string;
}

interface ColorSelectorProps {
    colors: ColorOption[];
    selectedColor: string;
    onSelectColor: (hex: string) => void;
}

export function SizeSelector({ sizes, selectedSize, onSelectSize, note }: SizeSelectorProps) {
    return (
        <div className="vto-option">
            <label className="vto-section-label">Kích cỡ</label>
            <div className="vto-size-grid">
                {sizes.map(s => (
                    <button
                        key={s}
                        className={`vto-size-btn ${selectedSize === s ? 'active' : ''}`}
                        onClick={() => onSelectSize(s)}
                    >
                        {s}
                    </button>
                ))}
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
            <div className="vto-color-grid">
                {displayColors.map((color) => (
                    <button
                        key={`${color.name || color.hex}-${color.hex}`}
                        className={`vto-color-btn ${selectedColor === color.hex ? 'active' : ''}`}
                        onClick={() => onSelectColor(color.hex)}
                        title={color.name || color.hex}
                    >
                        <span
                            className="vto-color-dot"
                            style={{ backgroundColor: color.hex }}
                        />
                        <span className="vto-color-name">{color.name || color.hex}</span>
                    </button>
                ))}
            </div>
        </div>
    );
}
