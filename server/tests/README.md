# Kiểm thử API VFitAI

Các bài test gọi API Express qua Supertest rồi đối chiếu response và dữ liệu MongoDB khi thao tác có ghi dữ liệu. Suite dùng Jest 30, Supertest 7 và `mongodb-memory-server` 11.

| Rủi ro | Ca kiểm thử tiêu biểu |
| --- | --- |
| Sai quyền hoặc lộ dữ liệu tài khoản | [Quyền admin và quyền truy cập](permissions.test.js) · [Dữ liệu trả về và ràng buộc tài khoản](security.test.js) |
| Sai giá, coupon hoặc tồn kho | [Checkout và hai yêu cầu tranh sản phẩm cuối cùng](checkout.test.js#L58) |
| Truy cập dữ liệu của tài khoản khác | [Địa chỉ giao hàng và phạm vi chủ sở hữu](addresses.test.js#L43) |

## Cách chạy

Cần Node.js 22 và npm. Từ thư mục gốc:

```sh
npm ci --prefix server
npm --prefix server test
npm --prefix server test -- --coverage
```

Jest dùng MongoDB replica set tạm và tự dọn dữ liệu sau mỗi ca. Lần đầu có thể cần tải binary MongoDB. Khi đã có binary tương thích, đặt `MONGOMS_SYSTEM_BINARY` theo [hướng dẫn môi trường](../../qa/docs/environment-setup.md). Suite dùng cấu hình test riêng để chạy độc lập với Atlas và tài khoản thật.

## Kết quả và giới hạn

Các file `*.test.js` chứa kịch bản theo nhóm nghiệp vụ. `setup.js` quản lý vòng đời database và `helpers.js` hỗ trợ tạo dữ liệu. Đợt chạy local ngày 18/11/2026 ghi 134/134 ca đạt. Coverage HTML nằm trong `.runtime/coverage/backend/`. [Báo cáo và link CI](../../qa/docs/test-summary.md).

Các ca chat và gợi ý sản phẩm kiểm tra API nội bộ. Tích hợp API outfit với Gemini và việc gửi email thật chưa được xác minh trong suite. Thanh toán online được kiểm tra ở trạng thái provider chưa cấu hình. [Danh sách endpoint](../../qa/docs/api-inventory.md).
