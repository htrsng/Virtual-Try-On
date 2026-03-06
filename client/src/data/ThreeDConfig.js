// src/data/ThreeDConfig.js
//
// Mỗi sản phẩm khai báo từng size riêng với file GLB tương ứng.

export const MODEL_INJECTION = {
    // Sản phẩm ID 3 — Áo Thun
    "3": {
        enable: true,

        colors: [
            { name: 'Trắng', hex: '#f5f5f5' },
            { name: 'Đen', hex: '#222222' },
            { name: 'Xanh Navy', hex: '#1f2a44' },
            { name: 'Be', hex: '#d4c3a3' }
        ],

        // Tuning chất liệu vải chung cho mọi size
        softness: {
            roughness: 0.8,
            metalness: 0.05,
            envMapIntensity: 0.5,
            skinOffset: 0.003
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
    }
};