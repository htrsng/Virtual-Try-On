# Tài liệu kiểm thử VFitAI

Nếu mới vào dự án, đọc [phạm vi chức năng](docs/feature-inventory.md) trước để biết từng luồng làm gì. [Báo cáo kết quả](docs/test-summary.md) ghi lần chạy, môi trường và giới hạn kiểm thử. [Danh sách lỗi](bug-reports/bug-register.md) ghi những lỗi đã được xác nhận và tình trạng kiểm tra lại.

## Chạy hoặc viết thêm bài test

- [Môi trường QA](docs/environment-setup.md) và [dữ liệu mẫu](test-data/README.md) hướng dẫn tạo dữ liệu riêng cho mỗi lần chạy.
- [Selenium](selenium-java/README.md) dùng cho luồng mua hàng và quản lý đơn. [Playwright](../tests/README.md) có các bài kiểm tra browser, accessibility và phòng thử đồ 3D.
- Khi thêm test API, tra [danh sách endpoint](docs/api-inventory.md), [ma trận quyền](docs/permission-matrix.md) và [quy tắc kiểm tra dữ liệu](docs/validation-rules.md).
- Tra [test cases](docs/test-cases.csv), [ca nghiệp vụ E2E](docs/e2e-test-cases.csv), [danh mục test tự động](docs/automated-test-catalog.csv) và [ma trận truy vết](docs/rtm.md) để tìm ca đã có.

## Đọc báo cáo

- [Hướng dẫn CI và báo cáo](docs/stage-8-ci-quality-gates.md) chỉ nơi tìm log, ảnh chụp, trace và kết quả từng job.
- [Kết quả đợt rà soát chất lượng](docs/quality-completion.md) ghi các kiểm tra đã thực hiện. [Checklist nghiệm thu](docs/manual-acceptance-checklist.md) dùng khi kiểm tra bằng thiết bị thật hoặc công cụ hỗ trợ.
- [Kế hoạch kiểm thử](docs/test-strategy.md), [ghi chú kiểm thử thủ công](docs/manual-testing.md) và [lộ trình](docs/implementation-roadmap.md) giúp chọn phần cần bổ sung.

Báo cáo theo từng giai đoạn lưu kết quả tại thời điểm chạy. Dùng báo cáo kết quả để tra số liệu của đợt gần nhất được ghi nhận.
