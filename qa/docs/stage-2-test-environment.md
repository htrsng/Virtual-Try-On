# Giai đoạn 2 — Môi trường và test data

Ngày 17/11/2026 (Asia/Saigon). Input commit `4caae89`; nhánh
`qa/stage-2-test-environment`. Tiếp nối backend P0, giữ nguyên vị trí `tests/`.

## Thiết kế

- Development giữ URI/.env/DB riêng. QA không đọc `server/.env`, không nhận URI test
  bên ngoài, tự tạo MongoMemoryReplSet mới, cổng Mongo ngẫu nhiên và database
  `vfitai_test_<runId>_<nonce>`. Đóng run sẽ disconnect và stop đúng replica set đó.
- `qa/config.cjs` là nguồn host/ports/URLs: default API `127.0.0.1:3300`, UI
  `127.0.0.1:55173`. Host test chỉ loopback; ports trùng/sai bị từ chối. Không reuse
  server development nếu cổng bận. API child nhận URI/JWT mới và provider keys rỗng.
- Seed/reset/clear nằm ngoài HTTP application. CLI dùng named pipe (Windows) hoặc
  local socket, capability ngẫu nhiên trong manifest local và ownership guard trước
  khi xóa. Không mở lại các endpoint reset/clear/create-admin đã retired ở Giai đoạn 1.
- Fixture identity/clock/catalog được kiểm soát, password/JWT tạo mới mỗi run.
  [Fixture contract](../test-data/README.md) mô tả accounts, stock, orders và assets 3D.
- Playwright global setup sở hữu API/UI/Mongo và return teardown; auto fixture reset
  trước/clear sau từng test, browser context mới cho mỗi case. Jest có DB mới mỗi suite
  và clear sau mỗi case; cleanup giữ indexes và ownership marker.

## Health và lifecycle

`GET /api/health/live`: 200 khi API process phục vụ HTTP, không phụ thuộc DB.
`GET /api/health/ready`: DB ping được và, khi managed QA, marker fixture có state ready;
trả 503 nếu disconnected/empty. Không trả URI, JWT, credentials hoặc stack.
Launcher kiểm tra cả API health trực tiếp, qua Vite proxy, runId khớp và HTML UI có root.
CLI clear làm ready=503; reset thành công đưa ready=200. Liveness vẫn 200 khi data empty.

Manifest `.runtime/qa/<runId>/environment.json` chứa capability và accounts ngẫu nhiên
khi environment chạy; mode file hạn chế trên hệ hỗ trợ. Không commit/copy manifest vào
report public. Sau stop, file chỉ còn runId/status/URLs; cleanup summary không có secrets.
Log, raw JSON, trace và generated reports đều ở ignored runtime/report paths.

## Thay đổi Development / QA

Development: thêm health routes và HOST; normalization giữ variant/size IDs thay vì
sinh IDs mới mỗi save, để reset và tham chiếu 3D ổn định. Không thay giá/quyền/order rules.

QA: fixtures/owned DB/CLI, Playwright global setup và context isolation, repeat runner;
thay networkidle và conditional branches của 3 smoke cases bằng assertions bắt buộc
trên seed product. Actual customer flow: API login làm fixture setup → home → product
50101 → size M → cart → chọn item → checkout. Chưa submit order bằng UI; case API
riêng tạo/read-back order thật. Không coi flow này là UI login hoặc payment coverage.

Browser context chỉ cho HTTP(S) tới UI/API test, language=vi; không phụ thuộc CDN,
analytics hoặc image/font ngoài repo. Đây là test policy, không đổi network behavior
của ứng dụng khi người dùng chạy development.

Dependency management: dùng lockfiles/`npm ci`; không thêm dependency. CI config được
chỉnh Node 22, npm ci và paths QA/scripts để dùng cùng launcher. Chưa xác minh run Actions;
full frontend unit/build/lint còn các lỗi baseline đã ghi, không tuyên bố CI xanh.

## Kiểm chứng / Definition of Done

Repeat runner: `node scripts/qa-repeat.cjs all`, backend 2 lượt rồi Playwright 2 lượt.
Raw results ở `.runtime/qa-repeat/<run>/`; mỗi lượt browser dùng runId/database mới,
reset mỗi case và xác minh manifest stopped, không còn credentials/capability, ports free.
Backend suite gồm 10 lifecycle/guard tests mới và toàn bộ regression Giai đoạn 1.
Kết quả cuối được ghi tại [evidence](../evidence/stage2-2026-11-17/README.md).

| Lượt | Kết quả | Cleanup |
|---|---|---|
| Backend 1 | 130/130 Pass, 13 suites | DB riêng/suite; clear từng case, disconnect/stop |
| Backend 2 | 130/130 Pass, 13 suites | Như trên; không dùng dữ liệu lượt 1 |
| Playwright 1 | 6/6 Pass, 0 skipped | 7 resets gồm initial seed; stopped, ports free |
| Playwright 2 | 6/6 Pass, 0 skipped | RunId/DB mới; stopped, ports free |
| CLI lifecycle | Pass | Port collision/capability giả bị từ chối; reset/clear/stop và scrub Pass |

130 và 6 là test invocations trong hai framework, không phải số cases thiết kế toàn hệ
thống; chạy lặp không làm tăng coverage. Không có assertions skip âm thầm trong smoke mới.

CLI acceptance: `node scripts/qa-environment-check.cjs` kiểm tra port bận bị từ chối,
reset khôi phục mutations, clear/health transitions, capability giả bị từ chối và stop
trả cổng/xóa credentials khỏi manifest. Thao tác chỉ trên MongoDB tạm do script tạo.

Lượt khảo sát ban đầu có timeout khởi tạo do npm/PowerShell không truyền được CLI
flags, khiến nhiều Mongo processes chạy đồng thời. Đã giới hạn workers và đặt startup/
teardown timeouts riêng; repeat runner gọi Node CLI trực tiếp để tránh mất arguments.
Networkidle và cart chưa chọn item là Test Defects được sửa theo behavior thực tế,
không tăng timeout UI hoặc nới assertion để đạt Pass.

Scope này chứng minh test data isolation và repeatability local. Chưa phải Selenium
framework, visual/3D render coverage, production DB migration hoặc kiểm chứng trên Linux.
Reset chỉ chạy ở boundary; chưa hỗ trợ reset an toàn đồng thời với transaction đang chạy.
Khi process bị hard-kill, không tự adopt/xóa stale locks; dùng runId mới và kiểm tra đúng
process của run trước. Không dùng cleanup script tùy ý trên database development.
