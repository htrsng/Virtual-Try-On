// src/three/controls/avatar/types.ts

export interface BodyMeasurements {
    // Nhóm 1: Cơ bản
    height: number; // cm
    weight: number; // kg

    // Nhóm 2: Thông số Chính (Vòng to)
    chest: number;  // Vòng 1
    waist: number;  // Vòng 2
    hips: number;   // Vòng 3

    // Nhóm 3: Thông số Chi tiết (Bộ phận nhỏ)
    shoulder: number; // Vai
    arm: number;      // Bắp tay
    thigh: number;    // Bắp đùi
    belly: number;    // Bụng (để chỉnh độ béo bụng riêng biệt với cân nặng)
    legLength: number;
}

export interface AvatarProps {
    body: BodyMeasurements;
    clothingTexture?: string | null;
    pose?: string;
}