// src/data/ThreeDConfig.js
//
// Mỗi sản phẩm khai báo từng size riêng với file GLB tương ứng.

export const MODEL_INJECTION = {
    // Sản phẩm ID 1 — Áo Thun
    "1": {
        enable: true,

        colors: [
            { name: 'Trắng', hex: '#f5f5f5', fabric: { preset: 'cotton-soft' } },
            { name: 'Đen', hex: '#222222', fabric: { preset: 'cotton-heavy' } },
            { name: 'Xanh Navy', hex: '#1f2a44', fabric: { preset: 'cotton-heavy' } },
            { name: 'Be', hex: '#d4c3a3', fabric: { preset: 'cotton' } }
        ],

        // Tuning chất liệu vải chung cho mọi size
        softness: {
            roughness: 0.95,
            metalness: 0.0,
            envMapIntensity: 0.2,
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

    "8": {
        enable: true,

        softness: {
            roughness: 1.0,
            metalness: 0.0,
            envMapIntensity: 0.1,
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
    },

    "16": {
        enable: true,

        softness: {
            roughness: 0.75,
            metalness: 0.0,
            envMapIntensity: 0.4,
            skinOffset: 0.005
        },

        fabric: {
            preset: 'silk'
        },

        measurementProfile: {
            garmentType: 'dress',
            sizeSpecs: {
                S: {
                    chest: 84,
                    waist: 66,
                    hips: 90,
                    shoulder: 36,
                    garmentLength: 85,
                    stretchWarp: 0.04,
                    stretchWeft: 0.06,
                    fitIntent: 'regular'
                },
                M: {
                    chest: 88,
                    waist: 70,
                    hips: 94,
                    shoulder: 38,
                    garmentLength: 87,
                    stretchWarp: 0.04,
                    stretchWeft: 0.06,
                    fitIntent: 'regular'
                },
                L: {
                    chest: 92,
                    waist: 74,
                    hips: 98,
                    shoulder: 40,
                    garmentLength: 89,
                    stretchWarp: 0.04,
                    stretchWeft: 0.06,
                    fitIntent: 'regular'
                }
            }
        },

        sizes: {
            S: {
                url: "/models/vay1-S.glb",
                autoNormalize: false,
                followAvatarBones: true,
                softness: {
                    morphInfluence: 0.85,
                    morphSmoothing: 0.25,
                    maxMorphInfluence: 0.95
                }
            },
            M: {
                url: "/models/vay1-M.glb",
                autoNormalize: false,
                followAvatarBones: true,
                softness: {
                    morphInfluence: 0.8,
                    morphSmoothing: 0.22,
                    maxMorphInfluence: 0.9
                }
            },
            L: {
                url: "/models/vay1-L.glb",
                autoNormalize: false,
                followAvatarBones: true,
                softness: {
                    morphInfluence: 0.75,
                    morphSmoothing: 0.2,
                    maxMorphInfluence: 0.85
                }
            }
        }
    },

    // Sản phẩm ID 17 — Váy 2
    "17": {
        enable: true,

        colors: [
            { name: 'Beige', hex: '#E8DCC8', fabric: { preset: 'silk' } },
            { name: 'Trắng', hex: '#FFFFFF', fabric: { preset: 'silk' } }
        ],

        softness: {
            roughness: 0.75,
            metalness: 0.0,
            envMapIntensity: 0.4,
            skinOffset: 0.005
        },

        fabric: {
            preset: 'silk'
        },

        measurementProfile: {
            garmentType: 'dress',
            sizeSpecs: {
                S: {
                    chest: 84,
                    waist: 66,
                    hips: 90,
                    shoulder: 36,
                    garmentLength: 85,
                    stretchWarp: 0.04,
                    stretchWeft: 0.06,
                    fitIntent: 'regular'
                },
                M: {
                    chest: 88,
                    waist: 70,
                    hips: 94,
                    shoulder: 38,
                    garmentLength: 87,
                    stretchWarp: 0.04,
                    stretchWeft: 0.06,
                    fitIntent: 'regular'
                },
                L: {
                    chest: 92,
                    waist: 74,
                    hips: 98,
                    shoulder: 40,
                    garmentLength: 89,
                    stretchWarp: 0.04,
                    stretchWeft: 0.06,
                    fitIntent: 'regular'
                }
            }
        },

        sizes: {
            S: {
                url: "/models/vay2-S.glb",
                autoNormalize: false,
                followAvatarBones: true,
                softness: {
                    morphInfluence: 0.85,
                    morphSmoothing: 0.25,
                    maxMorphInfluence: 0.95
                }
            },
            M: {
                url: "/models/vay2-M.glb",
                autoNormalize: false,
                followAvatarBones: true,
                softness: {
                    morphInfluence: 0.8,
                    morphSmoothing: 0.22,
                    maxMorphInfluence: 0.9
                }
            },
            L: {
                url: "/models/vay2-L.glb",
                autoNormalize: false,
                followAvatarBones: true,
                softness: {
                    morphInfluence: 0.75,
                    morphSmoothing: 0.2,
                    maxMorphInfluence: 0.85
                }
            }
        }
    },

    // Sản phẩm ID 4 — Áo Croptop
    "4": {
        enable: true,
        colors: [
            { name: 'Trắng', hex: '#FFFFFF', fabric: { preset: 'cotton-soft' } },
            { name: 'Đen', hex: '#1A1A1A', fabric: { preset: 'cotton-heavy' } }
        ],
        softness: {
            roughness: 0.95,
            metalness: 0.0,
            envMapIntensity: 0.2,
            skinOffset: 0.003
        },
        fabric: {
            preset: 'cotton-soft'
        },
        measurementProfile: {
            garmentType: 'top',
            sizeSpecs: {
                S: { chest: 84, waist: 64, hips: 80, shoulder: 36, sleeveLength: 15, garmentLength: 35, fitIntent: 'tight' },
                M: { chest: 88, waist: 68, hips: 84, shoulder: 38, sleeveLength: 16, garmentLength: 37, fitIntent: 'tight' },
                L: { chest: 92, waist: 72, hips: 88, shoulder: 40, sleeveLength: 17, garmentLength: 39, fitIntent: 'tight' }
            }
        },
        sizes: {
            S: { url: "/models/croptopS.glb", autoNormalize: false, followAvatarBones: true },
            M: { url: "/models/croptopM.glb", autoNormalize: false, followAvatarBones: true },
            L: { url: "/models/croptopL.glb", autoNormalize: false, followAvatarBones: true }
        }
    },

    // Sản phẩm ID 18 — Váy Hoa
    "18": {
        enable: true,
        colors: [
            { name: 'Hoa Nhí Trắng', hex: '#fdfbf7', fabric: { preset: 'silk' } },
            { name: 'Hoa Nhí Đỏ', hex: '#a62e38', fabric: { preset: 'silk' } }
        ],
        softness: { roughness: 0.75, metalness: 0.0, envMapIntensity: 0.4, skinOffset: 0.004 },
        fabric: { preset: 'silk' },
        measurementProfile: {
            garmentType: 'dress',
            sizeSpecs: {
                S: { chest: 84, waist: 66, hips: 90, shoulder: 36, garmentLength: 105, fitIntent: 'regular' },
                M: { chest: 88, waist: 70, hips: 94, shoulder: 38, garmentLength: 107, fitIntent: 'regular' },
                L: { chest: 92, waist: 74, hips: 98, shoulder: 40, garmentLength: 109, fitIntent: 'regular' }
            }
        },
        sizes: {
            S: { url: "/models/vayhoa - S.glb", autoNormalize: false, followAvatarBones: true },
            M: { url: "/models/vayhoa - M.glb", autoNormalize: false, followAvatarBones: true },
            L: { url: "/models/vayhoa - L.glb", autoNormalize: false, followAvatarBones: true }
        }
    },

    // Sản phẩm ID 12 — Chân Váy
    "12": {
        enable: true,
        colors: [
            { name: 'Đen', hex: '#111111', fabric: { preset: 'cotton-heavy' } },
            { name: 'Beige', hex: '#d4c3a3', fabric: { preset: 'cotton-soft' } }
        ],
        softness: { roughness: 0.95, metalness: 0.0, envMapIntensity: 0.2, skinOffset: 0.003 },
        fabric: { preset: 'cotton' },
        measurementProfile: {
            garmentType: 'bottom',
            sizeSpecs: {
                S: { waist: 64, hips: 90, thigh: 52, legOpening: 50, garmentLength: 42, fitIntent: 'regular' },
                M: { waist: 68, hips: 94, thigh: 56, legOpening: 54, garmentLength: 43, fitIntent: 'regular' },
                L: { waist: 72, hips: 98, thigh: 60, legOpening: 58, garmentLength: 44, fitIntent: 'regular' }
            }
        },
        sizes: {
            S: { url: "/models/chanvayS.glb", autoNormalize: false, followAvatarBones: true },
            M: { url: "/models/chanvayM.glb", autoNormalize: false, followAvatarBones: true },
            L: { url: "/models/chanvayL.glb", autoNormalize: false, followAvatarBones: true }
        }
    },

    // Sản phẩm ID 6 — Quần Suông
    "6": {
        enable: true,
        colors: [
            { name: 'Xanh Đen', hex: '#232f3e', fabric: { preset: 'denim-raw' } },
            { name: 'Xanh Xám', hex: '#5b6b7a', fabric: { preset: 'denim-stone-washed' } }
        ],
        softness: { roughness: 1.0, metalness: 0.0, envMapIntensity: 0.1, skinOffset: 0.004 },
        fabric: { preset: 'denim-raw' },
        measurementProfile: {
            garmentType: 'bottom',
            sizeSpecs: {
                S: { waist: 66, hips: 94, thigh: 60, legOpening: 58, garmentLength: 98, fitIntent: 'loose' },
                M: { waist: 70, hips: 98, thigh: 64, legOpening: 60, garmentLength: 100, fitIntent: 'loose' },
                L: { waist: 74, hips: 102, thigh: 68, legOpening: 62, garmentLength: 102, fitIntent: 'loose' }
            }
        },
        sizes: {
            S: { url: "/models/QuanSuongS.glb", autoNormalize: false, followAvatarBones: true },
            M: { url: "/models/QuanSuongM.glb", autoNormalize: false, followAvatarBones: true },
            L: { url: "/models/QuanSuongL.glb", autoNormalize: false, followAvatarBones: true }
        }
    }
};
