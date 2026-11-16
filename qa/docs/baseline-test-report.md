# Baseline test report — 16/11/2026

Baseline đo trên Windows và working tree chưa commit, commit nền `46d20b9`.
Không phải kết quả trên GitHub main hoặc clean clone. Source manifest và execution
summary nằm trong `../evidence/baseline-2026-11-16/`.

| Check | Kết quả | Chi tiết |
|---|---|---|
| Frontend build | FAIL | 112 TypeScript diagnostics; `tsc -b` không đạt, chưa tới Vite production bundle |
| Frontend lint | FAIL | 210 errors, 14 warnings trong phạm vi 74 file ESLint trả về |
| Frontend Vitest | FAIL | 2 files passed, 1 file failed to load; 14 tests passed; `useGLTF.preload is not a function` |
| Backend Jest | FAIL | 3 suites passed, 4 failed; 10 tests passed, 6 failed; auth suite lỗi cú pháp, chưa chạy cases |
| Playwright nguyên bản | BLOCKED | 3 cases không khởi chạy browser do thiếu Chromium headless shell; exit 1 không phải bằng chứng lỗi sản phẩm |
| Kiểm tra khôi phục bằng Edge | PASS có giới hạn | Evidence đợt trước: home, login, product/size/cart; không submit order |
| Clean-clone reproducibility | BLOCKED | Source khôi phục và archive moves chưa commit; chưa thử clone sạch |
| Selenium | NOT IMPLEMENTED | Chưa có framework, tests hay TestNG report |
| GitHub Actions | NOT VERIFIED | Có YAML; chưa có run/artifacts xác minh cho source hiện tại |
| Archived component runner | PASS | Đã sửa đường dẫn từ archive/vfitai/client về client; scoped component check exit 0 |

## Phân loại lỗi

1. Build/lint: vấn đề source/config frontend. Ví dụ unused declarations, type-only
   imports, kiểu product có null, thiếu type declaration. ESLint chỉ cấu hình
   TS/TSX; không xem con số này là kết quả audit toàn bộ JSX.
2. Frontend unit: lỗi test double của `useGLTF` thiếu `.preload` tại import
   `Avatar.tsx:14`; chưa phải bằng chứng model 3D thật hỏng.
3. Backend: `auth.test.js` không parse; product tests kỳ vọng status/body/route
   không khớp server; order tests nhận 403; FAQ test đòi một chuỗi không xuất hiện
   trong câu trả lời. Cần phân tích contract và fixture trước khi sửa assertions.
4. Playwright: thiếu browser executable là lỗi môi trường. Audit source còn phát
   hiện conditional assertions và route `/products` chưa thấy trong App.tsx.

Không gộp suite không load vào số tests Fail đã chạy. Backend 16 tests được Jest
đếm không bao gồm những cases chưa collect được trong auth suite.

## Cách thực thi và evidence

- Lượt đầu Vitest/Playwright/Mongo process gặp `spawn EPERM` do giới hạn môi
  trường thực thi. Chạy lại ba suites với quyền tạo process; kết quả bảng trên
  dùng lượt chạy lại. Không xem EPERM là lỗi ứng dụng.
- Jest chạy serial, `MONGODB_URI=''` để chặn `.env` dev, MongoMemoryServer dùng
  binary local trong database tạm. Không xóa database development.
- Build/lint giữ kết quả lượt đầu vì đã chạy tới compiler/linter và báo lỗi source.
- Không cài lại dependencies đang chạy trong lượt baseline; dùng node_modules
  hiện có. Cài đặt sạch client/Node 24 chưa được xác minh.
- Raw logs ở `.runtime/qa-baseline-2026-11-16/` và
  `.runtime/qa-baseline-2026-11-16-verified/` trên máy này. Summary/diagnostics và
  SHA-256 được lưu trong QA evidence; không coi raw log local là artifact GitHub.
- Chỉ điều chỉnh path và source hashing của archived frontend runner để theo
  client đã khôi phục; không đổi báo cáo fuzzing lịch sử hoặc chạy lại fuzzing core.

## Exit criteria giai đoạn 0

- Đã xác định module, routes, config, test coverage hiện có và failure baseline.
- Chưa đạt điều kiện clean clone + environment repeatability.
- Chưa sửa source business logic, tests cũ hoặc workflow trong lượt baseline.
- Việc tiếp theo: triage test contract, làm môi trường test cô lập, khắc phục
  blocker rồi mới xây vertical slice Selenium đầu tiên.
