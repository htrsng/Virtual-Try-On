# Environment setup

## Môi trường đã quan sát

16/11/2026: Windows 11 x64, Node 22.15.0, npm 11.3.0, Java/Javac 17.0.12,
Maven 3.9.10. CI cũ dùng Node 24; chưa đối chiếu kết quả Node 24. Edge đã dùng
để xác minh web; Playwright Chromium headless shell đúng phiên bản chưa có.

Java/Maven có trong PATH không đồng nghĩa Selenium đã cài hoặc chạy được.

## Chạy ứng dụng trên máy khác

Yêu cầu: Node/npm, MongoDB local hoặc MongoDB URI của môi trường được phép dùng.
Source khôi phục được lưu trong commit `c83799e` sau khi đo baseline. Chưa xác minh
khởi chạy lại từ clone sạch; cần checkout phiên bản có commit khôi phục này.

Từ repo root:

```powershell
npm ci --prefix server
npm ci --prefix client
npm ci --prefix tests
```

Tạo `server/.env` theo `server/.env.example`: Mongo URI và JWT secret riêng.
Tạo `client/.env` theo `client/.env.example`: API mặc định cổng 3000.
Không ghi đè file `.env` đang dùng khi chỉ cần đổi một giá trị.

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\start-web.ps1
```

Mongo mặc định 27017; API 3000; UI 5173. Script không cài MongoDB; cần MongoDB
service, mongod trong PATH hoặc binary local được mô tả trong `doc/RESTORED_WEB.md`.
`.runtime/` và database không nằm trong Git. Có thể chạy riêng `node index.js`
trong server và `npm run dev` trong client.

Dev server mở được không chứng minh production build đạt.

## Chạy lại baseline

Frontend từ `client/`:

```powershell
npm run build
npm run lint -- --format json
npm test -- --run
```

Backend: chỉ chạy khi đã ngăn load MongoDB URI development. Trong terminal mới,
từ `server/`:

```powershell
$env:MONGODB_URI = ''
$env:NODE_ENV = 'test'
$env:JWT_SECRET = 'baseline-only-not-a-deployed-secret'
$env:GEMINI_API_KEY = ''
$env:EMAIL_USER = ''
$env:EMAIL_PASS = ''
npm test -- --runInBand
```

`config/env.js` chỉ đọc `.env` nếu biến môi trường undefined; chuỗi rỗng ở đây
chặn kết nối dev khi import app. `tests/setup.js` tự tạo disposable MongoDB,
kết nối và xóa dữ liệu test sau mỗi test. MongoMemoryServer có thể tải binary;
nếu offline, đặt `MONGOMS_SYSTEM_BINARY` tới binary tin cậy đã có trên máy và
`MONGOMS_RUNTIME_DOWNLOAD=false`. Baseline này dùng `.runtime/tools/mongod.exe`.
Không chạy các lệnh migrate/reset trên database đang dùng.

Playwright từ `tests/`, sau khi có môi trường test riêng:

```powershell
npx playwright install chromium
npm test
```

Baseline đã thử suite cũ nhưng bị chặn vì thiếu executable. Không đổi browser,
selector hoặc assertion rồi gọi đó là kết quả suite nguyên bản.

## Môi trường test cần xây ở bước tiếp theo

- MongoDB riêng `vfitai_test`, API/UI test dùng port riêng hoặc được kiểm soát.
- Launcher truyền URI test rõ ràng; health xác minh cả API và DB readiness.
- Seed user/product có namespace cho mỗi run; dọn đúng fixture của run đó.
- Tạo user trực tiếp qua fixture Mongoose nếu registration chưa thuộc contract.
- Không dùng development session/browser storage cho automation.
- Kiểm chứng clone sạch và repeat run sau khi source đã commit.

Chưa có seed/reset, health endpoint hay launcher test mới. Script `start-web.ps1`
hiện là launcher web development, không phải môi trường test cô lập.
