# VFitAI — Virtual Try-On & SmartFit

Hệ thống web thời trang với phòng thử đồ 3D, quản lý sản phẩm/đơn hàng và AI stylist. Frontend React/TypeScript/Three.js kết nối backend Node.js/Express và MongoDB.

## Cấu trúc

```text
client/       Frontend React, Vite và tài nguyên 3D
server/       Backend Express, Mongoose models, services và backend tests
tests/        Playwright browser tests gốc
doc/          Tài liệu ứng dụng và ghi nhận khôi phục
scripts/      Launcher web/QA, seed lifecycle và repeat checks
qa/           QA docs, fixtures, isolated environment và evidence summaries
archive/      Coursework kiểm thử và báo cáo lịch sử
```

## Chạy ứng dụng

Giai đoạn 1 bổ sung backend RBAC/validation và server checkout với MongoDB transaction.
Cần **replica set/Atlas**, JWT secret riêng tối thiểu 32 ký tự; cấu hình mẫu dùng port
27018. Hướng dẫn hiện tại tại [environment setup](qa/docs/environment-setup.md).
Reset/create-admin HTTP đã được bỏ; admin bootstrap dùng script riêng.

Cài dependency từ thư mục gốc:

```powershell
npm ci --prefix server
npm ci --prefix client
```

Tạo `server/.env` theo [server/.env.example](server/.env.example), đặt `MONGODB_URI` và `JWT_SECRET`. Mẫu hiện tại dùng MongoDB replica set local `mongodb://127.0.0.1:27018/vfitai?replicaSet=rs0`, API cổng 3000. Tạo `client/.env` theo [client/.env.example](client/.env.example); frontend và Vite proxy trỏ API cổng 3000.

Trên Windows:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\start-web.ps1
```

Mở **http://127.0.0.1:5173**. Script sử dụng MongoDB đang chạy; nếu dùng URI local mặc định và chưa có MongoDB, script tìm `mongod` trong PATH hoặc `.runtime/tools/mongod.exe`. Log nằm trong `.runtime/`.

Có thể chạy backend và frontend trong hai terminal riêng, sau khi khởi động MongoDB:

```powershell
cd server
node index.js
```

```powershell
cd client
npm run dev
```

File `.env`, binary MongoDB và database local không được commit. Muốn dùng lại catalog, tài khoản và đơn hàng cũ, cần cấu hình URI của database gốc. Gemini và email cần khóa/cấu hình riêng trong `server/.env`.

## Tình trạng khôi phục — 16/11/2026

Đã đưa frontend, tài liệu và browser tests về thư mục gốc; khôi phục 26 file backend gốc từ commit `ff37283`, ngay trước commit xóa server.

Đã kiểm tra bằng Edge với backend và MongoDB thật: trang chủ, đăng nhập, chi tiết sản phẩm, chọn size, thêm giỏ và mở checkout. Không ghi nhận JavaScript page error trong luồng này. Hai record kiểm thử được dọn riêng sau khi chạy.

Đây chưa phải kết quả kiểm tra toàn bộ hệ thống: chưa submit đơn hàng, xác minh thanh toán/email/Gemini hoặc toàn bộ luồng 3D. Chi tiết nguồn khôi phục, cấu hình và phạm vi xác minh ở [doc/RESTORED_WEB.md](doc/RESTORED_WEB.md).

## Hướng kiểm thử

[Giai đoạn 4 — kiểm toán tests hiện có](qa/docs/existing-test-audit.md): frontend
**21 Pass**, helper units **14 Pass**, backend **128 Pass**, Playwright **6/6 Pass ×2**.
Đã sửa mock GLTF và đọc logs từng CI job; E2E CI cũ fail do Ubuntu26.04 không được
Playwright1.60 hỗ trợ, độc lập với lỗi frontend. Candidate đã pin Ubuntu24.04;
CI mới chờ chạy. Build/lint vẫn Fail và coverage gaps được ghi rõ trong audit.

Giai đoạn 2 có môi trường QA riêng, tự seed/reset/cleanup và health checks.
Chạy `node scripts/qa-repeat.cjs all`: đã xác minh **backend 130/130 Pass ×2** và
**Playwright 6/6 Pass ×2**. Test không dùng database/server development.
Xem [setup hiện tại](qa/docs/environment-setup.md),
[fixture contract](qa/test-data/README.md) và [stage report](qa/docs/stage-2-test-environment.md).

[Giai đoạn 1 — Backend P0](qa/docs/stage-1-backend-report.md) có API inventory,
permission matrix, validation rules và regression evidence. Backend: **120 tests / 12 suites
Pass** trên MongoDB replica set tạm; UI payment safety: **2 tests Pass**.
Online payment chưa có provider, API trả unavailable; không mô phỏng success.
Frontend build/lint/3D và CI vẫn có giới hạn nêu trong baseline/report.

Giai đoạn 0 đã bổ sung kiểm chứng clone local sạch, setup và script baseline
trên nhánh QA. Xem [baseline mới](qa/docs/baseline-report.md) và
[lộ trình lưu trong repo](qa/docs/implementation-roadmap.md).
Build/lint/tests vẫn có lỗi được ghi nhận; chưa xác minh GitHub Actions của nhánh này.

Giữ các backend tests trong `server/` và Playwright tests trong `tests/`. Hướng Selenium + Java + TestNG/POM vẫn là kế hoạch phát triển; chưa có Selenium suite mới.

Đã bắt đầu [QA baseline và kế hoạch triển khai](qa/README.md), gồm inventory,
kết quả build/lint/tests, 12 test scenarios/cases và bảng truy vết.
Xem [baseline report](qa/docs/baseline-test-report.md) để phân biệt kết quả
đã chạy, lỗi hiện tại và phần chưa triển khai.

Bộ bài tập API/fuzzing và các báo cáo trước đây được giữ tại [archive/coursework-api-fuzzing](archive/coursework-api-fuzzing/README.md). API target của coursework có phạm vi riêng; backend của ứng dụng nằm trong `server/`.
