# VFitAI — Thử đồ 3D và kiểm thử tự động

[![Kiểm thử API](https://github.com/htrsng/Virtual-Try-On/actions/workflows/backend-tests.yml/badge.svg?branch=main)](https://github.com/htrsng/Virtual-Try-On/actions/workflows/backend-tests.yml)
[![Selenium Smoke](https://github.com/htrsng/Virtual-Try-On/actions/workflows/selenium-smoke.yml/badge.svg?event=pull_request)](https://github.com/htrsng/Virtual-Try-On/actions/workflows/selenium-smoke.yml)
[![Playwright và 3D](https://github.com/htrsng/Virtual-Try-On/actions/workflows/playwright-3d.yml/badge.svg?event=pull_request)](https://github.com/htrsng/Virtual-Try-On/actions/workflows/playwright-3d.yml)

## Kiểm thử ở VFitAI

Kết quả ghi nhận trên môi trường QA local ngày 18/11/2026. Trạng thái CI theo từng lần chạy có ở các badge phía trên.

| Lớp kiểm thử | Công cụ | Kết quả | Tài liệu |
| --- | --- | --- | --- |
| API và tích hợp | Jest, Supertest, MongoDB replica set | 134/134 đạt | [Chạy test API](server/tests/README.md) |
| Frontend | Vitest, Testing Library | 38/38 đạt | [Báo cáo kết quả](qa/docs/test-summary.md) |
| Luồng mua hàng và quản lý đơn | Selenium, Java, TestNG | 22/22 đạt, gồm 5 lượt smoke | [Selenium](qa/selenium-java/README.md) |
| Web và thử đồ 3D | Playwright | 12/12 đạt, gồm 6 ca WebGL | [Playwright](tests/README.md) |
| So ảnh WebGL | Playwright | 1/1 đạt trên profile Windows | [Ảnh chuẩn đã duyệt](tests/visual-baselines/README.md) |
| Thủ công | CSV và checklist | 8 ca thiết kế. Nghiệm thu thiết bị thật đang chờ | [Checklist nghiệm thu](qa/docs/manual-acceptance-checklist.md) |

[Danh mục test tự động](qa/docs/automated-test-catalog.csv) ghi **217 lượt test** khi tính riêng các dòng dữ liệu và gộp các ca Playwright lặp giữa cấu hình trình duyệt. [Báo cáo kết quả](qa/docs/test-summary.md) có số liệu compatibility, accessibility và production preview. Xem thêm [kế hoạch kiểm thử](qa/docs/test-strategy.md), [ma trận truy vết](qa/docs/rtm.md), [danh sách lỗi](qa/bug-reports/bug-register.md) và [bằng chứng chạy](qa/evidence/quality-completion-2026-11-18/). [PR cập nhật README](https://github.com/htrsng/Virtual-Try-On/pull/7) lưu kết quả 13 check CI của lần merge đó.

## Ứng dụng

VFitAI là web bán quần áo có phòng thử đồ 3D. Người mua có thể xem sản phẩm, chọn size, thử đồ trên avatar và đặt hàng COD. Frontend dùng React, TypeScript và Three.js. Backend dùng Express và MongoDB.

## Chạy dự án

Cần Node.js 22 và npm. Chạy các lệnh sau từ thư mục gốc sau khi clone:

```sh
npm ci --prefix server
npm ci --prefix client
npm ci --prefix tests
```

Nếu muốn mở web để phát triển, làm theo [hướng dẫn cấu hình MongoDB và tệp môi trường](qa/docs/environment-setup.md). Web dev mặc định ở cổng `5173`, API ở `3000`.

Nếu chỉ chạy test, dùng các lệnh bên dưới. Môi trường QA tự tạo MongoDB replica set và tài khoản mẫu trên máy chạy test. Các lệnh test dùng database tạm riêng, không cần URI MongoDB Atlas hoặc tệp `server/.env`. Lần đầu có thể cần mạng để tải MongoDB, browser hoặc driver.

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
| `doc/` | Tài liệu và ảnh giao diện ứng dụng |
| [`archive/coursework-api-fuzzing/`](archive/coursework-api-fuzzing/README.md) | Bài tập API/fuzzing chạy trên ứng dụng Express đích riêng. Kết quả lưu trong archive. |

## Tình trạng kiểm thử

Checkout COD có test từ thao tác trên web đến đối chiếu đơn đã lưu qua API. Bộ 3D kiểm tra việc tải model, đổi size, camera và khôi phục sau lỗi tải. Xem [kết quả kiểm thử và link CI](qa/docs/test-summary.md), [phạm vi chức năng](qa/docs/feature-status.md) và [danh sách lỗi đã ghi nhận](qa/bug-reports/bug-register.md).

Thanh toán online chưa có provider. Đăng nhập mạng xã hội và khôi phục mật khẩu chưa có luồng hoàn chỉnh. Gemini và email chưa được xác minh end-to-end với dịch vụ thật. Các bước kiểm tra bằng trình đọc màn hình và điện thoại thật nằm trong [checklist nghiệm thu thủ công](qa/docs/manual-acceptance-checklist.md).

Kết quả chạy local nằm trong `.runtime/`, `tests/playwright-report/` hoặc `qa/selenium-java/target/`. Artifacts trên GitHub Actions được lưu 14 ngày. Giữ tệp `environment.json` của lần chạy ở máy local vì có thông tin đăng nhập mẫu.
