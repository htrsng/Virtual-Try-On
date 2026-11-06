# BIÊN BẢN KIỂM THỬ AN TOÀN PHẦN MỀM
Số: BBKT-20261030-01 · Ngày lập: 30/10/2026 · Hệ thống bán hàng mô phỏng trong Virtual-Try-On-sync.

## 1. Thông tin và căn cứ
Đơn vị/nhóm thực hiện: ................................; Người kiểm thử: ................................; Người xác nhận: ................................

Biên bản được lập bằng cách đọc 5 workbook Excel (đủ 10 sheet/workbook), mã nguồn bộ chạy/oracle và bằng chứng JSON đã lưu. Đây là biên bản tổng hợp kết quả lịch sử, không phải xác nhận đã chạy mới ngày 30/10/2026. Không điền giả tên người thực hiện, thời gian chạy hoặc chữ ký.

Campaign đối chiếu Excel: results/spec_excel_aligned/report.json; thời điểm tạo báo cáo 23/10/2026 22:35:54 (UTC+7); seed 7; Python được ghi trong báo cáo: 3.13.2 (tags/v3.13.2:4f8bb39, Feb  4 2025, 15:23:48) [MSC v.1942 64 bit (AMD64)]. Môi trường: node_harness_stub; Express xử lý request thực, datastore và dịch vụ là mô phỏng. Không đại diện cho production/MongoDB thật.

## 2. Đối chiếu đặc tả và phạm vi
| Workbook | TC hiện tại | Có kết quả lịch sử | Chưa có kết quả | PASS/FAIL lịch sử |
| --- | --- | --- | --- | --- |
| Module_Auth_Login_spec.xlsx | 25 | 5 | 20 | {'PASS': 4, 'FAIL': 1} |
| Module_Orders_Create_spec.xlsx | 27 | 8 | 19 | {'FAIL': 6, 'PASS': 2} |
| Module_OrderStatus_spec.xlsx | 28 | 6 | 22 | {'FAIL': 5, 'PASS': 1} |
| Module_Products_Manage_spec.xlsx | 27 | 5 | 22 | {'FAIL': 4, 'PASS': 1} |
| Module_Users_Admin_spec.xlsx | 27 | 5 | 22 | {'FAIL': 4, 'PASS': 1} |

Excel hiện tại có 134 testcase; snapshot lúc chạy có 104. Có 30 ID bổ sung, 75 ID trong snapshot chưa thực thi, tổng cộng 105 testcase hiện tại chưa có kết quả campaign API này. README ghi 104 là số của snapshot, không phải số đếm hiện tại.

Cả 5 SHA-256 workbook hiện tại đều khác snapshot. Đối chiếu từng trường trong sheet TestCase của 104 ID chung không phát hiện thay đổi nội dung; 30 ID bổ sung chưa có kết quả. Khác mã băm không tự chứng minh 104 testcase cũ đã đổi yêu cầu. Kết quả PASS/FAIL dưới đây chỉ thuộc kịch bản/oracle và snapshot lúc chạy; không xác nhận toàn bộ workbook hiện tại. Phụ lục Thay_doi_dac_ta chỉ có hàng tiêu đề vì không có trường TestCase nào thay đổi trên các ID chung.

## 3. Kết quả campaign API theo đặc tả
29 testcase đã thực thi, 9 PASS, 20 FAIL; 59 lượt kịch bản gồm 19 PASS và 40 FAIL; không có ERROR trong báo cáo này. Tỷ lệ PASS theo testcase đã chạy: 31,03%; mức hiện diện bằng chứng theo ID trên Excel hiện tại: 29/134 = 21,64%, không phải tỷ lệ bao phủ yêu cầu hoặc mã nguồn. Một lượt kịch bản có thể chứa nhiều HTTP request.

| ID | Tên tại thời điểm chạy | Kết quả lịch sử | Lượt |
| --- | --- | --- | --- |
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

PASS chỉ xác nhận các mẫu và điều kiện oracle đã cài đặt. Ví dụ TC-AUTH-2 có 5 lượt trong campaign, không xác nhận đã lặp 2.000 lần như bước Excel mô tả; không tự bao phủ mọi điều kiện bảo mật mở rộng.

