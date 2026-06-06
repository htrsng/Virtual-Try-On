'use client'

import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Sparkles, MessageCircle } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { generateOutfit } from '../services/aiOutfitService'
import LeftPanel from '../components/ai-outfit/LeftPanel'
import AvatarPanel from '../components/outfit/AvatarPanel'
import AIOutfitSuggestionsPanel from '../components/outfit/AIOutfitSuggestionsPanel'
import TryOnPanel from '../components/outfit/TryOnPanel'
import BodyEditorDrawer from '../features/virtual-tryon/components/BodyEditorDrawer'
import { MODEL_INJECTION } from '../data/ThreeDConfig'
import { useFittingRoom, type GarmentSlot, type Profile } from '../contexts/FittingRoomContext'
import type { OutfitFilter, OutfitResult, ChatMessage, ViewAngle } from '../types/outfit'
import type { OutfitItem } from '../types/outfit'
import { useOutfitGenerator } from '../hooks/useOutfitGenerator'
import { initSelection, SelectionState, resolveGlbUrl } from '../utils/glb'
import '../features/virtual-tryon/VirtualTryOn.css'

interface AIOutfitGeneratorProps {
  onAddToCart?: (product: any, size?: string) => void;
  onBuyNow?: (product: any, size?: string) => void;
  showToast?: (message: string, type?: string) => void;
}

