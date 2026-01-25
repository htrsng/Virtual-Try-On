# 🛍️ HỆ THỐNG SHOPEE FASHION - HƯỚNG DẪN SỬ DỤNG

## ✨ TÍNH NĂNG ĐÃ TRIỂN KHAI

### 🔐 1. Xác thực người dùng (Authentication với JWT)
- ✅ Đăng ký tài khoản mới với thông tin đầy đủ (email, mật khẩu, họ tên, số điện thoại, địa chỉ)
- ✅ Đăng nhập với JWT token (lưu token trong localStorage)
- ✅ Đăng xuất và xóa token
- ✅ Mã hóa mật khẩu với bcrypt
- ✅ Tự động đăng nhập lại khi quay lại trang (token còn hiệu lực)
- ✅ Hiển thị thông tin người dùng trên header

### 🛒 2. Giỏ hàng & Thanh toán (Checkout)
- ✅ Tự động điền thông tin giao hàng từ hồ sơ cá nhân
- ✅ Cho phép chỉnh sửa thông tin giao hàng trước khi đặt
- ✅ Hỗ trợ nhiều phương thức thanh toán (COD, Banking)
- ✅ Lưu đơn hàng vào database
- ✅ Hiển thị danh sách sản phẩm trong giỏ hàng với đầy đủ thông tin

### 📦 3. Trang chi tiết sản phẩm
- ✅ Hiển thị ảnh sản phẩm lớn với nhiều màu sắc/biến thể
- ✅ Chọn size và màu sắc
- ✅ Nút "Thêm vào giỏ hàng" và "Mua ngay"
- ✅ Nút "Thử lên người mẫu 3D"
- ✅ Hiển thị thông tin chi tiết sản phẩm

### 👤 4. Trang cá nhân người dùng (User Profile)
- ✅ Xem và chỉnh sửa thông tin cá nhân
- ✅ Quản lý địa chỉ giao hàng (địa chỉ, phường/xã, quận/huyện, tỉnh/thành phố)
- ✅ Xem lịch sử đơn hàng
- ✅ Hiển thị trạng thái đơn hàng (Đang xử lý, Đã giao, Đã hủy)
- ✅ Xem chi tiết từng đơn hàng

### 🎨 5. Giao diện hiện đại
- ✅ Thiết kế hiện đại với gradient, shadow, rounded corners
- ✅ Responsive design
- ✅ Hiệu ứng hover, animation
- ✅ Icon và emoji sinh động
- ✅ Thông báo toast đẹp mắt

---

## 🚀 CÁCH CHẠY DỰ ÁN

### Bước 1: Khởi động MongoDB
```bash
# Đảm bảo MongoDB đang chạy trên localhost:27017
```

### Bước 2: Khởi động Server (Backend)
```bash
cd server
npm install
node index.js
```
Server sẽ chạy tại: `http://localhost:3000`

### Bước 3: Khởi động Client (Frontend)
```bash
cd client
npm install
npm run dev
```
Client sẽ chạy tại: `http://localhost:5173`

---

## 📡 API ENDPOINTS

### Authentication
- `POST /api/auth/register` - Đăng ký tài khoản mới
- `POST /api/auth/login` - Đăng nhập
- `GET /api/auth/me` - Lấy thông tin user hiện tại (cần token)
- `PUT /api/auth/profile` - Cập nhật thông tin cá nhân (cần token)

### Products
- `GET /api/products` - Lấy danh sách sản phẩm
- `POST /api/products` - Thêm sản phẩm mới
- `PUT /api/products/:id` - Cập nhật sản phẩm
- `DELETE /api/products/:id` - Xóa sản phẩm

### Orders
- `POST /api/orders` - Tạo đơn hàng mới (cần token)
- `GET /api/orders/my-orders` - Lấy đơn hàng của user hiện tại (cần token)
- `GET /api/orders` - Lấy tất cả đơn hàng (admin)
- `PUT /api/orders/:id` - Cập nhật trạng thái đơn hàng
- `DELETE /api/orders/:id` - Xóa đơn hàng

### Users (Admin)
- `GET /api/users` - Lấy danh sách user
- `PUT /api/users/:id` - Cập nhật thông tin user
- `DELETE /api/users/:id` - Xóa user

---

## 🎯 LUỒNG SỬ DỤNG