## 4. Bằng chứng cho các testcase FAIL
### TC-AUTH-3 — Rò rỉ sự tồn tại tài khoản qua phản hồi đăng nhập
Mong đợi theo snapshot: Hai trường hợp tài khoản không tồn tại và sai mật khẩu có cùng mã trạng thái và thông báo công khai; không cấp token.

| Case ID | Oracle thực tế | HTTP quan sát | Tham chiếu |
| --- | --- | --- | --- |
| TC-AUTH-3:enumeration | {"kind": "same_response"} | 404, 401 | report.json → executions[8] |

Trích quan sát: [{"message": "Không tìm thấy tài khoản với email này"}, {"message": "Email hoặc mật khẩu không đúng"}]

### TC-ORD-1 — Sai kiểu và cấu trúc giỏ hàng đi vào tầng xử lý đơn
Mong đợi theo snapshot: HTTP 400/422 cho products sai cấu trúc hoặc số lượng âm; không coi đơn sai cấu trúc là đơn hợp lệ.

| Case ID | Oracle thực tế | HTTP quan sát | Tham chiếu |
| --- | --- | --- | --- |
| TC-ORD-1:0 | {"kind": "status", "allowed": [400, 422]} | 200 | report.json → executions[11] |
| TC-ORD-1:1 | {"kind": "status", "allowed": [400, 422]} | 200 | report.json → executions[12] |
| TC-ORD-1:3 | {"kind": "status", "allowed": [400, 422]} | 200 | report.json → executions[14] |

Trích quan sát: [{"message": "Đặt hàng thành công"}]

### TC-ORD-3 — Xử lý an toàn totalAmount thiếu/null và xác nhận nhánh required
Mong đợi theo snapshot: Yêu cầu ứng dụng: thiếu/null trả HTTP 400 có kiểm soát, không tạo đơn; HTTP 500 là vi phạm xử lý lỗi đầu vào, chưa chứng minh crash/bộ nhớ. Yêu cầu công cụ concolic: SAT phải sinh input có tiền tố nhánh thực đo đúng với model; lệch mô hình/trace phải báo lỗi công cụ, không ghi xác nhận nhánh thành công. Input vi phạm được replay từ dữ liệu sạch và lưu kết quả. Chưa chạy hoặc không có bằng chứng thì chưa xác minh.

| Case ID | Oracle thực tế | HTTP quan sát | Tham chiếu |
| --- | --- | --- | --- |
| TC-ORD-3:missing-total | {"kind": "status", "allowed": [400]} | 500 | report.json → executions[19] |

Trích quan sát: [{"message": "Lỗi server khi tạo đơn hàng", "error": "Order validation failed: totalAmount: Path `totalAmount` is required.", "details": "ValidationError: Order validation failed: totalAmount: Path `totalAmount` is required."}]

### TC-ORD-4 — Sai kiểu totalAmount: mutation và concolic xác nhận đường ép kiểu
Mong đợi theo snapshot: Yêu cầu ứng dụng: sai kiểu từ chối HTTP 400/422; không HTTP 5xx hoặc tạo đơn khi từ chối. Chuỗi số/boolean được chấp nhận qua ép kiểu là vi phạm hợp đồng kiểu, chưa tự chứng minh thiệt hại hoặc khả năng khai thác. Yêu cầu công cụ: model phải khớp trace và tiền tố mục tiêu; báo lỗi nếu lệch, không ghi xác nhận giả. UNKNOWN không được coi là UNSAT. Lưu điều kiện, input, response, trạng thái dữ liệu và replay; số input vi phạm không phải số lỗi gốc. Không suy ra lỗi bộ nhớ từ HTTP 500.

