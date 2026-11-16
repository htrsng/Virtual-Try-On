# Initial test scenarios

12 scenarios ban đầu từ source và kiểm tra khôi phục. Toàn bộ là thiết kế cho
suite mới, chưa có kết quả Selenium. Xem `test-cases.csv` cho steps và oracle.

| Scenario / Requirement | Hành vi | Priority | Công cụ dự kiến | Cơ sở |
|---|---|---|---|---|
| SC-001 / REQ-SMOKE-001 | Home có nội dung chính và navigation | P0 | Selenium | App.tsx, Banner.jsx |
| SC-002 / REQ-AUTH-001 | Login hợp lệ | P0 | Selenium | LoginPage, POST /api/auth/login |
| SC-003 / REQ-AUTH-002 | Sai mật khẩu không cấp session | P0 | Selenium/API | login route, concurrency test |
| SC-004 / REQ-PROD-001 | UI hiển thị product fixture từ API | P0 | Selenium | ProductDetailPage, GET /api/products |
| SC-005 / REQ-CART-001 | Chọn size và thêm đúng item vào cart | P0 | Selenium | ProductDetailPage, App cart state |
| SC-006 / REQ-CART-002 | Thay đổi quantity/remove item | P1 | Selenium | CartPage, App cart handlers |
| SC-007 / REQ-DATA-001 | Wishlist write/read theo user | P0 | API + MongoDB | wishlist add/get/remove routes |
| SC-008 / REQ-ACCESS-001 | Request thiếu token bị từ chối | P0 | API | authenticateToken, my-orders route |
| SC-009 / REQ-ORDER-001 | UI đặt order, lưu và đọc lại đúng user | P1 | Selenium + API/Mongo | CheckoutPage, orders routes |
| SC-010 / REQ-3D-001 | Model tải thành công và hiển thị đúng | P1 | Playwright/manual | VirtualTryOn, Avatar/useGLTF |
| SC-011 / REQ-3D-002 | Asset lỗi có hành vi phục hồi rõ | P1 | Playwright | Asset loader; expected UX cần xác nhận |
| SC-012 / REQ-API-001 | Version update đồng thời chỉ một lần thành công | P1 | Jest/Mongo | concurrency.js, concurrency.test.js |

REQ-ACCESS-001 chỉ chốt thiếu token trên route đã có guard; chưa đủ đặc tả tất cả
quyền admin. Không mặc định API product/user CRUD công khai là hành vi đúng.
SC-009 không xác minh thanh toán tiền thật. SC-010/011 cần xác định model ID,
readiness và lỗi mong đợi trước khi viết assertion tự động.
