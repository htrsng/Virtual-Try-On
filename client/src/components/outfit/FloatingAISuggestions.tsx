import { useState } from 'react'
import { MessageCircle, X } from 'lucide-react'
import ResultPanel from './ResultPanel'
import type { OutfitResult, ChatMessage, ViewAngle, OutfitItem } from '../../types/outfit'

interface FloatingAISuggestionsProps {
    outfits: OutfitResult[]
    selectedOutfitId: string | null
    onSelectOutfit: (id: string) => void
    onTryItem: (item: OutfitItem) => void
    isGenerating: boolean
    messages: ChatMessage[]
    onSendMessage: (text: string) => void
    activeTab: 'describe' | 'occasion'
}

export default function FloatingAISuggestions({
    outfits,
    selectedOutfitId,
    onSelectOutfit,
    onTryItem,
    isGenerating,
    messages,
    onSendMessage,
    activeTab,
}: FloatingAISuggestionsProps) {
    const [isOpen, setIsOpen] = useState(false)

    if (isOpen) {
        return (
            <div style={{
                position: 'fixed',
                bottom: 16,
                right: 16,
                width: 420,
                height: '70vh',
                maxHeight: 'calc(100vh - 100px)',
                background: 'rgba(255,255,255,0.96)',
                border: '1px solid rgba(148,163,184,0.35)',
                borderRadius: 24,
                boxShadow: '0 20px 50px rgba(15,23,42,0.20)',
                backdropFilter: 'blur(18px)',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
                zIndex: 1000,
            }}>
                {/* Header */}
                <div style={{
                    padding: '12px 16px',
                    borderBottom: '1px solid rgba(226,232,240,0.9)',
                    background: 'rgba(255,255,255,0.65)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                }}>
                    <h3 style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', margin: 0 }}>AI Suggestions</h3>
                    <button
                        onClick={() => setIsOpen(false)}
                        style={{
                            background: 'transparent',
                            border: 'none',
                            color: '#475569',
                            cursor: 'pointer',
                            fontSize: 18,
                            padding: 4,
                        }}
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div style={{ flex: 1, overflow: 'hidden' }}>
                    <ResultPanel
                        outfits={outfits}
                        selectedOutfitId={selectedOutfitId}
                        onSelectOutfit={onSelectOutfit}
                        onTryItem={onTryItem}
                        isGenerating={isGenerating}
                        messages={messages}
                        onSendMessage={onSendMessage}
                        activeTab={activeTab}
                    />
                </div>
            </div>
        )
    }

    // Floating button (closed state)
    return (
        <button
            onClick={() => setIsOpen(true)}
            style={{
                position: 'fixed',
                bottom: 24,
                right: 24,
                width: 60,
                height: 60,
                borderRadius: '50%',
                background: '#10b981',
                border: 'none',
                color: '#fff',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 8px 24px rgba(16,185,129,0.32)',
                transition: 'transform 0.2s ease',
                zIndex: 1000,
            }}
            onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.1)')}
            onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
        >
            <MessageCircle size={24} />
        </button>
    )
}
