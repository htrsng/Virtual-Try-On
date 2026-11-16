export interface ProductSizeMeasurement {
    size: string; // 'S', 'M', 'L', 'XL'
    chest?: [number, number]; // [min, max] in cm
    waist?: [number, number];
    hips?: [number, number];
    length?: number; // cm
    shoulder?: number; // cm
}

export interface AIOutfitItem {
    productId: string;
    type: 'closet' | 'shop';
    layer: 'tops' | 'bottoms' | 'outerwear' | 'shoes' | 'dresses';
    model3DUrl: string;
    thumbnail: string;
    name: string;
    price?: number;
    source?: 'order' | 'new-arrival' | 'import';
    defaultColor?: string;
    sizeChart?: ProductSizeMeasurement[];
    recommendedSize?: string;
    fitScore?: number;
}

export interface AIOutfit {
    id: string;
    name: string;
    description?: string;
    items: AIOutfitItem[];
    occasion?: string;
}
