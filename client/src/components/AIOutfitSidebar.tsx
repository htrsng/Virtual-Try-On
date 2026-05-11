import React, { useState, useRef } from 'react';
import type { AIOutfit } from '../types/aiOutfit';
import OutfitCard from './OutfitCard.tsx';

const RAW_API_URL = import.meta.env.VITE_API_URL || '';
const API_BASE_URL = RAW_API_URL.trim().replace(/\/$/, '');
const AI_OUTFIT_SUGGEST_ENDPOINT = API_BASE_URL
    ? `${API_BASE_URL}/api/ai/outfit-suggest`
    : '/api/ai/outfit-suggest';

export default function AIOutfitSidebar() {
    const [prompt, setPrompt] = useState('');
    const [outfits, setOutfits] = useState<AIOutfit[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const suggestionsRef = useRef<HTMLDivElement>(null);

    const handleGenerateOutfits = async () => {
        if (!prompt.trim()) {
            setError('Vui lòng nhập yêu cầu phối đồ');
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            const token = localStorage.getItem('token') || sessionStorage.getItem('token');

            if (!token) {
                setError('Vui lòng đăng nhập để sử dụng AI Stylist');
                setIsLoading(false);
                return;
            }

            const response = await fetch(AI_OUTFIT_SUGGEST_ENDPOINT, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    userPrompt: prompt,
                    includeClosetItems: true,
                    includeNewArrivals: true,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || `API Error: ${response.status}`);
            }

            const data = await response.json();

            // Transform API response to AIOutfit format
            const transformedOutfits: AIOutfit[] = (data.outfits || []).map(
                (outfit: any, index: number) => ({
                    id: `outfit-${Date.now()}-${index}`,
                    name: outfit.name || `Phối Đồ ${index + 1}`,
                    description: outfit.description,
                    occasion: outfit.occasion,
                    items: (outfit.items || []).map((item: any) => ({
                        productId: item.productId || item.id,
                        type: item.type || 'shop',
                        layer: item.layer || 'tops',
                        model3DUrl: item.model3DUrl || '',
                        thumbnail: item.thumbnail || item.image || '',
                        name: item.name || '',
                        price: item.price,
                        source: item.source,
                    })),
                })
            );

            setOutfits(transformedOutfits);

            // Scroll to suggestions
            setTimeout(() => {
                suggestionsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 200);
        } catch (err) {
            console.error('AI Outfit Generation Error:', err);
            setError(err instanceof Error ? err.message : 'Không thể tạo gợi ý phối đồ');
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && !isLoading) {
            handleGenerateOutfits();
        }
    };

    return (
        <div className="ai-outfit-sidebar">
            {/* Header */}
            <div className="ai-outfit-header">
                <h2 className="ai-outfit-title">✨ AI Phối Đồ</h2>
                <p className="ai-outfit-subtitle">Nhập yêu cầu phối đồ của bạn</p>
            </div>

            {/* Suggestions List */}
            <div
                ref={suggestionsRef}
                className="ai-outfit-suggestions"
                style={{
                    flex: 1,
                    overflowY: 'auto',
                    padding: '16px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px',
                }}
            >
                {outfits.length === 0 && !isLoading && (
                    <div className="ai-outfit-empty">
                        <p style={{ color: '#999', textAlign: 'center', fontSize: '13px' }}>
                            Nhập yêu cầu để bắt đầu tạo gợi ý phối đồ
                        </p>
                    </div>
                )}

                {outfits.map((outfit) => (
                    <OutfitCard
                        key={outfit.id}
                        outfit={outfit}
                        onWear={() => {
                            console.log('Wear outfit:', outfit.name);
                        }}
                    />
                ))}

                {isLoading && (
                    <div className="ai-outfit-loading">
                        <div className="spinner"></div>
                        <p>Đang tạo gợi ý...</p>
                    </div>
                )}

                {error && (
                    <div className="ai-outfit-error">
                        <p>{error}</p>
                        <button
                            className="ai-outfit-error-dismiss"
                            onClick={() => setError(null)}
                        >
                            ✕
                        </button>
                    </div>
                )}
            </div>

            {/* Input Section */}
            <div className="ai-outfit-input-section">
                <input
                    type="text"
                    className="ai-outfit-input"
                    placeholder="VD: Phối đồ đi Đà Lạt mùa đông..."
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    onKeyPress={handleKeyPress}
                    disabled={isLoading}
                />
                <button
                    className="ai-outfit-submit-btn"
                    onClick={handleGenerateOutfits}
                    disabled={isLoading}
                >
                    {isLoading ? '⏳' : '→'}
                </button>
            </div>

            <style>{`
        .ai-outfit-sidebar {
          display: flex;
          flex-direction: column;
          height: 100%;
          background: linear-gradient(135deg, #ffffff 0%, #f9f7f4 100%);
          border-left: 1px solid #e8e4df;
        }

        .ai-outfit-header {
          padding: 16px;
          border-bottom: 1px solid #e8e4df;
          background: linear-gradient(135deg, #fafaf8 0%, #f5f1e8 100%);
        }

        .ai-outfit-title {
          margin: 0 0 4px 0;
          font-size: 16px;
          font-weight: 600;
          color: #333;
        }

        .ai-outfit-subtitle {
          margin: 0;
          font-size: 12px;
          color: #999;
        }

        .ai-outfit-suggestions {
          background: transparent;
        }

        .ai-outfit-empty {
          display: flex;
          align-items: center;
          justify-content: center;
          flex: 1;
          min-height: 150px;
        }

        .ai-outfit-loading {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 24px;
          gap: 8px;
        }

        .spinner {
          width: 28px;
          height: 28px;
          border: 2px solid #e8e4df;
          border-top-color: #ee4d2d;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }

        .ai-outfit-loading p {
          font-size: 13px;
          color: #666;
          margin: 0;
        }

        .ai-outfit-error {
          background: #fff3cd;
          border: 1px solid #ffc107;
          border-radius: 6px;
          padding: 12px;
          position: relative;
          font-size: 12px;
          color: #856404;
        }

        .ai-outfit-error-dismiss {
          position: absolute;
          top: 8px;
          right: 8px;
          background: none;
          border: none;
          cursor: pointer;
          color: #856404;
          font-size: 14px;
          padding: 0;
        }

        .ai-outfit-input-section {
          display: flex;
          gap: 8px;
          padding: 12px;
          border-top: 1px solid #e8e4df;
          background: #fafaf8;
        }

        .ai-outfit-input {
          flex: 1;
          padding: 10px 12px;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 13px;
          font-family: inherit;
          outline: none;
          transition: border-color 0.2s;
        }

        .ai-outfit-input:focus {
          border-color: #ee4d2d;
        }

        .ai-outfit-input:disabled {
          background-color: #f5f5f5;
          color: #999;
          cursor: not-allowed;
        }

        .ai-outfit-submit-btn {
          width: 40px;
          height: 40px;
          padding: 0;
          border: 1px solid #ee4d2d;
          background: #ee4d2d;
          color: white;
          border-radius: 4px;
          cursor: pointer;
          font-size: 18px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background-color 0.2s, opacity 0.2s;
          font-weight: 500;
        }

        .ai-outfit-submit-btn:hover:not(:disabled) {
          background-color: #d63d26;
        }

        .ai-outfit-submit-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
      `}</style>
        </div>
    );
}
