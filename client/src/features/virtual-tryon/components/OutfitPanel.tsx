import { useMemo, useState } from 'react';
import type { SilentWearItem } from '../../../contexts/FittingRoomContext';

type OutfitSlots = Partial<Record<'tops' | 'bottoms' | 'outerwear' | 'dresses', SilentWearItem>>;

type OutfitPanelProps = {
    layeredGarments: OutfitSlots;
    onSave: (name: string) => Promise<void> | void;
};

export default function OutfitPanel({ layeredGarments, onSave }: OutfitPanelProps) {
    const [isExpanded, setIsExpanded] = useState(false);
    const [showPrompt, setShowPrompt] = useState(false);
    const [name, setName] = useState('');

    const slotEntries = useMemo(() => (
        [
            ['tops', 'Áo'],
            ['bottoms', 'Quần'],
            ['outerwear', 'Khoác'],
            ['dresses', 'Váy'],
        ] as const
    ), []);

    const handleConfirm = async () => {
        await onSave(name.trim() || 'Outfit chưa đặt tên');
        setName('');
        setShowPrompt(false);
        setIsExpanded(false);
    };

    if (!isExpanded) {
        return (
            <button
                type="button"
                className="vto-outfit-fab"
                data-testid="save-outfit-btn"
                aria-label="Mở lưu outfit"
                title="Lưu outfit"
                onClick={() => setIsExpanded(true)}
            >
                <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true">
                    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                </svg>
            </button>
        );
    }

    return (
        <div className="vto-outfit-panel">
            <button
                type="button"
                className="vto-outfit-panel__collapse"
                aria-label="Thu gọn lưu outfit"
                title="Thu gọn"
                onClick={() => {
                    setShowPrompt(false);
                    setIsExpanded(false);
                }}
            >
                ×
            </button>

            <div className="vto-outfit-panel__slots">
                {slotEntries.map(([slot, label]) => {
                    const item = layeredGarments[slot];
                    return (
                        <div key={slot} className="vto-outfit-panel__slot">
                            <span className="vto-outfit-panel__slot-label">{label}</span>
                            {item ? (
                                <div className="vto-outfit-panel__item">
                                    {item.thumbnail ? (
                                        <img src={item.thumbnail} alt={item.name} className="vto-outfit-panel__thumb" />
                                    ) : (
                                        <span className="vto-outfit-panel__placeholder">+</span>
                                    )}
                                    <span className="vto-outfit-panel__name">{item.name}</span>
                                </div>
                            ) : (
                                <span className="vto-outfit-panel__placeholder">+</span>
                            )}
                        </div>
                    );
                })}
            </div>

            {!showPrompt ? (
                <button
                    type="button"
                    className="vto-outfit-panel__save"
                    data-testid="save-outfit-btn"
                    onClick={() => setShowPrompt(true)}
                >
                    Lưu outfit
                </button>
            ) : (
                <div className="vto-outfit-panel__prompt">
                    <input
                        data-testid="outfit-name-input"
                        type="text"
                        value={name}
                        onChange={(event) => setName(event.target.value)}
                        placeholder="Tên outfit"
                    />
                    <button
                        type="button"
                        data-testid="confirm-save-btn"
                        onClick={handleConfirm}
                    >
                        Xác nhận
                    </button>
                </div>
            )}
        </div>
    );
}
