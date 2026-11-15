import type { OutfitFilter, Occasion, StyleTag } from '../../types/outfit'

interface FilterPanelProps {
    activeTab: 'describe' | 'occasion'
    filter: OutfitFilter
    onChange: (filter: OutfitFilter) => void
    onGenerate: () => void
    isGenerating: boolean
}

const OCCASIONS: { value: Occasion; label: string; emoji: string }[] = [
    { value: 'cafe', label: 'Đi cafe', emoji: '☕' },
    { value: 'office', label: 'Công sở', emoji: '💼' },
    { value: 'street', label: 'Dạo phố', emoji: '☀️' },
    { value: 'party', label: 'Party', emoji: '🎵' },
    { value: 'travel', label: 'Du lịch', emoji: '🏔️' },
    { value: 'date', label: 'Hẹn hò', emoji: '🌙' },
]

const STYLES: StyleTag[] = [
    'Casual',
    'Minimalist',
    'Streetwear',
    'Coquette',
    'Y2K',
    'Vintage',
    'Business casual',
]

const COLORS = [
    { hex: '#1a1a1a', label: 'Đen' },
    { hex: '#f5f0e8', label: 'Trắng' },
    { hex: '#93c5fd', label: 'Xanh nhạt' },
    { hex: '#f9a8d4', label: 'Hồng' },
    { hex: '#86efac', label: 'Xanh lá' },
    { hex: '#fcd34d', label: 'Vàng' },
    { hex: '#fdba74', label: 'Cam' },
    { hex: '#c4b5fd', label: 'Tím' },
]

