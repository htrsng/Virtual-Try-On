# Giai đoạn 2 evidence — 17/11/2026

Input `4caae89`, nhánh `qa/stage-2-test-environment`. Candidate source/config/fixtures
được nhận diện qua SHA-256; không nhúng commit SHA tự tham chiếu vào chính manifest.

- `execution-summary.json`: môi trường đo và kết quả tổng hợp.
- `repeat-summary.json`: hai lượt backend (130 Pass/13 suites mỗi lượt), hai lượt
  Playwright (6 Pass, 0 skipped mỗi lượt); runId/database khác nhau, mỗi browser suite
  có 7 resets gồm seed ban đầu và 6 cases, cleanup stopped và ports released.
- `control-summary.json`: CLI reset/clear/stop, health transitions, refusal cổng bận /
  capability giả, credentials scrubbed. CLI stop chờ cleanup xong trước khi trả thành công.
- `source-sha256.json`, `asset-sha256.json`: candidate source và 7 GLB assets hiện có.
- `raw-log-sha256.json`: fingerprints của raw logs/JSON (local, không phải CI artifacts).

Final repeat raw files: `.runtime/qa-repeat/1794900303253-9b0229f9/`.
CLI raw log: `.runtime/stage2/control-check.log`. Không commit các raw files, runtime
manifests chứa credentials/capabilities, Mongo data, traces hoặc reports sinh tự động.
Các lượt khảo sát fail không được dùng thay final results; xem
[findings/retest](../../bug-reports/STAGE2-ENV.md).

[Setup](../../docs/environment-setup.md), [stage report](../../docs/stage-2-test-environment.md),
[fixture contract](../../test-data/README.md). Số test invocations không phải coverage
phần trăm của kế hoạch 150 cases; chưa xác minh Linux/Actions, visual render hoặc payment thật.
