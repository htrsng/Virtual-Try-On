import type { OutfitResult, OutfitItem, ChatMessage } from '../../types/outfit'
import OutfitCard from './OutfitCard'
import ChatBox from './ChatBox'

interface ResultPanelProps {
  outfits: OutfitResult[]
  selectedOutfitId: string | null
  onSelectOutfit: (id: string) => void
  onTryItem: (item: OutfitItem) => void
  isGenerating: boolean
  messages: ChatMessage[]
  onSendMessage: (text: string) => void
  activeTab: 'describe' | 'occasion'
  fallbackMode?: boolean
}

export default function ResultPanel({
  outfits,
  selectedOutfitId,
  onSelectOutfit,
  onTryItem,
  isGenerating,
  messages,
  onSendMessage,
  activeTab,
  fallbackMode = false,
}: ResultPanelProps) {
  const panelStyle: React.CSSProperties = {
    width: '100%',
    height: '100%',
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    borderLeft: '0.5px solid #e5e7eb',
    background: '#fff',
    overflow: 'hidden',
    minHeight: 0,
    minWidth: 0,
  }

  const listStyle: React.CSSProperties = {
    flex: 1,
    overflowY: 'auto',
    overflowX: 'hidden',
    padding: '14px 16px',
    display: 'flex',
    flexDirection: 'column',
    gap: 14,
    minHeight: 0,
    scrollBehavior: 'smooth',
    WebkitOverflowScrolling: 'touch',
  }

  const bottomDockStyle: React.CSSProperties = {
    flexShrink: 0,
    borderTop: '1px solid rgba(226,232,240,0.85)',
    background: 'rgba(255,255,255,0.92)',
    backdropFilter: 'blur(12px)',
  }

  return (
    <div style={panelStyle}>
      <div style={{ padding: '12px 14px', borderBottom: '0.5px solid #e5e7eb', background: '#fff', flexShrink: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 500, color: '#0f172a' }}>Gợi ý AI</div>
        <div style={{ fontSize: 11, color: '#6b7280' }}>{outfits.length} gợi ý</div>
      </div>

      <div style={listStyle} className="suggestions-scroll">
        {isGenerating ? (
          // Skeleton cards
          <>
            {[1, 2].map(i => (
              <div key={i} style={{ border: '1px solid rgba(226,232,240,0.9)', background: 'rgba(255,255,255,0.9)', borderRadius: 18, padding: 16, boxShadow: '0 8px 28px rgba(15,23,42,0.06)' }}>
                <div style={{ height: 16, background: '#e2e8f0', borderRadius: 8, width: '35%', marginBottom: 12 }} />
                <div style={{ display: 'grid', gap: 8, marginBottom: 12 }}>
                  {[1, 2, 3].map(j => (
                    <div key={j} style={{ height: 48, background: '#e2e8f0', borderRadius: 12 }} />
                  ))}
                </div>
                <div style={{ height: 34, background: '#e2e8f0', borderRadius: 12 }} />
              </div>
            ))}
          </>
        ) : outfits.length === 0 ? (
          // Empty state
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 240, textAlign: 'center', paddingTop: 48 }}>
            <div style={{ fontSize: 42, marginBottom: 12 }}>🪄</div>
            <p style={{ fontSize: 15, color: '#475569', maxWidth: 340 }}>
              Nhập mô tả chi tiết ở panel trái để AI tạo outfit rõ ràng hơn. Bạn có thể chọn dịp, phong cách, tông màu và ngân sách.
            </p>
          </div>
        ) : (
          // Outfit cards
          <>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
              <h3 style={{ fontSize: 15, fontWeight: 800, color: '#0f172a', margin: '0 0 2px' }}>
                Outfit gợi ý ({outfits.length} bộ)
              </h3>
              <div style={{ fontSize: 12, color: '#64748b' }}>{outfits.filter(o => o.items.some(i => i.source === 'shop')).length} cần mua · {outfits.filter(o => o.items.some(i => i.source === 'closet')).length} trong tủ</div>
            </div>
            {outfits.map(outfit => (
              <OutfitCard
                key={outfit.id}
                outfit={outfit}
                isSelected={selectedOutfitId === outfit.id}
                index={outfits.indexOf(outfit)}
                onSelect={onSelectOutfit}
                onTryItem={onTryItem}
                isLocalFallback={outfit.id.startsWith('local-') || fallbackMode}
              />
            ))}
          </>
        )}
      </div>

      {outfits.length > 0 && (
        <div style={{ ...bottomDockStyle, padding: '8px 14px 6px' }}>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 10, height: 10, borderRadius: 999, background: '#10b981' }} />
              <span style={{ fontSize: 10, color: '#64748b' }}>Đã có trong tủ đồ</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 10, height: 10, borderRadius: 999, background: '#3b82f6' }} />
              <span style={{ fontSize: 10, color: '#64748b' }}>Cần mua mới</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 6px', borderRadius: 999, background: '#f1f5f9', color: '#475569' }}>AI: S</span>
              <span style={{ fontSize: 10, color: '#64748b' }}>Size gợi ý</span>
            </div>
          </div>

          <ChatBox
            messages={messages}
            onSend={onSendMessage}
            isLoading={isGenerating}
            activeTab={activeTab ?? 'describe'}
          />
        </div>
      )}
    </div>
  )
}

