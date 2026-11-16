# Baseline evidence — 16/11/2026

- `execution-summary.json`: lệnh, thời gian UTC, environment, exit codes, kết quả
  và giới hạn. Ngày hiển thị dùng Asia/Saigon.
- `diagnostics.json`: TypeScript/ESLint diagnostics và Jest assertions/failures;
  đường dẫn workspace được thay bằng `<repo>` khi nằm trong message.
- `source-sha256.json`: 213 source/config files của ứng dụng, tests, launcher và
  workflow, không gồm `.env`, node_modules, binary 3D, database hoặc output.
  Đây là snapshot source được đo, chưa phải Git commit khôi phục.
- `api-endpoints.csv`: 71 khai báo route từ index và AI router; thông tin guard
  là middleware khai báo trực tiếp, không phải chứng nhận authorization.
- `raw-log-sha256.json`: checksum raw logs local, không phải link tải artifacts.
- `coursework-component-check.json`: kiểm tra lại runner component trong archive
  sau khi cập nhật đường dẫn client; jsdom component scope, không phải fuzzing run.

Baseline không chứng minh tất cả chức năng chạy đúng. Playwright có exit 1 nhưng
được phân loại BLOCKED vì browser chưa launch; không ghi thành lỗi nghiệp vụ.
Raw logs giữ trong `.runtime/` trên máy đã chạy; thư mục đó không được commit.
