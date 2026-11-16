# Implementation roadmap

Tài liệu định hướng thứ hai được dùng để thống nhất cấu trúc: giữ `server/` và
`tests/`; coursework giữ tại `archive/coursework-api-fuzzing/`. Không chuyển tiếp
sang `coursework/api-fuzzing/` hoặc tạo Playwright framework mới.

| Giai đoạn | Deliverable | Exit criterion | Trạng thái |
|---|---|---|---|
| 0 Baseline | Inventory, setup, report, source manifest | Clone sạch chạy lại và biết rõ failures | Đã kiểm chứng clone local sạch tại `3d61097`; xem `baseline-report.md`; remote/CI chưa xác minh |
| 1 Backend P0 | API inventory, RBAC, validation, server checkout, regression, before/after bugs | Important routes có quyền/data/state contract và regression Pass | Hoàn thành scope local: 120 backend tests + 2 UI safety Pass; xem stage-1-backend-report.md; CI chưa xác minh |
| 2 QA foundation và Test environment | Strategy, cases/RTM, MongoDB test, fixtures, launcher/health | Contract rõ; repeat run không ảnh hưởng dev | Draft docs đã có; Jest replica set tạm có ở giai đoạn 1; chưa có full E2E seed/launcher |
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

## Cam kết phạm vi cho các lượt tiếp theo

Yêu cầu ngày 16/11/2026: hoàn thành Giai đoạn 0 trước. Chỉ tiếp tục các giai đoạn
sau khi có yêu cầu triển khai; tài liệu này lưu định hướng bền vững trong repository.
Không di chuyển `tests/` nếu làm hỏng imports/workflows, không đổi cấu trúc chỉ để
khớp sơ đồ. `client/`, `server/`, `tests/`, `qa/`, `archive/`, `.github/`, `doc/`
là cấu trúc mục tiêu. Chưa tạo các thư mục framework rỗng để giả định đã triển khai.

Sáu tiêu chí cuối cùng: hệ thống chạy nhất quán; nghiệp vụ/auth/RBAC đáng tin cậy;
Selenium Java có kiến trúc Maven/TestNG/POM; Playwright tập trung 3D/visual/traces;
có results/bugs/retesting/evidence/CI artifacts; README giúp người khác chạy và
xác minh. Chỉ ghi kết quả đã thực thi, không dùng các mục tiêu dưới đây làm coverage thực tế.

| Backlog | Ưu tiên | Điều kiện kiểm chứng |
|---|---|---|
| SEC-01 | P0 | Rà soát toàn bộ route nhạy cảm; auth/RBAC regression |
| SEC-02 | P0 | Reset/delete chỉ trong môi trường cho phép; secrets không vào Git |
| DATA-01 | P0 | Server xác minh và tính giá trị đơn hàng |
| ENV-01 | P0 | Clone sạch cài/chạy/kiểm thử được; mở rộng baseline hiện tại |
| CI-01 | P0 | Baseline CI mới có kết quả riêng từng job và artifacts |
| TEST-01 | P1 | Inventory và audit coverage Playwright |
| AUTO-01 | P1 | Selenium Java, Maven, TestNG, POM |
| TEST-02 | P1 | Strategy, cases, RTM, bug register tập trung |
| 3D-01 | P1 | Functional/visual tests có render evidence tái lập |
| DOC-01 | P1 | README đồng bộ commit và kết quả thực tế |
| CODE-01 | P2 | Refactor module có tests bảo vệ |
| PORT-01 | P2 | Demo, CI, bug evidence và báo cáo dễ đánh giá |

SEC/DATA là hạng mục cần xác minh; không mặc định là vulnerability đã khai thác.
Sau baseline, ưu tiên rà soát P0 backend song song với chốt contract/test foundation.

Mục tiêu sáu tuần có thể điều chỉnh: (1) baseline/P0, (2) test environment và QA
foundation, (3) Java/Selenium và 5 smoke, (4) POM/E2E/persistence, (5) 3D/visual/CI,
(6) bug retest/refactor/README. Phụ thuộc kỹ thuật và chất lượng quyết định tiến độ.

## Mục tiêu coverage, chưa phải kết quả

MVP 40 cases → Portfolio Ready 90 → mở rộng 150. Chốt số lượng sau feature
inventory; không tạo cases cho chức năng chưa tồn tại để đủ chỉ tiêu. Mỗi case
có một phương pháp thực thi chính để tránh đếm trùng giữa framework.

| Module | Mục tiêu mở rộng |
|---|---:|
| Authentication & User | 20 |
| Product Management | 20 |
| Shopping Cart | 15 |
| Checkout & Orders | 20 |
| 3D Virtual Try-On | 25 |
| Admin & Authorization | 15 |
| API & Database Integration | 15 |
| UI & Compatibility | 10 |
| Reliability & Regression | 10 |
| Tổng | 150 |

Phân bổ dự kiến: Selenium 60, Playwright 35, API/integration 30, manual 25.
125 automated cases là mục tiêu mở rộng, không phải số scripts đang có hoặc
điều kiện bắt buộc để ứng tuyển. Không cần automation hóa toàn bộ manual cases.
Artifacts lớn, trace/report/screenshots hàng loạt lưu qua CI với retention;
Git chỉ giữ summary, tài liệu và evidence mẫu đã kiểm tra dữ liệu nhạy cảm.
