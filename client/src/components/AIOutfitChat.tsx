import { useState, useRef } from 'react';
import './AIOutfitChat.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

interface OutfitItem {
    itemId?: string;
    productId?: number;
    name: string;
    slot: string;
    reason: string;
    source: 'closet' | 'shop';
    price?: number;
}

interface AIResult {
    outfit: OutfitItem[];
    suggestions: OutfitItem[];
    explanation: string;
    occasion?: string;
    weatherTip?: string;
}

interface Props {
    closetItems: any[];
    avatarData: any;
    token?: string;
    onWearOutfit: (items: OutfitItem[]) => void;
    onAddToCart: (productId: number) => void;
}

export default function AIOutfitChat({ closetItems, avatarData, token, onWearOutfit, onAddToCart }: Props) {
    const [open, setOpen] = useState(false);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<AIResult | null>(null);
    const [error, setError] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);

    const QUICK_PROMPTS = [
        'Đi làm sáng mai 🏢',
        'Đi cafe cuối tuần ☕',
        'Hẹn hò tối nay 🌙',
        'Đi biển ngày nóng 🏖️',
        'Ở nhà chill 🏠',
        'Dự tiệc quan trọng 🎉',
    ];

    const handleAsk = async (prompt?: string) => {
        const q = (prompt ?? input).trim();
        if (!q) return;

        const authToken =
            token ||
            localStorage.getItem('token') ||
            localStorage.getItem('accessToken') ||
            localStorage.getItem('authToken') ||
            localStorage.getItem('jwt') ||
            sessionStorage.getItem('token') ||
            '';

        console.log('Token khi gọi AI:', authToken);
        console.log('Token type:', typeof authToken);

        if (!authToken) {
            setError('Vui lòng đăng nhập để sử dụng AI Stylist');
            return;
        }

        setLoading(true);
        setResult(null);
        setError('');

        try {
            const res = await fetch(`${API_URL}/api/ai/outfit-suggest`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${authToken}`
                },
                body: JSON.stringify({
                    userPrompt: q,
                    closetItems: closetItems?.slice(0, 10) ?? [],
                    avatarData: avatarData ?? {}
                })
            });

            if (res.status === 401) {
                setError('Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.');
                return;
            }

            const data = await res.json();

            if (!res.ok) {
                setError(data.error ?? 'Có lỗi xảy ra');
                return;
            }

            setResult(data);

            // Tự động mặc đồ từ tủ lên avatar
            const closetOutfit = (data.outfit ?? []).filter((i: OutfitItem) => i.source === 'closet');
            if (closetOutfit.length > 0) onWearOutfit(closetOutfit);

        } catch (e) {
            setError('Không kết nối được AI. Vui lòng thử lại.');
        } finally {
            setLoading(false);
            setInput('');
        }
    };

    // Slot icon
    const slotIcon = (slot: string) => ({
        tops: '👕', bottoms: '👖', dress: '👗', outerwear: '🧥'
    }[slot] ?? '👔');

    const outfitItems = result?.outfit ?? [];
    const suggestionItems = result?.suggestions ?? [];

    return (
        <>
            {/* Nút mở chat — floating góc dưới trái canvas */}
            <button
                className={`ai-chat-fab ${open ? 'ai-chat-fab--open' : ''}`}
                onClick={() => setOpen(v => !v)}
                title="Hỏi AI Stylist"
            >
                {open ? '✕' : '✦'}
            </button>

            {/* Panel chat */}
            {open && (
                <div className="ai-chat-panel">
                    <div className="ai-chat-header">
                        <span className="ai-chat-title">✦ AI Stylist</span>
                        <span className="ai-chat-sub">Hỏi tôi muốn mặc gì hôm nay</span>
                    </div>

                    {/* Quick prompts */}
                    {!result && !loading && (
                        <div className="ai-quick-prompts">
                            {QUICK_PROMPTS.map(p => (
                                <button
                                    key={p}
                                    className="ai-quick-btn"
                                    onClick={() => handleAsk(p)}
                                >
                                    {p}
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Loading */}
                    {loading && (
                        <div className="ai-loading">
                            <div className="ai-loading-dots">
                                <span /><span /><span />
                            </div>
                            <p>AI đang phân tích tủ đồ...</p>
                        </div>
                    )}

                    {/* Error */}
                    {error && (
                        <div className="ai-error">
                            ⚠️ {error}
                            <button onClick={() => setError('')}>Thử lại</button>
                        </div>
                    )}

                    {/* Result */}
                    {result && (
                        <div className="ai-result">
                            {/* Explanation */}
                            <div className="ai-explanation">
                                <span className="ai-explanation-icon">✦</span>
                                {result.explanation}
                            </div>

                            {/* Đồ từ tủ */}
                            {outfitItems.length > 0 && (
                                <div className="ai-section">
                                    <div className="ai-section-title">Từ tủ đồ của bạn</div>
                                    {outfitItems.map((item, i) => (
                                        <div key={i} className="ai-item ai-item--closet">
                                            <span className="ai-item-icon">{slotIcon(item.slot)}</span>
                                            <div className="ai-item-info">
                                                <div className="ai-item-name">{item.name}</div>
                                                <div className="ai-item-reason">{item.reason}</div>
                                            </div>
                                            <span className="ai-item-badge ai-item-badge--closet">Tủ đồ ✓</span>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Gợi ý mua thêm */}
                            {suggestionItems.length > 0 && (
                                <div className="ai-section">
                                    <div className="ai-section-title">Gợi ý mua thêm</div>
                                    {suggestionItems.map((item, i) => (
                                        <div key={i} className="ai-item ai-item--shop">
                                            <span className="ai-item-icon">{slotIcon(item.slot)}</span>
                                            <div className="ai-item-info">
                                                <div className="ai-item-name">{item.name}</div>
                                                <div className="ai-item-reason">{item.reason}</div>
                                                {item.price && (
                                                    <div className="ai-item-price">
                                                        {item.price.toLocaleString('vi-VN')}đ
                                                    </div>
                                                )}
                                            </div>
                                            <button
                                                className="ai-item-add-btn"
                                                onClick={() => item.productId && onAddToCart(item.productId)}
                                            >
                                                + Giỏ
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Weather tip */}
                            {result.weatherTip && (
                                <div className="ai-weather-tip">🌤️ {result.weatherTip}</div>
                            )}

                            {/* Hỏi lại */}
                            <button className="ai-ask-again" onClick={() => setResult(null)}>
                                Hỏi lại ↩
                            </button>
                        </div>
                    )}

                    {/* Input */}
                    <div className="ai-chat-input-wrap">
                        <input
                            ref={inputRef}
                            className="ai-chat-input"
                            value={input}
                            onChange={e => setInput(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleAsk()}
                            placeholder="Hôm nay tôi muốn mặc gì?"
                            disabled={loading}
                        />
                        <button
                            className="ai-chat-send"
                            onClick={() => handleAsk()}
                            disabled={loading || !input.trim()}
                        >
                            {loading ? '...' : '↑'}
                        </button>
                    </div>
                </div>
            )}
        </>
    );
}
