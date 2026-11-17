# Implementation roadmap

Tài liệu định hướng thứ hai được dùng để thống nhất cấu trúc: giữ `server/` và
`tests/`; coursework giữ tại `archive/coursework-api-fuzzing/`. Không chuyển tiếp
sang `coursework/api-fuzzing/` hoặc tạo Playwright framework mới.

| Giai đoạn | Deliverable | Exit criterion | Trạng thái |
|---|---|---|---|
| 0 Baseline | Inventory, setup, report, source manifest | Clone sạch chạy lại và biết rõ failures | Đã kiểm chứng clone local sạch tại `3d61097`, nhánh QA đã đồng bộ; xem baseline-report.md; CI chưa xác minh |
| 1 Backend P0 | API inventory, RBAC, validation, server checkout, regression, before/after bugs | Important routes có quyền/data/state contract và regression Pass | Hoàn thành scope local: 120 backend tests + 2 UI safety Pass; xem stage-1-backend-report.md; CI chưa xác minh |
| 2 Test environment | Owned MongoDB, fixtures, setup/reset/cleanup, URLs/health | Repeat run không ảnh hưởng dev hoặc data cũ | Hoàn thành local: backend 130/130 ×2, Playwright 6/6 ×2; xem stage-2-test-environment.md; QA foundation docs vẫn cần chốt coverage |
| 3 QA foundation | Strategy, feature inventory, test cases, RTM | Chốt coverage theo chức năng thực tế | Chưa chốt đầy đủ; không tự tạo 150 cases |
| 4 Existing-test audit (yêu cầu hiện tại) | existing-test-audit.md, verified old suites, mocks/layers/CI logs | Mỗi suite có command/scope/result hoặc failure reason | Hoàn thành local: frontend21, helper14, backend128, Playwright6×2; static failures và candidate CI pending ghi riêng |
| 5 Selenium (yêu cầu mới 17/11/2026) | Java 17, Maven, TestNG, POM, smoke, reports | Suite độc lập, có failure evidence và cleanup | Local Edge 5/5 ×2, Chromium 5/5; xem stage-5-selenium.md; GitHub CI pending |
| 6 Business E2E (yêu cầu mới) | UI checkout, API/MongoDB readback, regression, bugs | Critical flows có kết quả nghiệp vụ lưu trữ và isolation | Xem stage-6-business-e2e.md; Playwright render/visual vẫn là backlog |
| 7 Playwright 3D (yêu cầu mới) | Real viewer/state, approved baselines, pixel diffs/traces, reliability | Sai 3D tái hiện qua oracle thực | Xem stage-7-playwright-3d.md; CI chờ run thật |
| 8 CI | Five scoped workflows + reusable runner, metadata, JUnit/HTML/artifacts | PR checks đủ dữ liệu phân tích mọi Fail | Xem stage-8-ci-quality-gates.md; lint/build vẫn Fail, remote proof ở PR checks |
| 9 Portfolio | Coverage/results/bugs/limits/CV | Người khác chạy được smoke | Chưa đạt |

## Hành động ưu tiên sau baseline

Yêu cầu mới ngày17/11/2026 ưu tiên audit Giai đoạn4 trước framework mới; không coi
Giai đoạn3/Selenium đã thực hiện. Integration mở rộng vẫn là backlog sau framework,
không phải nội dung đã hoàn thành khi đánh dấu audit này.

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

## Cập nhật giai đoạn 5

Yêu cầu mới xác định giai đoạn 5 là Selenium. Framework nằm tại qa/selenium-java;
Playwright/3D mở rộng vẫn là backlog. Xem [stage-5-selenium.md](stage-5-selenium.md)
cho kiến trúc, smoke evidence và giới hạn; không coi QA foundation hoặc 150 cases đã hoàn thành.

## Cập nhật giai đoạn 6

Giai đoạn 6 theo yêu cầu mới là nghiệp vụ E2E toàn hệ thống. Ma trận chức năng thật,
17 cases mới và giới hạn 3D/sorting/payment nằm trong [stage-6-business-e2e.md](stage-6-business-e2e.md).
Kế hoạch Playwright visual/3D vẫn cần thực hiện, chưa coi asset/data assertions là render coverage.

## Cập nhật giai đoạn 7

Playwright hiện có đã được mở rộng cho 3D thay vì tạo framework trùng lặp. Baseline
front/left được người dùng duyệt ngày17/11/2026. Bug reports và các giới hạn render/GPU
được ghi tại [stage-7-playwright-3d.md](stage-7-playwright-3d.md); bug management tiếp tục xuyên suốt các giai đoạn.

## Cập nhật giai đoạn 8

CI tách theo scope, giữ lỗi lint/build hiện hữu thành Failed, dùng owned QA data và
artifact whitelist. Scheduled/manual full regression chỉ active sau khi workflow ở
default branch. Kết quả remote đối chiếu theo PR head/checkout merge SHA, không lấy
local Pass thay CI. Branch protection và merge main cần được review riêng.
