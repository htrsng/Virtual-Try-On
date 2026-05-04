import { useState } from 'react';

export interface ClosetItemData {
    itemId?: string;
    productId?: string;
    name: string;
    thumbnailUrl?: string;
    imageUrl?: string;
    img?: string;
    purchasedColor?: string;
    purchasedSize?: string;
    availableColors?: { name: string; value: string; hex?: string }[];
    availableSizes?: string[];
    wornCount?: number;
    slotCategory?: string;
    purchasedAt?: string;
}

interface Props {
    item: any;
    matchScore?: number;
    onWear: (item: any, color: string, size: string) => void;
    onViewDetails?: (item: any) => void;
}

export default function VirtualClosetItem({ item, matchScore, onWear, onViewDetails }: Props) {
    const [open, setOpen] = useState(false);
    const [wearing, setWearing] = useState(false);
    const [color, setColor] = useState(item.purchasedColor ?? '');
    const [size, setSize] = useState(item.purchasedSize ?? '');

    const imgSrc = item.thumbnailUrl || item.imageUrl || item.img || '';
    const hasColors = (item.availableColors?.length ?? 0) > 0;
    const hasSizes = (item.availableSizes?.length ?? 0) > 0;
    const hasPicker = hasColors || hasSizes;

    const sp = (e: React.MouseEvent) => { e.preventDefault(); e.stopPropagation(); };

    const handleWearBtn = (e: React.MouseEvent) => {
        sp(e);
        if (hasPicker && !open) { setOpen(true); return; }
        doWear(e);
    };

    const doWear = (e: React.MouseEvent) => {
        sp(e);
        onWear(item, color || item.purchasedColor || '', size || item.purchasedSize || '');
        setOpen(false);
        setWearing(true);
        setTimeout(() => setWearing(false), 3000);
    };

    const handleCancel = (e: React.MouseEvent) => {
        sp(e);
        setOpen(false);
        setColor(item.purchasedColor ?? '');
        setSize(item.purchasedSize ?? '');
    };

    return (
        <div className={`ci${open ? ' ci--open' : ''}${wearing ? ' ci--wearing' : ''}`}
            data-testid="closet-item">

            {/* ── ẢNH ── */}
            <div className="ci-img" onClick={e => { sp(e); if (hasPicker) setOpen(v => !v); }}>
                {imgSrc
                    ? <img src={imgSrc} alt={item.name} loading="lazy" />
                    : <div className="ci-ph">👕</div>
                }
                {/* Badge match */}
                {typeof matchScore === 'number' && matchScore >= 50 && (
                    <span className="ci-bm" data-testid="match-badge">{matchScore}%</span>
                )}
                {/* Badge worn */}
                {(item.wornCount ?? 0) > 0 && (
                    <span className="ci-bw" data-testid="worn-badge">{item.wornCount}×</span>
                )}
                {/* Hint */}
                {hasPicker && !wearing && (
                    <span className="ci-hint">{open ? '▲' : '▼'}</span>
                )}
            </div>

            {/* ── INFO ── */}
            <div className="ci-info">
                <p className="ci-name" title={item.name}>{item.name}</p>
                <p className="ci-meta">
                    {size || item.purchasedSize || ''}
                    {(color || item.purchasedColor) ? ` · ${color || item.purchasedColor}` : ''}
                </p>
            </div>

            {/* ── PICKER 2 DÒNG — chỉ hiện khi open ── */}
            {open && (
                <div className="ci-picker">
                    {hasColors && (
                        <div className="ci-row">
                            <span className="ci-key">Màu</span>
                            <div className="ci-colors">
                                {item.availableColors!.map((c: any) => (
                                    <button
                                        key={c.value}
                                        className={`ci-dot${color === c.value || color === c.name ? ' ci-dot--on' : ''}`}
                                        style={{ background: c.hex ?? c.value }}
                                        title={c.name}
                                        onClick={e => { sp(e); setColor(c.value); }}
                                        data-testid="color-dot"
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                    {hasSizes && (
                        <div className="ci-row">
                            <span className="ci-key">Size</span>
                            <div className="ci-sizes">
                                {item.availableSizes!.map((s: any) => (
                                    <button
                                        key={s}
                                        className={[
                                            'ci-sz',
                                            size === s ? 'ci-sz--on' : '',
                                            s === item.purchasedSize ? 'ci-sz--bought' : '',
                                        ].filter(Boolean).join(' ')}
                                        onClick={e => { sp(e); setSize(s); }}
                                        data-testid="size-btn"
                                    >
                                        {s}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* ── ACTIONS ── */}
            <div className="ci-acts">
                {wearing ? (
                    <>
                        <div className="ci-btn ci-worn">Đang mặc ✓</div>
                        <button className="ci-btn ci-detail" onClick={e => { sp(e); onViewDetails?.(item); }}>Chi tiết</button>
                    </>
                ) : open ? (
                    <>
                        <button className="ci-btn ci-confirm" onClick={doWear} data-testid="confirm-wear-btn">Mặc lên</button>
                        <button className="ci-btn ci-cancel" onClick={handleCancel}>Huỷ</button>
                    </>
                ) : (
                    <>
                        <button className="ci-btn ci-wear" onClick={handleWearBtn} data-testid="wear-btn">Wear</button>
                        <button className="ci-btn ci-detail" onClick={e => { sp(e); onViewDetails?.(item); }} data-testid="detail-btn">Chi tiết</button>
                    </>
                )}
            </div>
        </div>
    );
}