const CSS = `
.aifp {
    display: flex;
    flex-direction: column;
    height: 100%;
    overflow: hidden;
    font-family: inherit;
}

.aifp__header {
    padding: 16px 18px 14px;
    border-bottom: 1px solid rgba(200,168,103,0.15);
    background: linear-gradient(135deg, #fffdf9 0%, #faf5ec 100%);
    flex-shrink: 0;
}

.aifp__eyebrow {
    font-size: 9px;
    font-weight: 800;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: rgba(200,168,103,0.8);
    margin: 0 0 4px;
    display: flex;
    align-items: center;
    gap: 6px;
}

.aifp__eyebrow::before {
    content: '';
    display: inline-block;
    width: 16px;
    height: 1px;
    background: rgba(200,168,103,0.6);
}

.aifp__title {
    font-size: 15px;
    font-weight: 700;
    color: #1f1a16;
    margin: 0 0 2px;
}

.aifp__subtitle {
    font-size: 11px;
    color: #9a8a78;
    margin: 0;
    line-height: 1.4;
}

.aifp__scroll {
    flex: 1;
    overflow-y: auto;
    padding: 16px;
    display: flex;
    flex-direction: column;
    gap: 18px;
    scrollbar-width: thin;
    scrollbar-color: rgba(200,168,103,0.3) transparent;
}

.aifp__scroll::-webkit-scrollbar { width: 5px; }
.aifp__scroll::-webkit-scrollbar-thumb { background: rgba(200,168,103,0.3); border-radius: 4px; }

.aifp__section-label {
    display: block;
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: #7a6d62;
    margin-bottom: 8px;
}

.aifp__textarea {
    width: 100%;
    min-height: 100px;
    resize: vertical;
    border-radius: 12px;
    border: 1px solid rgba(200,168,103,0.25);
    padding: 11px 13px;
    font-size: 13px;
    line-height: 1.55;
    color: #1f1a16;
    background: linear-gradient(135deg, #fffef9 0%, #faf8f2 100%);
    outline: none;
    box-sizing: border-box;
    font-family: inherit;
    transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.aifp__textarea:focus {
    border-color: rgba(200,168,103,0.5);
    box-shadow: 0 0 0 3px rgba(200,168,103,0.10);
}

.aifp__textarea::placeholder { color: #b8a89a; }

.aifp__occasions-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 7px;
}

.aifp__occasion-btn {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 9px 11px;
    border-radius: 11px;
    border: 1px solid rgba(31,26,23,0.10);
    background: #fff;
    color: #4a4039;
    font-size: 12px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.18s ease;
    font-family: inherit;
    text-align: left;
}

.aifp__occasion-btn:hover {
    border-color: rgba(200,168,103,0.35);
    background: #fdf9f0;
}

.aifp__occasion-btn--on {
    border-color: rgba(200,168,103,0.55);
    background: linear-gradient(135deg, #FDF8EE 0%, #FAF0D8 100%);
    color: #7A5C2E;
    box-shadow: 0 2px 8px rgba(200,168,103,0.12);
}

.aifp__occasion-emoji { font-size: 15px; line-height: 1; }

.aifp__styles-wrap {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
}

.aifp__style-btn {
    padding: 6px 12px;
    border-radius: 100px;
    border: 1px solid rgba(31,26,23,0.10);
    background: #fff;
    color: #5a4e46;
    font-size: 12px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.18s ease;
    font-family: inherit;
    white-space: nowrap;
}

.aifp__style-btn:hover {
    border-color: rgba(200,168,103,0.35);
    background: #fdf9f0;
}

.aifp__style-btn--on {
    background: linear-gradient(135deg, #1f1a16 0%, #2e2720 100%);
    color: #f5dfa8;
    border-color: #1f1a16;
    box-shadow: 0 3px 8px rgba(31,26,23,0.18);
}

.aifp__colors-wrap {
    display: flex;
    gap: 9px;
    flex-wrap: wrap;
}

.aifp__color-dot {
    width: 28px;
    height: 28px;
    border-radius: 50%;
    border: 2px solid transparent;
    cursor: pointer;
    transition: all 0.18s ease;
    position: relative;
    outline: none;
}

.aifp__color-dot:hover {
    transform: scale(1.12);
}

.aifp__color-dot--on {
    border-color: #c8a867;
    box-shadow: 0 0 0 3px rgba(200,168,103,0.25);
    transform: scale(1.12);
}

.aifp__color-dot--on::after {
    content: '✓';
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 11px;
    font-weight: 900;
    color: #fff;
    text-shadow: 0 0 3px rgba(0,0,0,0.5);
}

.aifp__budget-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;
}

.aifp__budget-val {
    font-size: 13px;
    font-weight: 700;
    color: #7A5C2E;
    background: linear-gradient(135deg, #FDF8EE 0%, #FAF0D8 100%);
    border: 1px solid rgba(200,168,103,0.25);
    padding: 3px 9px;
    border-radius: 100px;
}

.aifp__range {
    -webkit-appearance: none;
    appearance: none;
    width: 100%;
    height: 4px;
    border-radius: 4px;
    background: linear-gradient(90deg, #c8a867 0%, rgba(200,168,103,0.2) 100%);
    outline: none;
    cursor: pointer;
}

.aifp__range::-webkit-slider-thumb {
    -webkit-appearance: none;
    width: 18px;
    height: 18px;
    border-radius: 50%;
    background: linear-gradient(135deg, #c8a867 0%, #b8963e 100%);
    border: 2px solid #fff;
    box-shadow: 0 2px 6px rgba(200,168,103,0.4);
    cursor: pointer;
    transition: transform 0.15s ease;
}

.aifp__range::-webkit-slider-thumb:hover { transform: scale(1.15); }

.aifp__range-labels {
    display: flex;
    justify-content: space-between;
    margin-top: 5px;
    font-size: 10px;
    color: #b8a89a;
    font-weight: 500;
}

.aifp__footer {
    padding: 12px 14px;
    border-top: 1px solid rgba(200,168,103,0.12);
    background: linear-gradient(180deg, #fffdf9 0%, #faf5ec 100%);
    flex-shrink: 0;
}

.aifp__hint {
    font-size: 11px;
    color: #b8a89a;
    text-align: center;
    margin: 0 0 8px;
    line-height: 1.4;
}

.aifp__generate-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    width: 100%;
    padding: 13px 16px;
    border-radius: 13px;
    border: none;
    font-size: 14px;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.22s cubic-bezier(0.34, 1.56, 0.64, 1);
    font-family: inherit;
    letter-spacing: 0.01em;
    position: relative;
    overflow: hidden;
}

.aifp__generate-btn--active {
    background: linear-gradient(135deg, #c8a867 0%, #a87c3a 100%);
    color: #fff;
    box-shadow: 0 6px 20px rgba(200,168,103,0.35);
}

.aifp__generate-btn--active:hover {
    transform: translateY(-2px);
    box-shadow: 0 10px 28px rgba(200,168,103,0.45);
}

.aifp__generate-btn--active:active {
    transform: translateY(0);
}

.aifp__generate-btn--disabled {
    background: rgba(31,26,23,0.06);
    color: #b8a89a;
    cursor: not-allowed;
    box-shadow: none;
}

.aifp__spinner {
    width: 16px;
    height: 16px;
    border: 2px solid rgba(255,255,255,0.3);
    border-top-color: #fff;
    border-radius: 50%;
    animation: aifp-spin 0.75s linear infinite;
}

@keyframes aifp-spin {
    to { transform: rotate(360deg); }
}
`

