# System inventory

Khảo sát ngày 16/11/2026 trên working tree sau khôi phục; không đồng nhất với
nhánh main công khai. Commit nền `46d20b9`; source chưa commit được nhận diện
bằng manifest trong `../evidence/baseline-2026-11-16/`.

## Thành phần

| Thành phần | Bằng chứng source | Trạng thái |
|---|---|---|
| Frontend | `client/package.json`, `src/App.tsx` | React 19, Vite, TS/JSX, Three.js; mở được bằng dev server |
| Backend | `server/index.js`, `models.js`, `services.js`, `routes/ai.routes.js` | Express 5, Mongoose 9; phục hồi server gốc |
| MongoDB | `server/config/env.js`, `tests/setup.js` | Dev dùng MongoDB local; Jest dùng MongoMemoryServer |
| Browser tests | `tests/e2e/*.spec.ts` | 2 file, 3 tests; chưa phải regression coverage đầy đủ |
| Frontend tests | 2 component files và `VirtualTryOn.test.tsx` | 14 assertions/tests đạt; suite 3D lỗi import/mock |
| Backend tests | `server/tests/*.test.js` | 7 suites; xem baseline cho kết quả |
| Selenium | Chưa có source framework | Java/Maven đã có trên máy; chưa kiểm tra dependency/driver |
| CI | `.github/workflows/test.yml` | Có source workflow; chưa xác minh run trên GitHub |
| Coursework | `archive/coursework-api-fuzzing/` | API mô phỏng riêng; không tính vào coverage backend thật |

## Module và trạng thái xác minh

| Module | UI/source | API/source | Phạm vi đã xác minh |
|---|---|---|---|
| Authentication/profile | `/login`, `/profile` | `/api/auth/login`, `/me`, `/profile` | Login qua UI với user fixture đã chạy ở đợt khôi phục; chưa đủ negative cases |
| Catalog | `/search`, `/category/:id`, `/product/:id`, `/flash-sale` | `/api/products`, stock, product CRUD | Đọc product từ MongoDB, xem chi tiết/chọn size |
| Cart/checkout | `/cart`, `/checkout/choseproduct`, `/checkout/cart` | `/api/orders` | Thêm giỏ và mở cart; chưa submit order |
| Orders/payment | `/orders` | `/api/orders/*`, `/api/payment/*` | Có source; chưa xác minh UI → ghi order → đọc lại |
| Wishlist/reviews | `/wishlist`, ProductDetail | `/api/wishlist/*`, `/api/reviews/*` | Source-only trong lượt khảo sát |
| Try-on/avatar | `/try-on`, `/avatar-studio`, `/size-compare` | `/api/tryon/session*` | Có canvas/model source; chưa chứng minh model/texture render đúng |
| Closet/outfits | Try-on và AI pages | `/api/virtual-closet/*`, `/api/saved-outfits` | Source-only |
| AI stylist | `/ai-outfit`, `/ai-outfit-generator` | `/api/ai/outfit-suggest` | Thiếu Gemini key trong cấu hình local; chưa gọi dịch vụ thật |
| Admin | `/admin/*`: products, users, orders, banners, chat, AI | Admin/product/user/order APIs | Source-only; cần kiểm thử quyền backend độc lập UI |
| Support/recommendations | Chat widget | Chat, notifications, recommendations | Jest có kiểm tra một phần; không tương đương Gemini thật |

## Phân biệt dữ liệu thật và mô phỏng

- `App.tsx` dùng localStorage cho cart, một số categories/banner/top-search và
  dữ liệu fallback. Cart hiển thị không chứng minh order đã lưu trong MongoDB.
- API sản phẩm đã đọc MongoDB thật trong kiểm tra khôi phục; không suy rộng rằng
  mọi danh sách trên UI đều do backend cấp.
- `/api/payment/create` tạo URL `payment.vfitai.com` và dùng timer mô phỏng trạng
  thái. Không có bằng chứng tích hợp cổng thanh toán thật.
- Gemini và SMTP cần cấu hình dịch vụ riêng. Chat FAQ không chứng minh Gemini chạy.
- Không thấy route `POST /api/auth/register` trong index dù nhiều tests gọi route
  này. Cần chốt yêu cầu đăng ký và sửa fixture/test contract trước khi mở rộng.

API catalog kèm method, middleware và dòng source ở
`../evidence/baseline-2026-11-16/api-endpoints.csv`. Đây là trích xuất khai báo,
không phải danh sách endpoint đã được kiểm thử. Không gọi các route clear/reset.

## Audit tests và workflow

- Playwright title/root test chỉ xác nhận shell. Hai test còn lại đặt action và
  assertion trong `if`; có thể không thực hiện luồng nhưng vẫn kết thúc thành công.
- Tests tìm `/products`, trong khi App.tsx không khai báo route đó. Cần đối chiếu
  navigation thực tế thay vì thêm route chỉ để đáp ứng test cũ.
- `networkidle` chưa đủ chứng minh React/3D sẵn sàng. Cần wait theo trạng thái UI/model.
- Playwright config reuse server hiện có, không có isolated database/seed;
  trace chỉ on-first-retry; cần thiết kế môi trường test trước khi mở rộng.
- Jest `beforeAll` tạo user trong một số suites nhưng global `afterEach` xóa
  collection: token/data có thể không còn hợp lệ cho test tiếp theo.
- `test.yml` dùng Node 24 và `npm install`, thiếu MongoDB rõ ràng cho E2E,
  thiếu health check có trạng thái database, chưa có build/lint jobs, chưa có
  artifacts cho mọi loại check. Không kết luận CI đạt từ source YAML.
