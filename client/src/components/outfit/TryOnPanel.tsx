import { useState, useEffect, useMemo } from 'react';
import type { OutfitResult, OutfitItem } from '../../types/outfit';

interface TryOnPanelProps {
    isOpen: boolean;
    outfits: OutfitResult[];
    currentIndex: number;
    closetItems?: any[];
    onClose: () => void;
    onIndexChange: (index: number) => void;
    onUpdateItem: (outfitId: string, itemId: string, updates: Partial<OutfitItem>) => void;
    onAddToCart: (outfit: OutfitResult) => void;
    onBuyNow: (outfit: OutfitResult) => void;
    onTryOutfit?: (outfit: OutfitResult) => void;
}

export default function TryOnPanel({
    isOpen,
    outfits,
    currentIndex,
    closetItems = [],
    onClose,
    onIndexChange,
    onUpdateItem,
    onAddToCart,
    onBuyNow,
    onTryOutfit
}: TryOnPanelProps) {
    const [isAnimating, setIsAnimating] = useState(false);
    const [selectedForPurchase, setSelectedForPurchase] = useState<Record<string, boolean>>({});
    
    // Check if an item is owned based on current size/color variant
    const checkIsOwned = (item: OutfitItem) => {
        const size = item.selectedSize || item.suggestedSize || 'M';
        const color = item.selectedColor || item.color;
        // Find if this exact variant is in closet
        return closetItems.some(c => 
            String(c.productId) === String(item.id) && 
            c.size === size && 
            (c.colorHex === color || c.color === color)
        );
    };

    const outfit = outfits[currentIndex];

    // Initialize selection when outfit changes
    useEffect(() => {
        if (!outfit) return;
        const initialSelection: Record<string, boolean> = {};
        outfit.items.forEach(item => {
            const isOwned = checkIsOwned(item);
            initialSelection[item.id] = !isOwned;
        });
        setSelectedForPurchase(initialSelection);
    }, [outfit?.id, closetItems]);

    // Update selection dynamically when size or color changes
    useEffect(() => {
        if (!outfit) return;
        setSelectedForPurchase(prev => {
            const next = { ...prev };
            let changed = false;
            outfit.items.forEach(item => {
                const isOwned = checkIsOwned(item);
                // Only automatically uncheck if it becomes owned and was previously checked,
                // or check if it becomes unowned and was previously unchecked.
                // Wait, if user manually toggled, we might not want to override, 
                // but for simplicity we re-evaluate default if it changes status.
                const shouldBeSelected = !isOwned;
                if (isOwned && prev[item.id] === true) {
                    next[item.id] = false;
                    changed = true;
                } else if (!isOwned && prev[item.id] === false) {
                    next[item.id] = true;
                    changed = true;
                }
            });
            return changed ? next : prev;
        });
    }, [outfit, closetItems]);

    // Prevent rendering if not open and not animating
    if (!isOpen && !isAnimating) return null;
    if (!outfit) return null;

    const handleAnimationEnd = () => {
        if (!isOpen) {
            setIsAnimating(false);
        }
    };

    const togglePurchase = (itemId: string) => {
        setSelectedForPurchase(prev => ({ ...prev, [itemId]: !prev[itemId] }));
    };

    const isAllSelected = outfit.items.every(item => selectedForPurchase[item.id]);
    const toggleAllPurchase = () => {
        const nextState = !isAllSelected;
        const nextSelection: Record<string, boolean> = {};
        outfit.items.forEach(item => {
            nextSelection[item.id] = nextState;
        });
        setSelectedForPurchase(nextSelection);
    };

    const selectedItems = outfit.items.filter(item => selectedForPurchase[item.id]);
    const currentTotalPrice = selectedItems.reduce((sum, item) => sum + (item.price || 0), 0);

    const handleBuyAction = (action: (outfit: OutfitResult) => void) => {
        if (selectedItems.length === 0) {
            alert('Vui lòng chọn ít nhất 1 sản phẩm để mua!');
            return;
        }
        action({ ...outfit, items: selectedItems, totalPrice: currentTotalPrice });
    };

    return (
        <div 
            className={`tryon-panel-container ${isOpen ? 'open' : 'closed'}`}
            onAnimationEnd={handleAnimationEnd}
            style={{
                position: 'absolute',
                top: 0,
                right: 0,
                bottom: 0,
                width: '380px',
                background: 'var(--surface-elevated)',
                borderLeft: '1px solid var(--gold-divider)',
                zIndex: 50,
                display: 'flex',
                flexDirection: 'column',
                transform: isOpen ? 'translateX(0)' : 'translateX(100%)',
                transition: 'transform 250ms ease-in-out',
                boxShadow: '-8px 0 32px rgba(0,0,0,0.1)'
            }}
        >
            <style>{`
                @media (prefers-reduced-motion: reduce) {
                    .tryon-panel-container {
                        transition: none !important;
                    }
                }
                .top-item-card {
                    background: var(--surface-subtle);
                    border: 1px solid var(--gold-border);
                    border-radius: 12px;
                    padding: 12px;
                    margin-bottom: 12px;
                    position: relative;
                }
            `}</style>
            
            {/* Header */}
            <div style={{
                padding: '16px',
                borderBottom: '1px solid var(--gold-divider)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
            }}>
                <div>
                    <h3 style={{ margin: 0, fontSize: '16px', color: 'var(--text-primary)' }}>{outfit.name || `Outfit ${currentIndex + 1}`}</h3>
                    <div style={{ fontSize: '12px', color: 'var(--gold-primary)', fontWeight: '600', marginTop: '4px' }}>
                        {outfit.matchScore}% Phù hợp
                    </div>
                </div>
                
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    {/* Navigation */}
                    <div style={{ display: 'flex', background: 'var(--surface-subtle)', borderRadius: '20px', padding: '2px' }}>
                        <button 
                            onClick={() => onIndexChange(currentIndex > 0 ? currentIndex - 1 : outfits.length - 1)}
                            style={{ background: 'transparent', border: 'none', padding: '4px 8px', cursor: 'pointer', color: 'var(--text-secondary)' }}
                        >
                            ←
                        </button>
                        <span style={{ fontSize: '12px', padding: '4px 8px', color: 'var(--text-primary)' }}>
                            {currentIndex + 1} / {outfits.length}
                        </span>
                        <button 
                            onClick={() => onIndexChange((currentIndex + 1) % outfits.length)}
                            style={{ background: 'transparent', border: 'none', padding: '4px 8px', cursor: 'pointer', color: 'var(--text-secondary)' }}
                        >
                            →
                        </button>
                    </div>
                    
                    <button 
                        onClick={onClose}
                        style={{ background: 'transparent', border: 'none', fontSize: '20px', cursor: 'pointer', color: 'var(--text-secondary)' }}
                    >
                        ✕
                    </button>
                </div>
            </div>

            {/* Scrollable Content */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
                <div style={{ fontSize: '13px', fontWeight: '600', marginBottom: '12px', color: 'var(--text-primary)' }}>
                    Các món đồ trong Outfit
                </div>
                
                {outfit.items.map(item => {
                    const isOwned = checkIsOwned(item);
                    const isSelected = selectedForPurchase[item.id] || false;
                    
                    return (
                        <div key={item.id} className="top-item-card" style={{ border: isSelected ? '1px solid var(--gold-primary)' : '1px solid var(--gold-border)' }}>
                            <div style={{ display: 'flex', gap: '12px' }}>
                                {/* Checkbox & Thumbnail */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'center' }}>
                                    <input 
                                        type="checkbox" 
                                        checked={isSelected}
                                        onChange={() => togglePurchase(item.id)}
                                        style={{ cursor: 'pointer', width: '16px', height: '16px', accentColor: 'var(--gold-primary)' }}
                                    />
                                    <div style={{ width: '60px', height: '76px', borderRadius: '8px', overflow: 'hidden', background: 'var(--surface-card)', flexShrink: 0 }}>
                                        <img 
                                            src={item.imageUrl || (item as any).image || (item as any).thumbnail} 
                                            alt={item.name}
                                            style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: isSelected ? 1 : 0.6 }}
                                        />
                                    </div>
                                </div>
                                
                                {/* Details */}
                                <div style={{ flex: 1 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                        <div style={{ fontSize: '12px', fontWeight: '500', color: 'var(--text-primary)', marginBottom: '4px', paddingRight: '8px' }}>
                                            {item.name}
                                        </div>
                                        {isOwned && (
                                            <span style={{ background: '#ecfdf5', color: '#047857', padding: '2px 6px', borderRadius: '4px', fontSize: '10px', fontWeight: '600', whiteSpace: 'nowrap' }}>
                                                ✓ Đã có
                                            </span>
                                        )}
                                    </div>
                                    <div style={{ fontSize: '13px', fontWeight: '700', color: isSelected ? 'var(--gold-primary)' : 'var(--text-secondary)', marginBottom: '8px' }}>
                                        {typeof item.price === 'number' ? item.price.toLocaleString('vi-VN') + 'đ' : item.price}
                                    </div>
                                    
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                        {/* Color Picker */}
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <span style={{ fontSize: '11px', color: 'var(--text-secondary)', width: '30px' }}>Màu:</span>
                                            <div style={{ display: 'flex', gap: '6px' }}>
                                                {(item.availableColors && item.availableColors.length > 0 ? item.availableColors : ['#000000', '#ffffff', '#808080']).map((c: any, cIdx: number) => {
                                                    const hex = typeof c === 'string' ? c : (c.hex || '#ffffff');
                                                    const img = typeof c === 'string' ? null : c.image;
                                                    const label = typeof c === 'string' ? undefined : c.label;
                                                    
                                                    // Determine the internal "selected color" ID.
                                                    // In ProductDetail it uses colorName or colorHex, here we check hex or label.
                                                    const isColorSelected = (item.selectedColor || item.color) === hex || (label && (item.selectedColor || item.color) === label);
                                                    
                                                    return (
                                                        <div 
                                                            key={label || hex || cIdx}
                                                            title={label}
                                                            onClick={() => onUpdateItem(outfit.id, item.id, { selectedColor: label || hex })}
                                                            style={{ 
                                                                width: '20px', height: '20px', borderRadius: '50%', cursor: 'pointer',
                                                                background: img ? `url(${img}) center/cover` : hex,
                                                                border: isColorSelected ? '2px solid var(--gold-primary)' : '1px solid rgba(0,0,0,0.1)',
                                                                transform: isColorSelected ? 'scale(1.1)' : 'none'
                                                            }}
                                                        />
                                                    );
                                                })}
                                                {(!item.availableColors || item.availableColors.length === 0) && (
                                                    <input 
                                                        type="color" 
                                                        value={item.selectedColor || item.color || '#000000'}
                                                        onChange={(e) => onUpdateItem(outfit.id, item.id, { selectedColor: e.target.value })}
                                                        style={{ width: '22px', height: '22px', padding: 0, border: 'none', cursor: 'pointer', background: 'transparent' }}
                                                    />
                                                )}
                                            </div>
                                        </div>
                                        
                                        {/* Size Picker */}
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <span style={{ fontSize: '11px', color: 'var(--text-secondary)', width: '30px' }}>Size:</span>
                                            <select 
                                                value={item.selectedSize || item.suggestedSize || 'M'}
                                                onChange={(e) => onUpdateItem(outfit.id, item.id, { selectedSize: e.target.value })}
                                                style={{
                                                    background: 'var(--surface-card)',
                                                    border: '1px solid var(--gold-border)',
                                                    color: 'var(--text-primary)',
                                                    borderRadius: '4px',
                                                    padding: '4px 8px',
                                                    fontSize: '11px',
                                                    outline: 'none',
                                                }}
                                            >
                                                {(item.availableSizes || ['S', 'M', 'L', 'XL']).map(s => (
                                                    <option key={s} value={s}>{s} {item.suggestedSize === s ? '(AI Gợi ý)' : ''}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Footer */}
            <div style={{
                padding: '16px',
                borderTop: '1px solid var(--gold-divider)',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <input 
                        type="checkbox" 
                        id="selectAllItems"
                        checked={isAllSelected}
                        onChange={toggleAllPurchase}
                        style={{ cursor: 'pointer', width: '14px', height: '14px', accentColor: 'var(--gold-primary)' }}
                    />
                    <label htmlFor="selectAllItems" style={{ fontSize: '12px', color: 'var(--text-primary)', cursor: 'pointer', fontWeight: '500' }}>
                        Chọn tất cả ({selectedItems.length}/{outfit.items.length})
                    </label>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Tổng thanh toán</span>
                    <span style={{ fontSize: '16px', fontWeight: '700', color: 'var(--gold-primary)' }}>
                        {currentTotalPrice.toLocaleString('vi-VN')}đ
                    </span>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <button 
                        onClick={() => handleBuyAction(onAddToCart)}
                        style={{
                            flex: 1,
                            background: 'transparent',
                            border: '1px solid var(--gold-primary)',
                            color: 'var(--gold-primary)',
                            padding: '10px',
                            borderRadius: '8px',
                            fontWeight: '600',
                            fontSize: '13px',
                            cursor: 'pointer',
                            opacity: selectedItems.length === 0 ? 0.5 : 1
                        }}
                    >
                        Thêm giỏ hàng
                    </button>
                    {onTryOutfit && (
                        <button 
                            onClick={() => onTryOutfit(outfit)}
                            style={{
                                flex: 1,
                                background: '#10b981',
                                border: 'none',
                                color: '#fff',
                                padding: '10px',
                                borderRadius: '8px',
                                fontWeight: '600',
                                fontSize: '13px',
                                cursor: 'pointer'
                            }}
                        >
                            Mặc thử Outfit
                        </button>
                    )}
                    <button 
                        onClick={() => handleBuyAction(onBuyNow)}
                        style={{
                            flex: 1,
                            background: 'var(--gold-primary)',
                            border: 'none',
                            color: '#0F0B07',
                            padding: '10px',
                            borderRadius: '8px',
                            fontWeight: '600',
                            fontSize: '13px',
                            cursor: 'pointer',
                            opacity: selectedItems.length === 0 ? 0.5 : 1
                        }}
                    >
                        Mua ngay
                    </button>
                </div>
            </div>
        </div>
    );
}
