import { useEffect, useState } from 'react';
import type { OutfitResult, OutfitItem } from '../../types/outfit';

interface OutfitCardProps {
    outfit: OutfitResult;
    isSelected: boolean;
    index: number;
    onSelect: (id: string) => void;
    onTryItem: (item: OutfitItem) => void;
    isLocalFallback?: boolean;
}

export default function OutfitCard({
    outfit,
    isSelected,
    index,
    onSelect,
    onTryItem,
    isLocalFallback = false,
}: OutfitCardProps) {
    const [expanded, setExpanded] = useState(isSelected);

    useEffect(() => {
        setExpanded(isSelected);
    }, [isSelected]);

    const items = outfit.items ?? [];
    const totalCount = items.length;
    const ownedCount = items.filter((item) => item.owned).length;
    const shopCount = items.filter((item) => item.source === 'shop').length;
    const totalBuyPrice = items.filter((item) => item.source === 'shop').reduce((sum, item) => sum + (item.price ?? 0), 0);

    const score = outfit.matchScore ?? 0;
    const scoreColor = score >= 90 ? '#639922' : score >= 75 ? '#EF9F27' : '#9ca3af';

    return (
        <div
            style={{
                border: isSelected ? '1.5px solid #1a1a1a' : '0.5px solid #e5e7eb',
                borderRadius: 12,
                overflow: 'hidden',
                background: '#fff',
                flexShrink: 0,
            }}
        >
            <div
                onClick={() => {
                    setExpanded((current) => !current);
                    onSelect(outfit.id);
                }}
                style={{
                    padding: '10px 12px',
                    background: isSelected ? '#f9fafb' : '#fff',
                    borderBottom: '0.5px solid #f3f4f6',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    cursor: 'pointer',
                    gap: 10,
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0, flex: 1 }}>
                    <span style={{
                        width: 20,
                        height: 20,
                        borderRadius: '50%',
                        background: '#1a1a1a',
                        color: '#fff',
                        fontSize: 10,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 500,
                        flexShrink: 0,
                    }}>
                        {index + 1}
                    </span>
                    <span style={{
                        fontSize: 13,
                        fontWeight: 500,
                        minWidth: 0,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'normal',
                        lineHeight: 1.35,
                        display: '-webkit-box',
                        WebkitBoxOrient: 'vertical',
                        WebkitLineClamp: 2,
                    }}>
                        {outfit.name}
                    </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                    {isLocalFallback && (
                        <span style={{ fontSize: 9, padding: '2px 6px', borderRadius: 10, background: '#f3f4f6', color: '#6b7280' }}>
                            Nội bộ
                        </span>
                    )}
                    <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 10, background: '#ede9fe', color: '#5b21b6' }}>
                        {outfit.occasion || 'Outfit'}
                    </span>
                    <span style={{ fontSize: 12, color: '#9ca3af' }}>{expanded ? '▲' : '▼'}</span>
                </div>
            </div>

            <div style={{ padding: '8px 12px 0' }}>
                <div style={{ height: 4, background: '#e5e7eb', borderRadius: 999, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${Math.min(99, Math.max(0, score))}%`, background: scoreColor }} />
                </div>
            </div>

            {expanded && (
                <>
                    <div style={{ padding: '6px 12px', background: '#f9fafb', borderBottom: '0.5px solid #f3f4f6', fontSize: 11, color: '#6b7280', display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                        <span>🧺 Có {ownedCount}/{totalCount} món</span>
                        <span>🛒 Cần mua: {totalBuyPrice.toLocaleString('vi-VN')}đ</span>
                    </div>

                    <div>
                        {items.map((item, itemIndex) => (
                            <div
                                key={`${outfit.id}-${itemIndex}`}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onTryItem(item);
                                }}
                                style={{
                                    display: 'flex',
                                    gap: 10,
                                    alignItems: 'flex-start',
                                    padding: '10px 12px',
                                    borderBottom: '0.5px solid #f9fafb',
                                    cursor: 'pointer',
                                }}
                            >
                                <div style={{ width: 56, height: 56, borderRadius: 8, overflow: 'hidden', flexShrink: 0, background: '#f3f4f6', position: 'relative' }}>
                                    {item.imageUrl ? (
                                        <img
                                            src={item.imageUrl}
                                            alt={item.name}
                                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                            loading="lazy"
                                            onError={(e) => {
                                                (e.currentTarget as HTMLImageElement).src = '/placeholder.png';
                                            }}
                                        />
                                    ) : (
                                        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: '#9ca3af' }}>Ảnh</div>
                                    )}
                                </div>

                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{
                                        fontSize: 12,
                                        fontWeight: 500,
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        whiteSpace: 'normal',
                                        lineHeight: 1.35,
                                        display: '-webkit-box',
                                        WebkitBoxOrient: 'vertical',
                                        WebkitLineClamp: 2,
                                        color: '#111',
                                    }}>
                                        {item.name}
                                    </div>
                                    <div style={{ fontSize: 11, color: '#6b7280', marginTop: 2 }}>
                                        {(item.price ?? 0).toLocaleString('vi-VN')}đ
                                    </div>
                                    <div style={{ display: 'flex', gap: 4, marginTop: 4, flexWrap: 'wrap' }}>
                                        {item.suggestedSize && (
                                            <span title={item.sizeReason || ''} style={{ fontSize: 9, padding: '2px 6px', borderRadius: 8, background: '#14532d', color: '#fff', fontWeight: 500 }}>
                                                Size {item.suggestedSize}
                                            </span>
                                        )}
                                        <span style={{ fontSize: 9, padding: '2px 6px', borderRadius: 8, background: item.owned ? '#dcfce7' : '#fff7ed', color: item.owned ? '#166534' : '#c2410c' }}>
                                            {item.owned ? '✓ Đã có trong tủ' : '🛒 Cần mua'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {outfit.aiReason && (
                        <div
                            onClick={(e) => {
                                e.stopPropagation();
                                setExpanded((current) => current);
                            }}
                            style={{ margin: '0 12px 12px', background: '#f0fdf4', border: '0.5px solid #bbf7d0', borderRadius: 8, padding: 10, fontSize: 11, color: '#166534' }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <span>AI gợi ý</span>
                            </div>
                            <div style={{ marginTop: 8, fontSize: 10, lineHeight: 1.5 }}>{outfit.aiReason}</div>
                        </div>
                    )}

                    <div style={{ padding: '10px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, borderTop: '0.5px solid #e5e7eb', background: '#f9fafb', flexWrap: 'wrap', fontSize: 12, color: '#64748b' }}>
                        <div>
                            Tổng: {outfit.totalPrice.toLocaleString('vi-VN')}đ
                        </div>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onTryItem(items[0] ?? (null as unknown as OutfitItem));
                            }}
                            style={{ padding: '8px 12px', borderRadius: 8, border: '0.5px solid #e5e7eb', background: '#1a1a1a', color: '#fff', cursor: 'pointer', fontSize: 11, fontWeight: 500 }}
                        >
                            👕 Thử bộ
                        </button>
                    </div>
                </>
            )}
        </div>
    );
}
