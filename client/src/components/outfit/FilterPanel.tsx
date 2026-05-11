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
    { hex: '#ffffff', label: 'Trắng' },
    { hex: '#93c5fd', label: 'Xanh nhạt' },
    { hex: '#f9a8d4', label: 'Hồng' },
    { hex: '#86efac', label: 'Xanh lá' },
    { hex: '#fcd34d', label: 'Vàng' },
    { hex: '#fdba74', label: 'Cam' },
    { hex: '#c4b5fd', label: 'Tím' },
]

export default function FilterPanel({ activeTab, filter, onChange, onGenerate, isGenerating }: FilterPanelProps) {
    const panelStyle: React.CSSProperties = {
        width: 270,
        minWidth: 270,
        maxWidth: 270,
        flexShrink: 0,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        borderRadius: 24,
        border: '1px solid rgba(148,163,184,0.35)',
        background: 'rgba(255,255,255,0.92)',
        boxShadow: '0 12px 36px rgba(15,23,42,0.10)',
    }

    const scrollStyle: React.CSSProperties = {
        flex: 1,
        overflowY: 'auto',
        padding: 16,
        display: 'flex',
        flexDirection: 'column',
        gap: 18,
    }

    const labelStyle: React.CSSProperties = {
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: 0.8,
        color: '#64748b',
        textTransform: 'uppercase',
    }

    const buttonBase: React.CSSProperties = {
        fontSize: 12,
        borderRadius: 10,
        border: '1px solid #dbe2ea',
        background: '#fff',
        color: '#475569',
        cursor: 'pointer',
        transition: 'all 150ms ease',
    }

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
        <div style={panelStyle}>
            <div style={{ padding: '14px 16px', borderBottom: '1px solid rgba(226,232,240,0.9)', background: 'rgba(248,250,252,0.96)' }}>
                <h2 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#0f172a' }}>LeftPanel</h2>
                <p style={{ margin: '4px 0 0', fontSize: 12, color: '#64748b' }}>Chọn ngữ cảnh để AI tạo outfit</p>
            </div>

            <div style={scrollStyle}>
                {activeTab === 'describe' && (
                    <div>
                        <label style={labelStyle}>
                            Mô tả trang phục
                        </label>
                        <textarea
                            style={{
                                marginTop: 6,
                                width: '100%',
                                minHeight: 108,
                                resize: 'none',
                                borderRadius: 14,
                                border: '1px solid #dbe2ea',
                                padding: 12,
                                fontSize: 13,
                                lineHeight: 1.5,
                                color: '#0f172a',
                                outline: 'none',
                                boxSizing: 'border-box',
                            }}
                            rows={4}
                            placeholder="VD: Tôi muốn mặc đi cafe cuối tuần, phong cách nhẹ nhàng, không quá formal, tông màu trung tính..."
                            value={filter.description}
                            onChange={(event) => onChange({ ...filter, description: event.target.value })}
                        />
                    </div>
                )}

                {activeTab === 'occasion' && (
                    <div>
                        <label style={labelStyle}>
                            Dịp mặc
                        </label>
                        <div style={{ marginTop: 6, display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 8 }}>
                            {OCCASIONS.map((occasion) => (
                                <button
                                    key={occasion.value}
                                    onClick={() => toggleOccasion(occasion.value)}
                                    style={{
                                        ...buttonBase,
                                        padding: '10px 10px',
                                        textAlign: 'left',
                                        borderColor: filter.occasions.includes(occasion.value) ? '#3b82f6' : '#dbe2ea',
                                        background: filter.occasions.includes(occasion.value) ? '#eff6ff' : '#fff',
                                        color: filter.occasions.includes(occasion.value) ? '#1d4ed8' : '#475569',
                                    }}
                                >
                                    {occasion.emoji} {occasion.label}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                <div>
                    <label style={labelStyle}>
                        Phong cách
                    </label>
                    <div style={{ marginTop: 6, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                        {STYLES.map((style) => (
                            <button
                                key={style}
                                onClick={() => toggleStyle(style)}
                                style={{
                                    ...buttonBase,
                                    borderRadius: 999,
                                    padding: '7px 10px',
                                    borderColor: filter.styles.includes(style) ? '#10b981' : '#dbe2ea',
                                    background: filter.styles.includes(style) ? '#ecfdf5' : '#fff',
                                    color: filter.styles.includes(style) ? '#047857' : '#475569',
                                }}
                            >
                                {style}
                            </button>
                        ))}
                    </div>
                </div>

                <div>
                    <label style={labelStyle}>
                        Tông màu
                    </label>
                    <div style={{ marginTop: 6, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                        {COLORS.map((color) => (
                            <button
                                key={color.hex}
                                onClick={() => toggleColor(color.hex)}
                                title={color.label}
                                style={{
                                    width: 30,
                                    height: 30,
                                    borderRadius: '50%',
                                    border: filter.colors.includes(color.hex) ? '2px solid #64748b' : '2px solid #e2e8f0',
                                    boxShadow: filter.colors.includes(color.hex) ? '0 0 0 3px rgba(100,116,139,0.15)' : 'none',
                                    backgroundColor: color.hex,
                                    cursor: 'pointer',
                                }}
                            />
                        ))}
                    </div>
                </div>

                <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <label style={labelStyle}>
                            Ngân sách
                        </label>
                        <span style={{ fontSize: 12, fontWeight: 700, color: '#334155' }}>
                            {new Intl.NumberFormat('vi-VN').format(filter.budget)}đ
                        </span>
                    </div>
                    <input
                        type="range"
                        min={200000}
                        max={5000000}
                        step={100000}
                        value={filter.budget}
                        onChange={(event) => onChange({ ...filter, budget: Number(event.target.value) })}
                        style={{ width: '100%', marginTop: 8 }}
                    />
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4, fontSize: 11, color: '#94a3b8' }}>
                        <span>200k</span>
                        <span>5tr</span>
                    </div>
                </div>
            </div>

            <div style={{ padding: 12, borderTop: '1px solid #e2e8f0', background: '#fff' }}>
                {!canGenerate && (
                    <p style={{ fontSize: 12, color: '#94a3b8', textAlign: 'center', margin: '0 0 8px' }}>
                        {activeTab === 'describe'
                            ? 'Nhập mô tả để AI gợi ý outfit'
                            : 'Chọn ít nhất 1 dịp hoặc phong cách'}
                    </p>
                )}
                <button
                    onClick={onGenerate}
                    disabled={isGenerating || !canGenerate}
                    style={{
                        width: '100%',
                        padding: '12px 14px',
                        borderRadius: 14,
                        border: 'none',
                        background: isGenerating || !canGenerate ? '#e2e8f0' : '#0f172a',
                        color: isGenerating || !canGenerate ? '#94a3b8' : '#fff',
                        fontSize: 14,
                        fontWeight: 700,
                        cursor: isGenerating || !canGenerate ? 'not-allowed' : 'pointer',
                        boxShadow: isGenerating || !canGenerate ? 'none' : '0 8px 20px rgba(15,23,42,0.14)',
                    }}
                >
                    {isGenerating ? (
                        <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.37 0 0 5.37 0 12h4z" />
                            </svg>
                            Đang tạo...
                        </span>
                    ) : '✨ Tạo outfit với AI'}
                </button>
            </div>
        </div>
    )
}
