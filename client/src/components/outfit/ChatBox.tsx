import { useState } from 'react'
import { SendHorizontal } from 'lucide-react'
import type { ChatMessage } from '../../types/outfit'

interface ChatBoxProps {
  messages: ChatMessage[]
  onSend: (text: string) => void
  isLoading: boolean
  activeTab: 'describe' | 'occasion'
}

const DEFAULT_SUGGESTIONS = [
  'Đổi sang tông tối hơn',
  'Thêm phụ kiện',
  'Giảm ngân sách',
  'Phong cách năng động hơn',
  'Thêm lớp ngoài (áo khoác)'
]

export default function ChatBox({ messages, onSend, isLoading, activeTab }: ChatBoxProps) {
  const [input, setInput] = useState('')
  const lastAssistantMsg = [...messages].reverse().find(m => m.role === 'assistant')
  const suggestions = lastAssistantMsg?.suggestions || DEFAULT_SUGGESTIONS
  const boxStyle: React.CSSProperties = {
    borderTop: '1px solid rgba(226,232,240,0.8)',
    background: 'rgba(255,255,255,0.78)',
    backdropFilter: 'blur(14px)',
    padding: '12px 14px 14px',
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  }

  const handleSend = () => {
    if (!input.trim() || isLoading) return
    onSend(input)
    setInput('')
  }

  const handleSendSuggestion = (suggestion: string) => {
    onSend(suggestion)
    setInput('')
  }

  const placeholders: Record<string, string> = {
    describe: 'Tôi muốn thêm/bỏ/đổi...',
    occasion: 'Bạn có gợi ý gì thêm không?'
  }

  return (
    <div style={boxStyle}>
      <p style={{ fontSize: 11, fontWeight: 800, letterSpacing: 0.8, textTransform: 'uppercase', color: '#64748b', margin: 0 }}>Refine with AI</p>

      {/* Last assistant message */}
      {lastAssistantMsg && (
        <div style={{ background: 'rgba(255,255,255,0.95)', border: '1px solid rgba(226,232,240,0.95)', borderRadius: 14, padding: 10, fontSize: 12, lineHeight: 1.55 }}>
          <p style={{ color: '#0f172a', fontWeight: 700, margin: '0 0 4px' }}>AI Stylist</p>
          <p style={{ color: '#475569', margin: 0 }}>{lastAssistantMsg.content}</p>
        </div>
      )}

      {/* Quick suggestions */}
      {suggestions.length > 0 && (
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 2 }}>
          {suggestions.map((suggestion, i) => (
            <button
              key={i}
              onClick={() => handleSendSuggestion(suggestion)}
              style={{
                fontSize: 12,
                padding: '6px 10px',
                borderRadius: 999,
                background: '#fff',
                border: '1px solid #e2e8f0',
                color: '#475569',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}
            >
              {suggestion}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div style={{ display: 'flex', gap: 8 }}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder={placeholders[activeTab]}
          disabled={isLoading}
          style={{
            flex: 1,
            fontSize: 12,
            border: '1px solid #cbd5e1',
            borderRadius: 12,
            padding: '9px 12px',
            outline: 'none',
            background: isLoading ? '#f8fafc' : '#fff',
          }}
        />
        <button
          onClick={handleSend}
          disabled={!input.trim() || isLoading}
          style={{
            width: 40,
            height: 38,
            borderRadius: 12,
            border: 'none',
            background: !input.trim() || isLoading ? '#cbd5e1' : '#10b981',
            color: '#fff',
            cursor: !input.trim() || isLoading ? 'not-allowed' : 'pointer',
          }}
        >
          <SendHorizontal size={14} />
        </button>
      </div>
    </div>
  )
}

