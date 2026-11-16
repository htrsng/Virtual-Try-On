# Giai đoạn 0 — baseline từ clone sạch

Ngày: 16/11/2026 (Asia/Saigon). Source được đo: `3d6109745e1ec6a3035f7af25ea586357784fa1a`.
Nhánh thực hiện: `qa/stage-0-reproducible-baseline`. Đây là kiểm chứng local,
không phải kết quả GitHub Actions. Clone local dùng `git clone --no-hardlinks`,
không sao chép `.env`, `node_modules` hoặc database development.

Baseline trước thay đổi được giữ tại [báo cáo cũ](baseline-test-report.md).
Lượt này bổ sung clean-clone verification; không sửa business logic để làm xanh tests.

## Môi trường

Windows 11 x64; Node 22.15.0; npm 11.3.0; Java 17.0.12; Maven 3.9.10;
MongoDB binary 8.2.6; Playwright 1.60.0, Chromium 148.0.7778.96 (revision 1223),
headless, 1 worker, retries 0. MongoMemoryServer khởi tạo database tạm và dừng sau run.
Node 24 của workflow hiện tại chưa được xác minh local. Chưa có Selenium suite.

## Kết quả trước thay đổi

| Check | Kết quả | Phân loại / bằng chứng |
|---|---|---|
| Cấu trúc repository | PASS | `client/`, `server/`, `tests/`, `archive/coursework-api-fuzzing/fuzz-testing/` đã có trong commit |
| Cài sạch client/tests | PASS | `npm ci --no-audit`: lần lượt 442 và 4 packages; không dùng lại dependency từ working tree |
| Cài sạch server | PASS với prerequisite | Dùng `MONGOMS_SYSTEM_BINARY` trỏ binary local; lượt download mặc định bị dừng, không tính là Pass |
| Frontend build | FAIL | 112 TypeScript diagnostics; chưa chạy Vite production bundle — Application Defect, cần triage từng lỗi |
| Frontend lint | FAIL | 210 errors, 14 warnings — Application Defect/config debt |
| Frontend unit | FAIL | 2 files Pass; 14 tests Pass; 1 suite không collect vì mock `useGLTF.preload` — Test Defect |
| Backend nguyên cấu hình | FAIL | `No tests found`; absolute `testMatch` gặp đường dẫn Windows có separator trộn — Test Defect/config, chưa phải kết quả nghiệp vụ |
| Backend diagnostic | FAIL | Chỉ override glob `**/tests/**/*.test.js`: 3 suites Pass, 4 Fail; 10 tests Pass, 6 Fail; auth suite không parse |
| API + MongoDB startup | PASS giới hạn | API `/api/products` HTTP 200, body array; database tạm rỗng có banner mặc định, không phải catalog thật |
| UI startup | PASS giới hạn | HTTP 200, HTML có React root; chưa chứng minh render/browser hoặc toàn bộ nghiệp vụ |
| Playwright inventory | PASS | 3 tests / 2 files; không di chuyển hoặc sửa specs |
| Browser execution | PASS có giới hạn | Sau cài Chromium: 3/3 tests Pass; config riêng, database rỗng, specs có conditional assertions |
| GitHub CI / remote sync | NOT VERIFIED | Chưa push hoặc chạy Actions; không suy luận CI xanh từ local |

Backend diagnostic tái hiện test product không khớp route/contract, order nhận 403,
FAQ assertion không khớp và lỗi syntax auth. Đây là lỗi test hoặc nghi vấn contract
cần triage, chưa xác nhận tất cả là Application Defect hay lỗ hổng.
Trạng thái retest từng finding được lưu tại [register](../bug-reports/STAGE0-RETEST.md).
Email/Gemini chưa xác minh; email verify báo thiếu credentials khi startup.

Ba Playwright cases Pass **không chứng minh checkout, cart hoặc product navigation
đã thực thi**: specs cũ bọc bước trong `if (isVisible/count)`, database không có
product/user fixtures. Chỉ xác minh được browser khởi chạy và các assertions thực sự
được chạm tới. Cần sửa silent-pass tests trong TEST-01 ở giai đoạn sau.

## Evidence và cách tái lập

- [Setup](environment-setup.md) mô tả clone, cài đặt và lệnh chạy.
- `scripts/qa-baseline.cjs`: build, lint, unit, backend nguyên cấu hình, browser inventory;
  lưu exit codes và raw logs trong `.runtime/` của checkout đích. Exit 1 nghĩa là có check không đạt.
- `scripts/qa-startup-smoke.cjs`: MongoDB tạm, API 3300/UI 55173, từ chối reuse cổng,
  chạy 3 Playwright specs hiện có với config baseline riêng rồi dọn processes/database.
  Config này đổi baseURL, workers/retries/reporting; không phải run nguyên config CI.
- Raw logs, browser downloads và reports sinh tự động không commit. Chỉ commit summary
  và SHA-256 của log; hash không thay thế log để debug. CI artifacts chưa tồn tại cho run này.
- Lượt chạy khi dependencies chưa cài xong bị loại; không dùng các lỗi missing-module
  của lượt đó làm bằng chứng sản phẩm. Lượt diagnostic cấu hình nhầm binary cũng bị loại.
- [Evidence lần này](../evidence/stage0-clean-2026-11-16/README.md): exit codes,
  startup summary và source/log hashes; giữ riêng evidence cũ.

## Điều kiện hoàn thành

Source đã có commit nền và nhánh riêng; clone local sạch cài được dependencies;
startup UI/API/MongoDB và các kiểm tra cơ sở có kết quả, lỗi được phân loại.
Giai đoạn 0 không yêu cầu tất cả checks Pass. Những lỗi ở trên được giữ làm backlog.
Khả năng clone từ GitHub và kết quả CI vẫn chưa xác minh; cần push nhánh và chạy CI
trước khi tuyên bố repository remote có cùng baseline.

Không chạy reset/migration, không đọc/commit secrets, không tạo dữ liệu người dùng,
không sửa security/business logic trong giai đoạn này. SEC-01/02 và DATA-01 vẫn là
các hạng mục rà soát, không phải lỗ hổng đã chứng minh.
