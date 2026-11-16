# Baseline findings

Ngày 16/11/2026; base commit `46d20b9`, dirty working tree, manifest trong QA
evidence. Các mục là findings đã triage ban đầu, chưa có bug nào đã fixed/retested.

| ID | Loại / priority | Bằng chứng và tái hiện | Actual / Expected | Hướng xử lý / trạng thái |
|---|---|---|---|---|
| QA-BL-001 | Build / P0 | `client`: `npm run build`; compiler diagnostics trong evidence | 112 TS diagnostics / build đạt kiểm tra kiểu trước bundle | Triage typing/imports/unused theo module; OPEN |
| QA-BL-002 | Static analysis / P1 | `client`: `npm run lint -- --format json` | 210 errors + 14 warnings / phạm vi đã cấu hình không có lỗi | Fix theo rule; lưu ý JSX chưa nằm trong lint scope; OPEN |
| QA-BL-003 | Test double / P0 | `client`: `npm test -- --run`; Avatar.tsx:14 | `useGLTF.preload` không tồn tại trong mock / suite collect và kiểm tra component | Sửa mock đủ contract, không suy ra model render đúng; OPEN |
| QA-BL-004 | Test contract/fixture / P0 | `server`: isolated Jest như environment-setup | auth suite syntax; product 200 vs 201/body; orders 403; FAQ substring / contract và data nhất quán | Chốt spec, sửa syntax/fixture isolation; không sửa business tùy tiện; OPEN |
| QA-BL-005 | Environment / P0 | `tests`: `npm test` | Thiếu Chromium headless executable / browser đúng version launch được | Cài Chromium cho Playwright và dùng môi trường test; BLOCKED |
| QA-BL-006 | False-positive risk / P0 | Đọc `tests/e2e/home.spec.ts` và checkout-journey | Steps/assertions trong if; route products chưa khai báo / test bắt buộc đạt checkpoint hoặc Fail | Loại conditional skipping sau khi chốt navigation; source-confirmed, chưa browser retest |
| QA-BL-007 | Authorization review / P0 | Source `server/index.js`: product/user/order CRUD và clear/reset routes | Nhiều route không khai báo authenticateToken/requireAdmin; middleware đầu file chỉ CORS/JSON / quyền admin cần được định nghĩa và enforced | Chưa gọi destructive endpoint; cần negative tests trong DB cô lập và chốt role policy; OPEN source finding |

Severity nghiệp vụ cho API authorization chưa được chốt bằng runtime reproduction.
Không dùng clear/reset trên database development để lấy evidence. Repro report
chi tiết và Bug ID riêng được bổ sung khi đã xác định contract, fixture và phạm vi.
