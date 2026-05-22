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
    background: 'var(--surface-elevated)',
    borderLeft: '1px solid var(--gold-divider)',
    display: 'flex',
    flexDirection: 'column',
    overflowY: 'auto',
    scrollbarWidth: 'none',
  }

  const listStyle: React.CSSProperties = {
    flex: 1,
    overflowY: 'auto',
    overflowX: 'hidden',
    padding: '0 12px 16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    minHeight: 0,
    scrollBehavior: 'smooth',
    WebkitOverflowScrolling: 'touch',
    scrollbarWidth: 'none',
  }

  const bottomDockStyle: React.CSSProperties = {
    flexShrink: 0,
    borderTop: '1px solid var(--gold-divider)',
    background: 'var(--surface-elevated)',
  }

  const inClosetCount = outfits.filter(o => o.items.some(i => i.source === 'closet')).length
  const lowestCost = outfits.reduce((min, o) => {
    const cost = o.items.filter(i => i.source === 'shop').reduce((sum, item) => sum + (item.price || 0), 0)
    return cost < min ? cost : min
  }, Infinity)

  return (
    <div style={panelStyle}>
      <style>{`
        @keyframes sparkleShimmer {
          0%, 100% { opacity: 0.4; transform: scale(1) rotate(0deg); }
          50% { opacity: 1; transform: scale(1.1) rotate(5deg); }
        }
        .skeleton-shimmer {
          background: linear-gradient(90deg, var(--surface-subtle) 25%, var(--gold-light) 50%, var(--surface-subtle) 75%);
          background-size: 200% 100%;
          animation: shimmer 1.5s infinite linear;
        }
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>

      <div style={{
        padding: '20px 20px 14px',
        borderBottom: '1px solid var(--gold-divider)',
        flexShrink: 0
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{
              fontSize: '9px',
              letterSpacing: '0.12em',
              color: 'var(--gold-primary)',
              opacity: 0.7,
              marginBottom: '4px'
            }}>
              ✦ GEMINI AI STYLIST
            </div>
            <h2 style={{ fontSize: '18px', fontWeight: '600', color: 'var(--text-primary)', margin: 0 }}>
              Gợi ý AI
            </h2>
            <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
              Outfit được tạo riêng cho bạn
            </div>
          </div>
        </div>
      </div>

      {isGenerating ? (
        <div style={{ padding: '20px' }}>
          <div className="skeleton-shimmer" style={{
            borderRadius: '10px',
            padding: '12px 16px',
            marginBottom: '12px',
            height: '48px'
          }} />
          {[1, 2, 3].map(i => (
            <div key={i} className="skeleton-shimmer" style={{
              height: '120px',
              borderRadius: '12px',
              marginBottom: '10px'
            }} />
          ))}
        </div>
      ) : outfits.length === 0 ? (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          flex: 1,
          padding: '32px 20px'
        }}>
          <div style={{ fontSize: '32px', marginBottom: '14px', animation: 'sparkleShimmer 2.5s ease-in-out infinite' }}>
            ✨
          </div>
          <div style={{ fontSize: '14px', fontWeight: '500', color: 'var(--text-primary)', opacity: 0.6, marginBottom: '6px' }}>
            Chưa có gợi ý nào
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-secondary)', textAlign: 'center', lineHeight: 1.6, opacity: 0.5 }}>
            Nhập mô tả ở panel trái để AI tạo outfit
          </div>
          <div style={{ color: 'var(--gold-primary)', fontSize: '11px', marginTop: '8px', borderBottom: '1px solid var(--gold-border)', cursor: 'default' }}>
            Tạo outfit với AI
          </div>
        </div>
      ) : (
        <>
          <div style={{
            margin: '14px 16px 10px',
            background: 'var(--surface-subtle)',
            border: '1px solid var(--gold-border)',
            borderRadius: '12px',
            padding: '12px 16px',
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '8px',
            flexShrink: 0
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '16px', fontWeight: '700', color: 'var(--gold-primary)' }}>{outfits.length}</div>
              <div style={{ fontSize: '9px', color: 'var(--text-secondary)', marginTop: '2px', letterSpacing: '0.06em' }}>BỘ OUTFIT</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '16px', fontWeight: '700', color: 'var(--gold-primary)' }}>{inClosetCount}</div>
              <div style={{ fontSize: '9px', color: 'var(--text-secondary)', marginTop: '2px', letterSpacing: '0.06em' }}>TỦ ĐỒ ✓</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '16px', fontWeight: '700', color: 'var(--gold-primary)' }}>
                {lowestCost !== Infinity ? `${(lowestCost / 1000)}k` : '0đ'}
              </div>
              <div style={{ fontSize: '9px', color: 'var(--text-secondary)', marginTop: '2px', letterSpacing: '0.06em' }}>TỪ</div>
            </div>
          </div>

          <div style={listStyle} className="suggestions-scroll">
            {outfits.map((outfit, index) => (
              <OutfitCard
                key={outfit.id}
                outfit={outfit}
                isSelected={selectedOutfitId === outfit.id}
                index={index}
                onSelect={onSelectOutfit}
                onTryItem={onTryItem}
                isLocalFallback={outfit.id.startsWith('local-') || fallbackMode}
              />
            ))}
          </div>
        </>
      )}

      {outfits.length > 0 && (
        <div style={bottomDockStyle}>
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
