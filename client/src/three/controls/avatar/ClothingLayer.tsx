import React from 'react';
import { Decal, useTexture } from '@react-three/drei';
import type { ClothingLayerProps } from './types';

export const ClothingLayer: React.FC<ClothingLayerProps> = ({ textureUrl, scale, position }) => {
    const texture = useTexture(textureUrl);

    return (
        <Decal
            position={position}
            rotation={[0, 0, 0]}
            scale={scale}
            map={texture}
            depthTest={true} // Quan trọng: Giúp hình in bám sát vào bề mặt da
        />
    );
};