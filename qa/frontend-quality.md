# Frontend quality — scope và lỗi còn mở

Frontend trong `archive/vfitai/client/` được dùng làm đối tượng unit/component test.
Chưa tích hợp với Express harness thành E2E hoàn chỉnh.

## Component suite hiện hành

**14/14 PASS:** 8 ProductList, 6 Toast. Assertion kiểm tra tên/giá/link, empty/loading,
wishlist callback, preview boundary, điều hướng, title, live status, deadline timer,
unmount cleanup và thay callback. Test cũ chỉ kiểm tra `document.body` đã được thay.

Chạy từ repo root sau khi cài frontend dependency:

```sh
npm ci --prefix archive/vfitai/client
python tools/run_frontend_checks.py
```

Hoặc `npm run test:components` tại `archive/vfitai/client/`. Config
`vitest.components.config.ts` chỉ chọn ProductList và Toast. Test dùng React Testing
Library, jsdom và Vitest; mock hai context hook và QuickViewModal boundary.
Không xác minh provider/API integration, modal thực, WebGL hoặc browser E2E.

## Kiểm tra legacy

```sh
python tools/run_frontend_checks.py --checks all
```

Snapshot ngày 15/11/2026:

| Check | Kết quả |
|---|---|
| Component suite | 14 PASS, exit 0 |
| Typecheck `tsc -b` | 112 diagnostic, exit 2 |
| Vite bundle | NOT_RUN: script build dừng khi typecheck lỗi |
| ESLint hiện có | 210 error / 14 warning, exit 1 |

[Report](../reports/current/frontend/report.md) · [Typecheck log](../reports/current/frontend/typecheck.txt) ·
[Lint JSON](../reports/current/frontend/lint.json) · [JUnit](../reports/current/frontend/components-junit.xml).

ESLint kế thừa chủ yếu áp dụng TypeScript theo config hiện có; không diễn giải là
mọi JSX/JS đều đã lint. Chưa sửa hàng loạt lỗi ứng dụng để làm xanh CI.

Test integration cũ `VirtualTryOn.test.tsx` **chưa đạt** ở baseline thử chạy toàn bộ
Vitest: mock thiếu `useGLTF.preload`; test đó không thuộc suite component mới. Lệnh
`npm test` cũ vẫn có thể thất bại. Không che giấu bằng cách bỏ test hoặc gán PASS.

## CI

- **QA Portfolio Checks:** unit logic, reporting/replay regression, fuzz-tool regression,
  bốn API smoke controls. Chọn full để chạy 51 acceptance scenario và replay từ report
  mới dù acceptance còn FAIL; job vẫn đỏ khi target vi phạm yêu cầu.
- **API Fuzzing Checks:** campaign ngắn với Z3, artifact riêng.
- **Frontend Component Checks:** component scope trên push/PR; chọn `legacy_checks`
  qua workflow_dispatch để chạy typecheck/build/lint. Job legacy còn lỗi sẽ đỏ,
  không dùng continue-on-error; mặc định không tuyên bố full frontend gate đạt.

Workflow ứng dụng cũ có `server/` nằm trong archive, không hoạt động. Các workflow
hiện hành không cần backend `server/`. Trạng thái CI remote chỉ xác nhận sau khi push.
