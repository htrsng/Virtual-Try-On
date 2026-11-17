# Giai đoạn 6 — Bug reports

Source nền: `f7cab1a8fdfcfad3816a5d08c9f525cb04eecb15`. Tất cả tái hiện trong QA
MongoDB cô lập, tài khoản và địa chỉ synthetic; không suy rộng thành exploit đã có.

## BUG-E2E-01 — Customer mount được UI quản trị

Priority P1, Application Defect. Login customer rồi mở `/admin/orders`.
Expected: quay về store, không mount admin tree. Before: vẫn ở admin route, sidebar
và màn hình quản trị mount. `GET /api/orders` vẫn 403, chưa có bằng chứng data leak.
Selenium `customerCannotEnterAdminOrReadAdminOrders` thất bại ở redirect wait trong
run `sel_a080ec01`; assertion API 403 đã Pass trước đó.

Development fix: `RequireAdmin` chờ auth loading, chuyển guest về login/customer
về store, chỉ render children cho admin. QA: 4 unit boundary cases và Selenium
guest/customer/admin UI + API matrix. Retest ghi theo execution summary cuối.

## BUG-E2E-02 — Không áp dụng được coupon cố định qua UI

Priority P1, Application Defect. Customer chọn QA Cotton Shirt M, vào checkout,
nhập GIAM10, chọn Áp dụng. Expected: subtotal200000, discount20000, ship30000,
total210000. Before: lỗi “Không thể kiểm tra mã giảm giá”; total230000.
UI gọi POST `/api/check-coupon-used`, route không tồn tại trong backend hiện tại.
First E2E run `sel_d9039105` tái hiện; transaction backend đã có coupon logic.

Development fix: GET owner `/api/used-coupons`, kiểm tra coupons[]; dùng cùng
contract cho newsletter branch và chặn tiếp tục nếu precheck lỗi. QA: GIAM10 UI
flow phải tạo đơn có persisted discount/total đúng và persisted coupon usage.

## BUG-E2E-03 — Toast làm checkout mất form state

Priority P1, Application Defect. Sau sửa endpoint, áp dụng GIAM10 làm coupon/input
bị reset thay vì giữ discount. Retest `sel_32596a5a`: 13/14 Pass, coupon case Fail;
screenshot cho thấy input trống và total230000. AppShell được khai báo trong App,
toast update tạo component type mới và remount routes. Không sửa bằng delay/retry.

Development fix: stable top-level RouteShell, render callback nhận location;
không gọi router hooks ngoài BrowserRouter. QA: cùng coupon E2E phải giữ discount
đến lúc confirm, lưu đơn210000 và đọc lại UI/API; toàn regression bảo vệ navigation.

## Test defects đã chỉnh

- TD-01: cart test ban đầu không login dù cart có auth guard; bổ sung UI login.
- TD-02: đọc stale order card sau cancel trong lúc refetch; explicit wait tìm lại
  card theo order ID và status. Không đổi expected cancellation hoặc stock.

Test defects không được ghi thành lỗi ứng dụng hoặc đếm tăng coverage.

## Retest cuối — 17/11/2026

BUG-E2E-01/02/03: **Fixed, retest Pass trong môi trường QA local**.
`sel_863507cc` (Edge) và `sel_fd72f71f` (Chromium/ChromeDriver) đều 22/22 Pass.
Guest/customer/admin boundary, persisted coupon usage/total210000 và các luồng
checkout/cancel/stock/status/closet đều được kiểm tra, không đổi business oracle.
Frontend25/25 và Playwright6/6 Pass; CI GitHub chưa xác minh.

Evidence: [execution summary](../evidence/stage6-2026-11-17/summary.json),
[admin before](../evidence/stage6-2026-11-17/admin-ui-before.png),
[coupon before](../evidence/stage6-2026-11-17/coupon-before.png).
