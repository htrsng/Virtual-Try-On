import type { GarmentFabricProfile } from '../features/virtual-tryon/garmentBinding';
import type { GarmentSizeSpec } from '../features/virtual-tryon/components/sizeRecommendationEngine';
export interface GarmentColor {
    name?: string;
    hex: string;
    fabric?: GarmentFabricProfile;
}
export interface GarmentSoftness {
    morphInfluence?: number;
    morphSmoothing?: number;
    maxMorphInfluence?: number;
    roughness?: number;
    metalness?: number;
    envMapIntensity?: number;
    skinOffset?: number;
}
export interface GarmentSize {
    url: string;
    autoNormalize?: boolean;
    followAvatarBones?: boolean;
    scale?: number;
    translate?: [
        number,
        number,
        number
    ];
    softness?: GarmentSoftness;
    fabric?: GarmentFabricProfile;
    colors?: GarmentColor[];
}
export interface GarmentConfig extends Record<string, unknown> {
    enable?: boolean;
    url?: string;
    sizes?: Record<string, GarmentSize>;
    colors?: GarmentColor[];
    autoNormalize?: boolean;
    followAvatarBones?: boolean;
    scale?: number;
    translate?: [
        number,
        number,
        number
    ];
    softness?: GarmentSoftness;
    fabric?: GarmentFabricProfile;
    measurementProfile?: {
        garmentType?: string;
        sizeSpecs?: Record<string, GarmentSizeSpec>;
    };
}
