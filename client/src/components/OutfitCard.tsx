import { useState } from 'react';
import { useFittingRoom, type SilentWearItem } from '../contexts/FittingRoomContext';
import type { AIOutfit } from '../types/aiOutfit';

interface OutfitCardProps {
    outfit: AIOutfit;
    onWear?: (outfit: AIOutfit) => void;
}

export default function OutfitCard({ outfit, onWear }: OutfitCardProps) {
    const { applyFullOutfit } = useFittingRoom();
    const [isApplying, setIsApplying] = useState(false);

    const handleWearOutfit = async () => {
        setIsApplying(true);

        try {
            // Map outfit items to SilentWearItem format
            const silentWearItems: Array<Omit<SilentWearItem, 'updatedAt'>> = outfit.items.map(
                (item) => {
                    // Map AI source values into the SilentWearItem accepted union
                    let mappedSource: 'order' | 'fallback' | 'import' | undefined;
                    if (item.source === 'order') mappedSource = 'order';
                    else if (item.source === 'import') mappedSource = 'import';
                    else mappedSource = 'fallback';

                    return {
                        itemId: item.productId,
                        productId: item.productId,
                        name: item.name,
                        category: mapLayerToCategory(item.layer),
                        purchasedSize: 'M', // Default size, could be customized
                        purchasedColor: '#000', // Default color
                        thumbnail: item.thumbnail,
                        source: mappedSource || (item.type === 'closet' ? 'order' : 'fallback'),
                        model3D: item.model3DUrl ? { url: item.model3DUrl } : undefined,
                    };
                }
            );

            // Apply all items at once
            applyFullOutfit(silentWearItems);

            onWear?.(outfit);

            // Show brief visual feedback
            setTimeout(() => {
                setIsApplying(false);
            }, 300);
        } catch (err) {
            console.error('Error wearing outfit:', err);
            setIsApplying(false);
        }
    };

    const closetItems = outfit.items.filter((item) => item.type === 'closet');
    const shopItems = outfit.items.filter((item) => item.type === 'shop');

    return (
        <div className="outfit-card">
            {/* Card Header */}
            <div className="outfit-card-header">
                <h3 className="outfit-card-title">{outfit.name}</h3>
                {outfit.occasion && (
                    <span className="outfit-card-occasion">{outfit.occasion}</span>
                )}
            </div>

            {/* Items Grid */}
            <div className="outfit-card-items">
                {outfit.items.slice(0, 3).map((item, idx) => (
                    <div key={`${outfit.id}-${idx}`} className="outfit-item">
                        {/* Thumbnail */}
                        <div className="outfit-item-thumbnail">
                            {item.thumbnail ? (
                                <img src={item.thumbnail} alt={item.name} />
                            ) : (
                                <div className="outfit-item-placeholder">Ảnh</div>
                            )}

                            {/* Type Badge */}
                            {item.type === 'closet' ? (
                                <span className="outfit-item-badge closet">✓ Có</span>
                            ) : (
                                <span className="outfit-item-badge shop">+ Mua</span>
                            )}
                        </div>

                        {/* Item Info */}
                        <div className="outfit-item-info">
                            <p className="outfit-item-name">{item.name}</p>
                            {item.price && (
                                <p className="outfit-item-price">
                                    {new Intl.NumberFormat('vi-VN', {
                                        style: 'currency',
                                        currency: 'VND',
                                    }).format(item.price)}
                                </p>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* Summary */}
            {outfit.items.length > 3 && (
                <p className="outfit-card-summary">
                    +{outfit.items.length - 3} sản phẩm khác
                </p>
            )}

            {/* Footer Stats */}
            <div className="outfit-card-footer">
                <div className="outfit-card-stats">
                    <span className="outfit-stat">
                        <span className="outfit-stat-badge closet-small">✓</span>
                        {closetItems.length}
                    </span>
                    {shopItems.length > 0 && (
                        <span className="outfit-stat">
                            <span className="outfit-stat-badge shop-small">+</span>
                            {shopItems.length}
                        </span>
                    )}
                </div>

                {/* Wear All Button */}
                <button
                    className={`outfit-card-wear-btn ${isApplying ? 'applying' : ''}`}
                    onClick={handleWearOutfit}
                    disabled={isApplying}
                    title="Áp dụng toàn bộ phối đồ"
                >
                    {isApplying ? '⏳' : '👗'} Thử Set
                </button>
            </div>

            <style>{`
        .outfit-card {
          background: white;
          border: 1px solid #e8e4df;
          border-radius: 6px;
          overflow: hidden;
          transition: all 0.2s ease;
          display: flex;
          flex-direction: column;
        }

        .outfit-card:hover {
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
          border-color: #ddd;
        }

        .outfit-card-header {
          padding: 12px;
          background: linear-gradient(135deg, #fafaf8 0%, #f5f1e8 100%);
          border-bottom: 1px solid #e8e4df;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .outfit-card-title {
          margin: 0;
          font-size: 13px;
          font-weight: 600;
          color: #333;
        }

        .outfit-card-occasion {
          font-size: 11px;
          color: #999;
          background: white;
          padding: 2px 6px;
          border-radius: 3px;
          border: 1px solid #e8e4df;
        }

        .outfit-card-items {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 8px;
          padding: 8px;
          border-bottom: 1px solid #f0ede8;
          min-height: 100px;
        }

        .outfit-item {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .outfit-item-thumbnail {
          position: relative;
          width: 100%;
          aspect-ratio: 1;
          background: #f5f1e8;
          border: 1px solid #e8e4df;
          border-radius: 4px;
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .outfit-item-thumbnail img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .outfit-item-placeholder {
          font-size: 10px;
          color: #ccc;
          font-weight: 500;
        }

        .outfit-item-badge {
          position: absolute;
          top: 4px;
          right: 4px;
          font-size: 10px;
          padding: 2px 4px;
          border-radius: 2px;
          font-weight: 600;
        }

        .outfit-item-badge.closet {
          background: #d4edda;
          color: #155724;
          border: 0.5px solid #c3e6cb;
        }

        .outfit-item-badge.shop {
          background: #fff3cd;
          color: #856404;
          border: 0.5px solid #ffeaa7;
        }

        .outfit-item-info {
          padding: 2px 0;
        }

        .outfit-item-name {
          margin: 0;
          font-size: 10px;
          color: #666;
          line-height: 1.2;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .outfit-item-price {
          margin: 0;
          font-size: 9px;
          color: #ee4d2d;
          font-weight: 600;
        }

        .outfit-card-summary {
          padding: 0 8px;
          margin: 0;
          font-size: 11px;
          color: #999;
          text-align: center;
        }

        .outfit-card-footer {
          padding: 8px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 8px;
          background: #fafaf8;
        }

        .outfit-card-stats {
          display: flex;
          gap: 8px;
          font-size: 11px;
          color: #666;
        }

        .outfit-stat {
          display: flex;
          align-items: center;
          gap: 2px;
        }

        .outfit-stat-badge {
          width: 16px;
          height: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          font-size: 10px;
          font-weight: 600;
          color: white;
        }

        .outfit-stat-badge.closet-small {
          background: #28a745;
        }

        .outfit-stat-badge.shop-small {
          background: #ffc107;
          color: #333;
        }

        .outfit-card-wear-btn {
          flex-shrink: 0;
          padding: 6px 10px;
          background: linear-gradient(135deg, #ee4d2d 0%, #e63921 100%);
          color: white;
          border: none;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          white-space: nowrap;
        }

        .outfit-card-wear-btn:hover:not(:disabled) {
          background: linear-gradient(135deg, #f5623f 0%, #ee4d2d 100%);
          box-shadow: 0 2px 6px rgba(238, 77, 45, 0.3);
        }

        .outfit-card-wear-btn:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .outfit-card-wear-btn.applying {
          background: linear-gradient(135deg, #d63d26 0%, #c4321f 100%);
        }
      `}</style>
        </div>
    );
}

function mapLayerToCategory(layer: string): 'tops' | 'bottoms' | 'outerwear' | 'dresses' {
    switch (layer) {
        case 'tops':
            return 'tops';
        case 'bottoms':
            return 'bottoms';
        case 'outerwear':
            return 'outerwear';
        case 'shoes':
            return 'bottoms'; // Default to bottoms for shoes
        case 'dresses':
            return 'dresses';
        default:
            return 'tops';
    }
}