| Case ID | Oracle thực tế | HTTP quan sát | Tham chiếu |
| --- | --- | --- | --- |
| TC-ORD-4:0 | {"kind": "status", "allowed": [400, 422]} | 500 | report.json → executions[20] |
| TC-ORD-4:1 | {"kind": "status", "allowed": [400, 422]} | 500 | report.json → executions[21] |
| TC-ORD-4:2 | {"kind": "status", "allowed": [400, 422]} | 500 | report.json → executions[22] |
| TC-ORD-4:3 | {"kind": "status", "allowed": [400, 422]} | 200 | report.json → executions[23] |
| TC-ORD-4:fuzz-0 | {"kind": "status", "allowed": [400, 422]} | 500 | report.json → executions[48] |
| TC-ORD-4:fuzz-1 | {"kind": "status", "allowed": [400, 422]} | 500 | report.json → executions[49] |
| TC-ORD-4:fuzz-2 | {"kind": "status", "allowed": [400, 422]} | 200 | report.json → executions[50] |
| TC-ORD-4:fuzz-3 | {"kind": "status", "allowed": [400, 422]} | 200 | report.json → executions[51] |
| TC-ORD-4:fuzz-4 | {"kind": "status", "allowed": [400, 422]} | 500 | report.json → executions[52] |
| TC-ORD-4:fuzz-5 | {"kind": "status", "allowed": [400, 422]} | 500 | report.json → executions[53] |
| TC-ORD-4:fuzz-6 | {"kind": "status", "allowed": [400, 422]} | 200 | report.json → executions[54] |
| TC-ORD-4:fuzz-7 | {"kind": "status", "allowed": [400, 422]} | 500 | report.json → executions[55] |

Trích quan sát: [{"message": "Lỗi server khi tạo đơn hàng", "error": "Cast to Number failed for value \"{}\" at path \"totalAmount\"", "details": "CastError: Cast to Number failed for value \"{}\" at path \"totalAmount\""}]

### TC-ORD-5 — Tin cậy giá từ client làm sai toàn vẹn đơn hàng
Mong đợi theo snapshot: Server từ chối giá/tổng bị sửa hoặc tính lại từ catalog tin cậy; không lưu tổng bị giả mạo.

| Case ID | Oracle thực tế | HTTP quan sát | Tham chiếu |
| --- | --- | --- | --- |
| TC-ORD-5:catalog-price | {"kind": "catalog_total"} | 200 | report.json → executions[24] |

Trích quan sát: [{"message": "Đặt hàng thành công"}]

### TC-ORD-6 — Giá trị âm vượt qua kiểm tra miền số tiền
Mong đợi theo snapshot: HTTP 400/422; không chấp nhận tổng tiền âm.

| Case ID | Oracle thực tế | HTTP quan sát | Tham chiếu |
| --- | --- | --- | --- |
| TC-ORD-6:negative-total | {"kind": "status", "allowed": [400, 422]} | 200 | report.json → executions[25] |

Trích quan sát: [{"message": "Đặt hàng thành công"}]

### TC-ORD-18 — Giả mạo đồng thời đơn giá và tổng tiền để vượt oracle
Mong đợi theo snapshot: Từ chối 400/422 hoặc tính lại từ catalog thành 400000 trong seed không phí/giảm giá; không lưu tổng 2.

| Case ID | Oracle thực tế | HTTP quan sát | Tham chiếu |
| --- | --- | --- | --- |
| TC-ORD-18:catalog | {"kind": "catalog_total"} | 200 | report.json → executions[56] |

Trích quan sát: [{"message": "Đặt hàng thành công"}]

### TC-OS-1 — Vượt quyền cập nhật tài nguyên đơn hàng
Mong đợi theo snapshot: HTTP 401/403 khi thiếu token hoặc dùng tài khoản khác; request không được coi là cập nhật hợp lệ.

| Case ID | Oracle thực tế | HTTP quan sát | Tham chiếu |
| --- | --- | --- | --- |
| TC-OS-1:None | {"kind": "status", "allowed": [401, 403]} | 200, 200 | report.json → executions[26] |
| TC-OS-1:victim | {"kind": "status", "allowed": [401, 403]} | 200, 200 | report.json → executions[27] |

Trích quan sát: [{"message": "Đặt hàng thành công"}, {"status": "Đang xử lý"}]

### TC-OS-2 — Giá trị enum bất thường đi vào xử lý trạng thái
Mong đợi theo snapshot: HTTP 400/422 khi status ngoài tập hợp cho phép; không chấp nhận trạng thái tùy ý.