### 1. Đăng ký/Đăng nhập
1. Truy cập trang chủ
2. Click "Đăng ký" trên header
3. Điền thông tin: email, mật khẩu, họ tên, số điện thoại, địa chỉ
4. Sau khi đăng ký thành công, tự động đăng nhập và chuyển về trang chủ
5. Thông tin người dùng hiển thị trên header

### 2. Mua hàng
1. Browse sản phẩm trên trang chủ
2. Click vào sản phẩm để xem chi tiết
3. Chọn màu sắc và size
4. Click "Thêm vào giỏ hàng" hoặc "Mua ngay"
5. Trang thanh toán tự động điền thông tin từ profile
6. Kiểm tra và chỉnh sửa thông tin giao hàng nếu cần
7. Chọn phương thức thanh toán
8. Click "Đặt hàng ngay"
9. Đơn hàng được lưu vào database và chuyển sang trang profile

### 3. Quản lý thông tin cá nhân
1. Click vào tên người dùng trên header
2. Chọn tab "Thông tin cá nhân" để xem/sửa thông tin
3. Click "Chỉnh sửa" để cập nhật thông tin
4. Click "Lưu thông tin" để lưu thay đổi

### 4. Xem đơn hàng
1. Vào trang Profile
2. Chọn tab "Đơn hàng của tôi"
3. Xem danh sách đơn hàng với trạng thái
4. Xem chi tiết từng đơn hàng

---

## 💾 DATABASE SCHEMA

### Users Collection
```javascript
{
  email: String (unique),
  password: String (hashed),
  role: String (default: "user"),
  fullName: String,
  phone: String,
  address: String,
  city: String,
  district: String,
  ward: String,
  createdAt: Date
}
```

### Orders Collection
```javascript
{
  userId: ObjectId (ref: users),
  products: [{
    productId: ObjectId (ref: products),
    name: String,
    price: Number,
    quantity: Number,
    img: String
  }],
  totalAmount: Number,
  shippingInfo: {
    fullName: String,
    phone: String,
    address: String,
    city: String,
    district: String,
    ward: String
  },
  paymentMethod: String (default: "COD"),
  status: String (default: "Đang xử lý"),
  createdAt: Date
}
```

### Products Collection
```javascript
{
  name: String,
  price: Number,
  img: String,
  category: String,
  sold: Number,
  variants: [{
    color: String,
    hex: String,
    name: String,
    img: String
  }]
}
```

---

## 🛠️ CÔNG NGHỆ SỬ DỤNG

### Backend
- Node.js + Express
- MongoDB + Mongoose
- JWT (jsonwebtoken)
- bcryptjs (mã hóa mật khẩu)
- CORS

### Frontend
- React 19
- React Router DOM 7
- Axios
- Context API (AuthContext)
- TypeScript

---

## 🎨 TÍNH NĂNG NỔI BẬT

1. **JWT Authentication**: Bảo mật cao, token tự động gia hạn
2. **Auto-fill thông tin**: Không cần nhập lại thông tin mỗi lần mua hàng
3. **Quản lý đơn hàng**: Theo dõi trạng thái đơn hàng realtime
4. **Giao diện đẹp**: Modern UI với gradient, animation
5. **Responsive**: Tương thích mọi thiết bị
6. **3D Try-On**: Thử đồ trực tiếp trên người mẫu 3D

---

## 📝 LƯU Ý

- Đảm bảo MongoDB đang chạy trước khi khởi động server
- Token JWT có thời hạn 7 ngày
- Mật khẩu được mã hóa bằng bcrypt
- Thông tin người dùng được lưu trong localStorage và database
- Đơn hàng chỉ được tạo khi user đã đăng nhập

---

## 🔒 BẢO MẬT

- Mật khẩu được hash bằng bcrypt (10 rounds)
- JWT secret key nên thay đổi trong production
- Token được lưu trong localStorage
- API yêu cầu token cho các endpoint bảo mật
- Middleware authenticateToken kiểm tra token mỗi request

---

## 🎉 HOÀN THÀNH!

Hệ thống đã sẵn sàng sử dụng với đầy đủ tính năng:
✅ Đăng nhập/Đăng xuất với JWT
✅ Giỏ hàng thông minh với auto-fill
✅ Trang chi tiết sản phẩm đẹp
✅ Trang cá nhân với quản lý đơn hàng
✅ Giao diện hiện đại, responsive

Chúc bạn code vui vẻ! 🚀
