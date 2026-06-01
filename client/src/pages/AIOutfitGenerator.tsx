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
    avatars,
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
      background: 'var(--bg-primary)',
      color: 'var(--text-primary)',
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
        background: 'rgba(15,11,7,0.96)',
        borderBottom: '1px solid var(--gold-divider)',
        backdropFilter: 'blur(12px)',
        padding: '0 24px',
        height: '60px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button
            onClick={() => navigate(-1)}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-secondary)',
              padding: '0',
              fontSize: '13px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              cursor: 'pointer',
            }}
          >
            <span>←</span>
          </button>
          
          <div style={{ width: '1px', height: '20px', background: 'var(--gold-divider)' }} />
          
          <div style={{ 
            fontSize: '15px', 
            color: 'var(--gold-primary)', 
            display: 'flex', 
            alignItems: 'center', 
            gap: '8px',
            fontWeight: '700',
            letterSpacing: '0.02em'
          }}>
            ✨ VFit Stylist
          </div>
        </div>

        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            background: 'var(--surface-subtle)',
            border: '1px solid var(--gold-border)',
            borderRadius: '100px',
            padding: '4px 6px',
            gap: '4px',
          }}>
            <button
              onClick={() => setActiveTab('describe')}
              style={{
                background: activeTab === 'describe' ? 'var(--gold-primary)' : 'transparent',
                border: 'none',
                borderRadius: '100px',
                color: activeTab === 'describe' ? '#0F0B07' : 'var(--text-secondary)',
                padding: '6px 16px',
                fontSize: '12px',
                fontWeight: activeTab === 'describe' ? '600' : '500',
                transition: 'all 0.2s ease',
                cursor: 'pointer',
              }}
            >
              Gợi ý theo mô tả
            </button>
            <button
              onClick={() => setActiveTab('occasion')}
              style={{
                background: activeTab === 'occasion' ? 'var(--gold-primary)' : 'transparent',
                border: 'none',
                borderRadius: '100px',
                color: activeTab === 'occasion' ? '#0F0B07' : 'var(--text-secondary)',
                padding: '6px 16px',
                fontSize: '12px',
                fontWeight: activeTab === 'occasion' ? '600' : '500',
                transition: 'all 0.2s ease',
                cursor: 'pointer',
              }}
            >
              Chọn theo dịp
            </button>
          </div>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            background: 'var(--surface-subtle)',
            border: '1px solid var(--gold-border)',
            borderRadius: '100px',
            padding: '4px 14px',
            gap: '8px',
            height: '34px',
          }}>
            <span style={{ fontSize: '10px', color: 'var(--text-secondary)', fontWeight: '600', letterSpacing: '0.05em' }}>
              AVATAR
            </span>
            <select
              value={currentAvatarId || ''}
              onChange={(e) => setCurrentAvatarId(e.target.value)}
              disabled={avatars?.length === 0}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-primary)',
                fontSize: '12px',
                fontWeight: '600',
                outline: 'none',
                cursor: 'pointer',
                appearance: 'none',
                paddingRight: '12px',
              }}
            >
              {(!avatars || avatars.length === 0) && <option value="" style={{ color: '#000' }}>Khách mặc định</option>}
              {avatars?.map((avatar) => (
                <option key={avatar.id} value={avatar.id} style={{ color: '#000' }}>
                  {avatar.name}
                </option>
              ))}
            </select>
            <div style={{ width: '1px', height: '14px', background: 'var(--gold-divider)' }} />
            <button
              type="button"
              onClick={() => navigate('/avatar-studio', { state: { returnTo: '/ai-outfit' } })}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--gold-primary)',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                padding: '0 4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              title="Tạo avatar mới"
            >
              +
            </button>
          </div>
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

      {/* Inspiration Strip */}
      <div style={{
        background: 'var(--surface-elevated)',
        borderBottom: '1px solid var(--gold-divider)',
        padding: '12px 24px',
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        flexShrink: 0,
        overflowX: 'auto',
        scrollbarWidth: 'none',
      }}>
        <div style={{ fontSize: '11px', fontWeight: '600', color: 'var(--text-secondary)', letterSpacing: '0.04em', flexShrink: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ color: '#ef4444' }}>🔥</span> TRENDING TODAY
        </div>
        
        <div style={{ width: '1px', height: '14px', background: 'var(--gold-divider)', flexShrink: 0 }} />
        
        <div style={{ display: 'flex', gap: '8px' }}>
          {['Old Money', 'Korean Chic', 'Quiet Luxury', 'Summer Vibes', 'Minimalist'].map(tag => (
            <button
              key={tag}
              onClick={() => {
                setActiveTab('describe');
                setFilter(prev => ({ ...prev, description: prev.description ? `${prev.description}, ${tag}` : tag }));
              }}
              style={{
                background: 'linear-gradient(135deg, rgba(212,169,66,0.08) 0%, rgba(242,216,120,0.02) 100%)',
                border: '1px solid rgba(212,169,66,0.2)',
                borderRadius: '8px',
                padding: '6px 14px',
                fontSize: '12px',
                color: 'var(--text-primary)',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = 'var(--gold-primary)';
                e.currentTarget.style.background = 'var(--gold-light)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = 'rgba(212,169,66,0.2)';
                e.currentTarget.style.background = 'linear-gradient(135deg, rgba(212,169,66,0.08) 0%, rgba(242,216,120,0.02) 100%)';
              }}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: '300px 1fr 480px',
        height: 'calc(100vh - 60px - 53px)', /* 60px header + 53px strip */
        background: 'var(--bg-primary)',
        overflow: 'hidden',
      }}>
        {/* Left Column - Filter Panel */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          overflow: 'hidden',
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
          height: '100%',
          overflow: 'hidden',
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
          height: '100%',
          overflow: 'hidden',
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
