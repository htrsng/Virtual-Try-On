# Bug reports

Ba bug report minh họa được chọn từ acceptance run, trạng thái **OPEN**. Đây là
ba triệu chứng được tái hiện trên API mô phỏng, không phải tuyên bố đã tìm đủ mọi
lỗi gốc. Full suite còn các testcase FAIL khác trong baseline.

| Bug ID | Nội dung | Severity đề xuất | Testcase | Trạng thái |
|---|---|---|---|---|
| [BUG-001](BUG-001-role-escalation.md) | User tự gửi role admin và được trả role admin | High | TC-USR-2 | OPEN |
| [BUG-002](BUG-002-order-total.md) | API chấp nhận giá/tổng tiền giả mạo | High | TC-ORD-18 | OPEN |
| [BUG-003](BUG-003-user-authorization.md) | Cập nhật user khác không cần token | High | TC-USR-1 | OPEN |

Severity dựa trên tác động trong mô hình nghiệp vụ, không gán CVSS cho production.
Chưa sửa target để giữ khả năng tái hiện. Khi sửa, chạy lại cùng testcase và oracle;
lưu kết quả mới, chỉ chuyển CLOSED sau khi xác nhận cả dữ liệu và quyền liên quan.
