# Ảnh chuẩn WebGL

Hai ảnh góc trước và góc trái được duyệt ngày 17/11/2026. Mã băm của từng ảnh và cấu hình đã dùng nằm trong [render-profile.json](render-profile.json).

Bộ test chụp áo QA Cotton Shirt (`50101`), màu White, size M, trên avatar mặc định. Ảnh được lấy trực tiếp từ canvas WebGL khi các khung hình đã ổn định. Cấu hình dùng Windows, Playwright 1.60.0, Chromium 148.0.7778.96, ANGLE SwiftShader, viewport 1440 × 1000 và DPR 1. Ngưỡng chênh lệch là 0,2% số pixel.

Từ thư mục `tests/`, chạy bằng PowerShell:

```powershell
$env:QA_3D_VISUAL = '1'
node node_modules/@playwright/test/cli.js test --project=3d-visual
```

Khi ảnh khác, mở ảnh thực tế và ảnh diff để xác định nguyên nhân. Nếu thay đổi là chủ đích, tạo ảnh ứng viên ở máy local bằng `--update-snapshots`, duyệt từng ảnh và cập nhật mã băm trong profile. Ảnh xuất từ CI Linux nằm trong artifact `visual-candidates/` với `approved: false`. Dùng profile và ảnh được duyệt riêng cho mỗi hệ điều hành.

Từ thư mục gốc, chạy `node scripts/qa-3d-diagnostic.cjs` để kiểm tra bộ so ảnh có phát hiện model sai hay không. Ca bên trong tạo ảnh diff và trace theo chủ đích. [Chi tiết kiểm thử 3D](../../qa/docs/stage-7-playwright-3d.md).
