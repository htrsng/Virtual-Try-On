import { useState } from 'react';
import './ClosetItemCard.css';

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

    const purchasedColorObj = item.availableColors?.find(
        (c: any) =>
            c.value === item.purchasedColor ||
            c.name === item.purchasedColor ||
            c.hex === item.purchasedColor,
    );

    const displayColorHex = purchasedColorObj?.hex ?? purchasedColorObj?.value ?? item.purchasedColor ?? null;
    const displayColorName = purchasedColorObj?.name ?? item.purchasedColor ?? null;
    const displaySize = item.purchasedSize ?? null;

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
        setTimeout(() => setWearing(false), 2500);
    };

    const handleCancel = (e: React.MouseEvent) => {
        sp(e);
        setOpen(false);
        setColor(item.purchasedColor ?? '');
        setSize(item.purchasedSize ?? '');
    };

    return (
        <article
            className={[
                'cic',
                open ? 'cic--open' : '',
                wearing ? 'cic--wearing' : '',
            ].filter(Boolean).join(' ')}
            data-testid="closet-item"
        >
            {/* ─── IMAGE ZONE ─── */}
            <div
                className="cic__img-wrap"
                onClick={e => { sp(e); if (hasPicker) setOpen(v => !v); }}
                role="button"
                tabIndex={0}
                aria-label={`Xem tùy chọn cho ${item.name}`}
            >
                {imgSrc ? (
                    <img className="cic__img" src={imgSrc} alt={item.name} loading="lazy" />
                ) : (
                    <div className="cic__img-ph">
                        <span>👕</span>
                    </div>
                )}

                {/* overlay top row */}
                <div className="cic__overlay-top">
                    {/* "Đã Mua" badge */}
                    <span className="cic__badge-bought">✓ Đã mua</span>

                    {/* Worn count */}
                    {(item.wornCount ?? 0) > 0 && (
                        <span className="cic__badge-worn">{item.wornCount}× đã thử</span>
                    )}
                </div>

                {/* match score bottom left */}
                {typeof matchScore === 'number' && matchScore >= 50 && (
                    <span className="cic__badge-match">{matchScore}% phù hợp</span>
                )}

                {/* wearing overlay */}
                {wearing && (
                    <div className="cic__wearing-overlay">
                        <span>✦ Đang mặc</span>
                    </div>
                )}

                {/* expand hint */}
                {hasPicker && !wearing && (
                    <span className="cic__hint">{open ? '▲ Thu' : '▼ Chọn size'}</span>
                )}
            </div>

            {/* ─── INFO ZONE ─── */}
            <div className="cic__info">
                <p className="cic__name" title={item.name}>{item.name}</p>

                {/* size + color row — always visible */}
                <div className="cic__attrs">
                    {displaySize ? (
                        <span className="cic__attr cic__attr--size">
                            <span className="cic__attr-label">SIZE</span>
                            <span className="cic__attr-val">{displaySize}</span>
                        </span>
                    ) : (
                        <span className="cic__attr cic__attr--size cic__attr--empty">
                            <span className="cic__attr-label">SIZE</span>
                            <span className="cic__attr-val">—</span>
                        </span>
                    )}

                    {displayColorHex || displayColorName ? (
                        <span className="cic__attr cic__attr--color">
                            {displayColorHex && (
                                <span
                                    className="cic__color-swatch"
                                    style={{ background: displayColorHex }}
                                    title={displayColorName ?? ''}
                                />
                            )}
                            <span className="cic__attr-val">{displayColorName ?? displayColorHex}</span>
                        </span>
                    ) : (
                        <span className="cic__attr cic__attr--color cic__attr--empty">
                            <span className="cic__attr-val">—</span>
                        </span>
                    )}
                </div>
            </div>

            {/* ─── PICKER ZONE (expands when open) ─── */}
            {open && (
                <div className="cic__picker">
                    {hasColors && (
                        <div className="cic__picker-row">
                            <span className="cic__picker-label">Màu</span>
                            <div className="cic__color-list">
                                {item.availableColors!.map((c: any) => {
                                    const isPurchased =
                                        c.value === item.purchasedColor ||
                                        c.name === item.purchasedColor;
                                    const isSelected = color === c.value || color === c.name;
                                    return (
                                        <button
                                            key={c.value}
                                            className={[
                                                'cic__cdot',
                                                isSelected ? 'cic__cdot--on' : '',
                                                isPurchased ? 'cic__cdot--bought' : '',
                                            ].filter(Boolean).join(' ')}
                                            style={{ background: c.hex ?? c.value }}
                                            title={`${c.name}${isPurchased ? ' ★ đã mua' : ''}`}
                                            onClick={e => { sp(e); setColor(c.value); }}
                                            data-testid="color-dot"
                                        >
                                            {isPurchased && <span className="cic__cdot-check">✓</span>}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {hasSizes && (
                        <div className="cic__picker-row">
                            <span className="cic__picker-label">Size</span>
                            <div className="cic__size-list">
                                {item.availableSizes!.map((s: any) => {
                                    const isPurchased = s === item.purchasedSize;
                                    const isSelected = size === s;
                                    return (
                                        <button
                                            key={s}
                                            className={[
                                                'cic__sbtn',
                                                isSelected ? 'cic__sbtn--on' : '',
                                                isPurchased ? 'cic__sbtn--bought' : '',
                                            ].filter(Boolean).join(' ')}
                                            onClick={e => { sp(e); setSize(s); }}
                                            data-testid="size-btn"
                                            title={isPurchased ? `${s} — size đã mua` : s}
                                        >
                                            {s}
                                            {isPurchased && <span className="cic__sbtn-star">★</span>}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* ─── ACTION ZONE ─── */}
            <div className="cic__actions">
                {wearing ? (
                    <>
                        <div className="cic__btn cic__btn--worn">✓ Đang mặc</div>
                        <button
                            className="cic__btn cic__btn--detail"
                            onClick={e => { sp(e); onViewDetails?.(item); }}
                        >
                            Chi tiết
                        </button>
                    </>
                ) : open ? (
                    <>
                        <button className="cic__btn cic__btn--confirm" onClick={doWear} data-testid="confirm-wear-btn">
                            Mặc lên →
                        </button>
                        <button className="cic__btn cic__btn--cancel" onClick={handleCancel}>Huỷ</button>
                    </>
                ) : (
                    <>
                        <button className="cic__btn cic__btn--wear" onClick={handleWearBtn} data-testid="wear-btn">
                            👗 Wear
                        </button>
                        <button
                            className="cic__btn cic__btn--detail"
                            onClick={e => { sp(e); onViewDetails?.(item); }}
                            data-testid="detail-btn"
                        >
                            Chi tiết
                        </button>
                    </>
                )}
            </div>
        </article>
    );
}
