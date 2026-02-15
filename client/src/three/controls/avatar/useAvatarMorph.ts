import * as THREE from 'three';
// SỬA LỖI: Thêm từ khóa 'type' vào trước BodyMeasurements
import type { BodyMeasurements } from './types';

const STANDARD = {
    weight: 55, chest: 85, waist: 68, hips: 92,
    shoulder: 38, arm: 26, thigh: 50, belly: 70,
};

const RANGE = {
    weight: 30, chest: 15, waist: 12, hips: 15,
    shoulder: 5, arm: 6, thigh: 10, belly: 20,
};

/**
 * Hàm cập nhật hình thể (Ghi đè lên Animation Mixer mỗi khung hình)
 */
export const updateAvatarMorph = (targetMesh: THREE.SkinnedMesh, measurements: BodyMeasurements) => {
    if (!targetMesh.morphTargetDictionary || !targetMesh.morphTargetInfluences) return;

    const dict = targetMesh.morphTargetDictionary;
    const influences = targetMesh.morphTargetInfluences;

    // 1. Reset về 0 trước khi tính toán mới
    influences.fill(0);

    const apply = (key: string, value: number) => {
        if (dict[key] !== undefined) {
            influences[dict[key]] = Math.max(0, Math.min(1, value));
        }
    };

    // 2. Xử lý Cân nặng (Fat_Full / Thin_Full)
    const weightDiff = (measurements.weight - STANDARD.weight) / RANGE.weight;
    if (weightDiff > 0) apply('Fat_Full', weightDiff);
    else apply('Thin_Full', Math.abs(weightDiff));

    // 3. Áp dụng từng bộ phận (Khớp chính xác tên Shape Key trong Blender)
    const parts = [
        { name: 'Chest', val: measurements.chest, std: STANDARD.chest, rng: RANGE.chest },
        { name: 'Waist', val: measurements.waist, std: STANDARD.waist, rng: RANGE.waist },
        { name: 'Hip', val: measurements.hips, std: STANDARD.hips, rng: RANGE.hips },
        { name: 'Shoulder', val: measurements.shoulder, std: STANDARD.shoulder, rng: RANGE.shoulder },
        { name: 'Thigh', val: measurements.thigh, std: STANDARD.thigh, rng: RANGE.thigh },
        { name: 'Belly', val: measurements.belly, std: STANDARD.belly, rng: RANGE.belly },
        { name: 'Arm', val: measurements.arm, std: STANDARD.arm, rng: RANGE.arm },
    ];

    parts.forEach(p => {
        const diff = (p.val - p.std) / p.rng;
        if (diff > 0) apply(`${p.name}_Max`, diff);
        else apply(`${p.name}_Min`, Math.abs(diff));
    });
};