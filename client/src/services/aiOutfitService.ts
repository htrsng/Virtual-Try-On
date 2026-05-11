import type { OutfitResult, OutfitFilter, OutfitItem } from '../types/outfit'

const SYSTEM_ADDITION = `
Với mỗi sản phẩm trong suggestions, hãy thêm field "suggestedSize" dựa trên số đo avatar.
Ví dụ: "suggestedSize": "S" hoặc "suggestedSize": "M" hoặc "suggestedSize": "37" (cho giày).
Nếu không có thông tin số đo, để "suggestedSize": "M" làm mặc định.
`

// Lấy token từ localStorage — dùng đúng key project đang dùng
const getToken = (): string => {
  return (
    localStorage.getItem('token') ||
    localStorage.getItem('accessToken') ||
    localStorage.getItem('authToken') ||
    localStorage.getItem('jwt') ||
    ''
  )
}

// ── Chuyển OutfitFilter thành prompt text ──
const buildPromptFromFilter = (filter: OutfitFilter): string => {
  const parts: string[] = []

  if (filter.description.trim()) {
    parts.push(filter.description.trim())
  }

  if (filter.occasions.length > 0) {
    const occasionMap: Record<string, string> = {
      cafe: 'đi cafe',
      office: 'đi làm công sở',
      street: 'dạo phố',
      party: 'đi tiệc',
      travel: 'đi du lịch',
      date: 'hẹn hò'
    }
    parts.push(`Dịp: ${filter.occasions.map(o => occasionMap[o] ?? o).join(', ')}`)
  }

  if (filter.styles.length > 0) {
    parts.push(`Phong cách: ${filter.styles.join(', ')}`)
  }

  if (filter.colors.length > 0) {
    parts.push(`Tông màu ưa thích: ${filter.colors.join(', ')}`)
  }

  if (filter.budget > 0) {
    parts.push(`Ngân sách tối đa: ${new Intl.NumberFormat('vi-VN').format(filter.budget)}đ`)
  }

  // Include measurements if provided
  if (filter.measurements) {
    const { height, weight, chest, waist, hip } = filter.measurements
    const measurements: string[] = []
    if (height) measurements.push(`Cao ${height}cm`)
    if (weight) measurements.push(`Nặng ${weight}kg`)
    if (chest) measurements.push(`Ngực ${chest}cm`)
    if (waist) measurements.push(`Eo ${waist}cm`)
    if (hip) measurements.push(`Mông ${hip}cm`)
    if (measurements.length > 0) {
      parts.push(`Số đo: ${measurements.join(', ')}`)
    }
  }

  return parts.length > 0
    ? parts.join('. ')
    : 'Gợi ý outfit phù hợp cho tôi'
}

const buildSystemAddendum = (): string => SYSTEM_ADDITION.trim()

// ── Parse response từ backend thành OutfitResult[] ──
const parseBackendResponse = (data: any): OutfitResult[] => {
  const normalizeItem = (item: any, source: 'closet' | 'shop'): OutfitItem => ({
    id: String(item.itemId ?? item.id ?? item.productId ?? Math.random()),
    name: item.name ?? 'Sản phẩm',
    category: mapCategory(item.slot ?? item.category),
    price: item.price ?? 0,
    imageUrl: item.thumbnailUrl ?? item.imageUrl ?? item.img ?? '',
    productUrl: item.productId ? `/product/${item.productId}` : '#',
    color: item.color ?? '#888888',
    source,
    suggestedSize: item.suggestedSize ?? item.purchasedSize,
    sizeReason: item.sizeReason,
    owned: item.owned ?? false,
    slot: item.slot ?? item.category,
    model3D: item.model3D ?? item.model3d ?? undefined,
  })

  const closetItems = (data.outfit ?? []).map((item: any) => normalizeItem(item, 'closet'))
  const shopItems = (data.suggestions ?? []).map((item: any) => normalizeItem(item, 'shop'))

  const outfitVariants: OutfitItem[][] = []

  if (Array.isArray(data.outfits) && data.outfits.length > 0) {
    data.outfits.forEach((variant: any) => {
      outfitVariants.push((variant.items ?? []).map((item: any) => normalizeItem(item, item.type === 'closet' ? 'closet' : 'shop')))
    })
  } else {
    const base = [...closetItems, ...shopItems]
    const top = base.find((item) => item.category === 'top')
    const bottom = base.find((item) => item.category === 'bottom')
    const shoes = base.find((item) => item.category === 'shoes')
    const outerwear = base.find((item) => item.category === 'outerwear')
    const accessory = base.find((item) => item.category === 'accessory')

    const variant1 = [top, bottom, shoes, accessory].filter(Boolean) as OutfitItem[]
    const variant2 = [top, outerwear, bottom, shoes].filter(Boolean) as OutfitItem[]
    const variant3 = [...base].slice(0, 4)

    outfitVariants.push(variant1.length > 0 ? variant1 : base.slice(0, 3))
    outfitVariants.push(variant2.length > 0 ? variant2 : base.slice(0, 4))
    outfitVariants.push(variant3.length > 0 ? variant3 : base.slice(0, 3))
  }

  const uniqueVariants = outfitVariants
    .map((items) => items.filter((item, index, all) => all.findIndex((candidate) => candidate.id === item.id) === index))
    .filter((items) => items.length > 0)
    .slice(0, 3)

  return uniqueVariants.map((items, index) => ({
    id: `outfit-${Date.now()}-${index}`,
    name: data.outfits?.[index]?.name ?? (data.occasion ? `Outfit ${index + 1} - ${data.occasion}` : `Outfit ${index + 1}`),
    matchScore: calculateMatchScore(items),
    items,
    totalPrice: items.reduce((sum, item) => sum + (item.price ?? 0), 0),
    aiReason: data.outfits?.[index]?.aiReason ?? data.explanation ?? '',
    stats: data.stats ?? {
      ownedCount: items.filter(item => item.owned).length,
      buyCount: items.filter(item => !item.owned).length,
      totalBuyPrice: items.filter(item => !item.owned).reduce((sum, item) => sum + (item.price ?? 0), 0),
    },
  }))
}

