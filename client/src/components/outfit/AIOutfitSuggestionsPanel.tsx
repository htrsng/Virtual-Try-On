import { X } from 'lucide-react'
import ResultPanel from './ResultPanel'
import type { OutfitResult, ChatMessage, OutfitItem } from '../../types/outfit'

interface AIOutfitSuggestionsPanelProps {
    isOpen: boolean
    onClose: () => void
    outfits: OutfitResult[]
    selectedOutfitId: string | null
    onSelectOutfit: (id: string) => void
    onWearSet: (outfit: OutfitResult) => void
    onTryItem: (item: OutfitItem) => void
    isGenerating: boolean
    messages: ChatMessage[]
    onSendMessage: (text: string) => void
    activeTab?: 'describe' | 'occasion'
    fallbackMode?: boolean
}

export default function AIOutfitSuggestionsPanel({
    isOpen,
    onClose,
    outfits,
    selectedOutfitId,
    onSelectOutfit,
    onWearSet,
    onTryItem,
    isGenerating,
    messages,
    onSendMessage,
    activeTab = 'describe',
    fallbackMode = false,
}: AIOutfitSuggestionsPanelProps) {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#fff', overflow: 'hidden' }}>
            <div style={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>
                <ResultPanel
                    outfits={outfits}
                    selectedOutfitId={selectedOutfitId}
                    onSelectOutfit={onSelectOutfit}
                    onTryItem={onTryItem}
                    isGenerating={isGenerating}
                    messages={messages}
                    onSendMessage={onSendMessage}
                    activeTab={activeTab}
                    fallbackMode={fallbackMode}
                />
            </div>
        </div>
    )
}
