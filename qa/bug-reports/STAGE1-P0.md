# Giai đoạn 1 — Bug reports trước/sau sửa

Ngày 16/11/2026. Source trước: application `3d61097`, nhánh đầu vào `e751a46`.
Tất cả runtime probes trên DB tạm, không khai thác hoặc xóa dữ liệu development.
“Fixed + regression Pass” chỉ áp dụng đúng scope test, không phải security certification.

| ID / priority | Trước sửa, expected | Development Fix | QA regression / sau sửa |
|---|---|---|---|
| SEC-01 / P0 | Anonymous đọc users và ordinary user đọc admin sync được 200; expected 401/403 | Prefix và management guards, current DB role, safe DTO | 27 method/path matrix denies anonymous/user; admin positive tests, revoked/demoted identity tests Pass |
| SEC-02 / P0 | Source có public admin setup bằng key cố định; reset/clear handlers xóa data và tạo tài khoản password mặc định. Không gọi destructive handlers để chứng minh | Bỏ các handler và UI controls, path cũ 404; local create-admin explicit, không default credentials; secret fail closed | Retired endpoints 404 kể cả admin; user record giữ nguyên; unsafe JWT configs bị từ chối. Pass |
| DATA-01 / P0 | Probe: catalog 200k ×2; client total=1, server lưu 1; expected 430k với standard ship | Catalog snapshots, shipping table, server promotion validation, bounded quantities; không tin số tiền client | Tampered total/price/name/model, invalid quantity/product/shipping/coupon, persisted server totals Pass |
| DATA-02 / P0 | Source không reserve stock; coupon claim nằm sau order save, lỗi chỉ log, thiếu atomicity. Finding source-confirmed; không tuyên bố đã đo concurrent exploit trước sửa | MongoDB transaction, unique usage index, stock version; rollback | Last-unit buyers chỉ 1 order; same coupon chỉ 1 order/usage; invalid coupon rollback stock; variant stock tests Pass |
| AUTH-01 / P0 | Chat nhận clientUserId khi không có token; view-history và personalization tin userId từ body/query | Auth/optional auth theo stored identity; owner-scoped filters | Anonymous chat không impersonate; view-history không ghi cho user khác; orders/notifications/outfits owner tests Pass |
| PAY-01 / P0 | Source payment create tin amount/orderId, timer cập nhật order; status luôn success; UI success cả khi API lỗi. Không chờ timer trên order người khác trong probe | Bỏ payment giả và client timer; owner check, 503 unavailable; unknown status 404 | Foreign order 404, owner provider unavailable 503 không mutate, status404; 2 UI safety tests Pass |
| VAL-01 / P0 | Invalid user ObjectId trả 500; user write nhận mass assignment; expected400 và allowlist | Request validation, stable errors, safe user fields, no raw driver errors | Invalid IDs, operator/query/body, privilege fields, oversized/malformed JSON tests Pass |
| STATE-01 / P0 | Source nhận arbitrary order status; không reserve/restore inventory; audit bị xóa qua HTTP | State machine; cancel transaction owner scoped; audit DELETE405; legacy reservation flag | Invalid/skip/stale/terminal transition; cancel twice/race; old order no invented stock; reserved product deletion409 Pass |
| TEST-01 / P1 | Baseline auth syntax fail, fixtures beforeAll bị afterEach xóa, fake token và response contract sai | QA fixes, không nới assertions để bỏ quyền/validation | Full backend 120 Pass/12 suites; suite không cần forceExit |

Lệnh và hashes ở evidence folder. `before.log` có 5 failures để chứng minh assertion
thất bại trước thay đổi; `pricing-before.log` là probe riêng trên source baseline trong
clone local. Những finding chỉ đọc source đã được chỉ rõ, không gắn nhãn runtime exploit.
Raw logs không commit vì dài và có thể chứa dữ liệu fixture; không có CI artifacts cho run local.

Chưa tự xoay credentials của tài khoản cũ hoặc xóa dữ liệu cũ. Khi triển khai, operator
cần dùng JWT secret mới được quản lý riêng và xử lý các tài khoản mặc định nếu từng được
tạo từ phiên bản cũ; không coi việc bỏ code seed là đã thay mật khẩu trong database.
