import type { GarmentConfig } from './garment';
export interface CatalogVariant {
    color?: {
        hex?: string;
        name?: string;
        image?: string;
        img?: string;
    };
    sizes?: {
        size: string;
        stock: number;
    }[];
    model3D?: GarmentConfig;
}
export interface CatalogProduct {
    size?: string;
    colorHex?: string;
    _id?: string;
    id?: string | number;
    productId?: string | number;
    itemId?: string;
    name?: string;
    category?: string;
    price?: number;
    imageUrl?: string;
    thumbnailUrl?: string;
    thumbnail?: string;
    img?: string;
    image?: string;
    color?: string;
    slot?: string;
    suggestedSize?: string;
    purchasedSize?: string;
    sizeReason?: string;
    owned?: boolean;
    model3D?: GarmentConfig;
    model3d?: GarmentConfig;
    variants?: CatalogVariant[];
    aiStylist?: {
        styles?: string[];
        occasions?: string[];
        colorTone?: string;
    };
}
