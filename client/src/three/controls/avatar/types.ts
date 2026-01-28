// src/three/controls/avatar/types.ts

export interface BodyMeasurements {
    height: number; // cm
    weight: number; // kg
    chest: number;  // cm
    waist: number;  // cm
    hips: number;   // cm (Lưu ý: code cũ bạn dùng 'hip' hay 'hips' thì thống nhất, ở đây tôi dùng 'hips')
    shoulder?: number; // cm (Optional)
    arm?: number;      // cm (Optional - Bắp tay)
}

export interface AvatarProps {
    body: BodyMeasurements;
    clothingTexture?: string | null; // Tạm thời để null hoặc string
    pose?: 'Idle' | 'Walk' | 'Pose'; // Khớp với tên Action trong Blender
}