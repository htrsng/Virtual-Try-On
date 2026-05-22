import type { OutfitFilter, Occasion, StyleTag } from '../../types/outfit'

interface LeftPanelProps {
    activeTab: 'describe' | 'occasion'
    filter: OutfitFilter
    onChange: (filter: OutfitFilter) => void
    onGenerate: () => void
    isGenerating: boolean
    shopLoading?: boolean
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

export default function LeftPanel({ activeTab, filter, onChange, onGenerate, isGenerating, shopLoading = false }: LeftPanelProps) {
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
    const isDisabled = isGenerating || shopLoading || !canGenerate

    return (
        <div style={{
            background: 'var(--surface-elevated)',
            borderRight: '1px solid var(--gold-divider)',
            height: '100%',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            scrollbarWidth: 'none',
        }}>
            <style>{`
                .lp-textarea:focus {
                    border-color: var(--gold-primary) !important;
                }
                .lp-textarea::placeholder {
                    color: var(--text-secondary);
                    opacity: 0.5;
                }
                .lp-occasion-chip:hover {
                    background: var(--gold-light) !important;
                    border-color: var(--gold-border) !important;
                }
                .lp-style-chip:hover {
                    background: var(--surface-card);
                }
                .lp-cta-btn:hover:not(:disabled) {
                    transform: translateY(-1px);
                    box-shadow: 0 6px 20px rgba(201,150,63,0.35) !important;
                }
                .lp-cta-btn:active:not(:disabled) {
                    transform: translateY(0);
                }
                .lp-spinner {
                    display: inline-flex;
                    align-items: center;
                    gap: 4px;
                }
                .lp-spinner span {
                    width: 4px;
                    height: 4px;
                    background: #0F0B07;
                    border-radius: 50%;
                    animation: lp-bounce 1.4s infinite ease-in-out both;
                }
                .lp-spinner span:nth-child(1) { animation-delay: -0.32s; }
                .lp-spinner span:nth-child(2) { animation-delay: -0.16s; }
                @keyframes lp-bounce {
                    0%, 80%, 100% { transform: scale(0); }
                    40% { transform: scale(1); }
                }
            `}</style>

            <div style={{ padding: '20px 20px 0' }}>
                <div style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px',
                    fontSize: '9px',
                    letterSpacing: '0.12em',
                    color: 'var(--gold-primary)',
                    opacity: 0.7,
                    marginBottom: '4px'
                }}>
                    ✦ AI STYLIST
                </div>
                <h2 style={{ fontSize: '18px', fontWeight: '600', color: 'var(--text-primary)', margin: '0 0 2px' }}>
                    Bộ lọc
                </h2>
                <p style={{ fontSize: '11px', color: 'var(--text-secondary)', margin: '0 0 16px' }}>
                    Chọn ngữ cảnh để AI tạo outfit
                </p>
            </div>

            <div style={{ height: '1px', background: 'var(--gold-divider)', margin: '0 20px 16px' }} />

            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                {activeTab === 'describe' && (
                    <div>
                        <div style={{
                            fontSize: '10px',
                            letterSpacing: '0.1em',
                            color: 'var(--text-secondary)',
                            fontWeight: '500',
                            padding: '0 20px',
                            marginBottom: '8px'
                        }}>
                            MÔ TẢ TRANG PHỤC
                        </div>
                        <textarea
                            className="lp-textarea"
                            style={{
                                margin: '0 16px',
                                width: 'calc(100% - 32px)',
                                background: 'var(--surface-subtle)',
                                border: '1px solid var(--gold-border)',
                                borderRadius: '12px',
                                padding: '12px 14px',
                                fontSize: '12px',
                                color: 'var(--text-primary)',
                                lineHeight: '1.6',
                                resize: 'none',
                                minHeight: '90px',
                                transition: 'border-color 0.2s',
                                outline: 'none',
                                boxSizing: 'border-box'
                            }}
                            rows={4}
                            placeholder="VD: Tôi muốn mặc đi cafe cuối tuần, phong cách nhẹ nhàng..."
                            value={filter.description}
                            onChange={(event) => onChange({ ...filter, description: event.target.value })}
                        />
                    </div>
                )}

                {activeTab === 'occasion' && (
                    <>
                        <div style={{
                            fontSize: '10px',
                            letterSpacing: '0.1em',
                            color: 'var(--text-secondary)',
                            fontWeight: '500',
                            padding: '0 20px',
                            marginBottom: '8px'
                        }}>
                            DỊP MẶC
                        </div>
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: '1fr 1fr',
                            gap: '8px',
                            padding: '0 16px',
                            marginBottom: '16px'
                        }}>
                            {OCCASIONS.map((occasion) => {
                                const isSelected = filter.occasions.includes(occasion.value);
                                return (
                                    <div
                                        key={occasion.value}
                                        className="lp-occasion-chip"
                                        onClick={() => toggleOccasion(occasion.value)}
                                        style={{
                                            background: isSelected ? 'var(--gold-light)' : 'var(--surface-card)',
                                            border: isSelected ? '1.5px solid var(--gold-primary)' : '1px solid var(--gold-border)',
                                            borderRadius: '10px',
                                            padding: '10px 12px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '8px',
                                            cursor: 'pointer',
                                            transition: 'all 0.18s ease',
                                            fontSize: '12px',
                                            color: isSelected ? 'var(--gold-primary)' : 'var(--text-primary)',
                                            fontWeight: isSelected ? '500' : 'normal',
                                            boxSizing: 'border-box'
                                        }}
                                    >
                                        <span style={{ fontSize: '14px' }}>{occasion.emoji}</span>
                                        <span>{occasion.label}</span>
                                        {isSelected && (
                                            <span style={{ color: 'var(--gold-primary)', fontSize: '10px', marginLeft: 'auto' }}>✓</span>
                                        )}
                                    </div>
                                )
                            })}
                        </div>

