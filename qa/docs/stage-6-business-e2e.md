# Giai đoạn 6 — Business E2E

Selenium điều khiển UI thật; Java HttpClient gọi Express thật để chuẩn bị fixture và
đọc lại dữ liệu MongoDB của môi trường QA sở hữu riêng. Không mock API trong business
suite, không truy cập development DB. Không cần truy vấn MongoDB trực tiếp: các read
endpoints đọc Mongoose/MongoDB thật và UI đọc lại sau refresh.

## Phạm vi thực thi

[17 test cases](e2e-test-cases.csv), 13 methods với 3 DataProviders. Cộng 5 lượt smoke
cũ thành 22 invocations trong group `regression`. Không đếm các lần repeat thành
coverage mới. Default `smoke` vẫn chỉ 5 lượt; probe diagnostics luôn tách riêng.

```sh
node scripts/qa-selenium.cjs -Dgroups=e2e
node scripts/qa-selenium.cjs -Dgroups=regression
node scripts/qa-selenium.cjs -Dbrowser=chrome -Dgroups=regression
```

Xem [framework README](../selenium-java/README.md) để cài Java/Maven/Node/browser.
QA ports, lifecycle, fresh driver, reset và clear giữ nguyên hợp đồng giai đoạn 2/5.

| Module | Đã triển khai | Giới hạn |
| --- | --- | --- |
| Authentication | UI login smoke; session reload; logout; malformed và signed expired JWT | Không dùng token giả để gọi đó là expiration; JWT hết hạn được ký bằng key API QA dùng một lần |
| Catalog | Seeded listing/detail smoke; header search positive/empty; category route filtering | User-selected price/name sorting: Not Implemented; built-in 3D-first ordering không phải control sắp xếp |
| Cart | UI add/select; increment; reload persistence; remove; checkout gate | Cart chỉ lưu localStorage; không tuyên bố server-side cart sync |
| Checkout | COD standard/express; GIAM10; UI confirm; real server stock error | Address tạo qua API là setup; không nhận coverage address-form UI; online payment Not Implemented |
| Orders | Exact product/size/quantity/price/fee/discount/total readback; owner cancellation and stock restoration | Không giả lập thanh toán thành công |
| User/Admin | Anonymous/customer UI boundary + 401/403 API; actual admin UI login/list; status transitions through admin API reflected in owner UI | Admin status action dùng API integration; chưa có coverage admin edit-dropdown UI |
| 3D data | Delivered order sync vào purchased closet đúng owner/size/GLB URL | WebGL loading/garment selection/zoom/rotate/asset failure UI: Blocked in this suite; chưa có browser-render oracle, cần Playwright workstream |
| Persistence | Owner API readback and UI reload; account isolation; stock/coupon usage/closet persisted | Không coi localStorage cart là MongoDB persistence |

## Development Fix và QA

Development: guard UI admin; đổi coupon precheck sang API owner có thật và fail closed;
giữ RouteShell identity ổn định khi toast/cart state đổi. Chỉ thêm data-testid cho
order card/expand/cancel để chọn đúng ID, không phụ thuộc layout inline style.

QA: [bug report và retest](../bug-reports/stage6-business-e2e.md), CSV cases,
Java UI/API assertions, expired-session fixture và lifecycle acceptance, regression
groups/CI artifact setup. Không thay expected business totals để làm suite xanh.

JWT fixture được tạo trong owned QA launcher, đã hết hạn ngay khi cấp; không lộ
signing key và không có HTTP mint/reset endpoint. Manifest chứa accounts/capability/
testSessions là dữ liệu runtime bị ignore, scrub khi stop, không upload qua CI.

## Reports

Surefire/TestNG XML/HTML và screenshots nằm trong ignored Maven `target/`;
raw run logs/XML copies nằm dưới `.runtime/stage6/`. CI chạy regression với Chrome
và giữ báo cáo/screenshots 14 ngày; không upload environment manifests. Git chỉ
lưu summary đã lọc và evidence mẫu.

## Execution ngày 17/11/2026

| Check | Kết quả |
| --- | --- |
| Full Selenium regression — Edge 157.0.4341.60 | 22/22 Pass, 0 Fail/Skip, launcher exit0 |
| Repeat full regression — Chromium 148.0.7778.96 qua ChromeDriver | 22/22 Pass, 0 Fail/Skip, launcher exit0 |
| Frontend Vitest — sau Development Fix | 25/25 Pass, 5 files |
| Playwright hiện có | 6/6 Pass; scope cũ giữ nguyên, không cộng vào 17 E2E cases mới |
| Owned environment acceptance | Pass; collision/forged capability refused; expired JWT401; reset/clear/stop; credentials/session scrubbed; ports released |
| TypeScript build prerequisite | Fail: 109 diagnostics, cùng số lượng baseline giai đoạn4; không tuyên bố full build Pass |
| GitHub CI mới | Chưa xác minh run; workflow regression đã cập nhật |

Hai regression runs dùng database/run ID khác nhau, reset trước/clear sau từng
invocation; 23 resets/run bao gồm seed ban đầu. Assertions baseline stock/order
counts bảo vệ việc rò dữ liệu giữa tests. Không retry, không yêu cầu thứ tự test.
Backend tests không được chạy lại toàn bộ trong lượt này: không đổi server handlers;
business API/MongoDB được thực thi trực tiếp qua E2E và lifecycle acceptance.

[Summary và source hashes](../evidence/stage6-2026-11-17/summary.json) lưu kết quả
cả failure/retest, case IDs, report hashes và môi trường. Hai ảnh mẫu đã kiểm tra:
[UI admin trước sửa](../evidence/stage6-2026-11-17/admin-ui-before.png),
[coupon trước sửa](../evidence/stage6-2026-11-17/coupon-before.png).
Ảnh chỉ có dữ liệu QA synthetic. Raw HTML/XML/logs giữ local hoặc qua CI artifacts.
