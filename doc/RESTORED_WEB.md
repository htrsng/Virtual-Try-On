# Khôi phục ứng dụng VFitAI — 16/11/2026

## Nguồn khôi phục

- `client/`, `doc/`, `tests/` và workflow ứng dụng trở lại thư mục gốc từ
  `archive/vfitai/`; giữ các tài nguyên ảnh, model 3D và mã giao diện.
- 26 file `server/` được khôi phục từ commit `ff37283` (`0b20cb8^`), phiên bản ngay
  trước commit xóa backend. Đây là server gốc, gồm `models.js`, `services.js`,
  `routes/ai.routes.js`, middleware, config và backend tests.
- Không dùng `models.js` stub hoặc API target của bài fuzzing để thay thế backend.
- Các thay đổi đang lưu coursework vào `archive/coursework-api-fuzzing/` được giữ,
  không hoàn tác hoặc ghi đè chúng trong đợt khôi phục web.

## Cấu hình kết nối

API dùng cổng 3000, Vite dùng 5173. Proxy frontend trước đó còn trỏ 5050 được sửa
về 3000; `client/.env` local cũng được cập nhật từ địa chỉ loopback 5050 sang 3000.
Output component test được đổi về `.runtime/` để phù hợp cấu trúc root mới.

Không có `server/.env` cũ trong Git hoặc MongoDB URI sử dụng được trong file cấu
hình harness còn lưu. Đã tạo cấu hình local được Git bỏ qua, JWT secret mới và
MongoDB URI `mongodb://127.0.0.1:27017/vfitai`. Khóa Gemini/email để trống; có thể
đặt lại cấu hình dịch vụ của bạn trong `server/.env`.

MongoDB local dùng binary có sẵn trong cache, đặt tại `.runtime/tools/mongod.exe`,
với dữ liệu trong `.runtime/mongodb/`, chỉ bind loopback. Không xóa database cũ,
không gọi endpoint reset/clear hoặc migration reset. Dữ liệu catalog/user/order
của Atlas hoặc database cũ không được lưu trong Git; cần URI gốc để sử dụng lại.

## Kiểm tra bằng browser thật

Edge headless chạy với locale vi-VN, server `server/index.js`, Mongoose và MongoDB
thật. Chỉ thêm một user và một product test có ID riêng; sau kiểm tra xóa đúng hai
record đó bằng `_id`, không reset collection.

| Bước | Kết quả |
|---|---|
| Render trang chủ | PASS |
| Vite `/api/products` đọc product từ backend/MongoDB thật | PASS |
| Đăng nhập qua form UI và nhận token từ server | PASS |
| Xem chi tiết product, chọn size, thêm giỏ | PASS |
| Mở màn hình cart/checkout với item đã chọn | PASS |
| JavaScript page error trong luồng trên | 0 |

Lần thử đầu dùng locale trình duyệt mặc định tiếng Anh nên selector add-to-cart
tiếng Việt không khớp; sau khi cố định vi-VN, luồng trên đạt. Không sửa UI để làm
khớp test. Log/ảnh local ở `.runtime/restored-web-verification.json`,
`.runtime/restored-home.png` và `.runtime/restored-checkout.png`.

Chưa submit đơn hàng, chưa kiểm tra gateway thanh toán/email/Gemini thật hoặc toàn
bộ luồng WebGL. Không suy ra tất cả test suite hoặc production build đều đạt từ
luồng kiểm tra này. Chưa có Selenium suite mới.

## Khởi chạy lại

Từ repo root, sau khi cài dependency và cấu hình `.env`:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\start-web.ps1
```

Script khởi động MongoDB local khi dùng cấu hình mặc định và chưa có listener,
rồi khởi động API/frontend. Nếu dùng Atlas, script không mở MongoDB local.
Các process nền ẩn và log nằm trong `.runtime/`. Có thể chạy riêng `node index.js`
trong `server/` và `npm run dev` trong `client/` như trước.
