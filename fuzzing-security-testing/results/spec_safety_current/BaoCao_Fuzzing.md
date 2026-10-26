# Phương pháp kiểm thử theo fuzzing cho hệ thống bán hàng

Bản thảo kỹ thuật từ bằng chứng thực thi; cần dàn trang và bổ sung thông tin sinh viên trước khi nộp.

## 1. Mục tiêu và phạm vi

Kiểm tra đăng nhập, tạo đơn, trạng thái đơn, người dùng và sản phẩm. Chuỗi thực hiện: đặc tả/ràng buộc → seed và mutation → request API → oracle → bằng chứng.

## 2. Hệ thống và phương pháp

Môi trường lần chạy: `node_harness_stub`. Thời điểm UTC: `2026-10-23T15:24:30.946056+00:00`. Seed: `7`.

Mỗi scenario chạy trong tiến trình cô lập và có dữ liệu test riêng. Các bước trong cùng scenario giữ trạng thái. Oracle kiểm tra mã HTTP, catalog, dữ liệu lưu, quyền và vòng đời đơn. FAIL là vi phạm oracle trên mẫu đã thử; ERROR là lỗi chuẩn bị/chạy/đánh giá, không tự coi là lỗi ứng dụng.

## 3. Kết quả

Scenario đã chạy: 59. Theo testcase API: PASS=9, FAIL=20.

Có 75 testcase ngoài phạm vi API, được ghi riêng trong excluded_testcases.json; không tính vào số test đạt hoặc lỗi bán hàng.

| Testcase | Nội dung | Kết quả | Scenario |
|---|---|---|---|
| TC-AUTH-1 | Xử lý an toàn trường xác thực bị thiếu hoặc rỗng | PASS | 3 |
| TC-AUTH-2 | Ngoại lệ khi email/password sai kiểu dữ liệu | PASS | 5 |
| TC-AUTH-3 | Rò rỉ sự tồn tại tài khoản qua phản hồi đăng nhập | FAIL | 1 |
| TC-AUTH-5 | Chèn role vào input xác thực để nâng quyền | PASS | 1 |
| TC-AUTH-7 | Khả năng xử lý email dài bất thường | PASS | 1 |
| TC-ORD-1 | Sai kiểu và cấu trúc giỏ hàng đi vào tầng xử lý đơn | FAIL | 4 |
| TC-ORD-2 | Thiếu cấu trúc lồng shippingInfo gây ngoại lệ | PASS | 4 |
| TC-ORD-3 | Thiếu totalAmount đi vào phép toán hoặc chuyển kiểu | FAIL | 1 |
| TC-ORD-4 | Sai kiểu và giá trị số bất thường tại totalAmount | FAIL | 12 |
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
