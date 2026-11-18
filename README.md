# VFitAI — Thử đồ 3D và kiểm thử tự động

VFitAI là web bán quần áo có phòng thử đồ 3D, từ xem sản phẩm, chọn size đến đặt hàng COD. Bộ kiểm thử tập trung vào ba câu hỏi: đơn hàng có được tính và lưu đúng, quyền truy cập có được kiểm soát, và phòng thử đồ có hoạt động khi đổi size hoặc gặp lỗi tải model.

[![Kiểm thử API](https://github.com/htrsng/Virtual-Try-On/actions/workflows/backend-tests.yml/badge.svg?branch=main)](https://github.com/htrsng/Virtual-Try-On/actions/workflows/backend-tests.yml)
[![Selenium Smoke](https://github.com/htrsng/Virtual-Try-On/actions/workflows/selenium-smoke.yml/badge.svg?event=pull_request)](https://github.com/htrsng/Virtual-Try-On/actions/workflows/selenium-smoke.yml)
[![Playwright và 3D](https://github.com/htrsng/Virtual-Try-On/actions/workflows/playwright-3d.yml/badge.svg?event=pull_request)](https://github.com/htrsng/Virtual-Try-On/actions/workflows/playwright-3d.yml)

## Phạm vi kiểm thử theo nghiệp vụ

| Nhóm chức năng | Phạm vi tiêu biểu |
| --- | --- |
| Đăng nhập và phân quyền | Đăng nhập đúng/sai, phiên hết hạn, quyền khách hàng và quản trị viên. |
| Sản phẩm và giỏ hàng | Tìm kiếm, lọc danh mục, mở sản phẩm, chọn size, đổi số lượng và xoá khỏi giỏ. |
| Checkout, đơn hàng và tồn kho | Giá và phí do server tính, coupon, đặt COD, huỷ đơn, chuyển trạng thái và tranh mua sản phẩm cuối cùng. |
| Thử đồ 3D | Tải GLB, đổi geometry theo size, xoay/zoom camera, animation, tài nguyên renderer và phục hồi sau lỗi tải. |
| Gợi ý outfit bằng AI | Vitest giả lập service để kiểm tra trạng thái chờ và lỗi khi tinh chỉnh gợi ý. API outfit với Gemini thật chưa được xác minh. |
| Toàn vẹn dữ liệu | Kiểm tra bản ghi trong MongoDB, phạm vi dữ liệu theo chủ sở hữu và tồn kho khi checkout bị từ chối. |

Jest/Supertest kiểm tra API và trạng thái dữ liệu. Vitest kiểm tra hành vi UI ở tầng component. Selenium chạy luồng mua hàng qua trình duyệt, còn Playwright kiểm tra luồng web và renderer 3D.

## Kết quả chạy test

Kết quả local ngày **18/11/2026** trên Windows, Node.js 22.15.0, Java 17 và MongoDB 8.2.6. Báo cáo ghi commit nền `b0fc753` cùng các thay đổi local và mã băm source. [Bằng chứng lần chạy](qa/evidence/quality-completion-2026-11-18/execution-summary.json).

| Lớp kiểm thử | Kết quả local | Tài liệu |
| --- | --- | --- |
| API và tích hợp — Jest/Supertest | 134/134 đạt | [Test API](server/tests/README.md) |
| Frontend — Vitest/Testing Library | 38/38 đạt | [Báo cáo kết quả](qa/docs/test-summary.md) |
| Nghiệp vụ E2E — Selenium/TestNG | 22/22 đạt, gồm 5 lượt smoke | [Selenium](qa/selenium-java/README.md) |
| Web và 3D — Playwright | 12/12 mặc định, gồm 6 ca WebGL. So ảnh Windows 1/1 đạt. | [Playwright](tests/README.md) · [Ảnh chuẩn](tests/visual-baselines/README.md) |
| Thủ công | 8 ca đã thiết kế. Nghiệm thu thiết bị thật đang chờ. | [Checklist nghiệm thu](qa/docs/manual-acceptance-checklist.md) |

**217 test tự động trong danh mục** gồm 134 Jest, 38 Vitest, 22 Selenium và 23 Playwright. Mỗi dòng dữ liệu tham số được tính riêng. Ca Playwright chạy lại trên nhiều browser hoặc cấu hình được gộp theo file và tên test. Báo cáo kết quả ghi riêng các lượt chạy compatibility, accessibility và production preview. [Danh mục test tự động](qa/docs/automated-test-catalog.csv) · [Báo cáo kết quả](qa/docs/test-summary.md).

**GitHub Actions** ghi kết quả theo từng revision. Ví dụ, PR #7 ghi 13 check đạt cho commit `360e518`. Các badge ở đầu trang dẫn tới lịch sử từng workflow. [Checks PR #7](https://github.com/htrsng/Virtual-Try-On/pull/7/checks).

## Ba kiểm tra tiêu biểu

- **Đặt hàng COD từ giao diện.** Selenium chọn sản phẩm, đặt đơn và đối chiếu đơn đã lưu qua API, gồm tổng tiền và tồn kho sau khi đặt. [Test Selenium](qa/selenium-java/src/test/java/com/vfitai/qa/tests/BusinessE2ETests.java#L47) · [Bằng chứng E2E](qa/docs/stage-6-business-e2e.md).
- **Hai khách tranh mua sản phẩm cuối cùng.** Jest gửi hai request đồng thời và kiểm tra chỉ một đơn được tạo, tồn kho còn 0. [Test checkout](server/tests/checkout.test.js#L58) · [Báo cáo backend](qa/docs/stage-1-backend-report.md).
- **Thay model và phục hồi lỗi ở phòng thử đồ.** Playwright kiểm tra geometry khi đổi size, camera, animation và tải lại sau lỗi GLB 404. Một ca chẩn đoán riêng xác nhận bộ so ảnh phát hiện khi GLB hợp lệ nhưng sai loại. [Test WebGL](tests/e2e/tryon-3d.spec.ts) · [Bằng chứng 3D](qa/docs/stage-7-playwright-3d.md).

## Tài liệu và bằng chứng QA

| Cần xem | Tài liệu |
| --- | --- |
| Chiến lược kiểm thử và yêu cầu được bao phủ | [Test Strategy](qa/docs/test-strategy.md) · [RTM](qa/docs/rtm.md) |
| Kết quả, môi trường và bằng chứng chạy | [Test Summary](qa/docs/test-summary.md) · [Bằng chứng local](qa/evidence/quality-completion-2026-11-18/) |
| Lỗi đã ghi nhận và kiểm tra lại | [Bug Register](qa/bug-reports/bug-register.md) |
| Lịch sử CI và cách mở artifacts | [GitHub Actions](https://github.com/htrsng/Virtual-Try-On/actions) · [Hướng dẫn CI](qa/docs/stage-8-ci-quality-gates.md) |

## Chạy dự án và kiểm thử

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

Kết quả local nằm trong `.runtime/`, `tests/playwright-report/` hoặc `qa/selenium-java/target/`. Artifacts GitHub Actions được lưu 14 ngày. Giữ tệp `environment.json` của lần chạy ở máy local vì có thông tin đăng nhập mẫu.

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

## Giới hạn hiện tại

- Thanh toán online chưa có provider. Đăng nhập mạng xã hội và khôi phục mật khẩu chưa có luồng hoàn chỉnh.
- Test AI hiện dùng service giả lập ở UI. Tích hợp Gemini và email thật chưa được xác minh end-to-end.
- Kiểm thử browser dùng viewport giả lập cho mobile. Safari/iOS, điện thoại thật và trình đọc màn hình còn trong [checklist nghiệm thu](qa/docs/manual-acceptance-checklist.md).
