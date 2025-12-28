import React from 'react';

export const Lighting = () => {
    return (
        <>
            <ambientLight intensity={0.6} color="#ffffff" />
            <directionalLight
                position={[2, 5, 2]}
                intensity={1.5}
                castShadow
                shadow-bias={-0.0001}
            />
            <spotLight
                position={[0, 2, 5]}
                intensity={1}
                angle={0.5}
                penumbra={1}
            />
            {/* Ánh sáng phụ từ phía sau để tạo khối (Rim light) */}
            <spotLight position={[-5, 5, -5]} intensity={1} color="#b0c4de" />
        </>
    );
};