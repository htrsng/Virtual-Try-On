import React from 'react';
import { useFittingRoom, type GarmentSlot } from '../../contexts/FittingRoomContext';

export default function OutfitColorPicker() {
    const { layeredGarments, applySilentWear } = useFittingRoom();

    const handleColorChange = (slot: GarmentSlot, color: string) => {
        const garment = layeredGarments[slot];
        if (garment) {
            applySilentWear({
                ...garment,
                purchasedColor: color,
            });
        }
    };

    const handleSaveToCloset = async (slot: GarmentSlot) => {
        const garment = layeredGarments[slot];
        if (!garment) return;
        
        // This is a placeholder for the actual API call
        console.log('Lưu vào tủ đồ:', {
            itemId: garment.itemId,
            size: garment.purchasedSize,
            color: garment.purchasedColor,
        });
        alert(`Đã lưu ${garment.name} vào tủ đồ!`);
    };

    const handleAddToCart = async (slot: GarmentSlot) => {
        const garment = layeredGarments[slot];
        if (!garment) return;
        
        // This is a placeholder for the actual API call
        console.log('Thêm vào giỏ hàng:', {
            itemId: garment.itemId,
            variantId: `${garment.purchasedSize}-${garment.purchasedColor}`,
        });
        alert(`Đã thêm ${garment.name} vào giỏ hàng!`);
    };

    const activeGarments = Object.entries(layeredGarments).filter(
        ([_, garment]) => garment && garment.model3D
    ) as [GarmentSlot, NonNullable<typeof layeredGarments[GarmentSlot]>][];

    if (activeGarments.length === 0) {
        return null;
    }

    return (
        <div className="outfit-color-picker-panel">
            <h4 className="ocp-title">Tuỳ chỉnh Outfit</h4>
            <div className="ocp-items">
                {activeGarments.map(([slot, garment]) => (
                    <div key={slot} className="ocp-item">
                        <div className="ocp-item-info">
                            <span className="ocp-item-name">{garment.name}</span>
                            {garment.purchasedSize && (
                                <span className="ocp-item-size">Size: {garment.purchasedSize}</span>
                            )}
                        </div>
                        
                        <div className="ocp-item-controls">
                            <label className="ocp-color-label">
                                <input
                                    type="color"
                                    value={garment.purchasedColor || '#000000'}
                                    onChange={(e) => handleColorChange(slot, e.target.value)}
                                    className="ocp-color-input"
                                />
                                <span className="ocp-color-hex">{garment.purchasedColor || '#000000'}</span>
                            </label>
                            
                            <div className="ocp-actions">
                                <button 
                                    onClick={() => handleSaveToCloset(slot)}
                                    className="ocp-btn ocp-btn-save"
                                    title="Lưu vào tủ đồ"
                                >
                                    💾 Lưu
                                </button>
                                <button 
                                    onClick={() => handleAddToCart(slot)}
                                    className="ocp-btn ocp-btn-cart"
                                    title="Thêm vào giỏ hàng"
                                >
                                    🛒 Mua
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <style>{`
                .outfit-color-picker-panel {
                    position: absolute;
                    bottom: 20px;
                    right: 20px;
                    background: rgba(33, 28, 23, 0.95);
                    border: 1px solid rgba(200, 168, 103, 0.3);
                    border-radius: 12px;
                    padding: 16px;
                    width: 280px;
                    backdrop-filter: blur(10px);
                    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
                    z-index: 100;
                    color: white;
                }

                .ocp-title {
                    margin: 0 0 12px 0;
                    font-size: 14px;
                    font-weight: 600;
                    color: rgba(200, 168, 103, 0.9);
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
                    padding-bottom: 8px;
                }

                .ocp-items {
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                    max-height: 300px;
                    overflow-y: auto;
                    scrollbar-width: thin;
                    scrollbar-color: rgba(200,168,103,0.5) transparent;
                }

                .ocp-item {
                    background: rgba(255, 255, 255, 0.05);
                    border-radius: 8px;
                    padding: 10px;
                    border: 1px solid rgba(255, 255, 255, 0.05);
                }

                .ocp-item-info {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 8px;
                }

                .ocp-item-name {
                    font-size: 12px;
                    font-weight: 500;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    max-width: 160px;
                }

                .ocp-item-size {
                    font-size: 10px;
                    background: rgba(200, 168, 103, 0.2);
                    color: #f5d9a0;
                    padding: 2px 6px;
                    border-radius: 4px;
                }

                .ocp-item-controls {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }

                .ocp-color-label {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    cursor: pointer;
                }

                .ocp-color-input {
                    -webkit-appearance: none;
                    -moz-appearance: none;
                    appearance: none;
                    width: 24px;
                    height: 24px;
                    background: transparent;
                    border: none;
                    cursor: pointer;
                    padding: 0;
                }

                .ocp-color-input::-webkit-color-swatch-wrapper {
                    padding: 0;
                }

                .ocp-color-input::-webkit-color-swatch {
                    border: 2px solid rgba(255,255,255,0.2);
                    border-radius: 4px;
                }

                .ocp-color-hex {
                    font-size: 11px;
                    font-family: monospace;
                    color: rgba(255, 255, 255, 0.6);
                }

                .ocp-actions {
                    display: flex;
                    gap: 6px;
                }

                .ocp-btn {
                    background: transparent;
                    border: 1px solid rgba(255,255,255,0.1);
                    color: rgba(255,255,255,0.8);
                    border-radius: 4px;
                    padding: 4px 8px;
                    font-size: 11px;
                    cursor: pointer;
                    transition: all 0.2s;
                }

                .ocp-btn:hover {
                    background: rgba(255,255,255,0.1);
                    color: white;
                }

                .ocp-btn-save:hover {
                    border-color: rgba(200, 168, 103, 0.6);
                    color: #f5d9a0;
                }

                .ocp-btn-cart:hover {
                    background: rgba(238, 77, 45, 0.2);
                    border-color: rgba(238, 77, 45, 0.5);
                    color: #ff9d8a;
                }
            `}</style>
        </div>
    );
}