// Helper: map slot name sang category
const mapCategory = (slot: string): 'top' | 'bottom' | 'shoes' | 'accessory' | 'outerwear' => {
  const map: Record<string, any> = {
    tops: 'top', top: 'top',
    bottoms: 'bottom', bottom: 'bottom',
    outerwear: 'outerwear',
    shoes: 'shoes', footwear: 'shoes',
    accessory: 'accessory', accessories: 'accessory',
    dress: 'bottom', dresses: 'bottom',
  }
  return map[slot?.toLowerCase()] ?? 'top'
}

// Helper: tính match score dựa trên số items từ closet
const calculateMatchScore = (items: any[]): number => {
  const total = items.length
  if (total === 0) return 70
  // Tính dựa trên số lượng items, max 99
  return Math.min(99, 70 + Math.round((Math.min(items.length, 3) / 3) * 29))
}

// ── API call chính ──
export const generateOutfit = async (
  filter: OutfitFilter,
  closetItems: any[] = [],
  avatarData: any = {},
  userId?: string
): Promise<{ outfits: OutfitResult[], message: string, suggestions: string[] }> => {

  const token = getToken()
  if (!token) {
    throw new Error('Vui lòng đăng nhập để sử dụng AI Stylist')
  }

  const userPrompt = buildPromptFromFilter(filter)
  const systemAddendum = buildSystemAddendum()

  const response = await fetch('/api/ai/outfit-suggest', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      userPrompt: `${userPrompt}\n\n${systemAddendum}`,
      closetItems: closetItems.slice(0, 10),
      avatarData,
      userId,
      filter: {
        occasions: filter.occasions,
        styles: filter.styles,
        colors: filter.colors,
        budget: filter.budget,
      },
      measurements: filter.measurements || {},
    }),
  })

  if (response.status === 401) {
    throw new Error('Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.')
  }

  if (response.status === 429) {
    throw new Error('AI đang bận, vui lòng thử lại sau vài giây.')
  }

  if (!response.ok) {
    const err = await response.json().catch(() => ({}))
    throw new Error(err.error ?? 'Không thể tạo outfit. Vui lòng thử lại.')
  }

  const data = await response.json()
  const outfits = parseBackendResponse(data)

  if (!Array.isArray(outfits) || outfits.length === 0) {
    throw new Error('AI chưa trả về sản phẩm cụ thể. Vui lòng thử lại với mô tả chi tiết hơn.')
  }

  // Tạo suggestions từ explanation
  const suggestions: string[] = [
    'Đổi sang tông tối hơn',
    'Thêm phụ kiện',
    'Giảm ngân sách',
    'Phong cách năng động hơn',
    'Thêm áo khoác bên ngoài',
  ]

  return {
    outfits,
    message: (typeof data.explanation === 'string' && data.explanation.trim().length > 0)
      ? data.explanation
      : `AI đã gợi ý ${outfits[0]?.items?.length ?? 0} sản phẩm phù hợp cho bạn.`,
    suggestions,
  }
}

// ── Chat tinh chỉnh outfit ──
export const refineOutfit = async (
  message: string,
  currentOutfits: OutfitResult[],
  closetItems: any[] = [],
  avatarData: any = {}
): Promise<{ outfits: OutfitResult[], reply: string, suggestions: string[] }> => {

  const token = getToken()
  if (!token) throw new Error('Chưa đăng nhập')

  // Thêm context về outfit hiện tại vào prompt
  const currentContext = currentOutfits.length > 0
    ? `Outfit hiện tại: ${currentOutfits[0].items.map(i => i.name).join(', ')}. `
    : ''

  const response = await fetch('/api/ai/outfit-suggest', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      userPrompt: `${currentContext}Yêu cầu chỉnh sửa: ${message}\n\n${buildSystemAddendum()}`,
      closetItems: closetItems.slice(0, 10),
      avatarData,
    }),
  })

  if (!response.ok) {
    throw new Error('Không thể xử lý yêu cầu. Vui lòng thử lại.')
  }

  const data = await response.json()
  const outfits = parseBackendResponse(data)

  return {
    outfits,
    reply: data.explanation ?? `Đã điều chỉnh theo yêu cầu "${message}"`,
    suggestions: ['Thử lại', 'Xem lựa chọn khác', 'Tông khác'],
  }
}
