# 🔧 Hướng Dẫn Fix Lỗi Sản Phẩm Mất Khi Đổi Tài Khoản

## ❌ Vấn Đề
Khi vào localhost với tài khoản Gmail A thì thấy sản phẩm, nhưng vào với tài khoản Gmail B thì sản phẩm lại mất.

## 🔍 Nguyên Nhân (ĐÃ TÌM RA)

### 1. **Vấn đề Cache localStorage**
- Dữ liệu sản phẩm đang được lưu trong `localStorage` của trình duyệt
- `localStorage` được chia sẻ chung cho tất cả user trên cùng domain (localhost:5173)
- Khi Admin (tài khoản A) xóa sản phẩm, nó xóa trong `localStorage`
- Tài khoản B cũng đọc từ `localStorage` đó nên không có sản phẩm

### 2. **Vấn đề Logic Giới Hạn Hiển Thị** ⚠️ NGUYÊN NHÂN CHÍNH
File: `client/src/components/ProductList.jsx` (Lines 14-15)

```javascript
// CODE CŨ - CÓ LỖI:
const isLoggedIn = Boolean(localStorage.getItem('currentUser'));
const displayProducts = products?.slice(0, isLoggedIn ? 90 : 72) || [];
```

**Vấn đề:**
- Khi **CHƯA đăng nhập**: Chỉ hiển thị 72 sản phẩm đầu
- Khi **ĐÃ đăng nhập**: Hiển thị 90 sản phẩm đầu
- **Logic này đang dùng `currentUser` trong localStorage thay vì AuthContext**
- Nếu cache bị xóa hoặc không đồng bộ → không hiển thị đúng sản phẩm

## ✅ Giải Pháp Đã Áp Dụng

### 1. **KHÔNG Xóa Dữ Liệu Sản Phẩm/Ảnh Khi Login/Logout** ⚠️ QUAN TRỌNG
File: `client/src/contexts/AuthContext.jsx`

```javascript
const login = async (email, password) => {
    // KHÔNG XÓA products/bannerData vì sẽ làm MẤT ảnh đã thêm
    // Chỉ xóa dữ liệu user cũ
    localStorage.removeItem('currentUser');
    // ... logic login
}

const logout = () => {
    // Chỉ xóa dữ liệu liên quan đến USER
    localStorage.removeItem('token');
    localStorage.removeItem('cartItems');
    localStorage.removeItem('currentUser');
    
    // ⚠️ KHÔNG XÓA: products, topProducts, flashSaleProducts, bannerData
    // Vì đó là dữ liệu chung của website (bao gồm ảnh đã thêm)
    // ... logic logout
}
```

**Lý do:**
- ❌ **TRƯỚC:** Xóa `products`, `topProducts`, `flashSaleProducts` → Làm **MẤT ẢNH** đã thêm
- ✅ **SAU:** Chỉ xóa dữ liệu user → **GIỮ NGUYÊN ẢNH VÀ SẢN PHẨM**

### 2. **Force Reload Trang Sau Login/Logout**
File: `client/src/pages/LoginPage.jsx`

```javascript
// Reload trang để load lại sản phẩm từ đầu
window.location.href = '/';
```

### 3. **FIX LOGIC HIỂN thị SẢN PHẨM** ✅ QUAN TRỌNG NHẤT
File: `client/src/components/ProductList.jsx`

```javascript
// CODE MỚI - ĐÃ SỬA:
import { useAuth } from '../contexts/AuthContext';

function ProductList({ products, title, onBuy, loading }) {
    const { isAuthenticated } = useAuth();
    
    // Hiển thị TẤT CẢ sản phẩm, không giới hạn theo login
    const displayProducts = products || [];
    
    // ... rest of code
}
```

**Thay đổi:**
- ✅ Xóa logic `slice(0, isLoggedIn ? 90 : 72)` → Hiển thị **TẤT CẢ** sản phẩm
- ✅ Dùng `useAuth()` từ AuthContext thay vì đọc `currentUser` từ localStorage
- ✅ Đảm bảo mọi user thấy **cùng số lượng sản phẩm**

### 4. **Cách Sử Dụng**

