# Phương pháp kiểm thử theo fuzzing cho hệ thống bán hàng

Bản thảo kỹ thuật từ bằng chứng thực thi; cần dàn trang và bổ sung thông tin sinh viên trước khi nộp.

## 1. Mục tiêu và phạm vi

Kiểm tra đăng nhập, tạo đơn, trạng thái đơn, người dùng và sản phẩm. Chuỗi thực hiện: đặc tả/ràng buộc → seed và mutation → request API → oracle → bằng chứng.

## 2. Hệ thống và phương pháp

Môi trường lần chạy: `node_harness_stub`. Thời điểm UTC: `2026-10-23T00:46:29.634616+00:00`. Seed: `7`.

Mỗi scenario chạy trong tiến trình cô lập và có dữ liệu test riêng. Các bước trong cùng scenario giữ trạng thái. Oracle kiểm tra mã HTTP, catalog, dữ liệu lưu, quyền và vòng đời đơn. FAIL là vi phạm oracle trên mẫu đã thử; ERROR là lỗi chuẩn bị/chạy/đánh giá, không tự coi là lỗi ứng dụng.

## 3. Kết quả

Scenario đã chạy: 59. Theo testcase API: PASS=9, FAIL=20.

Có 0 testcase ngoài phạm vi API, được ghi riêng trong excluded_testcases.json; không tính vào số test đạt hoặc lỗi bán hàng.

| Testcase | Nội dung | Kết quả | Scenario |
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

### Bằng chứng vi phạm

#### TC-AUTH-3

Scenario: `TC-AUTH-3:enumeration`.

Oracle: `{"kind": "same_response"}`.

Chuỗi HTTP ở mẫu đầu: 404 → 401. Input đầy đủ, thứ tự thao tác và dữ liệu sau chạy ở report.json/generated_cases.json. Nhóm theo testcase chưa phải số nguyên nhân lỗi duy nhất.

#### TC-ORD-1

Scenario: `TC-ORD-1:0`, `TC-ORD-1:1`, `TC-ORD-1:3`.

Oracle: `{"kind": "status", "allowed": [400, 422]}`.

Chuỗi HTTP ở mẫu đầu: 200. Input đầy đủ, thứ tự thao tác và dữ liệu sau chạy ở report.json/generated_cases.json. Nhóm theo testcase chưa phải số nguyên nhân lỗi duy nhất.

#### TC-ORD-18

Scenario: `TC-ORD-18:catalog`.

Oracle: `{"kind": "catalog_total"}`.

Chuỗi HTTP ở mẫu đầu: 200. Input đầy đủ, thứ tự thao tác và dữ liệu sau chạy ở report.json/generated_cases.json. Nhóm theo testcase chưa phải số nguyên nhân lỗi duy nhất.

#### TC-ORD-3

Scenario: `TC-ORD-3:missing-total`.

Oracle: `{"kind": "status", "allowed": [400]}`.

Chuỗi HTTP ở mẫu đầu: 500. Input đầy đủ, thứ tự thao tác và dữ liệu sau chạy ở report.json/generated_cases.json. Nhóm theo testcase chưa phải số nguyên nhân lỗi duy nhất.

#### TC-ORD-4

Scenario: `TC-ORD-4:0`, `TC-ORD-4:1`, `TC-ORD-4:2`, `TC-ORD-4:3`, `TC-ORD-4:fuzz-0`, `TC-ORD-4:fuzz-1`, `TC-ORD-4:fuzz-2`, `TC-ORD-4:fuzz-3`, `TC-ORD-4:fuzz-4`, `TC-ORD-4:fuzz-5`, `TC-ORD-4:fuzz-6`, `TC-ORD-4:fuzz-7`.

Oracle: `{"kind": "status", "allowed": [400, 422]}`.

Chuỗi HTTP ở mẫu đầu: 500. Input đầy đủ, thứ tự thao tác và dữ liệu sau chạy ở report.json/generated_cases.json. Nhóm theo testcase chưa phải số nguyên nhân lỗi duy nhất.

#### TC-ORD-5

Scenario: `TC-ORD-5:catalog-price`.

Oracle: `{"kind": "catalog_total"}`.

Chuỗi HTTP ở mẫu đầu: 200. Input đầy đủ, thứ tự thao tác và dữ liệu sau chạy ở report.json/generated_cases.json. Nhóm theo testcase chưa phải số nguyên nhân lỗi duy nhất.

#### TC-ORD-6

Scenario: `TC-ORD-6:negative-total`.

Oracle: `{"kind": "status", "allowed": [400, 422]}`.

Chuỗi HTTP ở mẫu đầu: 200. Input đầy đủ, thứ tự thao tác và dữ liệu sau chạy ở report.json/generated_cases.json. Nhóm theo testcase chưa phải số nguyên nhân lỗi duy nhất.

#### TC-OS-1

Scenario: `TC-OS-1:None`, `TC-OS-1:victim`.

Oracle: `{"kind": "status", "allowed": [401, 403]}`.

Chuỗi HTTP ở mẫu đầu: 200 → 200. Input đầy đủ, thứ tự thao tác và dữ liệu sau chạy ở report.json/generated_cases.json. Nhóm theo testcase chưa phải số nguyên nhân lỗi duy nhất.

#### TC-OS-2

Scenario: `TC-OS-2:''`, `TC-OS-2:'0000000000'`.

Oracle: `{"kind": "status", "allowed": [400, 422]}`.

Chuỗi HTTP ở mẫu đầu: 200 → 200. Input đầy đủ, thứ tự thao tác và dữ liệu sau chạy ở report.json/generated_cases.json. Nhóm theo testcase chưa phải số nguyên nhân lỗi duy nhất.

