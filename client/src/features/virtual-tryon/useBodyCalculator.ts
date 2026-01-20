import { useState } from 'react';
import { toast } from 'react-toastify';

// Hàm tiện ích: Chuyển đổi Morph (0-1) sang CM
export const morphToCm = (morphValue: number, type: 'chest' | 'waist' | 'hips') => {
    const ranges = {
        chest: { min: 75, max: 110 },
        waist: { min: 58, max: 95 },
        hips: { min: 80, max: 115 }
    };
    const range = ranges[type];
    return Math.round(range.min + morphValue * (range.max - range.min));
};

export const useBodyCalculator = (initialHeight: number = 170, initialWeight: number = 60) => {
    // State Body
    const [realHeight, setRealHeight] = useState(initialHeight);
    const [realWeight, setRealWeight] = useState(initialWeight);
    const [scaleY, setScaleY] = useState(1.0);

    // Morph Targets (0-1)
    const [fat, setFat] = useState(0);
    const [chest, setChest] = useState(0);
    const [waist, setWaist] = useState(0);
    const [hips, setHips] = useState(0);

    const [errorMsg, setErrorMsg] = useState('');
    const [fitScore, setFitScore] = useState(0);

    const calculateBody = (selectedSize: string | null) => {
        // Validation
        if (realHeight < 140 || realHeight > 200) {
            setErrorMsg('Chiều cao phải từ 140cm - 200cm');
            toast.error('Chiều cao không hợp lệ!');
            return;
        }
        if (realWeight < 40 || realWeight > 120) {
            setErrorMsg('Cân nặng phải từ 40kg - 120kg');
            toast.error('Cân nặng không hợp lệ!');
            return;
        }
        setErrorMsg('');

        // 1. Tính chiều cao model
        const newScale = 1 + (realHeight - 170) * 0.005;
        setScaleY(newScale);

        // 2. Tính BMI
        const h_meter = realHeight / 100;
        const bmi = realWeight / (h_meter * h_meter);

        // 3. Quy đổi BMI sang độ béo (0-1)
        let estimatedFat = (bmi - 18.5) / (30 - 18.5);
        estimatedFat = Math.max(0, Math.min(1, estimatedFat));
        setFat(estimatedFat);

        // 4. Ước lượng các vòng
        let waistAdjust = estimatedFat * 0.9;
        if (waistAdjust < 0.2) waistAdjust = 0.1;

        let chestAdjust = estimatedFat * 0.6;
        let hipsAdjust = estimatedFat * 0.7;

        setWaist(Math.min(1, waistAdjust));
        setChest(Math.min(1, chestAdjust));
        setHips(Math.min(1, hipsAdjust));

        // 5. Tính Fit Score
        let score = 100 - Math.abs(bmi - 22) * 4;
        if (selectedSize === 'S' && bmi > 24) score -= 20;
        if (selectedSize === 'XL' && bmi < 19) score -= 20;

        score = Math.max(50, Math.min(100, score));
        setFitScore(Math.round(score));

        toast.success(`Đã cập nhật body! Điểm phù hợp: ${Math.round(score)}/100`);
    };

    return {
        realHeight, setRealHeight,
        realWeight, setRealWeight,
        scaleY,
        fat, setFat,
        chest, setChest,
        waist, setWaist,
        hips, setHips,
        errorMsg,
        fitScore,
        calculateBody
    };
};