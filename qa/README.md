# Tài liệu kiểm thử VFitAI

Dùng trang này để tìm test theo nghiệp vụ, xem bằng chứng của một lần chạy hoặc chọn tầng phù hợp khi bổ sung ca hồi quy.

| Việc cần làm | Bắt đầu ở đâu |
| --- | --- |
| Kiểm tra quyền truy cập, giá, coupon và tồn kho | [Jest/Supertest](../server/tests/README.md) |
| Kiểm tra đặt COD và quản lý đơn qua giao diện | [Selenium/TestNG](selenium-java/README.md) |
| Kiểm tra model 3D, tương thích browser và accessibility | [Playwright](../tests/README.md) |
| Tra yêu cầu, test case và kết quả | [Phạm vi chức năng](docs/feature-inventory.md) · [RTM](docs/rtm.md) · [Test Summary](docs/test-summary.md) |
| Xem lỗi đã xác nhận và đợt kiểm tra lại | [Bug Register](bug-reports/bug-register.md) |

## Chạy hoặc viết thêm bài test

- [Môi trường QA](docs/environment-setup.md) và [dữ liệu mẫu](test-data/README.md) hướng dẫn tạo dữ liệu riêng cho mỗi lần chạy.
- [Selenium](selenium-java/README.md) dùng cho luồng mua hàng và quản lý đơn. [Playwright](../tests/README.md) có các bài kiểm tra browser, accessibility và phòng thử đồ 3D.
- Khi thêm test API, tra [danh sách endpoint](docs/api-inventory.md), [ma trận quyền](docs/permission-matrix.md) và [quy tắc kiểm tra dữ liệu](docs/validation-rules.md).
- Tra [test cases](docs/test-cases.csv), [ca nghiệp vụ E2E](docs/e2e-test-cases.csv), [danh mục test tự động](docs/automated-test-catalog.csv) và [ma trận truy vết](docs/rtm.md) để tìm ca đã có.

## Đọc báo cáo

- [Hướng dẫn CI và báo cáo](docs/stage-8-ci-quality-gates.md) chỉ nơi tìm log, ảnh chụp, trace và kết quả từng job.
- [Kết quả đợt rà soát chất lượng](docs/quality-completion.md) ghi các kiểm tra đã thực hiện. [Checklist nghiệm thu](docs/manual-acceptance-checklist.md) dùng khi kiểm tra bằng thiết bị thật hoặc công cụ hỗ trợ.
- [Kế hoạch kiểm thử](docs/test-strategy.md), [ghi chú kiểm thử thủ công](docs/manual-testing.md) và [lộ trình](docs/implementation-roadmap.md) giúp chọn phần cần bổ sung.

Khi trích số liệu, lấy số ca từ danh mục và kết quả thực thi từ báo cáo của lần chạy tương ứng. Checklist nghiệm thu ghi phần cần người kiểm thử thực hiện.
