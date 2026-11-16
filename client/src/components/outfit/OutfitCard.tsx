import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { OutfitResult, OutfitItem } from '../../types/outfit';

interface OutfitCardProps {
    outfit: OutfitResult;
    isSelected: boolean;
    index: number;
    onSelect: (id: string) => void;
    onTryItem: (item: OutfitItem) => void;
    isLocalFallback?: boolean;
    onUpdateItem?: (outfitId: string, itemId: string, updates: Partial<OutfitItem>) => void;
    onOpenTryonPanel?: (outfitId: string) => void;
}

export default function OutfitCard({
    outfit,
    isSelected,
    index,
    onSelect,
    onTryItem,
    isLocalFallback = false,
    onUpdateItem,
    onOpenTryonPanel,
}: OutfitCardProps) {
    const [expanded, setExpanded] = useState(isSelected);
    const [isLoadingSession, setIsLoadingSession] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        setExpanded(isSelected);
    }, [isSelected]);

    const items = outfit.items ?? (outfit as any).products ?? [];
    const rawScore = outfit.matchScore ?? (outfit as any).score ?? 0;
    const score = Math.round(parseFloat(String(rawScore)) || 0);
    
    let scoreColor = 'var(--text-secondary)';
    let scoreFill = 'var(--text-secondary)';
    if (score >= 90) {
        scoreColor = '#4CAF50';
        scoreFill = 'linear-gradient(90deg, #4CAF50, #81C784)';
    } else if (score >= 70) {
        scoreColor = 'var(--gold-primary)';
        scoreFill = 'linear-gradient(90deg, var(--gold-primary), #E8B84B)';
    }

    return (
        <div
            className={`outfit-card ${isSelected ? 'selected' : ''}`}
            onClick={() => onSelect(outfit.id)}
            style={{
                position: 'relative',
                background: 'var(--surface-card)',
                border: isSelected ? '1.5px solid var(--gold-primary)' : '1px solid var(--gold-border)',
                borderRadius: '14px',
                overflow: 'hidden',
                transition: 'transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s',
                cursor: 'pointer',
                boxShadow: isSelected ? '0 0 0 3px var(--gold-light)' : 'none',
                flexShrink: 0,
            }}
        >
            <style>{`
                .outfit-card:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 8px 24px rgba(201,150,63,0.1);
                    border-color: var(--gold-primary);
                }
                .ai-reason-content {
                    max-height: 0;
                    overflow: hidden;
                    transition: max-height 0.25s ease;
                }
                .ai-reason-content.expanded {
                    max-height: 200px;
                }
                .oc-color-swatch {
                    width: 18px;
                    height: 18px;
                    border-radius: 50%;
                    cursor: pointer;
                    border: 1px solid rgba(0,0,0,0.1);
                    display: inline-block;
                }
                .oc-color-swatch.selected {
                    border: 2px solid var(--gold-primary);
                    transform: scale(1.1);
                }
                .oc-size-select {
                    background: var(--surface-card);
                    border: 1px solid var(--gold-border);
                    color: var(--text-secondary);
                    border-radius: 4px;
                    padding: 2px 6px;
                    font-size: 10px;
                    outline: none;
                }
            `}</style>

            {isSelected && (
                <div style={{
                    position: 'absolute',
                    top: '8px',
                    right: '8px',
                    background: 'var(--gold-primary)',
                    color: '#0F0B07',
                    borderRadius: '6px',
                    padding: '2px 8px',
                    fontSize: '9px',
                    fontWeight: '700',
                    letterSpacing: '0.06em',
                    zIndex: 2
                }}>
                    ĐANG XEM
                </div>
            )}

            <div style={{ padding: '12px 14px 10px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                    <div style={{
                        display: 'inline-block',
                        background: 'var(--gold-light)',
                        border: '1px solid var(--gold-border)',
                        borderRadius: '6px',
                        padding: '2px 8px',
                        fontSize: '10px',
                        color: 'var(--gold-primary)',
                        fontWeight: '600'
                    }}>
                        Outfit {index + 1}
                    </div>
                    {outfit.name && (
                        <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)', marginTop: '4px' }}>
                            {outfit.name}
                        </div>
                    )}
                    {/* Mini product thumbnails */}
                    <div style={{
                        display: 'flex',
                        gap: '4px',
                        marginTop: '8px',
                    }}>
                        {items.slice(0, 3).map((p: any, i: number) => {
                            const pImage = p.image || p.thumbnail || p.img || p.imageUrl || p.images?.[0];
                            return (
                                <div key={i} style={{
                                    width: '36px',
                                    height: '44px',
                                    borderRadius: '6px',
                                    overflow: 'hidden',
                                    background: 'var(--gold-light)',
                                    border: '1px solid var(--gold-border)',
                                    flexShrink: 0,
                                }}>
                                    {pImage && (
                                        <img
                                            src={pImage}
                                            alt=""
                                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                        />
                                    )}
                                </div>
                            );
                        })}
                        {items.length > 3 && (
                            <div style={{
                                width: '36px', height: '44px',
                                borderRadius: '6px',
                                background: 'var(--gold-light)',
                                border: '1px solid var(--gold-border)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: '10px', color: 'var(--gold-primary)', fontWeight: '600',
                            }}>
                                +{items.length - 3}
                            </div>
                        )}
                    </div>
                </div>
                {!isSelected && (
                    <div style={{ fontSize: '13px', fontWeight: '700', color: scoreColor }}>
                        {score}%
                    </div>
                )}
                {isSelected && <div style={{ width: 60 }} />}
            </div>

            <div style={{ margin: '0 14px 10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ fontSize: '10px', color: 'var(--text-secondary)', letterSpacing: '0.06em', minWidth: '28px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span style={{ color: 'var(--gold-primary)' }}>⭐</span> ĐỘ PHÙ HỢP
                </div>
                <div style={{ flex: 1, height: '6px', background: 'var(--gold-light)', borderRadius: '3px', position: 'relative', overflow: 'hidden' }}>
                    <div style={{
                        position: 'absolute',
                        left: 0,
                        top: 0,
                        height: '6px',
                        borderRadius: '3px',
                        background: scoreFill,
                        width: `${score}%`,
                        transition: 'width 0.6s ease 0.1s'
                    }} />
                </div>
                <div style={{ fontSize: '11px', fontWeight: '700', color: scoreColor }}>{score}%</div>
            </div>

            <div style={{ padding: '0 14px 10px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {items.map((item, i) => {
                    const isCloset = item.source === 'closet' || item.owned || (item as any).fromCloset || (item as any).inCloset;
                    const itemImage = (item as any).image || (item as any).thumbnail || (item as any).img || (item as any).imageUrl || (item as any).images?.[0];
                    return (
                        <div
                            key={i}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '10px',
                                padding: '8px 10px',
                                background: 'var(--surface-subtle)',
                                borderRadius: '10px',
                                marginBottom: '6px',
                                cursor: 'pointer',
                                transition: 'background 0.15s',
                            }}
                            onMouseEnter={e => e.currentTarget.style.background = 'var(--gold-light)'}
                            onMouseLeave={e => e.currentTarget.style.background = 'var(--surface-subtle)'}
                            onClick={(e) => {
                                e.stopPropagation();
                                onTryItem(item);
                            }}
                        >
                            {/* THUMBNAIL */}
                            <div style={{
                                width: '56px',
                                height: '68px',
                                flexShrink: 0,
                                borderRadius: '8px',
                                overflow: 'hidden',
                                background: 'var(--surface-card)',
                                border: '1px solid var(--gold-border)',
                            }}>
                                {itemImage ? (
                                    <img
                                        src={itemImage}
                                        alt={item.name}
                                        style={{
                                            width: '100%',
                                            height: '100%',
                                            objectFit: 'cover',
                                            display: 'block',
                                        }}
                                        onError={e => {
                                            e.currentTarget.style.display = 'none';
                                            if (e.currentTarget.parentElement) {
                                                e.currentTarget.parentElement.style.background = 'var(--gold-light)';
                                            }
                                        }}
                                    />
                                ) : (
                                    <div style={{
                                        width: '100%', height: '100%',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontSize: '18px', opacity: 0.3,
                                    }}>
                                        👕
                                    </div>
                                )}
                            </div>

                            {/* PRODUCT INFO */}
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{
                                    fontSize: '11px',
                                    fontWeight: '500',
                                    color: 'var(--text-primary)',
                                    lineHeight: '1.4',
                                    display: '-webkit-box',
                                    WebkitLineClamp: 2,
                                    WebkitBoxOrient: 'vertical',
                                    overflow: 'hidden',
                                    marginBottom: '4px',
                                }}>
                                    {item.name}
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', flexWrap: 'wrap' }}>
                                    {isCloset ? (
                                        <span style={{
                                            background: 'rgba(76,175,80,0.1)',
                                            border: '1px solid rgba(76,175,80,0.3)',
                                            color: '#4CAF50',
                                            borderRadius: '4px',
                                            padding: '1px 6px',
                                            fontSize: '9px',
                                            fontWeight: '600',
                                            letterSpacing: '0.04em',
                                        }}>TỦ ĐỒ ✓</span>
                                    ) : (
                                        <span style={{
                                            background: 'var(--gold-light)',
                                            border: '1px solid var(--gold-border)',
                                            color: 'var(--gold-primary)',
                                            borderRadius: '4px',
                                            padding: '1px 6px',
                                            fontSize: '9px',
                                            fontWeight: '500',
                                        }}>Mua mới</span>
                                    )}
                                </div>
                                {isSelected && (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '6px', flexWrap: 'wrap' }}>
                                        {/* Color Selector */}
                                        <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                                            {(() => {
                                                let colorsToRender = item.availableColors;
                                                const itemName = (item.name || '').toLowerCase();
                                                
                                                if (itemName.includes('áo')) {
                                                    colorsToRender = ['#f5f5f5', '#222222', '#47484c', '#d4c3a3']; // Trắng, Đen, Xám, Kaki
                                                } else if (itemName.includes('quần')) {
                                                    colorsToRender = ['#222222']; // Đen
                                                }

                                                const finalColors = (colorsToRender || ['#000000', '#ffffff', '#808080']).map((c: any) => typeof c === 'string' ? c : c.hex).filter(Boolean);
                                                
                                                return finalColors.map((c: string) => (
                                                    <div
                                                        key={c}
                                                        className={`oc-color-swatch ${item.selectedColor === c || (!item.selectedColor && item.color === c) ? 'selected' : ''}`}
                                                        style={{ background: c }}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            onUpdateItem?.(outfit.id, item.id, { selectedColor: c });
                                                        }}
                                                    />
                                                ));
                                            })()}
                                            {/* fallback color picker if availableColors is just fake */}
                                            {!(item.name?.toLowerCase().includes('áo') || item.name?.toLowerCase().includes('quần')) && (
                                                <input 
                                                    type="color" 
                                                    value={item.selectedColor || item.color || '#000000'}
                                                    onChange={(e) => {
                                                        onUpdateItem?.(outfit.id, item.id, { selectedColor: e.target.value });
                                                    }}
                                                    onClick={e => e.stopPropagation()}
                                                    style={{ width: '20px', height: '20px', padding: 0, border: 'none', cursor: 'pointer', background: 'transparent' }}
                                                />
                                            )}
                                        </div>
                                        {/* Size Selector */}
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                            <select 
                                                className="oc-size-select"
                                                value={item.selectedSize || item.suggestedSize || 'M'}
                                                onChange={(e) => {
                                                    onUpdateItem?.(outfit.id, item.id, { selectedSize: e.target.value });
                                                }}
                                                onClick={e => e.stopPropagation()}
                                            >
                                                {(item.availableSizes || ['S', 'M', 'L', 'XL']).map((s: string) => (
                                                    <option key={s} value={s}>{s}</option>
                                                ))}
                                            </select>
                                            <span style={{ fontSize: '9px', color: 'var(--gold-primary)', background: 'var(--gold-light)', padding: '2px 4px', borderRadius: '4px' }}>AI Gợi ý</span>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* PRICE + ACTION */}
                            <div style={{
                                flexShrink: 0,
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'flex-end',
                                gap: '6px',
                            }}>
                                {item.price && (
                                    <span style={{
                                        fontSize: '12px',
                                        fontWeight: '700',
                                        color: 'var(--gold-primary)',
                                        whiteSpace: 'nowrap',
                                    }}>
                                        {typeof item.price === 'number'
                                            ? item.price.toLocaleString('vi-VN') + 'đ'
                                            : item.price}
                                    </span>
                                )}
                                <div style={{ display: 'flex', gap: '4px' }}>
                                        <button
                                            onClick={e => {
                                                e.stopPropagation();
                                                onTryItem(item);
                                            }}
                                            style={{
                                                background: 'var(--gold-primary)',
                                                border: '1px solid var(--gold-primary)',
                                                borderRadius: '6px',
                                                padding: '3px 8px',
                                                fontSize: '9px',
                                                fontWeight: '600',
                                                color: '#0F0B07',
                                                cursor: 'pointer',
                                                whiteSpace: 'nowrap',
                                                transition: 'all 0.15s',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '4px'
                                            }}
                                            onMouseEnter={e => {
                                                e.currentTarget.style.opacity = '0.9';
                                            }}
                                            onMouseLeave={e => {
                                                e.currentTarget.style.opacity = '1';
                                            }}
                                        >
                                            <span>✨</span> Thử ngay
                                        </button>
                                    <button
                                        onClick={e => {
                                            e.stopPropagation();
                                            const productId = (item as any)._id || item.id || (item as any).productId;
                                            if (productId) {
                                                window.open(`/product/${productId}`, '_blank');
                                            }
                                        }}
                                        style={{
                                            background: 'transparent',
                                            border: '1px solid var(--gold-border)',
                                            borderRadius: '6px',
                                            padding: '3px 8px',
                                            fontSize: '9px',
                                            color: 'var(--gold-primary)',
                                            cursor: 'pointer',
                                            whiteSpace: 'nowrap',
                                            transition: 'all 0.15s',
                                        }}
                                        onMouseEnter={e => {
                                            e.currentTarget.style.background = 'var(--gold-primary)';
                                            e.currentTarget.style.color = '#0F0B07';
                                        }}
                                        onMouseLeave={e => {
                                            e.currentTarget.style.background = 'transparent';
                                            e.currentTarget.style.color = 'var(--gold-primary)';
                                        }}
                                    >
                                        Xem →
                                    </button>
                                </div>
                            </div>
                        </div>
                    )
                })}
            </div>

            {isSelected && (
                <div style={{ borderTop: '1px solid var(--gold-divider)', padding: '12px 14px' }}>
                    <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
                        <div style={{ fontSize: '16px' }}>✨</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-primary)', lineHeight: 1.5, fontStyle: 'italic', opacity: 0.9 }}>
                            "Với phong cách Casual và ngân sách 2 triệu, tôi đề xuất outfit này vì sự thoải mái và phù hợp hoàn hảo."
                        </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <div style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ color: 'var(--gold-primary)' }}>✓</span> Hợp dáng người
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ color: 'var(--gold-primary)' }}>✓</span> Hợp ngân sách
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ color: 'var(--gold-primary)' }}>✓</span> Đúng phong cách
                        </div>
                    </div>
                    {outfit.aiReason && (
                        <div style={{ marginTop: '10px', fontSize: '11px', color: 'var(--text-secondary)', lineHeight: 1.5, opacity: 0.8, paddingTop: '10px', borderTop: '1px dashed var(--gold-border)' }}>
                            {outfit.aiReason}
                        </div>
                    )}
                </div>
            )}
            
            {/* Try Entire Outfit Banner */}
            {isSelected && outfit.items?.length > 0 && (
                <div style={{ padding: '0 14px 14px' }}>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onOpenTryonPanel?.(outfit.id);
                        }}
                        style={{
                            width: '100%',
                            background: 'linear-gradient(135deg, var(--gold-primary) 0%, #B8860B 100%)',
                            color: '#0F0B07',
                            border: 'none',
                            borderRadius: '8px',
                            padding: '10px',
                            fontSize: '13px',
                            fontWeight: '700',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px',
                            transition: 'all 0.2s ease',
                            boxShadow: '0 4px 12px rgba(212,169,66,0.3)'
                        }}
                    >
                        <>
                            <span style={{ fontSize: '16px' }}>👕</span> Thử cả bộ Outfit này
                        </>
                    </button>
                </div>
            )}
        </div>
    );
}
