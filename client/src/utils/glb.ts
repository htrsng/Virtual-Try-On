import { OutfitItem, OutfitResult } from '../types/outfit';
import { MODEL_INJECTION } from '../data/ThreeDConfig';

export interface SelectionState {
  [productId: string]: {
    size: string;
    colorHex?: string;
  };
}

export function resolveGlbUrl(
  item: OutfitItem,
  selectedSize: string,
  selectedColorHex?: string
): string | undefined {
  if (item.glbVariants && item.glbVariants.length > 0) {
    const variant = item.glbVariants.find(
      v => v.size === selectedSize && v.colorHex === selectedColorHex
    );

    if (!variant) {
      const sizeMatch = item.glbVariants.find(v => v.size === selectedSize);
      return sizeMatch?.glbUrl ?? item.glbVariants[0].glbUrl;
    }
    return variant.glbUrl;
  }

  // If glbVariants is missing, return undefined so the caller can fall back to resolveModel3D
  return undefined;
}

export function resolveOutfitGlbs(
  outfit: OutfitResult,
  selections: SelectionState
): { productId: string; glbUrl: string | undefined }[] {
  return outfit.items.map(item => ({
    productId: item.id,
    glbUrl: resolveGlbUrl(
      item,
      selections[item.id]?.size || 'M',
      selections[item.id]?.colorHex
    ),
  }));
}

export function resolveVariantId(
  productId: string,
  size: string,
  colorHex: string,
  variants?: { size: string; colorHex: string; variantId?: string }[]
): string | undefined {
  if (!variants) return undefined;
  const variant = variants.find(v => v.size === size && v.colorHex === colorHex);
  return variant?.variantId;
}

export function initSelection(outfit: OutfitResult): SelectionState {
  const selections: SelectionState = {};
  if (!outfit || !outfit.items) return selections;

  outfit.items.forEach(item => {
    let defaultColor = item.color;
    
    // Explicit override for AI styles (Áo and Quần)
    const itemName = (item.name || '').toLowerCase();
    if (itemName.includes('áo')) {
      defaultColor = '#f5f5f5'; // Trắng
    } else if (itemName.includes('quần')) {
      defaultColor = '#222222'; // Đen
    } else if (item.availableColors && item.availableColors.length > 0) {
      const firstColor = item.availableColors[0];
      if (typeof firstColor === 'string') {
        defaultColor = firstColor;
      } else {
        const defaultColorObj = (item.availableColors as any[]).find((c: any) => c.isDefault);
        defaultColor = defaultColorObj ? defaultColorObj.hex : firstColor.hex;
      }
    }
    
    selections[item.id] = {
      size: item.selectedSize || item.suggestedSize || (item.availableSizes && item.availableSizes.length > 0 ? item.availableSizes[0] : 'M'),
      colorHex: item.selectedColor || defaultColor,
    };
  });
  return selections;
}
