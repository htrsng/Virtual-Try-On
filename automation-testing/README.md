# Application unit automation

**14 unit test** chạy trực tiếp trên hai hàm TypeScript của ứng dụng gốc:

- `calculateRecommendedSize`: fallback, chọn size phù hợp, cận dưới/trên, phân biệt
  tops/bottoms, fit score, giữ input và tính ổn định khi đổi thứ tự chart.
- `fetchWithTimeout`: method/body, response, abort khi timeout, giữ nguyên network
  error và HTTP 4xx. Mock fetch ở ranh giới mạng; không gọi dịch vụ ngoài.

Từ thư mục này, dùng Node.js >=22.15 (CI dùng 24):

```sh
npm test
```

Không cần npm install: suite dùng `node:test` và khả năng strip TypeScript của Node,
import trực tiếp mã nguồn trong `archive/vfitai/client/src/utils/`. Không dùng mã
copy làm target. Test không render React, không xác nhận WebGL hay browser E2E.

Chạy `python tools/run_checks.py --suite smoke` từ repo root để lưu JUnit và log
cùng API/reporting/fuzz-tool regression. Unit application result được đếm riêng.
Playwright cũ vẫn trong archive và chưa được tính vào kết quả portfolio.

## React component scope riêng

Đã bổ sung 14 component test ProductList/Toast bằng Vitest/Testing Library trên mã
frontend gốc. Chạy `python tools/run_frontend_checks.py` từ repo root sau khi cài
dependency frontend. Không cộng 14 component case với unit logic để suy ra E2E.
[Scope, mocks và lỗi build/lint còn mở](../qa/frontend-quality.md).
