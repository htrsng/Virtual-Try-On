# Dữ liệu mẫu của môi trường QA

Playwright và Selenium đặt lại dữ liệu trước mỗi ca. Jest bắt đầu với database rỗng để mỗi ca tự tạo dữ liệu cần thiết. Khi cần cả bộ dữ liệu mẫu trong Jest, gọi `global.qaTestDatabase.reset()`.

| Dữ liệu | Giá trị dùng trong test |
| --- | --- |
| Tài khoản | Admin, khách mua hàng và khách thứ hai. Email có dạng `role+runId@example.test`. |
| QA Cotton Shirt | Mã 50101, giá 200.000 đồng, màu White. Size S/M/L có tồn kho lần lượt 4/5/3. |
| QA Trousers | Mã 50102, giá 300.000 đồng, tồn kho 6. |
| QA Unavailable Shirt | Mã 50103, đã tắt bán, tồn kho 0. |
| Đơn hàng mẫu | Một đơn đang xử lý và một đơn đã giao, tổng 230.000 đồng mỗi đơn. |
| Tủ đồ và outfit | Khách mua hàng có áo size M trong tủ đồ. |
| Phiên thử đồ | Áo size M. Thời điểm tạo được làm mới để phiên chưa hết hạn khi test bắt đầu. |
| Banner và newsletter | Mỗi loại một bản ghi. Mã `NEWS10QA` thuộc khách mua hàng. |

Đơn mẫu là dữ liệu lịch sử với `inventoryReserved=false`. Đơn tạo qua API vẫn trừ tồn kho qua transaction. Model 3D lấy từ `client/public/`, gồm avatar và các size S/M/L của áo, quần. [Danh mục mẫu](catalog.json).

Dùng API reset/clear của [helper quản lý database QA](../../server/test-support/owned-database.js). Helper kiểm tra connection, tên database và marker sở hữu trước khi xoá dữ liệu. Chỉ reset giữa các ca vì các bài trong cùng suite dùng chung môi trường.

Mật khẩu được tạo khi mở môi trường và dùng lại qua các lần reset. Manifest local có tài khoản mẫu và một JWT đã hết hạn để kiểm tra phiên đăng nhập. Launcher xoá các giá trị này khi dừng. Giữ manifest trong `.runtime/qa/` ở máy local.
