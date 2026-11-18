# Chạy Playwright cho VFitAI

Cài các gói theo [README ở thư mục gốc](../README.md), sau đó cài Chromium và Firefox từ thư mục gốc:

```sh
node tests/node_modules/@playwright/test/cli.js install chromium firefox
```

Các lệnh sau chạy từ `tests/`:

```sh
npm run typecheck
npm test
npm run test:3d
```

`npm test` chạy 12 ca, gồm 6 ca web/API và 6 ca 3D. Ca checkout đi đến trang tóm tắt đơn. Các ca 3D dùng GLB thật để kiểm tra đổi size, camera, animation và lỗi tải model. Playwright mở môi trường QA riêng, đặt lại dữ liệu trước mỗi ca và dọn sau khi chạy. Dùng một worker vì các ca cùng dùng môi trường đã khởi động cho suite.

## Chạy từng nhóm

| Nhóm | Cách chạy |
| --- | --- |
| Tương thích trình duyệt | Trong `tests/`, chạy `node node_modules/@playwright/test/cli.js test --config=playwright.compat.config.ts`. |
| Accessibility | Từ thư mục gốc, chạy CI runner với suite `playwright-accessibility`. |
| Bản build | Từ thư mục gốc, chạy CI runner với suite `playwright-production`. Runner build rồi mở Vite preview. |
| So ảnh WebGL | Dùng [profile Windows và hướng dẫn baseline](visual-baselines/README.md). |

Ví dụ chạy nhóm accessibility bằng cùng runner với CI:

```sh
node scripts/ci/run.cjs init playwright-accessibility
node scripts/ci/run.cjs run playwright-accessibility
node scripts/ci/run.cjs finalize playwright-accessibility
```

Compatibility chạy Chromium và Firefox trên desktop, cùng viewport tablet 768 × 1024 và mobile 390 × 844 trên Chromium. Hai viewport nhỏ là giả lập. Accessibility dùng axe và các ca thao tác bằng bàn phím. Safari, trình đọc màn hình và thiết bị thật có [checklist nghiệm thu riêng](../qa/docs/manual-acceptance-checklist.md).

## Xem lỗi

Báo cáo HTML mặc định ở `tests/playwright-report/`. Ảnh và trace của ca lỗi ở `tests/test-results/`. Mở trace từ `tests/` bằng `node node_modules/@playwright/test/cli.js show-trace <trace.zip>`. Nếu cần giữ kết quả cũ, sao chép chúng ra ngoài `test-results/` trước khi chạy lại.

Từ thư mục gốc, chạy `node scripts/qa-3d-diagnostic.cjs` để thử bộ so ảnh với một model GLB hợp lệ nhưng sai loại. Ca Playwright bên trong được kỳ vọng tạo ảnh diff. Script chỉ trả mã thoát 0 sau khi xác minh đúng loại sai khác; kết quả nằm trong `.runtime/qa3d-diagnostic/`. [Thiết kế và giới hạn của bộ 3D](../qa/docs/stage-7-playwright-3d.md).