| Case ID | Oracle thực tế | HTTP quan sát | Tham chiếu |
| --- | --- | --- | --- |
| TC-OS-2:'' | {"kind": "status", "allowed": [400, 422]} | 200, 200 | report.json → executions[28] |
| TC-OS-2:'0000000000' | {"kind": "status", "allowed": [400, 422]} | 200, 200 | report.json → executions[29] |

Trích quan sát: [{"message": "Đặt hàng thành công"}, {"status": ""}]

### TC-OS-3 — Phá vỡ bất biến sau trạng thái đã giao
Mong đợi theo snapshot: Sau khi các bước chuẩn bị thành công, request chuyển ngược bị từ chối HTTP 400/409/422.

| Case ID | Oracle thực tế | HTTP quan sát | Tham chiếu |
| --- | --- | --- | --- |
| TC-OS-3:revert-delivered | {"kind": "status", "allowed": [400, 409, 422]} | 200, 200, 200, 200 | report.json → executions[30] |

Trích quan sát: [{"message": "Đặt hàng thành công"}, {"status": "Đang giao"}, {"status": "Đã giao"}, {"status": "Đang xử lý"}]

### TC-OS-4 — ID hoặc status sai kiểu gây lỗi tầng xử lý
Mong đợi theo snapshot: HTTP 400/404/422 có kiểm soát, không HTTP 500 do lỗi chuyển kiểu hoặc truy cập dữ liệu.

| Case ID | Oracle thực tế | HTTP quan sát | Tham chiếu |
| --- | --- | --- | --- |
| TC-OS-4:/api/orders/abc | {"kind": "status", "allowed": [400, 404, 422]} | 200, 500 | report.json → executions[32] |
| TC-OS-4:/api/orders/{order} | {"kind": "status", "allowed": [400, 404, 422]} | 200, 500 | report.json → executions[33] |

Trích quan sát: [{"message": "Đặt hàng thành công"}, {"error": "Cast to ObjectId failed for value \"abc\" (type string) at path \"_id\""}]

### TC-OS-21 — Phá vỡ trạng thái kết thúc sau khi hủy đơn
Mong đợi theo snapshot: Sau khi hủy thành công, từ chối tiếp tục giao bằng HTTP 400/409/422; trạng thái lưu vẫn là đã hủy.

| Case ID | Oracle thực tế | HTTP quan sát | Tham chiếu |
| --- | --- | --- | --- |
| TC-OS-21:cancelled-terminal | {"kind": "cancelled_terminal"} | 200, 200, 200 | report.json → executions[58] |

Trích quan sát: [{"message": "Đặt hàng thành công"}, {"status": "Đã hủy"}, {"status": "Đang giao"}]

### TC-PRD-1 — Vượt quyền tạo hoặc sửa dữ liệu sản phẩm
Mong đợi theo snapshot: HTTP 401/403 khi thiếu token hoặc dùng tài khoản thường cho thao tác quản trị.

| Case ID | Oracle thực tế | HTTP quan sát | Tham chiếu |
| --- | --- | --- | --- |
| TC-PRD-1:POST-None | {"kind": "status", "allowed": [401, 403]} | 200 | report.json → executions[40] |
| TC-PRD-1:POST-self | {"kind": "status", "allowed": [401, 403]} | 200 | report.json → executions[41] |
| TC-PRD-1:PUT-None | {"kind": "status", "allowed": [401, 403]} | 200 | report.json → executions[42] |
| TC-PRD-1:PUT-self | {"kind": "status", "allowed": [401, 403]} | 200 | report.json → executions[43] |

Trích quan sát: [{}]

### TC-PRD-2 — Giá âm vượt qua ràng buộc miền dữ liệu
Mong đợi theo snapshot: HTTP 400/422 cho giá âm; không coi cập nhật là hợp lệ.

| Case ID | Oracle thực tế | HTTP quan sát | Tham chiếu |
| --- | --- | --- | --- |
| TC-PRD-2:negative-price | {"kind": "status", "allowed": [400, 422]} | 200 | report.json → executions[44] |

Trích quan sát: [{}]

### TC-PRD-3 — Giá sản phẩm sai kiểu gây ngoại lệ xử lý
Mong đợi theo snapshot: HTTP 400/422 cho object thay vì số; không để lỗi chuyển kiểu gây HTTP 500.

