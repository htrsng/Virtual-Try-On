import type { OutfitFilter, Occasion, StyleTag } from '../../types/outfit'

interface LeftPanelProps {
    activeTab: 'describe' | 'occasion'
    setActiveTab: (tab: 'describe' | 'occasion') => void
    filter: OutfitFilter
    onChange: (filter: OutfitFilter) => void
    onGenerate: () => void
    isGenerating: boolean
    shopLoading?: boolean
    onClose?: () => void
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

export default function LeftPanel({ activeTab, setActiveTab, filter, onChange, onGenerate, isGenerating, shopLoading = false, onClose }: LeftPanelProps) {
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
            height: '100%',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            scrollbarWidth: 'none',
            position: 'relative'
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
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <div style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px',
                        fontSize: '9px',
                        letterSpacing: '0.12em',
                        color: 'var(--gold-primary)',
                        opacity: 0.7
                    }}>
                        ✦ AI STYLIST
                    </div>
                    {onClose && (
                        <button
                            onClick={onClose}
                            style={{
                                background: 'rgba(255,255,255,0.1)',
                                border: '1px solid rgba(255,255,255,0.2)',
                                borderRadius: '50%',
                                width: '28px',
                                height: '28px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: '#fff',
                                cursor: 'pointer',
                                transition: 'all 0.2s'
                            }}
                            title="Thu gọn"
                            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
                            onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                        >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                        </button>
                    )}
                </div>
                <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#f8fafc', margin: '0 0 2px' }}>
                    Tạo Outfit mới
                </h2>
                <p style={{ fontSize: '11px', color: '#94a3b8', margin: '0 0 16px' }}>
                    Chọn phương thức và thiết lập bộ lọc
                </p>

                {/* Tabs */}
                <div style={{
                    display: 'flex',
                    background: 'rgba(255,255,255,0.05)',
                    borderRadius: '12px',
                    padding: '4px',
                    marginBottom: '16px'
                }}>
                    <button
                        onClick={() => setActiveTab('describe')}
                        style={{
                            flex: 1,
                            background: activeTab === 'describe' ? 'var(--gold-primary)' : 'transparent',
                            color: activeTab === 'describe' ? '#0F0B07' : '#94a3b8',
                            border: 'none',
                            borderRadius: '8px',
                            padding: '8px 0',
                            fontSize: '12px',
                            fontWeight: activeTab === 'describe' ? '600' : '500',
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                        }}
                    >
                        Mô tả
                    </button>
                    <button
                        onClick={() => setActiveTab('occasion')}
                        style={{
                            flex: 1,
                            background: activeTab === 'occasion' ? 'var(--gold-primary)' : 'transparent',
                            color: activeTab === 'occasion' ? '#0F0B07' : '#94a3b8',
                            border: 'none',
                            borderRadius: '8px',
                            padding: '8px 0',
                            fontSize: '12px',
                            fontWeight: activeTab === 'occasion' ? '600' : '500',
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                        }}
                    >
                        Ngữ cảnh
                    </button>
                </div>
            </div>

            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                {activeTab === 'describe' && (
                    <div>
                        <div style={{
                            fontSize: '10px',
                            letterSpacing: '0.1em',
                            color: '#94a3b8',
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
                                background: 'rgba(255,255,255,0.05)',
                                border: '1px solid rgba(212,169,66,0.2)',
                                borderRadius: '12px',
                                padding: '12px 14px',
                                fontSize: '12px',
                                color: '#f8fafc',
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
                            color: '#94a3b8',
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
                                            background: isSelected ? 'rgba(212,169,66,0.15)' : 'rgba(255,255,255,0.03)',
                                            border: isSelected ? '1.5px solid var(--gold-primary)' : '1px solid rgba(255,255,255,0.1)',
                                            borderRadius: '10px',
                                            padding: '10px 12px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '8px',
                                            cursor: 'pointer',
                                            transition: 'all 0.18s ease',
                                            fontSize: '12px',
                                            color: isSelected ? 'var(--gold-primary)' : '#f8fafc',
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
                            color: '#94a3b8',
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
                                            background: isSelected ? 'rgba(212,169,66,0.15)' : 'rgba(255,255,255,0.05)',
                                            border: isSelected ? '1px solid var(--gold-primary)' : '1px solid rgba(255,255,255,0.1)',
                                            borderRadius: '20px',
                                            padding: '5px 14px',
                                            fontSize: '11px',
                                            color: isSelected ? 'var(--gold-primary)' : '#cbd5e1',
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
                    color: '#94a3b8',
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
                                    border: isSelected ? '2px solid var(--gold-primary)' : '2px solid rgba(255,255,255,0.2)',
                                    backgroundColor: color.hex,
                                    transform: isSelected ? 'scale(1.15)' : 'none',
                                    boxShadow: isSelected ? '0 0 0 2px rgba(212,169,66,0.2)' : '0 1px 3px rgba(0,0,0,0.3)',
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
                        color: '#94a3b8',
                        fontWeight: '500'
                    }}>
                        NGÂN SÁCH
                    </div>
                    <div style={{
                        background: 'rgba(212,169,66,0.15)',
                        border: '1px solid rgba(212,169,66,0.3)',
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
                marginTop: '16px',
                padding: '16px',
                borderTop: '1px solid rgba(212,169,66,0.1)',
            }}>
                <div style={{
                    fontSize: '11px',
                    color: '#94a3b8',
                    textAlign: 'center',
                    marginBottom: '10px',
                    opacity: 0.8
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
