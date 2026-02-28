// src/data/ThreeDConfig.js

// Danh sách các sản phẩm cần "độ" thêm tính năng 3D
export const MODEL_INJECTION = {
    // Bạn sẽ dán ID thật của sản phẩm lấy từ MongoDB vào đây
    // Ví dụ: "65b21..." : { ...config }

    // Sản phẩm ID 3 - Áo Thun (giai đoạn test)
    // - Chỉ bật size S
    // - Bấm size khác sẽ tạm thời không hiển thị áo
    "3": {
        enable: true,
        colors: [
            { name: 'Trắng', hex: '#f5f5f5' },
            { name: 'Đen', hex: '#222222' },
            { name: 'Xanh Navy', hex: '#1f2a44' },
            { name: 'Be', hex: '#d4c3a3' }
        ],
        sizes: {
            S: {
                // File bạn đang có trong public/models
                url: "/models/Ao_Thun_sizeS.glb?v=3",
                scale: 1,
                position: [0, 0, 0],
                autoNormalize: false,
                followAvatarBones: true
            },
        }
    }
};