| Case ID | Oracle thực tế | HTTP quan sát | Tham chiếu |
| --- | --- | --- | --- |
| TC-PRD-3:price-object | {"kind": "status", "allowed": [400, 422]} | 500 | report.json → executions[45] |

Trích quan sát: [{"error": "Cast to Number failed for value \"{\"a\":1}\" at path \"price\""}]

### TC-PRD-5 — ID trùng gây ghi đè hoặc mơ hồ định danh sản phẩm
Mong đợi theo snapshot: Từ chối ID trùng hoặc cấp ID mới duy nhất; không tạo hai sản phẩm cùng định danh hoặc ghi đè trái phép.

| Case ID | Oracle thực tế | HTTP quan sát | Tham chiếu |
| --- | --- | --- | --- |
| TC-PRD-5:duplicate-id | {"kind": "duplicate_id"} | 200 | report.json → executions[47] |

Trích quan sát: [{}]

### TC-USR-1 — Truy cập trái phép hồ sơ tài khoản khác
Mong đợi theo snapshot: HTTP 401/403 khi thiếu token hoặc sửa hồ sơ người khác; không coi request là cập nhật hợp lệ.

| Case ID | Oracle thực tế | HTTP quan sát | Tham chiếu |
| --- | --- | --- | --- |
| TC-USR-1:None | {"kind": "status", "allowed": [401, 403]} | 200 | report.json → executions[34] |
| TC-USR-1:self | {"kind": "status", "allowed": [401, 403]} | 200 | report.json → executions[35] |

Trích quan sát: [{"role": "user"}]

### TC-USR-2 — Mass assignment làm thay đổi quyền tài khoản
Mong đợi theo snapshot: Role lưu trong dữ liệu vẫn giữ nguyên khi người dùng thường gửi role=admin; không nâng quyền theo body.

| Case ID | Oracle thực tế | HTTP quan sát | Tham chiếu |
| --- | --- | --- | --- |
| TC-USR-2:role | {"kind": "role_unchanged"} | 200 | report.json → executions[36] |

Trích quan sát: [{"role": "admin"}]

### TC-USR-4 — Dữ liệu mật khẩu nhạy cảm bị lưu dạng rõ
Mong đợi theo snapshot: Sau cập nhật hợp lệ, mật khẩu không được lưu bằng chuỗi plaintext đầu vào; phải kiểm tra dữ liệu lưu, không suy ra từ đăng nhập thành công.

| Case ID | Oracle thực tế | HTTP quan sát | Tham chiếu |
| --- | --- | --- | --- |
| TC-USR-4:password-storage | {"kind": "password"} | 200 | report.json → executions[38] |

Trích quan sát: [{"role": "user"}]

Kiểm tra lưu mật khẩu: {"is_bcrypt": false, "verifies": false, "equals_plaintext": true}

### TC-USR-3 — ID sai định dạng gây ngoại lệ truy vấn hồ sơ
Mong đợi theo snapshot: HTTP 400/404 có kiểm soát; không HTTP 500 do ID sai định dạng.

| Case ID | Oracle thực tế | HTTP quan sát | Tham chiếu |
| --- | --- | --- | --- |
| TC-USR-3:invalid-id | {"kind": "status", "allowed": [400, 404]} | 500 | report.json → executions[37] |

Trích quan sát: [{"error": "Cast to ObjectId failed for value \"abc\" (type string) at path \"_id\""}]

Các mục FAIL là nhóm theo testcase; chưa có phân tích chứng minh đây là 20 lỗi gốc độc lập. Dữ liệu request, actor, entity_before/after (nếu được lưu), response và toàn bộ chuỗi thao tác tra trong executions của JSON gốc theo Case ID ở trên.

## 5. Blackbox 3.500 input (campaign riêng)
Nguồn: results/blackbox/e97d715116e3/report.json. Seed 42, 3.500 input, thời gian được ghi 51.366 giây. 240 HTTP 5xx (6,86%), 1.669 lượt finding nghiệp vụ/bảo mật. Không dùng 1.669 làm số lỗi gốc; không cộng với 20 testcase FAIL.

