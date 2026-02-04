// src/data/ThreeDConfig.js

// Danh sách các sản phẩm cần "độ" thêm tính năng 3D
export const MODEL_INJECTION = {
    // Bạn sẽ dán ID thật của sản phẩm lấy từ MongoDB vào đây
    // Ví dụ: "65b21..." : { ...config }

    "6978cac7a11cdeb512c36998": {
        enable: true,
        url: "/models/tshirt_base.glb", // File trong public/models
        scale: 0.085,
        nodeName: "Ao_Phong",
        position: [0, -1.65, 0.02]
    }
};