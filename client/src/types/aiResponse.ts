import type { CatalogProduct } from './catalog';
import type { AIOutfitItem } from './aiOutfit';
import type { OutfitResult } from './outfit';
import type { Profile } from '../contexts/FittingRoomContext';
export type AvatarInput = Partial<Profile> | {
    avatar: Profile;
    layeredGarments?: object;
};
export interface SuggestedItem extends CatalogProduct {
    type?: 'closet' | 'shop';
    layer?: string;
    model3DUrl?: string;
    model3dUrl?: string;
    source?: AIOutfitItem['source'];
}
export interface SuggestedOutfit {
    name?: string;
    description?: string;
    occasion?: string;
    aiReason?: string;
    items?: SuggestedItem[];
}
export interface AIResponse {
    outfits?: SuggestedOutfit[];
    outfit?: SuggestedItem[];
    suggestions?: SuggestedItem[];
    occasion?: string;
    explanation?: string;
    message?: string;
    outfitName?: string;
    stats?: OutfitResult['stats'];
}
