# VFitAI — Thử đồ 3D và kiểm thử API

VFitAI là dự án học tập về ứng dụng mua sắm thời trang và thử đồ 3D. Giao diện sử dụng React, TypeScript, Vite và Three.js. Phần kiểm thử API bằng Python được phát triển trong cùng kho mã để giữ lịch sử thực hiện.

## Các phần của dự án

- **Ứng dụng VFitAI:** giao diện mua sắm và trải nghiệm thử đồ 3D trong `client/`.
- **Kiểm thử API:** sinh dữ liệu bất thường, kiểm tra phản hồi và lưu bằng chứng trên API Express mô phỏng trong [fuzzing-security-testing](./fuzzing-security-testing/README.md).
- **Tài liệu ứng dụng:** ảnh và tài liệu học tập trong `doc/`.
- **Kiểm thử trình duyệt:** cấu hình và mã kiểm thử trong `tests/`.

API mô phỏng phục vụ nghiên cứu kiểm thử; không thay thế backend hoàn chỉnh của VFitAI.

## Kiểm thử API bằng fuzzing

Phần này tập trung vào đăng nhập, tạo đơn hàng, cập nhật trạng thái đơn, cập nhật người dùng và quản lý sản phẩm.

- Sinh và biến đổi dữ liệu JSON đầu vào.
- Kiểm tra phản hồi HTTP, xác thực, phân quyền và tính toàn vẹn đơn hàng.
- Chạy lại dữ liệu đã phát hiện, lưu yêu cầu, phản hồi và trạng thái để đối chiếu.
- Khảo sát nhánh xử lý và dùng Z3 với mô hình giới hạn của trường `totalAmount`.

**Công nghệ:** Python, requests, unittest, Node.js/Express và Z3.

[Xem cấu trúc, cách chạy và giới hạn](./fuzzing-security-testing/README.md) · [Xem kết quả xác minh](./fuzzing-security-testing/docs/verification.md)

## Chạy giao diện

Dùng Node.js 24 và npm. Tại thư mục gốc:

```sh
cd client
npm ci
npm run dev
```

Mở địa chỉ do Vite in ra. Các lệnh khác trong `client/`:

```sh
npm run build
npm run lint
npm test -- --run
```

Đây là các lệnh được khai báo trong dự án, không phải xác nhận mọi kiểm tra đều đạt. Chạy giao diện riêng không cung cấp những dịch vụ backend còn thiếu.

## Chạy phần fuzzing

Làm theo [hướng dẫn cài đặt và chạy](./fuzzing-security-testing/README.md). Phần này có API mô phỏng riêng, không cần frontend hoặc backend VFitAI để chạy kiểm tra hồi quy.

## Tình trạng và phạm vi

- Kho mã hiện không có thư mục `server/` mà workflow ứng dụng cũ tham chiếu. Chưa xác nhận khả năng chạy ứng dụng đầy đủ từ đầu đến cuối.
- Workflow **API Fuzzing Checks** kiểm tra riêng phần fuzzing; workflow ứng dụng chỉ chạy khi mã ứng dụng hoặc cấu hình liên quan thay đổi.
- Kết quả của API mô phỏng không đại diện cho bảo mật của một hệ thống đang triển khai.
- Báo cáo cũ được giữ để đối chiếu, không tự coi là kết quả chạy phiên bản hiện tại.

## Quy ước

Tài liệu hướng dẫn đang duy trì dùng tiếng Việt; tên file, thư mục, hàm và biến dùng tiếng Anh theo quy ước của từng ngôn ngữ. Tài liệu và bằng chứng lịch sử giữ nguyên tên để bảo toàn đối chiếu.

Xem [CONTRIBUTING.md](./CONTRIBUTING.md). Giấy phép: [MIT](./LICENSE).
