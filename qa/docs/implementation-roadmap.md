# Implementation roadmap

Tài liệu định hướng thứ hai được dùng để thống nhất cấu trúc: giữ `server/` và
`tests/`; coursework giữ tại `archive/coursework-api-fuzzing/`. Không chuyển tiếp
sang `coursework/api-fuzzing/` hoặc tạo Playwright framework mới.

| Giai đoạn | Deliverable | Exit criterion | Trạng thái |
|---|---|---|---|
| 0 Baseline | Inventory, setup, report, source manifest | Clone sạch chạy lại và biết rõ failures | Đã khảo sát/chạy checks; clone sạch còn blocked |
| 1 QA foundation | Strategy, 12 scenarios/cases, RTM | Expected result và contract rõ | Draft đã có; cần chốt các contract còn mơ hồ |
| 2 Test environment | MongoDB test, fixture lifecycle, launcher/health | Repeat run không ảnh hưởng dev | Chưa triển khai; Jest disposable DB hiện có được tận dụng |
| 3 Selenium | Java 17+, Maven, TestNG, POM, 5 smoke tests | Maven run độc lập có report/failure screenshots | Chưa triển khai |
| 4 Integration | UI write → API → Mongo → read-back + failure | Persistence và failure path có evidence | Chưa triển khai |
| 5 Playwright | Sửa tests hiện có, thêm diagnostics | Assertions không skip âm thầm; scope bổ trợ | Audit source đã có; chưa sửa/chạy browser thành công |
| 6 3D | Model state, controlled camera, asset failure, visual | Reproducible render evidence | Chưa triển khai |
| 7 Bug management | Repro, priority, evidence, retest | Đóng bug có retest | Baseline findings đã ghi; chưa retest fix |
| 8 CI | Checks + smoke, isolated DB, always artifacts | Run thật từ commit sạch | Audit YAML đã có; chưa có pipeline mới |
| 9 Portfolio | Coverage/results/bugs/limits/CV | Người khác chạy được smoke | Chưa đạt |

## Hành động ưu tiên sau baseline

1. Chốt contract login/registration/product/order và giải quyết test syntax/mock.
   Không đổi expected results chỉ để làm suite xanh.
2. Khắc phục TypeScript/lint theo module, giữ strict checking; retest ghi run mới.
3. Tạo MongoDB test và fixture seed/cleanup có namespace; không dùng reset-all.
4. Viết 5 Selenium smoke cases đã thiết kế, cấu hình baseUrl/browser; screenshot
   khi fail và TestNG report. Không Thread.sleep, không phụ thuộc test trước.
5. Đưa smoke lên CI có health check; mở rộng persistence slice, Playwright/3D sau.

Không tạo hàng loạt thư mục rỗng, Docker/Grid/Allure Server trước khi có nhu cầu.
Source khôi phục và archive đã được lưu trong commit `c83799e`; QA baseline được
lưu riêng sau đó. Kết quả baseline vẫn mô tả working tree tại thời điểm thực thi,
không thay bằng kết quả giả định từ commit hoặc CI.