                        <div style={{
                            fontSize: '10px',
                            letterSpacing: '0.1em',
                            color: 'var(--text-secondary)',
                            fontWeight: '500',
                            padding: '0 20px',
                            marginBottom: '8px'
                        }}>
                            PHONG CÁCH
                        </div>
                        <div style={{
                            display: 'flex',
                            flexWrap: 'wrap',
                            gap: '6px',
                            padding: '0 16px',
                            marginBottom: '16px'
                        }}>
                            {STYLES.map((style) => {
                                const isSelected = filter.styles.includes(style);
                                return (
                                    <div
                                        key={style}
                                        className="lp-style-chip"
                                        onClick={() => toggleStyle(style)}
                                        style={{
                                            background: isSelected ? 'var(--gold-light)' : 'var(--surface-subtle)',
                                            border: isSelected ? '1px solid var(--gold-primary)' : '1px solid var(--gold-border)',
                                            borderRadius: '20px',
                                            padding: '5px 14px',
                                            fontSize: '11px',
                                            color: isSelected ? 'var(--gold-primary)' : 'var(--text-secondary)',
                                            cursor: 'pointer',
                                            transition: 'all 0.15s ease',
                                            fontWeight: isSelected ? '500' : 'normal',
                                        }}
                                    >
                                        {style}
                                    </div>
                                )
                            })}
                        </div>
                    </>
                )}

                <div style={{
                    fontSize: '10px',
                    letterSpacing: '0.1em',
                    color: 'var(--text-secondary)',
                    fontWeight: '500',
                    padding: '0 20px',
                    marginBottom: '8px',
                    marginTop: activeTab === 'describe' ? '16px' : 0
                }}>
                    TÔNG MÀU
                </div>
                <div style={{ padding: '0 16px', display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '16px' }}>
                    {COLORS.map((color) => {
                        const isSelected = filter.colors.includes(color.hex);
                        return (
                            <div
                                key={color.hex}
                                onClick={() => toggleColor(color.hex)}
                                title={color.label}
                                style={{
                                    width: '26px',
                                    height: '26px',
                                    borderRadius: '50%',
                                    cursor: 'pointer',
                                    transition: 'transform 0.15s, box-shadow 0.15s',
                                    border: isSelected ? '2px solid var(--gold-primary)' : '2px solid transparent',
                                    backgroundColor: color.hex,
                                    transform: isSelected ? 'scale(1.15)' : 'none',
                                    boxShadow: isSelected ? '0 0 0 2px var(--gold-light)' : '0 1px 3px rgba(0,0,0,0.1)',
                                    boxSizing: 'border-box'
                                }}
                            />
                        )
                    })}
                </div>

                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '0 16px',
                    marginBottom: '8px'
                }}>
                    <div style={{
                        fontSize: '10px',
                        letterSpacing: '0.1em',
                        color: 'var(--text-secondary)',
                        fontWeight: '500'
                    }}>
                        NGÂN SÁCH
                    </div>
                    <div style={{
                        background: 'var(--gold-light)',
                        border: '1px solid var(--gold-border)',
                        borderRadius: '8px',
                        padding: '2px 10px',
                        fontSize: '11px',
                        color: 'var(--gold-primary)',
                        fontWeight: '600'
                    }}>
                        {new Intl.NumberFormat('vi-VN').format(filter.budget)}đ
                    </div>
                </div>
                <div style={{ padding: '0 16px', marginBottom: '16px' }}>
                    <input
                        type="range"
                        min={200000}
                        max={5000000}
                        step={100000}
                        value={filter.budget}
                        onChange={(event) => onChange({ ...filter, budget: Number(event.target.value) })}
                        style={{ width: '100%', accentColor: 'var(--gold-primary)' }}
                    />
                </div>
            </div>

            <div style={{
                marginTop: 'auto',
                padding: '16px',
                borderTop: '1px solid var(--gold-divider)',
            }}>
                <div style={{
                    fontSize: '11px',
                    color: 'var(--text-secondary)',
                    textAlign: 'center',
                    marginBottom: '10px',
                    opacity: 0.6
                }}>
                    {activeTab === 'describe'
                        ? 'Nhập mô tả để AI gợi ý outfit'
                        : 'Chọn ít nhất 1 dịp hoặc phong cách'}
                </div>
                <button
                    className="lp-cta-btn"
                    onClick={onGenerate}
                    disabled={isDisabled}
                    style={{
                        width: '100%',
                        background: 'linear-gradient(135deg, var(--gold-primary) 0%, #E8B84B 100%)',
                        border: 'none',
                        borderRadius: '12px',
                        padding: '13px',
                        fontSize: '13px',
                        fontWeight: '600',
                        color: '#0F0B07',
                        cursor: isDisabled ? 'not-allowed' : 'pointer',
                        letterSpacing: '0.03em',
                        boxShadow: '0 4px 16px rgba(201,150,63,0.25)',
                        transition: 'transform 0.15s, box-shadow 0.15s',
                        opacity: isDisabled ? 0.45 : 1,
                        transform: isDisabled ? 'none' : undefined
                    }}
                >
                    {shopLoading ? (
                        '⏳ Đang tải sản phẩm...'
                    ) : isGenerating ? (
                        <div className="lp-spinner">
                            <span /><span /><span />
                        </div>
                    ) : (
                        <><span style={{ marginRight: '6px' }}>✨</span> Tạo outfit với AI</>
                    )}
                </button>
            </div>
        </div>
    )
}