export default function AIOutfitGenerator({ onAddToCart, onBuyNow, showToast }: AIOutfitGeneratorProps = {}) {
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
  
  // TryOnPanel State
  const [isTryOnPanelOpen, setIsTryOnPanelOpen] = useState(false)
  const [tryOnPanelOutfitId, setTryOnPanelOutfitId] = useState<string | null>(null)
  const [selections, setSelections] = useState<SelectionState>({})

  // Floating Bubble State
  const [isLeftPanelExpanded, setIsLeftPanelExpanded] = useState(true)

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

  useEffect(() => {
    if (selectedOutfit) {
      setSelections(initSelection(selectedOutfit));
    }
  }, [selectedOutfitId, outfits]);

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

  const resolveModel3D = (itemId: string | number, itemModel3D?: any, productUrl?: string, category?: string) => {
    // If backend returns a config object
    if (itemModel3D && typeof itemModel3D === 'object' && itemModel3D.sizes) return itemModel3D;
    
    // If backend returns a raw URL string
    if (itemModel3D && typeof itemModel3D === 'string') {
        return {
            enable: true,
            sizes: {
                S: { url: itemModel3D, autoNormalize: true, followAvatarBones: false },
                M: { url: itemModel3D, autoNormalize: true, followAvatarBones: false },
                L: { url: itemModel3D, autoNormalize: true, followAvatarBones: false },
                XL: { url: itemModel3D, autoNormalize: true, followAvatarBones: false },
            }
        };
    }

    const modelMap = MODEL_INJECTION as any;
    
    // First try the item ID
    let strId = String(itemId).trim();
    if (strId && modelMap[strId]) return modelMap[strId];
    
    // If it didn't match, the item ID might be a MongoDB ObjectID. 
    // Try to extract the real product ID from the productUrl.
    if (productUrl && productUrl.includes('/product/')) {
        const extractedId = productUrl.split('/product/').pop()?.trim();
        if (extractedId && modelMap[extractedId]) return modelMap[extractedId];
    }
    
    return undefined;
  }

  const applyOutfitToAvatar = (outfit: OutfitResult) => {
    const silentWearItems = outfit.items
      .map((item) => {
        const slot = mapToSilentWearSlot(item.category)
        if (!slot) return null
        
        const size = selections[item.id]?.size || item.selectedSize || item.suggestedSize || 'M'
        const color = selections[item.id]?.colorHex || item.selectedColor || item.color || '#ffffff'
        
        let glbUrl = resolveGlbUrl(item, size, color)

        return {
          itemId: item.id,
          productId: item.id,
          name: item.name,
          category: slot,
          purchasedSize: size,
          purchasedColor: color,
          thumbnail: item.imageUrl,
          source: 'fallback' as const,
          model3D: glbUrl ? { enable: true, sizes: { [size]: { url: glbUrl, autoNormalize: true } } } : resolveModel3D(item.id, item.model3D, item.productUrl, item.category),
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
  }

  const handleUpdateOutfitItem = (outfitId: string, itemId: string, updates: Partial<OutfitItem>) => {
    setOutfits(prevOutfits => prevOutfits.map(outfit => {
      if (outfit.id !== outfitId) return outfit;
      return {
        ...outfit,
        items: outfit.items.map(item => {
          if (item.id !== itemId) return item;
          return { ...item, ...updates };
        })
      };
    }));
  };

  const handleOpenTryOnPanel = (outfitId: string) => {
    setTryOnPanelOutfitId(outfitId);
    setIsTryOnPanelOpen(true);
  };

  const handleCloseTryOnPanel = () => {
    setIsTryOnPanelOpen(false);
  };

  const handleTryOnPanelIndexChange = (index: number) => {
    const nextOutfit = outfits[index];
    if (nextOutfit) {
      setTryOnPanelOutfitId(nextOutfit.id);
      setSelectedOutfitId(nextOutfit.id);
      applyOutfitToAvatar(nextOutfit);
    }
  };

  const handleAddToCart = (outfit: OutfitResult) => {
    if (!onAddToCart) {
      alert('Đã thêm Outfit vào giỏ hàng!');
      return;
    }
    outfit.items.forEach(item => {
      onAddToCart({
        id: item.id,
        name: item.name,
        price: item.price,
        img: item.imageUrl,
        category: item.category,
      }, item.selectedSize || item.suggestedSize || 'M');
    });
    if (showToast) showToast('Đã thêm Outfit vào giỏ hàng!');
  };

  const handleBuyNow = (outfit: OutfitResult) => {
    if (!onBuyNow) {
      alert('Đang chuyển đến trang thanh toán...');
      handleCloseTryOnPanel();
      return;
    }
    outfit.items.forEach((item, index) => {
      const product = {
        id: item.id,
        name: item.name,
        price: item.price,
        img: item.imageUrl,
        category: item.category,
      };
      const size = item.selectedSize || item.suggestedSize || 'M';
      if (index === outfit.items.length - 1) {
         onBuyNow(product, size);
      } else {
         if (onAddToCart) onAddToCart(product, size);
      }
    });
    handleCloseTryOnPanel();
  };

  const handleTryItem = (item: OutfitItem) => {
    const slot = mapToSilentWearSlot(item.category)
    if (!slot) return

    applySilentWear({
      itemId: item.id,
      productId: item.id,
      name: item.name,
      category: slot,
      purchasedSize: item.selectedSize || item.suggestedSize || 'M',
      purchasedColor: item.selectedColor || item.color,
      thumbnail: item.imageUrl,
      source: 'fallback',
      model3D: resolveModel3D(item.id, item.model3D, item.productUrl, item.category),
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

  // Close bubble if there are already generated outfits when the component loads
  useEffect(() => {
    if (outfits && outfits.length > 0) {
      setIsLeftPanelExpanded(false)
    }
  }, [outfits.length])

  // Handle outfit generation with Circuit Breaker pattern
  const handleGenerate = async () => {
    setIsLeftPanelExpanded(false)
    setMessages([])
    const generatedOutfits = await handleGenerateOutfit(filter)

    // After outfit generation, select the first outfit but do NOT apply it automatically
    if (generatedOutfits && generatedOutfits.length > 0) {
      setSelectedOutfitId(generatedOutfits[0].id)
    }
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
        gridTemplateColumns: '1fr 480px',
        height: 'calc(100vh - 60px - 53px)', /* 60px header + 53px strip */
        background: 'var(--bg-primary)',
        overflow: 'hidden',
        position: 'relative',
      }}>
        {/* Floating Left Panel (Bubble) */}
        <div style={{
          position: 'absolute',
          bottom: '24px',
          left: '24px',
          zIndex: 50,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          pointerEvents: 'none', // Let clicks pass through empty space
        }}>
          {isLeftPanelExpanded ? (
            <div style={{
              pointerEvents: 'auto',
              background: 'rgba(15, 15, 30, 0.92)',
              backdropFilter: 'blur(8px)',
              borderRadius: '24px',
              border: '1px solid rgba(212, 169, 66, 0.3)',
              boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
              width: '320px',
              maxHeight: 'calc(100vh - 120px)',
              overflowY: 'auto',
              transform: 'translateY(0)',
              opacity: 1,
              transition: 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.3s ease',
              display: 'flex',
              flexDirection: 'column',
              scrollbarWidth: 'none',
            }}>
              <LeftPanel
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                filter={filter}
                onChange={setFilter}
                onGenerate={handleGenerate}
                isGenerating={isGenerating}
                shopLoading={shopLoading}
                onClose={() => setIsLeftPanelExpanded(false)}
              />
            </div>
          ) : (
            <button
              onClick={() => setIsLeftPanelExpanded(true)}
              style={{
                pointerEvents: 'auto',
                height: '56px',
                width: outfits.length > 0 ? 'auto' : '56px',
                borderRadius: '28px',
                padding: outfits.length > 0 ? '0 24px' : '0',
                background: outfits.length > 0 ? 'rgba(15,15,30,0.92)' : 'linear-gradient(135deg, var(--gold-primary) 0%, #E8B84B 100%)',
                border: outfits.length > 0 ? '1px solid rgba(212,169,66,0.4)' : 'none',
                boxShadow: outfits.length > 0 ? '0 10px 30px rgba(0,0,0,0.3)' : '0 8px 24px rgba(201,150,63,0.3)',
                backdropFilter: 'blur(8px)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                justifyContent: 'center',
                transform: 'translateY(0) scale(1)',
                transition: 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1), background 0.2s',
                color: outfits.length > 0 ? 'var(--gold-primary)' : '#0F0B07'
              }}
              onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-4px) scale(1.02)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0) scale(1)'}
              title={outfits.length > 0 ? "Chỉnh sửa bộ lọc" : "Mở bộ lọc AI"}
            >
              {outfits.length > 0 ? (
                <>
                  <span style={{ fontSize: '20px' }}>✨</span>
                  <span style={{ fontSize: '13px', fontWeight: '600' }}>Sửa bộ lọc</span>
                  <div style={{ background: 'var(--gold-primary)', color: '#0F0B07', fontSize: '11px', fontWeight: 'bold', padding: '2px 8px', borderRadius: '10px', marginLeft: '2px' }}>
                    {outfits.length}
                  </div>
                </>
              ) : (
                <span style={{ fontSize: '24px' }}>✨</span>
              )}
            </button>
          )}
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
          {isTryOnPanelOpen && (
            <div 
                style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.18)', zIndex: 40, cursor: 'pointer' }}
                onClick={handleCloseTryOnPanel}
            />
          )}
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
            onUpdateItem={handleUpdateOutfitItem}
            onOpenTryonPanel={handleOpenTryOnPanel}
          />
        </div>

        {/* Try On Panel Overlay */}
        <TryOnPanel
            isOpen={isTryOnPanelOpen}
            outfits={outfits}
            currentIndex={outfits.findIndex(o => o.id === tryOnPanelOutfitId)}
            closetItems={closetItems}
            onClose={handleCloseTryOnPanel}
            onIndexChange={handleTryOnPanelIndexChange}
            onUpdateItem={handleUpdateOutfitItem}
            onAddToCart={handleAddToCart}
            onBuyNow={handleBuyNow}
            onTryOutfit={(outfit) => applyOutfitToAvatar(outfit)}
        />
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
