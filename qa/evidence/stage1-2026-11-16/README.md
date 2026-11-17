# Stage 1 evidence — 16/11/2026

Input commit `e751a46`, baseline app `3d61097`, nhánh `qa/stage-1-backend-p0`.
Final candidate được nhận diện bằng `source-sha256.json` (application/config/tests
đã thay đổi và lockfiles). Commit bàn giao chứa manifest này; không nhúng SHA tự tham chiếu.

- `execution-summary.json`: số liệu từ final Jest JSON; UI safety và syntax check.
- `source-sha256.json`: source fingerprints, không bao gồm `.env` hay DB data.
- `raw-log-sha256.json`: hashes của local raw logs/JSON, không phải CI artifact links.

Raw files chỉ giữ trong `.runtime/stage1/`: `before.log` (5 expected Fail),
`pricing-before.log` (source cũ lưu total=1), `backend-final.log` và `jest-results.json`
(120 Pass/12 suites), `frontend-payment.log` (2 Pass), `jsx-syntax.log` (8 files, 0 diagnostics).
Pricing probe được thêm riêng trong clone local source cũ, không thay business source.
Các lượt trung gian fail khi đang sửa không thay thế baseline hoặc final result.

Reproduce: [environment setup](../../docs/environment-setup.md).
Scope/limits: [stage report](../../docs/stage-1-backend-report.md).
Không commit generated reports, database, downloaded binaries hoặc raw logs dài.
Không tuyên bố full frontend/E2E/3D, payment/email/AI thật hay GitHub Actions Pass.
