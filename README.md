# 👕 VFitAI – Nền tảng Thử đồ 3D (Virtual Try-On)

## 📖 Giới thiệu

**VFitAI** là một dự án web thương mại điện tử thời trang được tích hợp công nghệ **Virtual Try-On 3D**, giúp người dùng có thể hình dung trực quan trang phục trước khi mua.

Thay vì chỉ xem hình ảnh sản phẩm như các website thông thường, người dùng có thể nhập **chiều cao** và **cân nặng** để tạo ra một **nhân vật 3D (avatar)** tương ứng với vóc dáng của mình và thử quần áo trực tiếp trong môi trường 3D.

Dự án được xây dựng với mục tiêu học tập, nghiên cứu và phát triển kỹ năng **Fullstack Web + 3D Graphics**.

---

## 🚀 Tính năng chính

### 🛍️ Chức năng Thương mại điện tử
- Xem danh sách sản phẩm theo danh mục
- Xem chi tiết sản phẩm
- Thêm sản phẩm vào giỏ hàng
- Cập nhật số lượng, xoá sản phẩm trong giỏ hàng
- Mô phỏng quy trình thanh toán
- Hệ thống người dùng (Đăng ký / Đăng nhập)

### 🕴️ Virtual Try-On 3D (Trọng tâm dự án)
- **Tạo Avatar 3D theo cơ thể người dùng** dựa trên:
  - Chiều cao (cm)
  - Cân nặng (kg)
- **Body Morphing:** Tự động thay đổi hình dáng nhân vật 3D theo thông số cơ thể
- **Thay đổi trang phục theo thời gian thực**
- **Điều chỉnh size quần áo** (S, M, L, XL) để phù hợp với avatar
- **Fit Score:** Đưa ra đánh giá mức độ phù hợp của trang phục dựa trên chỉ số BMI
- **Animation:** Xem avatar ở các trạng thái như đứng yên hoặc di chuyển
- **Xuất hình ảnh:** Cho phép người dùng chụp và tải ảnh avatar sau khi thử đồ

---

## 🛠️ Công nghệ sử dụng

### Frontend
- **ReactJS (Vite)**
- **TypeScript**
- **Three.js**
- **React Three Fiber**
- **@react-three/drei**
- React Router DOM
- React Hooks
- CSS / CSS Modules

### Backend
- **Node.js**
- **Express.js**
- RESTful API

### Database
- **MongoDB**
- **Mongoose**

---

## 📂 Cấu trúc thư mục

```txt
Virtual-Try-On/
├── client/                # Frontend (React + Vite)
│   ├── public/
│   ├── src/
│   ├── index.html
│   ├── package.json
│   └── vite.config.ts
│
├── server/                # Backend (Node + Express)
│   ├── index.js
│   ├── package.json
│   └── node_modules/
│
├── .gitignore
└── README.md
```
## ⚙️ Cài đặt & Chạy dự án
Yêu cầu hệ thống

Node.js (phiên bản 16 trở lên)

MongoDB (cài local hoặc sử dụng MongoDB Atlas)

1️⃣ Clone project
```git clone https://github.com/your-username/vfitai.git
cd Virtual-Try-On
``````
2️⃣ Chạy Frontend
````
cd client
npm install
npm run dev
````
````
Mặc định frontend chạy tại:

http://localhost:5173
````

3️⃣ Chạy Backend

Mở terminal mới:
````
cd server
npm install
node index.js
````

````
Backend mặc định chạy tại:

http://localhost:5000
````

## 🎯 Mục tiêu của dự án

Áp dụng kiến thức React + Node.js + MongoDB

Nghiên cứu và thực hành lập trình đồ họa 3D trên web

Mô phỏng quy trình xây dựng một nền tảng thương mại điện tử hiện đại

Chuẩn bị nền tảng để phát triển các tính năng nâng cao trong tương lai

## 🔮 Hướng phát triển trong tương lai

Tích hợp xác thực JWT

Quản lý sản phẩm cho Admin

Cải thiện độ chính xác của Body Morphing

Thêm gợi ý size thông minh bằng AI

Triển khai dự án lên môi trường production

## 📌 Ghi chú

Dự án hiện đang trong giai đoạn phát triển, một số tính năng có thể chưa hoàn thiện và sẽ được cập nhật thêm trong các phiên bản tiếp theo.