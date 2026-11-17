# Test data contract

Fixtures chỉ được ghi qua `server/test-support/owned-database.js`, không gọi trực
tiếp `seed()` hoặc đưa URI development vào script. Seed yêu cầu handle sở hữu được
ghi trong WeakMap, connection/client đúng instance, database có prefix test và marker
khớp capability; `NODE_ENV=test` một mình không đủ để được reset.

| Fixture | Identity / giá trị | Dùng cho |
|---|---|---|
| Admin, customer, other | IDs 101/102/103 dạng ObjectId cố định; email `role+runId@example.test` | RBAC, login, owner isolation |
| QA Cotton Shirt | Product 50101, giá 200k, White S/M/L stock 4/5/3 | UI smoke, checkout, stock, model theo size |
| QA Trousers | Product 50102, giá 300k, stock 6 | Multi-product/3D baseline |
| QA Unavailable Shirt | Product 50103, inactive, stock 0 | Negative checkout |
| Processing/delivered order | IDs 201/202, total 230k, customer owner | Order list, cancellation, closet baseline |
| Virtual closet + saved outfit | Customer có một purchased shirt size M | Owner closet, outfit persistence |
| Try-on session | ID 401, shirt M; createdAt mới mỗi reset | Session API, tránh TTL xóa fixture ngay |
| Banner + newsletter | Một record mỗi loại; NEWS10QA thuộc customer | UI shell và promotion tests |

Numeric suffix trong bảng chỉ để đọc; ObjectId đầy đủ nằm trong seed contract.
Product và nested variant/size IDs cố định để reset không phá tham chiếu. Fixed clock
`2026-01-01T00:00:00Z` dùng cho dữ liệu lịch sử; TTL session cố ý dùng thời gian hiện tại.
Passwords được tạo ngẫu nhiên mỗi environment, giữ nguyên qua các reset của environment
đó; bcrypt salt có thể thay đổi. Không có password/JWT cố định trong fixtures JSON.

Các đơn seed là historical snapshots `inventoryReserved=false`, không giữ kho hiện tại.
Order mới qua API vẫn reserve stock bằng transaction như Giai đoạn 1. Cleanup giữ marker
và unique indexes, xóa data trong tất cả collections còn lại của **database do run sở hữu**,
kể cả collection mới mà test tạo thêm. Mỗi reset xóa mutations/coupon usage rồi seed lại.

Model fixtures dùng 7 GLB files đã có trong `client/public`: avatar morph, shirt S/M/L,
trousers S/M/L. Không copy binary vào QA; product images dùng favicon local để smoke
không cần CDN. Kiểm tra GLB header/resource và model references không chứng minh hình
render đúng, morph đúng hoặc đạt visual regression; đó vẫn là scope giai đoạn 3D sau.

Test authors: dùng `tests/fixtures.ts` cho Playwright (auto reset/clear mỗi case) hoặc
`global.qaTestDatabase.reset()` khi cần full catalog trong Jest. Suite Jest mặc định
bắt đầu rỗng; mỗi test tự tạo fixture, teardown tự clear. Một Node process sở hữu một
Mongoose default connection; cần worker/process riêng nếu muốn chạy nhiều environment.
Playwright hiện chạy 1 worker để tránh reset chung giữa tests đang chạy song song.
Không reset giữa transaction/test đang chạy; CLI reset là thao tác tại boundary của test.