#### TC-OS-21

Scenario: `TC-OS-21:cancelled-terminal`.

Oracle: `{"kind": "cancelled_terminal"}`.

Chuỗi HTTP ở mẫu đầu: 200 → 200 → 200. Input đầy đủ, thứ tự thao tác và dữ liệu sau chạy ở report.json/generated_cases.json. Nhóm theo testcase chưa phải số nguyên nhân lỗi duy nhất.

#### TC-OS-3

Scenario: `TC-OS-3:revert-delivered`.

Oracle: `{"kind": "status", "allowed": [400, 409, 422]}`.

Chuỗi HTTP ở mẫu đầu: 200 → 200 → 200 → 200. Input đầy đủ, thứ tự thao tác và dữ liệu sau chạy ở report.json/generated_cases.json. Nhóm theo testcase chưa phải số nguyên nhân lỗi duy nhất.

#### TC-OS-4

Scenario: `TC-OS-4:/api/orders/abc`, `TC-OS-4:/api/orders/{order}`.

Oracle: `{"kind": "status", "allowed": [400, 404, 422]}`.

Chuỗi HTTP ở mẫu đầu: 200 → 500. Input đầy đủ, thứ tự thao tác và dữ liệu sau chạy ở report.json/generated_cases.json. Nhóm theo testcase chưa phải số nguyên nhân lỗi duy nhất.

#### TC-PRD-1

Scenario: `TC-PRD-1:POST-None`, `TC-PRD-1:POST-self`, `TC-PRD-1:PUT-None`, `TC-PRD-1:PUT-self`.

Oracle: `{"kind": "status", "allowed": [401, 403]}`.

Chuỗi HTTP ở mẫu đầu: 200. Input đầy đủ, thứ tự thao tác và dữ liệu sau chạy ở report.json/generated_cases.json. Nhóm theo testcase chưa phải số nguyên nhân lỗi duy nhất.

#### TC-PRD-2

Scenario: `TC-PRD-2:negative-price`.

Oracle: `{"kind": "status", "allowed": [400, 422]}`.

Chuỗi HTTP ở mẫu đầu: 200. Input đầy đủ, thứ tự thao tác và dữ liệu sau chạy ở report.json/generated_cases.json. Nhóm theo testcase chưa phải số nguyên nhân lỗi duy nhất.

#### TC-PRD-3

Scenario: `TC-PRD-3:price-object`.

Oracle: `{"kind": "status", "allowed": [400, 422]}`.

Chuỗi HTTP ở mẫu đầu: 500. Input đầy đủ, thứ tự thao tác và dữ liệu sau chạy ở report.json/generated_cases.json. Nhóm theo testcase chưa phải số nguyên nhân lỗi duy nhất.

#### TC-PRD-5

Scenario: `TC-PRD-5:duplicate-id`.

Oracle: `{"kind": "duplicate_id"}`.

Chuỗi HTTP ở mẫu đầu: 200. Input đầy đủ, thứ tự thao tác và dữ liệu sau chạy ở report.json/generated_cases.json. Nhóm theo testcase chưa phải số nguyên nhân lỗi duy nhất.

#### TC-USR-1

Scenario: `TC-USR-1:None`, `TC-USR-1:self`.

Oracle: `{"kind": "status", "allowed": [401, 403]}`.

Chuỗi HTTP ở mẫu đầu: 200. Input đầy đủ, thứ tự thao tác và dữ liệu sau chạy ở report.json/generated_cases.json. Nhóm theo testcase chưa phải số nguyên nhân lỗi duy nhất.

#### TC-USR-2

Scenario: `TC-USR-2:role`.

Oracle: `{"kind": "role_unchanged"}`.

Chuỗi HTTP ở mẫu đầu: 200. Input đầy đủ, thứ tự thao tác và dữ liệu sau chạy ở report.json/generated_cases.json. Nhóm theo testcase chưa phải số nguyên nhân lỗi duy nhất.

#### TC-USR-3

Scenario: `TC-USR-3:invalid-id`.

Oracle: `{"kind": "status", "allowed": [400, 404]}`.

Chuỗi HTTP ở mẫu đầu: 500. Input đầy đủ, thứ tự thao tác và dữ liệu sau chạy ở report.json/generated_cases.json. Nhóm theo testcase chưa phải số nguyên nhân lỗi duy nhất.

#### TC-USR-4

Scenario: `TC-USR-4:password-storage`.

Oracle: `{"kind": "password"}`.

Chuỗi HTTP ở mẫu đầu: 200. Input đầy đủ, thứ tự thao tác và dữ liệu sau chạy ở report.json/generated_cases.json. Nhóm theo testcase chưa phải số nguyên nhân lỗi duy nhất.

## 4. Hạn chế

- PASS concerns listed input samples, not complete requirement coverage.
- Simulated datastore and test accounts; not a real-server or production benchmark.
- Email/virtual-closet integrations are disabled. Timing uses test hashes and is exploratory.
- Rate limiting, throughput and formal verification are outside this campaign.

## 5. Kết luận và tái hiện

Kết luận giới hạn trong các scenario và môi trường đã ghi. Không suy ra mọi yêu cầu đều đạt, không suy ra không còn lỗi từ tỷ lệ lỗi bằng 0 trên mẫu hữu hạn. Các số liệu lịch sử trong thư mục khác không tự động nhập vào báo cáo này.

README.md ghi lệnh chạy; spec_snapshot.json và source_sha256 trong report.json xác định nguồn. Tài liệu nộp cuối cần trích dẫn công cụ/tài liệu đã sử dụng và ghi rõ phần AI hỗ trợ.
