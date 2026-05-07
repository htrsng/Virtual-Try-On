export interface AIOutfitItem {
    productId: string;
    type: 'closet' | 'shop';
    layer: 'tops' | 'bottoms' | 'outerwear' | 'shoes' | 'dresses';
    model3DUrl: string;
    thumbnail: string;
    name: string;
    price?: number;
    source?: 'order' | 'new-arrival' | 'import';
}

export interface AIOutfit {
    id: string;
    name: string;
    description?: string;
    items: AIOutfitItem[];
    occasion?: string;
}
