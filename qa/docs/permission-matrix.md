# Permission matrix — Giai đoạn 1

Quyền được kiểm tra trên backend, không dựa vào việc frontend có ẩn nút hay không.
Danh sách từng method/path và response: [API inventory](api-inventory.md).

| Nhóm API | Anonymous | User hiện hành | Admin hiện hành | Giới hạn dữ liệu |
|---|---|---|---|---|
| Catalog, stock, product detail, banners, reviews đọc/like, try-on session | Cho phép | Cho phép | Cho phép | Dữ liệu công khai; session chỉ chứa tham chiếu sản phẩm/size |
| Register/login | Cho phép với validation | Như anonymous | Như anonymous | Register luôn role=user; không nhận role/password hash từ client |
| Chat send, recommendations | Cho phép | Token hợp lệ để cá nhân hóa | Như user | Không tin userId từ client; token được cung cấp mà sai thì 401 |
| Product create/update/delete, next-id; banner writes | 401 | 403 | Cho phép | Dữ liệu đã validation; product numeric ID không đổi khi edit |
| `/api/admin/*`, `/api/users/*`, `/api/coupons/*` | 401 | 403 | Cho phép | Prefix guard bảo vệ cả endpoints quản trị bổ sung sau này |
| `/api/orders` GET/PUT `:id` | 401 | 403 | Cho phép | Danh sách admin có thể có tên/email chủ đơn; transition có giới hạn |
| `/api/orders/:id` DELETE | 401 | 403 | 405 | Giữ audit record; dùng trạng thái hủy thay cho xóa |
| `/api/orders` POST, my-orders, cancel | 401 | Cho phép trên tài khoản mình | Như user cho các route owner | userId lấy từ DB identity; đơn người khác hoặc không tồn tại khi cancel trả 404 |
| Auth me/profile, addresses, wishlist, closet, saved-outfits, notifications, used-coupons | 401 | Chỉ tài nguyên của mình | Chỉ tài nguyên của mình qua owner routes | Admin không mặc nhiên truy cập closet/profile người khác qua owner routes |
| View-history POST | 401 | Owner từ token | Owner từ token | userId gửi trong body không quyết định chủ dữ liệu |
| Payment create/status | 401 | Owner order; create 503, unknown status 404 | Như user | Chưa kết nối payment provider; không ghi nhận thanh toán giả |
| Create-admin, reset-data, clear-all-data cũ | 404 | 404 | 404 | Bỏ handler trên mọi môi trường; không có flag mở lại HTTP reset |

401: thiếu/sai/hết hạn token, scheme khác Bearer hoặc user bị xóa. JWT chỉ chấp nhận
HS256; `id` phải là Mongo ObjectId. Middleware đọc role hiện tại trong DB, nên token
admin cũ không giữ quyền sau demotion. 403: identity hợp lệ nhưng không có role admin.
Tất cả API live có DB readiness guard; database chưa sẵn sàng trả 503.

`permissions.test.js` kiểm tra 27 method/path quản trị, mỗi case gọi anonymous và
user rồi kiểm tra 401/403; có positive tests cho admin. `security.test.js`,
`order.test.js`, `validation.test.js` kiểm tra revoked credentials, chống tự nâng
quyền, owner isolation, chat/view-history và notification/outfit ownership.
Ma trận là contract hiện tại, không phải tuyên bố mọi nhánh của 71 routes đã được test.

Public like/session/chat vẫn cần rate limiting/abuse controls khi triển khai public.
Đây không phải tính năng payment production, penetration test hoặc chứng nhận bảo mật.
