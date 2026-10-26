# Sales API fuzzing campaign

Environment: `node_harness_stub`; seed: 7.

PASS/FAIL apply only to executed API scenarios. ERROR is a setup/runner/oracle failure.
Scope: API input validation, authorization, stored data and order lifecycle.

| Testcase | Title | Status | Executions |
|---|---|---|---|
| TC-AUTH-1 | Thiếu email hoặc password | PASS | 3 |
| TC-AUTH-2 | email/password sai kiểu dữ liệu | PASS | 5 |
| TC-AUTH-3 | Phân biệt tài khoản không tồn tại vs sai mật khẩu | FAIL | 1 |
| TC-AUTH-5 | Token phát hành đúng role từ DB | PASS | 1 |
| TC-AUTH-7 | email dài bất thường (5000 ký tự) | PASS | 1 |
| TC-ORD-1 | products sai kiểu dữ liệu vẫn được chấp nhận | FAIL | 4 |
| TC-ORD-2 | Thiếu từng trường trong shippingInfo | PASS | 4 |
| TC-ORD-3 | Thiếu totalAmount | FAIL | 1 |
| TC-ORD-4 | totalAmount sai kiểu dữ liệu | FAIL | 12 |
| TC-ORD-5 | totalAmount lệch giá thật | FAIL | 1 |
| TC-ORD-6 | totalAmount âm | FAIL | 1 |
| TC-ORD-18 | Giá và tổng tiền giả nhưng tự khớp nhau | FAIL | 1 |
| TC-ORD-19 | Tạo đơn hợp lệ làm mẫu đối chứng | PASS | 1 |
| TC-OS-1 | Đổi trạng thái không token / với token người khác | FAIL | 2 |
| TC-OS-2 | status ngoài tập giá trị hợp lệ | FAIL | 2 |
| TC-OS-3 | Chuyển trạng thái ngược sau khi đã giao | FAIL | 1 |
| TC-OS-4 | :id sai định dạng / status sai kiểu | FAIL | 2 |
| TC-OS-5 | Cập nhật hợp lệ (positive control) | PASS | 1 |
| TC-OS-21 | Đơn đã hủy không được tiếp tục giao | FAIL | 1 |
| TC-PRD-1 | Tạo/sửa sản phẩm không token | FAIL | 4 |
| TC-PRD-2 | Giá sản phẩm âm | FAIL | 1 |
| TC-PRD-3 | price sai kiểu dữ liệu | FAIL | 1 |
| TC-PRD-4 | PUT sản phẩm không tồn tại | PASS | 1 |
| TC-PRD-5 | POST với id trùng sản phẩm đã có | FAIL | 1 |
| TC-USR-1 | Sửa hồ sơ không token / hồ sơ người khác | FAIL | 2 |
| TC-USR-2 | Tự đặt role=admin qua PUT thông thường | FAIL | 1 |
| TC-USR-3 | :id sai định dạng | FAIL | 1 |
| TC-USR-4 | password bị lưu plaintext | FAIL | 1 |
| TC-USR-5 | create-admin với secretKey sai | PASS | 1 |

## Limitations

- PASS concerns listed input samples, not complete requirement coverage.
- Simulated datastore and test accounts; not a real-server or production benchmark.
- Email/virtual-closet integrations are disabled. Timing uses test hashes and is exploratory.
- Rate limiting, throughput and formal verification are outside this campaign.
