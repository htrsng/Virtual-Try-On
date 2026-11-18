# Kiểm thử API VFitAI

Suite dùng Jest 30, Supertest 7 và `mongodb-memory-server` 11. Các ca gọi ứng dụng Express và kiểm tra response hoặc dữ liệu lưu trong MongoDB. Phạm vi gồm đăng nhập, quyền truy cập, sản phẩm, địa chỉ, đặt hàng và tồn kho.

Cần Node.js 22 và npm. Từ thư mục gốc:

```sh
npm ci --prefix server
npm --prefix server test
npm --prefix server test -- --coverage
```

Jest dùng MongoDB replica set tạm và tự dọn dữ liệu sau mỗi ca. Lần đầu có thể cần tải binary MongoDB. Khi đã có binary tương thích, đặt `MONGOMS_SYSTEM_BINARY` theo [hướng dẫn môi trường](../../qa/docs/environment-setup.md). Suite dùng cấu hình test riêng để chạy độc lập với Atlas và tài khoản thật.

Các file `*.test.js` chứa kịch bản theo nhóm nghiệp vụ. `setup.js` quản lý vòng đời database và `helpers.js` hỗ trợ tạo dữ liệu. Đợt chạy local ngày 18/11/2026 ghi 134/134 ca đạt. Coverage HTML nằm trong `.runtime/coverage/backend/`. [Báo cáo và link CI](../../qa/docs/test-summary.md).

Suite dùng cấu hình không có key Gemini hoặc email. Thanh toán online được kiểm tra ở trạng thái provider chưa cấu hình. [Danh sách endpoint](../../qa/docs/api-inventory.md).
