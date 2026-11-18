import type { GarmentConfig } from '../types/garment';
export const MODEL_INJECTION: Record<string, GarmentConfig>;
export interface ProductWithModel {
    id: string | number;
    name?: string;
    model3D?: GarmentConfig;
}
