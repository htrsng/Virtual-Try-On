export type BodyMorph = {
    height: number;
    weight: number;
    chest: number;
    waist: number;
    hips: number;
};

export type AvatarPose = 'idle' | 'walking';

export interface AvatarProps {
    body: BodyMorph;
    clothingTexture?: string | null;
    clothingScale?: number;
    pose?: AvatarPose;
}

export interface ClothingLayerProps {
    textureUrl: string;
    scale: [number, number, number];
    position: [number, number, number];
}