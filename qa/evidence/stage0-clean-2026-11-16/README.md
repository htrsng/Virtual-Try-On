# Stage 0 — clean local clone evidence

Source: `3d6109745e1ec6a3035f7af25ea586357784fa1a`, Windows 11,
16/11/2026 Asia/Saigon. Xem [report](../../docs/baseline-report.md).

- `check-summary.json`: exit codes của run sau khi cài xong; root path là vị trí
  clone local, không phải URI database. `browser-inventory` chỉ là test discovery.
- `startup-summary.json`: API/UI/proxy HTTP 200 và browser exit 0 sau cài Chromium.
- `source-sha256.json`: source/config/lockfile fingerprints từ clone sạch.
- `log-sha256.json`, `startup-log-sha256.json`: raw-log fingerprints; raw logs nằm
  local trong `.runtime/stage0-clean/.runtime/`, không phải CI artifacts.

Run được giữ: `baseline-1794841660830`, `startup-1794841911272`,
`backend-portable-glob-local.log` (diagnostic với glob tương đối).
Build/lint/unit/backend chưa Pass. Browser 3 Pass nhưng có conditional assertions;
không dùng con số này làm bằng chứng nghiệp vụ checkout. Không lưu secrets,
database, generated reports hoặc toàn bộ screenshots vào Git.
