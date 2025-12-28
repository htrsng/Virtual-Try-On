// Định nghĩa các chỉ số cơ thể có thể biến đổi
export interface MorphParams {
    height: number;      // 0 đến 1 (Thấp -> Cao)
    waist: number;       // 0 đến 1 (Eo nhỏ -> Eo to)
    chest: number;       // 0 đến 1 (Ngực nhỏ -> Ngực to)
    hips: number;        // 0 đến 1 (Hông nhỏ -> Hông to)
    muscle: number;      // 0 đến 1 (Gầy -> Cơ bắp)
}

// Giá trị mặc định
export const DEFAULT_MORPHS: MorphParams = {
    height: 0.5,
    waist: 0.5,
    chest: 0.5,
    hips: 0.5,
    muscle: 0.5,
};