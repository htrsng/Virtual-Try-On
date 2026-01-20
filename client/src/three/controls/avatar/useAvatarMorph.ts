import { useEffect } from 'react';
import * as THREE from 'three';
import type { BodyMorph } from './types';

export const useAvatarMorph = (
    mesh: THREE.Mesh | null,
    body: BodyMorph
) => {
    useEffect(() => {
        // Kiểm tra xem mesh có hỗ trợ Morph không
        if (!mesh?.morphTargetDictionary || !mesh.morphTargetInfluences) return;

        const dict = mesh.morphTargetDictionary;
        const infl = mesh.morphTargetInfluences;

        // Hàm helper: Gán giá trị Morph an toàn
        const set = (name: string, value: number) => {
            const idx = dict[name];
            // Chỉ gán nếu model có morph key đó
            if (idx !== undefined) {
                // Clamp: Đảm bảo giá trị luôn nằm trong khoảng 0 đến 1
                // 0 = Trạng thái gốc (Gầy nhất/Mặc định)
                // 1 = Biến đổi tối đa (Béo nhất/To nhất)
                infl[idx] = THREE.MathUtils.clamp(value, 0, 1);
            }
        };

        // --- SỬA LỖI TẠI ĐÂY ---
        // Bỏ hết các logic if/else cứng nhắc.
        // Thay vào đó, map trực tiếp giá trị từ slider (body.weight) vào morph target.

        // 1. Độ béo (Fat):
        // Nếu body.weight = 0 -> Model về dáng gốc (gầy).
        // Nếu body.weight = 1 -> Model béo tối đa.
        set('Fat_Full', body.weight);

        // 2. Ngực (Chest):
        // Bỏ Math.max(0.9...) đi để người dùng có thể chỉnh ngực nhỏ lại nếu muốn.
        set('Chest_Big', body.chest);

        // 3. Eo (Waist):
        set('Waist_Big', body.waist);

        // 4. Hông (Hips):
        set('Hips_Wide', body.hips);

        // 5. Các chỉ số mở rộng (nếu model có hỗ trợ như đã bàn trước đó)
        // set('Shoulders_Wide', body.shoulders);
        // set('Arms_Thick', body.arms);

    }, [mesh, body]);
};