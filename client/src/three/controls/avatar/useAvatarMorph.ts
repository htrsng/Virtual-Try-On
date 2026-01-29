import { useEffect } from 'react';
import * as THREE from 'three';
import type { BodyMeasurements } from './types';

// 1. CẤU HÌNH CHUẨN (Cơ thể mặc định trong Blender)
const STANDARD = {
    height: 165,
    weight: 50,  // Mốc chuẩn: Dưới 50 là Gầy, Trên 50 là Béo
    chest: 85,
    waist: 68,
    hip: 92,
    shoulder: 38,
    thigh: 50,
    belly: 70,
    arm: 26,
};

// 2. BIÊN ĐỘ DAO ĐỘNG (Độ nhạy của thanh trượt)
const RANGE = {
    weight: 30, // ±30kg (Tức là Max ~80kg, Min ~20kg)
    chest: 15,
    waist: 12,
    hip: 15,
    shoulder: 5,
    thigh: 10,
    belly: 20,
    arm: 6,
};

export const useAvatarMorph = (
    targetMesh: THREE.SkinnedMesh | undefined | null,
    measurements: BodyMeasurements
) => {
    useEffect(() => {
        if (!targetMesh || !targetMesh.morphTargetDictionary || !targetMesh.morphTargetInfluences || !measurements) {
            return;
        }

        const dict = targetMesh.morphTargetDictionary;
        const influences = targetMesh.morphTargetInfluences;

        // Reset về 0
        influences.fill(0);

        // Hàm tìm Index thông minh
        const getIndex = (name: string) => {
            if (dict[name] !== undefined) return dict[name];
            return Object.keys(dict).find(k => k.toLowerCase() === name.toLowerCase())
                ? dict[Object.keys(dict).find(k => k.toLowerCase() === name.toLowerCase())!]
                : undefined;
        };

        // HÀM APPLY MORPH THÔNG MINH (Xử lý cả Béo & Gầy)
        // bmiShift: > 0 là hướng béo, < 0 là hướng gầy
        const applyMorph = (keyBase: string, value: number, std: number, rng: number, bmiShift: number = 0) => {
            if (value === undefined) return;

            // Tính độ lệch thực tế (User nhập)
            const realDiff = value - std;

            // Cộng hưởng với độ lệch BMI (Cân nặng)
            // Ví dụ: User nhập eo 68 (Chuẩn) nhưng cân nặng 90kg (bmiShift cao)
            // => virtualDiff sẽ dương lớn => Kích hoạt Waist_Max (Bụng to ra do mỡ)
            const virtualDiff = realDiff + (bmiShift * rng);

            const factor = Math.min(Math.abs(virtualDiff) / rng, 1.0);

            if (virtualDiff > 0) {
                // Hướng Tăng (Max)
                const idx = getIndex(`${keyBase}_Max`);
                if (idx !== undefined) influences[idx] = factor;
            } else {
                // Hướng Giảm (Min)
                const idx = getIndex(`${keyBase}_Min`);
                if (idx !== undefined) influences[idx] = factor;
            }
        };

        // ==================================================================
        // 3. XỬ LÝ CÂN NẶNG (MASTER CONTROL)
        // ==================================================================
        let bmiShift = 0; // Biến điều hướng toàn thân

        if (measurements.weight) {
            const weightDiff = measurements.weight - STANDARD.weight;

            // A. Ưu tiên dùng Key Chuyên Dụng (Fat_Full / Thin_Full)
            const fatIdx = getIndex('Fat_Full') ?? getIndex('Fat');
            const thinIdx = getIndex('Thin_Full') ?? getIndex('Thin'); // ✅ Key cho người gầy

            if (weightDiff > 0 && fatIdx !== undefined) {
                // Béo: Dùng Fat_Full
                influences[fatIdx] = Math.min(weightDiff / RANGE.weight, 1.0);
            }
            else if (weightDiff < 0 && thinIdx !== undefined) {
                // Gầy: Dùng Thin_Full
                influences[thinIdx] = Math.min(Math.abs(weightDiff) / (RANGE.weight * 0.7), 1.0);
            }
            else {
                // B. Fallback (Nếu không có Key chuyên dụng, dùng bmiShift để tác động lên từng bộ phận)
                // Đây là tính năng "Dự phòng" giúp nhân vật vẫn béo/gầy dù chưa có Fat_Full/Thin_Full
                bmiShift = weightDiff / RANGE.weight;
            }
        }

        // ==================================================================
        // 4. ÁP DỤNG LÊN TỪNG BỘ PHẬN
        // ==================================================================
        // bmiShift sẽ tự động cộng thêm mỡ (nếu dương) hoặc rút bớt thịt (nếu âm)

        applyMorph('Chest', measurements.chest, STANDARD.chest, RANGE.chest, bmiShift * 0.5);
        applyMorph('Waist', measurements.waist, STANDARD.waist, RANGE.waist, bmiShift * 1.2); // Bụng ảnh hưởng nhiều nhất
        applyMorph('Hip', measurements.hips, STANDARD.hip, RANGE.hip, bmiShift * 0.8);
        applyMorph('Shoulder', measurements.shoulder, STANDARD.shoulder, RANGE.shoulder, bmiShift * 0.3);
        applyMorph('Thigh', measurements.thigh, STANDARD.thigh, RANGE.thigh, bmiShift * 0.8);
        applyMorph('Belly', measurements.belly, STANDARD.belly, RANGE.belly, bmiShift * 1.5);
        applyMorph('Arm', measurements.arm, STANDARD.arm, RANGE.arm, bmiShift * 0.6);

    }, [targetMesh, measurements]);
};