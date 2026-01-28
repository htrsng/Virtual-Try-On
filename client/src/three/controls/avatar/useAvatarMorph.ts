// src/three/controls/avatar/useAvatarMorph.ts

import { useEffect } from 'react';
import * as THREE from 'three';

// ✅ FIX: Thêm 'type' vào import để thỏa mãn verbatimModuleSyntax
import type { BodyMeasurements } from './types';

const STANDARD = {
    chest: 85,
    waist: 68,
    hips: 92,
    shoulder: 38,
    arm: 26,
    thigh: 50,
    belly: 70
};

const RANGE = {
    chest: 15,
    waist: 12,
    hips: 15,
    shoulder: 5,
    arm: 6,
    thigh: 10,
    belly: 20
};

export const useAvatarMorph = (
    targetMesh: THREE.SkinnedMesh | undefined | null,
    measurements: BodyMeasurements
) => {
    useEffect(() => {
        if (!targetMesh || !targetMesh.morphTargetDictionary || !targetMesh.morphTargetInfluences) return;

        const dict = targetMesh.morphTargetDictionary;
        const influences = targetMesh.morphTargetInfluences;

        influences.fill(0);

        const updateMorph = (name: string, currentValue: number, standardValue: number, range: number) => {
            if (!currentValue) return;

            const diff = currentValue - standardValue;
            const factor = Math.min(Math.abs(diff) / range, 1.0);

            if (diff > 0) {
                const idx = dict[`${name}_Max`];
                if (idx !== undefined) influences[idx] = factor;
            } else {
                const idx = dict[`${name}_Min`];
                if (idx !== undefined) influences[idx] = factor;
            }
        };

        updateMorph('Chest', measurements.chest, STANDARD.chest, RANGE.chest);
        updateMorph('Waist', measurements.waist, STANDARD.waist, RANGE.waist);
        updateMorph('Hip', measurements.hips, STANDARD.hips, RANGE.hips);
        updateMorph('Shoulder', measurements.shoulder || STANDARD.shoulder, STANDARD.shoulder, RANGE.shoulder);
        updateMorph('Arm', measurements.arm || STANDARD.arm, STANDARD.arm, RANGE.arm);

        const bmi = measurements.weight / ((measurements.height / 100) ** 2);
        if (bmi > 22) {
            const fatFactor = Math.min((bmi - 22) / 10, 1.0);
            const bellyIdx = dict['Belly_Max'];
            const thighIdx = dict['Thigh_Max'];
            if (bellyIdx !== undefined) influences[bellyIdx] = fatFactor;
            if (thighIdx !== undefined) influences[thighIdx] = fatFactor * 0.8;
        }

    }, [targetMesh, measurements]);
};