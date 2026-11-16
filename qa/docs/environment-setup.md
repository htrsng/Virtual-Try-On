# Environment setup

## Giai đoạn 1 — cấu hình hiện tại

Backend hardening nằm ở nhánh `qa/stage-1-backend-p0`; xem
[stage report](stage-1-backend-report.md). Các mục Giai đoạn 0 phía dưới là lịch sử.

Prerequisites đã dùng: Windows 11, Node 22.15.0, npm 11.3.0, MongoDB binary 8.2.6.
Không thêm dependency mới. Java/Maven chưa dùng trong giai đoạn này.

```powershell
# Nếu có binary tin cậy sẵn, đặt trước npm ci server:
$env:MONGOMS_SYSTEM_BINARY = 'C:\tools\mongodb\bin\mongod.exe'
$env:MONGOMS_RUNTIME_DOWNLOAD = 'false'
npm ci --prefix server --no-audit
npm ci --prefix client --no-audit
npm test --prefix server -- --runInBand
```

Thay đường dẫn ví dụ bằng binary thật; máy thực thi dùng
`D:\Virtual-Try-On-sync\.runtime\tools\mongod.exe`. Nếu không dùng binary local,
MongoMemoryServer có thể cần Internet để tải đúng binary (package hiện tại dùng 8.2.6).
`global-setup.js` đặt test JWT/URI/service keys; NODE_ENV=test không đọc `.env`.
Mỗi suite tự chạy MongoMemoryReplSet tạm và chờ indexes; afterEach chỉ xóa các
collections trong replica set tạm, afterAll disconnect/stop. Không cần database dev,
không gọi HTTP reset/create-admin. Test fixtures không phải tài khoản triển khai.

UI safety tests từ `client/`:

```powershell
node node_modules/vitest/vitest.mjs run src/components/PaymentSafety.test.jsx
```

### Chạy ứng dụng với checkout mới

Checkout dùng transaction nên cần MongoDB replica set/Atlas. Standalone cũ vẫn có thể
phục vụ một số reads nhưng checkout trả 503 REPLICA_SET_REQUIRED. Không tự chuyển
hoặc reset database cũ. Dùng database/dev path riêng, ví dụ port 27018:

```powershell
# Terminal MongoDB: giữ process chạy; cần mongod trong PATH.
New-Item -ItemType Directory -Force .runtime/mongodb-rs | Out-Null
mongod --dbpath .runtime/mongodb-rs --port 27018 --bind_ip 127.0.0.1 --replSet rs0
```

Terminal khác, dùng mongosh đã cài riêng (hoặc replica set/Atlas do bạn quản lý):

```powershell
mongosh 'mongodb://127.0.0.1:27018/?directConnection=true' --eval 'rs.initiate({_id:"rs0",members:[{_id:0,host:"127.0.0.1:27018"}]})'
```

Đây là hướng dẫn self-managed local; lệnh mongosh này chưa được chạy trên máy đo.
Replica-set path đã được xác minh qua MongoMemoryReplSet của regression suite.
Chỉ bind localhost cho dev, không mở MongoDB không auth ra mạng.

Tạo `.env` từ example và cấu hình URI
`mongodb://127.0.0.1:27018/vfitai?replicaSet=rs0`; không ghi đè `.env` đang có.
Tạo secret riêng bằng `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`
rồi lưu vào `.env` untracked hoặc secret manager. Backend từ chối secret thiếu,
dưới 32 ký tự hoặc placeholder. `npm start --prefix server`, UI `npm run dev --prefix client`.
Launcher development cũ không cấu hình/initialize replica set; khởi động DB riêng trước.
Restart backend/frontend đang chạy để dùng code mới; suite không dừng server dev của bạn.

### Bootstrap admin riêng, không qua HTTP

Chỉ chạy trên database bạn chủ động chọn. Script không in password, không sửa
account email đã tồn tại. Đặt URI/JWT đúng môi trường trước; lấy credentials qua prompt:

