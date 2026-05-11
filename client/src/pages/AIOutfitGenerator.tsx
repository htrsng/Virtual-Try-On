'use client'

import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Sparkles, MessageCircle } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { generateOutfit } from '../services/aiOutfitService'
import LeftPanel from '../components/ai-outfit/LeftPanel'
import AvatarPanel from '../components/outfit/AvatarPanel'
import AIOutfitSuggestionsPanel from '../components/outfit/AIOutfitSuggestionsPanel'
import BodyEditorDrawer from '../features/virtual-tryon/components/BodyEditorDrawer'
import { useFittingRoom, type GarmentSlot, type Profile } from '../contexts/FittingRoomContext'
import type { OutfitFilter, OutfitResult, ChatMessage, ViewAngle } from '../types/outfit'
import type { OutfitItem } from '../types/outfit'
import { useOutfitGenerator } from '../hooks/useOutfitGenerator'
import '../features/virtual-tryon/VirtualTryOn.css'

export default function AIOutfitGenerator() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const {
    currentAvatar,
    currentAvatarId,
    setCurrentAvatarId,
    layeredGarments,
    applySilentWear,
    applyFullOutfit,
    updateAvatar,
    addAvatar,
  } = useFittingRoom()

  // State management
  const [activeTab, setActiveTab] = useState<'describe' | 'occasion'>('describe')
  const [filter, setFilter] = useState<OutfitFilter>({
    occasions: [],
    styles: [],
    colors: [],
    budget: 2000000,
    description: ''
  })
  const [selectedOutfitId, setSelectedOutfitId] = useState<string | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [viewAngle, setViewAngle] = useState<ViewAngle>('front')
  const [closetItems, setClosetItems] = useState<any[]>([])
  const [isBodyEditorOpen, setIsBodyEditorOpen] = useState(false)
  const [bodyEditorNotice, setBodyEditorNotice] = useState<string>('')

  // Circuit Breaker Hook - handles Gemini fallback to Local Engine
  const {
    outfits,
    isLoading: isGenerating,
    error,
    fallbackMode,
    shopLoading,
    handleGenerateOutfit,
    setOutfits,
    setError,
  } = useOutfitGenerator({
    closetItems,
    shopItems: [],
    userId: user?._id,
    avatarData: {
      avatar: currentAvatar,
      layeredGarments,
    },
  })

  const selectedOutfit = outfits.find(o => o.id === selectedOutfitId) || outfits[0] || null

  const activeAvatarData = useMemo(() => ({
    avatar: currentAvatar,
    layeredGarments,
  }), [currentAvatar, layeredGarments])

  const showBodyEditorToast = (message: string) => {
    setBodyEditorNotice(message)
    window.setTimeout(() => setBodyEditorNotice(''), 2200)
  }

  const ensureEditableAvatarId = (): string => {
    if (currentAvatarId) return currentAvatarId

    const newAvatar: Profile = {
      ...currentAvatar,
      id: `ai-avatar-${Date.now()}`,
      name: 'Avatar AI',
    }
    addAvatar(newAvatar)
    setCurrentAvatarId(newAvatar.id)
    return newAvatar.id
  }

  const handleBodyProfileChange = (nextProfile: Profile) => {
    const targetAvatarId = ensureEditableAvatarId()
    updateAvatar(targetAvatarId, nextProfile)
  }

  const mapToSilentWearSlot = (category: OutfitItem['category']): GarmentSlot | null => {
    if (category === 'top') return 'tops'
    if (category === 'bottom') return 'bottoms'
    if (category === 'outerwear') return 'outerwear'
    if (category === 'shoes') return null
    return null
  }

  const applyOutfitToAvatar = (outfit: OutfitResult) => {
    const silentWearItems = outfit.items
      .map((item) => {
        const slot = mapToSilentWearSlot(item.category)
        if (!slot) return null
        return {
          itemId: item.id,
          productId: item.id,
          name: item.name,
          category: slot,
          purchasedSize: 'M',
          purchasedColor: item.color,
          thumbnail: item.imageUrl,
          source: 'fallback' as const,
          model3D: item.model3D,
        }
      })
      .filter((item): item is NonNullable<typeof item> => Boolean(item))

    if (silentWearItems.length > 0) {
      applyFullOutfit(silentWearItems)
    }
  }

  const handleSelectOutfit = (outfitId: string) => {
    const outfit = outfits.find((entry) => entry.id === outfitId)
    if (!outfit) return
    setSelectedOutfitId(outfitId)
    applyOutfitToAvatar(outfit)
  }

  const handleTryItem = (item: OutfitItem) => {
    const slot = mapToSilentWearSlot(item.category)
    if (!slot) return

    applySilentWear({
      itemId: item.id,
      productId: item.id,
      name: item.name,
      category: slot,
      purchasedSize: 'M',
      purchasedColor: item.color,
      thumbnail: item.imageUrl,
      source: 'fallback',
      model3D: item.model3D,
    })
  }

  // Fetch closet items when component mounts
  useEffect(() => {
    const token = localStorage.getItem('token') || ''
    if (!token) return

    fetch('/api/virtual-closet', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(r => r.json())
      .then(data => setClosetItems(data.items ?? []))
      .catch(() => { }) // không crash nếu chưa có closet
  }, [])

  // Handle outfit generation with Circuit Breaker pattern
  const handleGenerate = async () => {
    setMessages([])
    await handleGenerateOutfit(filter)

    // After outfit generation, apply the first outfit to avatar if successful
    setOutfits(currentOutfits => {
      if (currentOutfits.length > 0) {
        setSelectedOutfitId(currentOutfits[0].id)
        applyOutfitToAvatar(currentOutfits[0])
      }
      return currentOutfits
    })
  }

  // Handle chat/refinement with real API
  const handleSendMessage = async (text: string) => {
    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      timestamp: new Date(),
    }
    setMessages(prev => [...prev, userMsg])
    setIsGenerating(true)
    setError('')

    try {
      const result = await generateOutfit(filter, closetItems, activeAvatarData, user?._id)
      if (result.outfits.length > 0) {
        setOutfits(result.outfits)
        setSelectedOutfitId(result.outfits[0].id)
        applyOutfitToAvatar(result.outfits[0])
      }
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `${result.message} (Đã ưu tiên mô tả từ panel bên trái)`,
        timestamp: new Date(),
        suggestions: result.suggestions,
      }])
    } catch (err: any) {
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `⚠️ ${err.message}`,
        timestamp: new Date(),
      }])
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div style={{
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      background: 'linear-gradient(180deg, #f8fafc 0%, #eef2f7 100%)',
      color: '#0f172a',
      overflow: 'hidden',
    }}>
      <style>{`
        .ai-gen-btn {
          border: 1px solid #cbd5e1;
          background: #fff;
          border-radius: 999px;
          padding: 8px 12px;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
          box-shadow: 0 1px 2px rgba(15, 23, 42, 0.05);
        }
        .ai-gen-tab {
          border: 1px solid transparent;
          background: transparent;
          border-radius: 10px;
          padding: 7px 12px;
          font-size: 13px;
          cursor: pointer;
          color: #475569;
        }
        .ai-gen-tab.active {
          background: #0f172a;
          color: #fff;
        }
        .ai-gen-card {
          background: rgba(255,255,255,0.84);
          border: 1px solid rgba(148,163,184,0.35);
          box-shadow: 0 10px 35px rgba(15,23,42,0.10);
          backdrop-filter: blur(18px);
        }
      `}</style>

      {/* Topbar */}
      <header style={{
        height: 56,
        borderBottom: '1px solid #e2e8f0',
        background: 'rgba(255,255,255,0.88)',
        display: 'flex',
        alignItems: 'center',
        padding: '0 16px',
        gap: 12,
        flexShrink: 0,
        backdropFilter: 'blur(14px)',
      }}>
        <button
          onClick={() => navigate(-1)}
          className="ai-gen-btn"
        >
          <span>←</span>
          <span className="text-sm">Quay lại</span>
        </button>

        <div style={{ width: 1, height: 24, background: '#e2e8f0' }} />

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Sparkles size={16} color="#0f172a" />
          <span style={{ fontSize: 14, fontWeight: 700, letterSpacing: 0.2 }}>AI Outfit Generator</span>
        </div>

        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, padding: 4, background: '#f1f5f9', borderRadius: 12 }}>
          <button
            onClick={() => setActiveTab('describe')}
            className={`ai-gen-tab ${activeTab === 'describe' ? 'active' : ''}`}
          >
            Gợi ý theo mô tả
          </button>
          <button
            onClick={() => setActiveTab('occasion')}
            className={`ai-gen-tab ${activeTab === 'occasion' ? 'active' : ''}`}
          >
            Chọn theo dịp
          </button>
          <button
            onClick={handleGenerate}
            className="ai-gen-tab"
            style={{
              marginLeft: 6,
              borderColor: '#10b981',
              borderWidth: 1,
              borderStyle: 'solid',
              color: '#065f46',
              background: '#ecfdf5',
              cursor: isGenerating ? 'wait' : 'pointer',
            }}
          >
            <MessageCircle size={14} />
            {isGenerating ? 'Đang tạo...' : 'Tạo outfit với AI'}
          </button>
        </div>
      </header>

      {/* Error Banner */}
      {error && (
        <div style={{
          margin: '12px 16px 0',
          padding: '10px 12px',
          background: '#fef2f2',
          border: '1px solid #fecaca',
          borderRadius: 12,
          fontSize: 13,
          color: '#dc2626',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
        }}>
          <span>⚠️ {error}</span>
          <button onClick={() => setError('')} style={{ color: '#f87171', border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 16 }}>✕</button>
        </div>
      )}

      {/* Fallback Mode Banner */}
      {bodyEditorNotice && (
        <div style={{
          margin: '10px 16px 0',
          padding: '10px 12px',
          background: '#ecfeff',
          border: '1px solid #a5f3fc',
          borderRadius: 12,
          fontSize: 13,
          color: '#0f766e',
        }}>
          {bodyEditorNotice}
        </div>
      )}

      {/* Main Content - 3-Column Grid Layout */}
      <div style={{
        flex: 1,
        display: 'grid',
        gridTemplateColumns: '290px 1fr 480px',
        overflow: 'hidden',
        backgroundColor: '#fff',
      }}>
        {/* Left Column - Filter Panel */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          borderRight: '0.5px solid #e5e7eb',
          overflow: 'hidden',
          backgroundColor: '#fafafa',
        }}>
          <LeftPanel
            activeTab={activeTab}
            filter={filter}
            onChange={setFilter}
            onGenerate={handleGenerate}
            isGenerating={isGenerating}
            shopLoading={shopLoading}
          />
        </div>

        {/* Middle Column - Avatar Panel */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          borderRight: '0.5px solid #e5e7eb',
          overflow: 'hidden',
          backgroundColor: '#f5f4f0',
        }}>
          <AvatarPanel
            selectedOutfit={selectedOutfit}
            isGenerating={isGenerating}
            viewAngle={viewAngle}
            onViewChange={setViewAngle}
          />
        </div>

        {/* Right Column - AI Suggestions Panel */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          backgroundColor: '#fff',
        }}>
          <AIOutfitSuggestionsPanel
            isOpen={true}
            onClose={() => { }}
            outfits={outfits}
            selectedOutfitId={selectedOutfitId}
            onSelectOutfit={handleSelectOutfit}
            onWearSet={applyOutfitToAvatar}
            onTryItem={handleTryItem}
            isGenerating={isGenerating}
            messages={messages}
            onSendMessage={handleSendMessage}
            activeTab={activeTab}
            fallbackMode={fallbackMode}
          />
        </div>
      </div>

      <BodyEditorDrawer
        profile={currentAvatar}
        isOpen={isBodyEditorOpen}
        onClose={() => setIsBodyEditorOpen(false)}
        onSave={handleBodyProfileChange}
        onChange={handleBodyProfileChange}
        showToast={(message) => showBodyEditorToast(message)}
      />
    </div>
  )
}
