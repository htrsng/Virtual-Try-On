# Bug reports

Năm bug report chi tiết được chọn từ acceptance run, trạng thái **OPEN**. Đây là
các triệu chứng được tái hiện trên API mô phỏng, không phải số lỗi gốc đã xác nhận.
[Defect register](../qa/defect-register.md) ghi đủ 20 testcase FAIL, giả thuyết phân
nhóm, expected/actual, replay, regression scenario và trạng thái sửa.

| Bug ID | Nội dung | Severity đề xuất | Testcase | Trạng thái |
|---|---|---|---|---|
| [BUG-001](BUG-001-role-escalation.md) | User tự gửi role admin và được trả role admin | High | TC-USR-2 | OPEN |
| [BUG-002](BUG-002-order-total.md) | API chấp nhận giá/tổng tiền giả mạo | High | TC-ORD-18 | OPEN |
| [BUG-003](BUG-003-user-authorization.md) | Cập nhật user khác không cần token | High | TC-USR-1 | OPEN |
| [BUG-004](BUG-004-terminal-order-state.md) | Đơn hủy vẫn chuyển sang đang giao | High | TC-OS-21 | OPEN |
| [BUG-005](BUG-005-plaintext-password.md) | Password cập nhật lưu dạng rõ | High | TC-USR-4 | OPEN |

Severity dựa trên tác động trong mô hình nghiệp vụ, không gán CVSS cho production.
Chưa sửa target để giữ khả năng tái hiện. Khi sửa, chạy lại cùng testcase và oracle;
lưu kết quả mới, chỉ chuyển CLOSED sau khi xác nhận cả dữ liệu và quyền liên quan.