| Target | HTTP | Số lượt |
| --- | --- | --- |
| login | 200 | 220 |
| login | 400 | 142 |
| login | 401 | 67 |
| login | 404 | 71 |
| order_status | 200 | 471 |
| order_status | 500 | 29 |
| orders | 200 | 372 |
| orders | 400 | 71 |
| orders | 500 | 57 |
| product_create | 200 | 423 |
| product_create | 500 | 77 |
| product_update | 200 | 423 |
| product_update | 500 | 77 |
| user_update_self | 200 | 500 |
| user_update_victim | 200 | 500 |

| Target có 5xx | Số lượt |
| --- | --- |
| orders | 57 |
| product_update | 77 |
| order_status | 29 |
| product_create | 77 |

Ví dụ iteration 1: tạo đơn thiếu totalAmount trả HTTP 500 với thông báo required; finding iteration 3 ghi sửa hồ sơ bản thân không có token vẫn HTTP 200; iteration 4 ghi sửa hồ sơ người khác bằng token user thường vẫn HTTP 200. Đây là quan sát trên harness; 500 không chứng minh tiến trình crash.

## 6. Demo coverage, concolic và khảo sát biên
results/demo_chuong4_final/: blackbox 42 input, 1 lỗi HTTP ứng dụng, 22 quan sát nghiệp vụ/bảo mật; khảo sát coverage 16 input, 6 lỗi HTTP ứng dụng và 6 quan sát. Coverage-guided là greybox; không gọi toàn bộ giai đoạn này là symbolic execution.

Concolic riêng cho totalAmount: 5 input, 4 input replay, 4 input vi phạm, 2 input HTTP 5xx, 1 truy vấn UNSAT. number trả 200; null và object trả 500; numeric_string và boolean trả 200 nhưng bị phân loại chấp nhận sai kiểu. Mô hình thủ công total_kind trong [0,7], Z3 phiên bản ghi nhận 5.1.0; không chứng minh toàn bộ JavaScript hoặc toàn hệ thống. requirements.txt hiện quy định z3-solver<5 khác phiên bản ghi trong bằng chứng: cần tái lập môi trường trước khi so sánh lần chạy mới.

results/boundary_smoke_final/: blackbox 14 input (1 lỗi HTTP, 8 quan sát); khảo sát coverage 4 input (4 lỗi HTTP). Probe thay productId và độ dài name trong [0,16] trong khi shippingFee sai kiểu được giữ nguyên; các mẫu đều 5xx, không có transition, complete=false. Vì vậy chưa xác định được biên lỗi của productId/name, chưa loại trừ tác động che khuất từ shippingFee. Không suy ra toàn miền [0,16] đã được kiểm tra đầy đủ.

## 7. Sai lệch và giới hạn bằng chứng
Hai lần thử ngày 28/10/2026 được Kiem_tra_runtime.json ghi SETUP_ERROR: harness chưa sẵn sàng sau 15 giây; nguyên nhân chưa xác định. Đây không phải campaign hoàn tất, không cộng thành PASS/FAIL của ứng dụng.

Chưa có bằng chứng xác nhận crash tiến trình, hang hoặc memory corruption bằng sanitizer; giá trị null trong mục confirmed_* là chưa đo, không phải số 0. Chưa xác minh đầy đủ CTL/SMT, concurrency, timing, rate limit, tích hợp email/virtual closet và 105 testcase còn lại. Năm sheet mô hình/thuộc tính hay mã sinh trong Excel là đặc tả, không tự trở thành kết quả chạy.

## 8. Kết luận và xử lý đề nghị
Kết luận theo bằng chứng lịch sử: campaign API chưa đạt, vì 20/29 testcase vi phạm oracle; chưa đủ cơ sở xác nhận an toàn hoặc nghiệm thu toàn bộ 134 testcase hiện tại. Chưa có kết quả retest chứng minh các vi phạm đã được sửa.

