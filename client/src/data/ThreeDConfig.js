// src/data/ThreeDConfig.js
//
// Mỗi sản phẩm khai báo từng size riêng với file GLB tương ứng.

export const MODEL_INJECTION = {
    // Sản phẩm ID 3 — Áo Thun
    "3": {
        enable: true,

        colors: [
            { name: 'Trắng', hex: '#f5f5f5', fabric: { preset: 'cotton-soft' } },
            { name: 'Đen', hex: '#222222', fabric: { preset: 'cotton-heavy' } },
            { name: 'Xanh Navy', hex: '#1f2a44', fabric: { preset: 'cotton-heavy' } },
            { name: 'Be', hex: '#d4c3a3', fabric: { preset: 'cotton' } }
        ],

        // Tuning chất liệu vải chung cho mọi size
        softness: {
            roughness: 0.8,
            metalness: 0.05,
            envMapIntensity: 0.5,
            skinOffset: 0.003
        },

        fabric: {
            kind: 'knit',
            weaveScale: 30,
            weaveStrength: 0.48,
            wrinkleScale: 6.2,
            wrinkleStrength: 0.1,
            normalScale: 0.42,
            roughnessBias: 0.02
        },

        // Số đo thật theo từng size (cm) để tính fit chính xác hơn.
        measurementProfile: {
            garmentType: 'top',
            sizeSpecs: {
                S: {
                    chest: 94,
                    waist: 90,
                    hips: 96,
                    shoulder: 42.5,
                    sleeveLength: 19.5,
                    garmentLength: 65,
                    stretchWarp: 0.06,
                    stretchWeft: 0.10,
                    fitIntent: 'regular'
                },
                M: {
                    chest: 100,
                    waist: 96,
                    hips: 102,
                    shoulder: 44,
                    sleeveLength: 21,
                    garmentLength: 68,
                    stretchWarp: 0.06,
                    stretchWeft: 0.10,
                    fitIntent: 'regular'
                },
                L: {
                    chest: 106,
                    waist: 102,
                    hips: 108,
                    shoulder: 45.5,
                    sleeveLength: 22.5,
                    garmentLength: 71,
                    stretchWarp: 0.06,
                    stretchWeft: 0.10,
                    fitIntent: 'regular'
                }
            }
        },

        sizes: {
            S: {
                url: "/models/Ao_Thun_sizeS.glb",
                autoNormalize: false,
                followAvatarBones: true,
                softness: {
                    morphInfluence: 0.92,
                    morphSmoothing: 0.2,
                    maxMorphInfluence: 0.98
                }
            },
            M: {
                url: "/models/Ao_Thun_sizeM.glb",
                autoNormalize: false,
                followAvatarBones: true,
                softness: {
                    morphInfluence: 0.78,
                    morphSmoothing: 0.18,
                    maxMorphInfluence: 0.9
                }
            },
            L: {
                url: "/models/Ao_Thun_sizeL.glb",
                autoNormalize: false,
                followAvatarBones: true,
                softness: {
                    morphInfluence: 0.65,
                    morphSmoothing: 0.16,
                    maxMorphInfluence: 0.82
                }
            }
        }
    },

    // Sản phẩm ID 11
    "11": {
        enable: true,

        colors: [
            { name: 'Denim Raw Indigo', hex: '#1f2a44', fabric: { preset: 'denim-raw' } },
            { name: 'Denim Stone Washed', hex: '#6f8fb5', fabric: { preset: 'denim-stone-washed' } },
            { name: 'Denim Black Fade', hex: '#30343b', fabric: { preset: 'denim-black-fade' } }
        ],

        softness: {
            roughness: 0.84,
            metalness: 0.03,
            envMapIntensity: 0.42,
            skinOffset: 0.0035
        },

        fabric: {
            preset: 'denim-raw'
        },

        measurementProfile: {
            garmentType: 'bottom',
            sizeSpecs: {
                S: {
                    waist: 68,
                    hips: 98,
                    thigh: 62,
                    legOpening: 56,
                    garmentLength: 46,
                    stretchWarp: 0.05,
                    stretchWeft: 0.08,
                    fitIntent: 'regular'
                },
                M: {
                    waist: 72,
                    hips: 102,
                    thigh: 66,
                    legOpening: 58,
                    garmentLength: 48,
                    stretchWarp: 0.05,
                    stretchWeft: 0.08,
                    fitIntent: 'regular'
                },
                L: {
                    waist: 76,
                    hips: 106,
                    thigh: 70,
                    legOpening: 60,
                    garmentLength: 50,
                    stretchWarp: 0.05,
                    stretchWeft: 0.08,
                    fitIntent: 'regular'
                }
            }
        },

        sizes: {
            S: {
                url: "/models/QuanS.glb",
                autoNormalize: false,
                followAvatarBones: true,
                softness: {
                    morphInfluence: 0.78,
                    morphSmoothing: 0.2,
                    maxMorphInfluence: 0.9
                }
            },
            M: {
                url: "/models/QuanM.glb",
                autoNormalize: false,
                followAvatarBones: true,
                softness: {
                    morphInfluence: 0.72,
                    morphSmoothing: 0.19,
                    maxMorphInfluence: 0.86
                }
            },
            L: {
                url: "/models/QuanL.glb",
                autoNormalize: false,
                followAvatarBones: true,
                softness: {
                    morphInfluence: 0.68,
                    morphSmoothing: 0.18,
                    maxMorphInfluence: 0.84
                }
            }
        }
    }
};