```powershell
$qaAdminCredential = Get-Credential -Message 'New VFitAI admin credentials'
$env:ADMIN_EMAIL = $qaAdminCredential.UserName
$env:ADMIN_PASSWORD = $qaAdminCredential.GetNetworkCredential().Password
try { npm run admin:create --prefix server }
finally {
    Remove-Item Env:ADMIN_PASSWORD -ErrorAction SilentlyContinue
    Remove-Item Env:ADMIN_EMAIL -ErrorAction SilentlyContinue
}
```

Không có reset-all CLI/HTTP mới; disposable test setup chịu trách nhiệm fixture cleanup.
Không giả định các tài khoản mật khẩu yếu từng có trong DB đã được thay đổi bởi code fix.

### Evidence local

Raw logs chỉ ở `.runtime/stage1/`; summary/hashes trong
`qa/evidence/stage1-2026-11-16/`. Export inventory bằng
`node scripts/export-api-inventory.cjs`. CI mới chưa được chạy; không đẩy generated
reports, Mongo files, browser binaries hoặc secrets lên Git.

## Giai đoạn 0: clean-clone verification (16/11/2026)

Xem [baseline mới](baseline-report.md); các phần bên dưới giữ lại ngữ cảnh lượt cũ.
Commit source đã xác minh: `3d6109745e1ec6a3035f7af25ea586357784fa1a`.
Clone vào thư mục mới; không copy `.env`, database hoặc `node_modules`.
Thay `<repository-url>` bằng remote của bạn và checkout commit trên.

```powershell
git clone <repository-url> VFitAI-stage0
cd VFitAI-stage0
git checkout 3d6109745e1ec6a3035f7af25ea586357784fa1a
# Nếu dùng binary MongoDB local, đặt đường dẫn tuyệt đối trước npm ci:
$env:MONGOMS_SYSTEM_BINARY = 'C:\tools\mongodb\bin\mongod.exe'
$env:MONGOMS_RUNTIME_DOWNLOAD = 'false'
npm ci --prefix server --no-audit
npm ci --prefix client --no-audit
npm ci --prefix tests --no-audit
node tests/node_modules/@playwright/test/cli.js install chromium
```

Đường dẫn binary ở trên là ví dụ, cần thay bằng binary tin cậy thực sự tồn tại.
Máy đo dùng MongoDB 8.2.6; package có thể cần Internet để tải binary nếu không đặt
`MONGOMS_SYSTEM_BINARY`. Không vô hiệu hóa kiểm tra TLS để tải dependencies.
`--no-audit` chỉ bỏ audit trong bước cài, không phải tuyên bố dependencies an toàn.

Hai script mới có trong nhánh QA sau commit nguồn trên. Có thể chạy từ nhánh QA
và truyền đường dẫn tuyệt đối tới clone cần đo (không cần copy script vào clone):

```powershell
node scripts/qa-baseline.cjs D:\path\VFitAI-stage0
node scripts/qa-startup-smoke.cjs D:\path\VFitAI-stage0
```

Script baseline tự chặn URI development và đặt khóa dịch vụ ngoài rỗng; startup dùng DB tạm,
cổng 3300/55173 và override cả API URL lẫn Vite proxy. Cần cổng trống.
Exit code khác 0 phải được đọc trong logs, không đồng nghĩa mọi test thất bại.
Baseline có lỗi Jest discovery Windows; diagnostic từ `server/`, trong terminal
đã đặt `NODE_ENV=test`, `MONGODB_URI=''`, JWT test và khóa dịch vụ rỗng như hướng dẫn dưới:

```powershell
node node_modules/jest/bin/jest.js --runInBand --testMatch '**/tests/**/*.test.js'
```

Lệnh diagnostic thay glob, không thay assertions; báo cáo riêng với run nguyên cấu hình.
Để chạy ứng dụng development theo phần bên dưới cần `.env` riêng. Hai script QA
không cần `.env` và không dùng launcher development.

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
