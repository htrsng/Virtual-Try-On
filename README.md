# VFitAI

VFitAI là web bán quần áo có phòng thử đồ 3D. Người mua có thể xem sản phẩm, chọn size, thử đồ trên avatar, thêm vào giỏ và đặt hàng COD. Dự án dùng React, TypeScript và Three.js ở frontend, Express và MongoDB ở backend.

## Chạy dự án

Cần Node.js 22 và npm. Chạy các lệnh sau từ thư mục gốc sau khi clone:

```sh
npm ci --prefix server
npm ci --prefix client
npm ci --prefix tests
```

Nếu muốn mở web để phát triển, làm theo [hướng dẫn cấu hình MongoDB và tệp môi trường](qa/docs/environment-setup.md). Web dev mặc định ở cổng `5173`, API ở `3000`.

Nếu chỉ chạy test, dùng các lệnh bên dưới. Môi trường QA tự tạo MongoDB replica set và tài khoản mẫu. Lần đầu có thể cần mạng để tải MongoDB, browser hoặc driver.

```sh
npm --prefix server test
npm --prefix client run test:ci
node tests/node_modules/@playwright/test/cli.js install chromium
npm --prefix tests test
```

Selenium cần thêm Java 17, Maven 3.9+ và Chrome hoặc Edge:

```sh
node scripts/qa-selenium.cjs -Dbrowser=chrome -Dgroups=smoke
```

Chạy Playwright và Selenium lần lượt nếu dùng cổng QA mặc định (`3300` cho API, `55173` cho UI). Cách chạy hồi quy, đổi cổng và tìm báo cáo có trong [hướng dẫn Selenium](qa/selenium-java/README.md) và [hướng dẫn Playwright](tests/README.md).

## Tìm code và bài test

| Thư mục | Nội dung |
| --- | --- |
| `client/` | Giao diện, phòng thử đồ 3D và test Vitest |
| `server/` | API, nghiệp vụ, model MongoDB và test Jest/Supertest |
| `tests/` | Playwright cho luồng web, trình duyệt, accessibility và 3D |
| `qa/selenium-java/` | Selenium/TestNG cho đăng nhập, giỏ hàng, đặt và quản lý đơn |
| `qa/` | Dữ liệu mẫu, test cases, kết quả và báo cáo lỗi |
| `scripts/`, `.github/workflows/` | Khởi động môi trường test, chạy CI và xuất báo cáo |
| `archive/` | Bài tập API/fuzzing trên ứng dụng đích riêng |

## Tình trạng kiểm thử

Checkout COD có test từ thao tác trên web đến đối chiếu đơn đã lưu qua API. Bộ 3D kiểm tra việc tải model, đổi size, camera và khôi phục sau lỗi tải. Xem [kết quả kiểm thử và link CI](qa/docs/test-summary.md), [phạm vi chức năng](qa/docs/feature-status.md) và [danh sách lỗi đã ghi nhận](qa/bug-reports/bug-register.md).

Thanh toán online chưa có provider. Đăng nhập mạng xã hội và khôi phục mật khẩu chưa có luồng hoàn chỉnh. Gemini và email chưa được xác minh end-to-end với dịch vụ thật. Các bước kiểm tra bằng trình đọc màn hình và điện thoại thật nằm trong [checklist nghiệm thu thủ công](qa/docs/manual-acceptance-checklist.md).

Kết quả chạy local nằm trong `.runtime/`, `tests/playwright-report/` hoặc `qa/selenium-java/target/`. Artifacts trên GitHub Actions được lưu 14 ngày. Giữ tệp `environment.json` của lần chạy ở máy local vì có thông tin đăng nhập mẫu.