export default function FilterPanel({ activeTab, filter, onChange, onGenerate, isGenerating }: FilterPanelProps) {
    const toggleOccasion = (occasion: Occasion) => {
        const next = filter.occasions.includes(occasion)
            ? filter.occasions.filter((value) => value !== occasion)
            : [...filter.occasions, occasion]
        onChange({ ...filter, occasions: next })
    }

    const toggleStyle = (style: StyleTag) => {
        const next = filter.styles.includes(style)
            ? filter.styles.filter((value) => value !== style)
            : [...filter.styles, style]
        onChange({ ...filter, styles: next })
    }

    const toggleColor = (hex: string) => {
        const next = filter.colors.includes(hex)
            ? filter.colors.filter((value) => value !== hex)
            : [...filter.colors, hex]
        onChange({ ...filter, colors: next })
    }

    const canGenerate = activeTab === 'describe'
        ? filter.description.trim().length > 0
        : filter.occasions.length > 0 || filter.styles.length > 0

    return (
        <>
            <style>{CSS}</style>
            <div className="aifp">
                {/* Header */}
                <div className="aifp__header">
                    <p className="aifp__eyebrow">AI Stylist</p>
                    <h2 className="aifp__title">Bộ lọc</h2>
                    <p className="aifp__subtitle">Chọn ngữ cảnh để AI tạo outfit</p>
                </div>

                {/* Scrollable content */}
                <div className="aifp__scroll">
                    {/* Mô tả */}
                    {activeTab === 'describe' && (
                        <div>
                            <span className="aifp__section-label">Mô tả trang phục</span>
                            <textarea
                                className="aifp__textarea"
                                rows={4}
                                placeholder="VD: Tôi muốn mặc đi cafe cuối tuần, phong cách nhẹ nhàng, không quá formal, tông màu trung tính..."
                                value={filter.description}
                                onChange={(event) => onChange({ ...filter, description: event.target.value })}
                            />
                        </div>
                    )}

                    {/* Dịp mặc */}
                    {activeTab === 'occasion' && (
                        <div>
                            <span className="aifp__section-label">Dịp mặc</span>
                            <div className="aifp__occasions-grid">
                                {OCCASIONS.map((occasion) => (
                                    <button
                                        key={occasion.value}
                                        className={`aifp__occasion-btn${filter.occasions.includes(occasion.value) ? ' aifp__occasion-btn--on' : ''}`}
                                        onClick={() => toggleOccasion(occasion.value)}
                                    >
                                        <span className="aifp__occasion-emoji">{occasion.emoji}</span>
                                        {occasion.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Phong cách */}
                    <div>
                        <span className="aifp__section-label">Phong cách</span>
                        <div className="aifp__styles-wrap">
                            {STYLES.map((style) => (
                                <button
                                    key={style}
                                    className={`aifp__style-btn${filter.styles.includes(style) ? ' aifp__style-btn--on' : ''}`}
                                    onClick={() => toggleStyle(style)}
                                >
                                    {style}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Tông màu */}
                    <div>
                        <span className="aifp__section-label">Tông màu</span>
                        <div className="aifp__colors-wrap">
                            {COLORS.map((color) => (
                                <button
                                    key={color.hex}
                                    className={`aifp__color-dot${filter.colors.includes(color.hex) ? ' aifp__color-dot--on' : ''}`}
                                    style={{ backgroundColor: color.hex, outline: color.hex === '#f5f0e8' ? '1px solid rgba(0,0,0,0.12)' : undefined }}
                                    title={color.label}
                                    onClick={() => toggleColor(color.hex)}
                                />
                            ))}
                        </div>
                    </div>

                    {/* Ngân sách */}
                    <div>
                        <div className="aifp__budget-header">
                            <span className="aifp__section-label" style={{ marginBottom: 0 }}>Ngân sách</span>
                            <span className="aifp__budget-val">
                                {new Intl.NumberFormat('vi-VN').format(filter.budget)}đ
                            </span>
                        </div>
                        <input
                            type="range"
                            className="aifp__range"
                            min={200000}
                            max={5000000}
                            step={100000}
                            value={filter.budget}
                            onChange={(event) => onChange({ ...filter, budget: Number(event.target.value) })}
                        />
                        <div className="aifp__range-labels">
                            <span>200k</span>
                            <span>5tr</span>
                        </div>
                    </div>
                </div>

                {/* Footer CTA */}
                <div className="aifp__footer">
                    {!canGenerate && (
                        <p className="aifp__hint">
                            {activeTab === 'describe'
                                ? 'Nhập mô tả để AI gợi ý outfit'
                                : 'Chọn ít nhất 1 dịp hoặc phong cách'}
                        </p>
                    )}
                    <button
                        className={`aifp__generate-btn${(isGenerating || !canGenerate) ? ' aifp__generate-btn--disabled' : ' aifp__generate-btn--active'}`}
                        onClick={onGenerate}
                        disabled={isGenerating || !canGenerate}
                    >
                        {isGenerating ? (
                            <>
                                <span className="aifp__spinner" />
                                Đang tạo...
                            </>
                        ) : (
                            <>✨ Tạo outfit với AI</>
                        )}
                    </button>
                </div>
            </div>
        </>
    )
}
