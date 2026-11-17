# Existing-test audit evidence — 17/11/2026

Input `1914105`, nhánh `qa/stage-4-existing-test-audit`. Final candidate được nhận diện
bằng source hashes, không nhúng commit SHA tự tham chiếu. Xem
[existing-test-audit.md](../../docs/existing-test-audit.md).

- `execution-summary.json`: before/after frontend, backend consolidation, static
  failures và các legacy suites đã chạy. Component subset14 nằm trong frontend21.
- `test-file-inventory.csv`: 32 automated test files, runner/layer/case counts/status;
  includes 22 app-related files (hai helper files nằm tại legacy location) và10 archived
  Python files. Infrastructure files và manual design cases không tính thành tests.
- `coverage-summary.json`: V8 execution totals trên130 frontend source files và19
  backend files trong scope khai báo; không cộng native subprocess runs vào coverage.
- `browser-repeat-summary.json`: hai lượt6 Pass,0 skipped, fixtures reset7 lần/run,
  owned DB khác nhau và cleanup stopped/ports free.
- `ci-job-audit.json`: **6 job logs đã đọc**, URLs, conclusions, skipped/failed steps,
  cause và raw-log SHA-256. Historical PR run head1914105 thực tế checkout mergefe571b1.
  Candidate workflow runner fix chưa có GitHub Actions run; không ghi nhầm local thành CI.
- `source-sha256.json`, `raw-log-sha256.json`: candidate source/toolchain và raw local
  artifact fingerprints. Raw files ở `.runtime/stage4/`, `.runtime/ci/`,
  `.runtime/coverage/`; browser repeat ở `.runtime/qa-repeat/1794902786997-a2a6fa3a/`.

Raw CI logs, credential helper, signed download links, generated HTML/JSON/XML reports,
trace/screenshots và runtime manifests không commit. GitHub credential chỉ dùng trong
bộ nhớ để đọc log; metadata ở đây không có token. Archived historical reports không sửa.
Build109 diagnostics và lint208 errors/14 warnings là Fail thực tế, không bị che bởi
tests Pass. Full archived fuzz campaign/visual rendering/payment provider chưa chạy.