Ưu tiên sửa kiểm tra xác thực/quyền trên tài khoản, sản phẩm và trạng thái đơn; ngăn mass assignment role, lưu mật khẩu bằng hash phù hợp; kiểm tra kiểu/miền đầu vào trước tầng lưu trữ; tính giá/tổng từ dữ liệu server; bảo vệ trạng thái kết thúc và định danh sản phẩm; đồng nhất phản hồi đăng nhập. Sau sửa cần chạy lại theo Excel hiện tại, bổ sung oracle cho điều kiện mới, lưu snapshot/hash/runtime và retest từng FAIL cùng testcase hồi quy. Mức ưu tiên là đề nghị xử lý, chưa phải chấm điểm CVSS.

## 9. Nguồn và truy vết
| Nguồn (tương đối từ fuzzing-security-testing) | SHA-256 hiện tại |
| --- | --- |
| BaoCaoATPM\Module_Auth_Login_spec.xlsx | 0911ac90a0c86ce7afa5d20d1337a1f96bbed61945fa0790a0e0235cb9485e6f |
| BaoCaoATPM\Module_Orders_Create_spec.xlsx | e012313461b5fd75c1e153e02c862a43e588567b6e4f5a6e2b531de87748cbce |
| BaoCaoATPM\Module_OrderStatus_spec.xlsx | def734a752a43c9c21064ee9e00918282c147b058bf7d0a2177413032f39944b |
| BaoCaoATPM\Module_Products_Manage_spec.xlsx | 659d7990fbd69a36bef7a73b0e19612917e907e4081fc62a59bce2d93715c5e8 |
| BaoCaoATPM\Module_Users_Admin_spec.xlsx | e1d890ac77a57337f675fe2b7f45a65d511897246458b4d7d0b8cc122b676551 |
| results/spec_excel_aligned/report.json | 4d0ab7a2cce025f0144da621de9af56803feadcac35b80b4933fee324e38dea8 |
| results/spec_excel_aligned/spec_snapshot.json | 0262bd6c507f33932b753b529fbc66263f917dbfb6ebed4f7eb47d4ffd335f79 |
| results/spec_excel_aligned/excluded_testcases.json | 6c27560506e67f168a6774a52bd85bbebd8bd6c85063c15edd86cbc3e9f8e4db |
| results/blackbox/e97d715116e3/report.json | ce275dae533b07c7766879539be28c081eebc83640823b33ec84ba17a410a8de |
| results/demo_chuong4_final/report.json | 14338773937a48c3f0e7ec57710d7ee17a1759c9b35fa2417fb4e87d5080d6d7 |
| results/demo_chuong4_final/concolic/report.json | f13e6943f502ffc8212f3d5ab978ef41160fcf98f278fac409dffef8e267db77 |
| results/boundary_smoke_final/report.json | 8fe4d3129e5b6bb37221393b5c2de8c025bf79040f1932ecc80fcae3b49a2e07 |
| results/boundary_smoke_final/whitebox/bounded_analysis.json | 2f44242b7750baece07cbb77c5cc0c0cf92edb02d0048bf66965bf3bba3bce3b |
| BaoCaoATPM/BaoCao_Trang/Kiem_tra_runtime.json | f0cafb96933e6d38d8a3048b919d0a764caf2070298b51bc50385c4695cef845 |
| fuzzers/oracles.py | 4c28fd65eb4e1bf253ae78ffc8a25b9e5d84e712ec701bf8bd796663d8ed2037 |
| fuzzers/spec_campaign.py | 74cc54e1194ed44968bf8f682765524642057c3e906b47c7e65b3bda8d357e77 |
| README.md | 6f66b7d3f5a58af79376320645b8aab0a50f954a98aa0e2f73e04bcb34e57e03 |
| requirements.txt | d3c9294fcfa8376fce72157e55ee47443a1658ba4af33437f6d8d6fa2585a4cb |

Phụ lục Excel đi kèm: toàn bộ 134 testcase hiện tại; kết quả lịch sử được tách riêng; thay đổi từng trường so với snapshot; 59 lượt kịch bản cùng oracle và HTTP; mã băm nguồn. Không có thao tác chạy campaign trong lần lập biên bản này.

## 10. Xác nhận
| Người lập biên bản | Đại diện kiểm thử | Đại diện phụ trách hệ thống |
| --- | --- | --- |
| (Ký, ghi rõ họ tên) | (Ký, ghi rõ họ tên) | (Ký, ghi rõ họ tên) |
| ........................ | ........................ | ........................ |
