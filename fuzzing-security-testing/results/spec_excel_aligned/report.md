# Sales API fuzzing campaign

Environment: `node_harness_stub`; seed: 7.

PASS/FAIL apply only to executed API scenarios. ERROR is a setup/runner/oracle failure.
Scope: API input validation, authorization, stored data and order lifecycle.

| Testcase | Title | Status | Executions |
|---|---|---|---|
| TC-AUTH-1 | Xử lý an toàn trường xác thực bị thiếu hoặc rỗng | PASS | 3 |
| TC-AUTH-2 | Ngoại lệ khi email/password sai kiểu dữ liệu | PASS | 5 |
| TC-AUTH-3 | Rò rỉ sự tồn tại tài khoản qua phản hồi đăng nhập | FAIL | 1 |
| TC-AUTH-5 | Chèn role vào input xác thực để nâng quyền | PASS | 1 |
| TC-AUTH-7 | Khả năng xử lý email dài bất thường | PASS | 1 |
| TC-ORD-1 | Sai kiểu và cấu trúc giỏ hàng đi vào tầng xử lý đơn | FAIL | 4 |
| TC-ORD-2 | Thiếu cấu trúc lồng shippingInfo gây ngoại lệ | PASS | 4 |
| TC-ORD-3 | Xử lý an toàn totalAmount thiếu/null và xác nhận nhánh required | FAIL | 1 |
| TC-ORD-4 | Sai kiểu totalAmount: mutation và concolic xác nhận đường ép kiểu | FAIL | 12 |
| TC-ORD-5 | Tin cậy giá từ client làm sai toàn vẹn đơn hàng | FAIL | 1 |
| TC-ORD-6 | Giá trị âm vượt qua kiểm tra miền số tiền | FAIL | 1 |
| TC-ORD-18 | Giả mạo đồng thời đơn giá và tổng tiền để vượt oracle | FAIL | 1 |
| TC-ORD-19 | Đối chứng seed hợp lệ trước khi đột biến đơn hàng | PASS | 1 |
| TC-OS-1 | Vượt quyền cập nhật tài nguyên đơn hàng | FAIL | 2 |
| TC-OS-2 | Giá trị enum bất thường đi vào xử lý trạng thái | FAIL | 2 |
| TC-OS-3 | Phá vỡ bất biến sau trạng thái đã giao | FAIL | 1 |
| TC-OS-4 | ID hoặc status sai kiểu gây lỗi tầng xử lý | FAIL | 2 |
| TC-OS-21 | Phá vỡ trạng thái kết thúc sau khi hủy đơn | FAIL | 1 |
| TC-OS-5 | Đối chứng luồng và tác dụng phụ thông báo | PASS | 1 |
| TC-PRD-1 | Vượt quyền tạo hoặc sửa dữ liệu sản phẩm | FAIL | 4 |
| TC-PRD-2 | Giá âm vượt qua ràng buộc miền dữ liệu | FAIL | 1 |
| TC-PRD-3 | Giá sản phẩm sai kiểu gây ngoại lệ xử lý | FAIL | 1 |
| TC-PRD-5 | ID trùng gây ghi đè hoặc mơ hồ định danh sản phẩm | FAIL | 1 |
| TC-PRD-4 | Đối chứng lỗi truy cập sản phẩm không tồn tại | PASS | 1 |
| TC-USR-1 | Truy cập trái phép hồ sơ tài khoản khác | FAIL | 2 |
| TC-USR-2 | Mass assignment làm thay đổi quyền tài khoản | FAIL | 1 |
| TC-USR-4 | Dữ liệu mật khẩu nhạy cảm bị lưu dạng rõ | FAIL | 1 |
| TC-USR-3 | ID sai định dạng gây ngoại lệ truy vấn hồ sơ | FAIL | 1 |
| TC-USR-5 | Vượt cơ chế bảo vệ khởi tạo tài khoản admin | PASS | 1 |

## Limitations

- PASS concerns listed input samples, not complete requirement coverage.
- Simulated datastore and test accounts; not a real-server or production benchmark.
- Email/virtual-closet integrations are disabled. Timing uses test hashes and is exploratory.
- Rate limiting, throughput and formal verification are outside this campaign.