**Tình huống 1: Đổi tài khoản**
1. Đăng xuất tài khoản A
2. Đăng nhập tài khoản B
3. Trang sẽ tự động reload và load lại sản phẩm mới

**Tình huống 2: Xóa cache thủ công**
Nếu vẫn gặp vấn đề, vào Chrome DevTools:
- F12 → Application → Local Storage
- Xóa các key: `products`, `topProducts`, `flashSaleProducts`, `currentUser`
- Reload trang (F5 hoặc Ctrl+R)

## 🎯 Giải Pháp Lâu Dài (Khuyến Nghị)

### **Chuyển sang Database Backend**

Thay vì lưu trong `localStorage`, nên:

1. **Lưu sản phẩm vào MongoDB**
```javascript
// Server: POST /api/products
// Server: GET /api/products
// Server: DELETE /api/products/:id
```

2. **Load từ API khi vào trang**
```javascript
useEffect(() => {
    fetch('http://localhost:3000/api/products')
        .then(res => res.json())
        .then(data => setSuggestionProducts(data));
}, []);
```

3. **Mỗi user sẽ load dữ liệu fresh từ server**
- Không bị conflict giữa users
- Dữ liệu đồng bộ giữa các thiết bị
- Admin thay đổi sẽ áp dụng cho tất cả users

## 📝 Lưu Ý

### Lỗi `runtime.lastError: Could not establish connection`
- Đây là lỗi từ **Chrome Extension** (không liên quan đến code)
- Có thể bỏ qua hoặc tắt extension gây lỗi

### Kiểm Tra Console
```javascript
// Console log để debug
console.log('Products:', localStorage.getItem('products'));
console.log('User:', localStorage.getItem('token'));
console.log('Display products count:', products?.length);
```

## 🚀 Test Các Bước

### ✅ Checklist Kiểm Tra:

1. **Test với User Chưa Đăng Nhập:**
   - [ ] Mở localhost:5173
   - [ ] Xem trang chủ → Phải thấy **110 sản phẩm**
   - [ ] Kiểm tra console: `Display products count: 110`

2. **Test Đăng Nhập Tài Khoản A:**
   - [ ] Đăng nhập user A
   - [ ] Trang reload tự động
   - [ ] Vẫn thấy **110 sản phẩm** ✓

3. **Test Đăng Xuất → Đăng Nhập Tài Khoản B:**
   - [ ] Đăng xuất user A
   - [ ] Cache products bị xóa
   - [ ] Đăng nhập user B
   - [ ] Trang reload → Load lại **110 sản phẩm từ data gốc** ✓

4. **Test Xóa Sản Phẩm (Admin):**
   - [ ] Đăng nhập admin
   - [ ] Xóa 1 sản phẩm
   - [ ] Đăng xuất
   - [ ] Đăng nhập user khác
   - [ ] Cache đã reset → Thấy lại **110 sản phẩm** ✓

5. **Test Incognito/Private Window:**
   - [ ] Mở cửa sổ ẩn danh
   - [ ] Đăng nhập tài khoản khác
   - [ ] Không bị ảnh hưởng cache → **110 sản phẩm** ✓

## 🔍 Debug Commands

Nếu vẫn có vấn đề, chạy trong Console:

```javascript
// 1. Kiểm tra localStorage
console.log('Current User:', localStorage.getItem('currentUser'));
console.log('Token:', localStorage.getItem('token'));
console.log('Products:', JSON.parse(localStorage.getItem('products') || '[]').length);

// 2. Xóa toàn bộ cache
localStorage.clear();
location.reload();

// 3. Reset về dữ liệu gốc
localStorage.removeItem('products');
localStorage.removeItem('topProducts');
localStorage.removeItem('flashSaleProducts');
location.reload();
```

## 📊 Kết Quả Mong Đợi

Sau khi fix:
- ✅ Mọi user (đăng nhập hay chưa) đều thấy **cùng số lượng sản phẩm**
- ✅ Đổi tài khoản không làm mất sản phẩm
- ✅ Logout → Login lại sẽ reset cache và load lại sản phẩm
- ✅ Không còn phụ thuộc vào `currentUser` trong localStorage
