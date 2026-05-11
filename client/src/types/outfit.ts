export type Occasion = 'cafe' | 'office' | 'street' | 'party' | 'travel' | 'date'
export type StyleTag = 'Casual' | 'Minimalist' | 'Streetwear' | 'Coquette' | 'Y2K' | 'Vintage' | 'Business casual'
export type ViewAngle = 'front' | 'back' | 'left' | 'right'

export interface Measurements {
  height: string
  weight: string
  chest: string
  waist: string
  hip: string
}

export interface OutfitFilter {
  occasions: Occasion[]
  styles: StyleTag[]
  colors: string[]
  budget: number
  description: string
  measurements?: Measurements
}

export interface OutfitItem {
  id: string
  name: string
  category: 'top' | 'bottom' | 'shoes' | 'accessory' | 'outerwear'
  price: number
  imageUrl: string
  productUrl: string
  color: string
  source: 'closet' | 'shop'
  suggestedSize?: string
  sizeReason?: string
  owned?: boolean
  slot?: string
  model3D?: Record<string, unknown>
}

export interface OutfitResult {
  id: string
  name: string
  matchScore: number
  items: OutfitItem[]
  totalPrice: number
  aiReason: string
  stats?: {
    ownedCount?: number
    buyCount?: number
    totalBuyPrice?: number
  }
}

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  suggestions?: string[]
}
