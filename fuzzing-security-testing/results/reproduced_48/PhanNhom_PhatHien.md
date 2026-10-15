# Phân nhóm dấu hiệu vi phạm

Nguồn: [campaign 48 testcase](../spec_completed_48/report.json) và
[kết quả tái hiện](report.md). Mỗi testcase chọn một kịch bản FAIL đại diện,
chạy lại hai lần trong tiến trình Node mới. 21/21 kịch bản đều FAIL ở cả hai lần,
không có ERROR. Không suy ra mọi input của testcase đều đã được tái hiện.

Đây là 13 nhóm để trình bày và điều tra, **không phải 13 lỗi gốc hay CVE đã xác nhận**.
Một nhóm có thể gồm nhiều nguyên nhân ở các endpoint khác nhau.

| Nhóm | Testcase | Bằng chứng/hành vi | Vị trí cần xem trong node_harness/index.js |
|---|---|---|---|
| Phân biệt tài khoản tồn tại | AUTH-3 | Email không tồn tại trả 404, sai mật khẩu trả 401 | Route login, dòng 391 |
| Chênh lệch thời gian đăng nhập | AUTH-6 | Chênh lệch trung bình vượt ngưỡng 20 ms trên mẫu cục bộ | Nhánh tra user và bcrypt.compare, dòng 391–413 |
| Cấu trúc giỏ hàng | ORD-1 | Giỏ sai cấu trúc vẫn được chấp nhận | Route tạo đơn, dòng 641 |
| Kiểm tra trường tổng tiền | ORD-3, ORD-4, ORD-6 | Thiếu/sai kiểu gây HTTP 500; giá trị âm được lưu | Khối tạo OrderModel, khoảng dòng 707 |
| Tin giá hoặc tổng tiền client | ORD-5, ORD-18 | Tổng lưu không khớp giá danh mục; tổng giả tự khớp cũng được chấp nhận | Route tạo đơn, dòng 641–709 |
| Thiếu xác thực/phân quyền | OS-1, USR-1, PRD-1 | Thao tác thay đổi dữ liệu vẫn thành công khi thiếu token | Các route PUT đơn, PUT user, POST/PUT sản phẩm |
| Thiếu kiểm tra enum trạng thái | OS-2 | Trạng thái ngoài tập hợp vẫn được chấp nhận | Route PUT đơn, dòng 807 |
| Thiếu kiểm tra vòng đời đơn | OS-3, OS-21 | Quay lui sau giao hoặc tiếp tục giao sau hủy vẫn thành công | Route PUT đơn, dòng 807–810 |
| ID sai dẫn đến HTTP 500 | OS-4, USR-3 | Lỗi ép kiểu ID không được chuyển thành lỗi đầu vào | Khối catch của PUT đơn/user và castObjectIdOrThrow trong models.js |
| Validation giá sản phẩm | PRD-2, PRD-3 | Giá âm được chấp nhận; object làm phát sinh HTTP 500 | PUT sản phẩm, dòng 281 |
| ID sản phẩm trùng | PRD-5 | Không đáp ứng điều kiện từ chối trùng hoặc giữ nguyên bản ghi cũ với ID mới | POST sản phẩm, dòng 357; đối chiếu final_products trong bằng chứng |
| Sửa quyền qua hồ sơ | USR-2 | Client thường đặt role=admin thành công | PUT user, dòng 563; versionedUpdate và danh sách trường models.js |
| Mật khẩu lưu không an toàn | USR-4 | password_audit không thỏa bcrypt/hash và xác minh mật khẩu | PUT user, dòng 563; trường password trong mô hình |

ID trong bảng viết ngắn; `AUTH-3` tương ứng `TC-AUTH-3`.
Các vị trí code là gợi ý điều tra trên phiên bản có mã băm trong campaign,
không phải chứng minh tất cả nhóm đã được tìm ra một nguyên nhân duy nhất.

## Cách đọc bằng chứng

Ví dụ `evidence/TC-OS-21_1.json` chứa input, chuỗi thao tác, phản hồi và dữ liệu
sau từng bước. Đối chiếu với `case.check` để biết lý do oracle kết luận FAIL.
`evidence/TC-USR-4_1.json` có password_audit; báo cáo không cần chép mật khẩu/hash.

## Giới hạn

- Tất cả kết luận áp dụng cho ứng dụng và datastore mô phỏng.
- Timing là thăm dò; chưa dùng các số đo này làm kết luận về khai thác qua mạng.
- HTTP 500 không tự chứng minh tiến trình crash, rò rỉ bộ nhớ hay lỗi C.
- Chưa sửa các lỗi nghiệp vụ ở ứng dụng mục tiêu trong bước phân tích này.
- Kết quả cần được đối chiếu lại nếu thay đổi code, oracle hoặc workbook.
