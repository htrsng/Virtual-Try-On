# Defect register

**20 testcase FAIL / 32 scenario FAIL → 17 nhóm triage sơ bộ.**
17 là số nhóm triệu chứng do reviewer phân loại, không phải số bug gốc đã xác nhận.
Số lỗi gốc độc lập hiện **chưa xác định**. Không suy ra từ số testcase, HTTP status hay nhóm.
Các nhóm có thể tách hoặc gộp tiếp sau code review và kiểm chứng bản sửa.

| Finding | Module | Testcase | Nhóm | Severity | Expected | Actual trong các scenario FAIL | Replay | State | Regression cố định | Evidence / bug |
|---|---|---|---|---|---|---|---|---|---|---|
| DF-001 | Login | TC-AUTH-3 | G01 | Medium | Hai response login cùng status/body | HTTP [401]; hai nhánh HTTP 404/401 | REPRODUCED (2 lần) | OPEN; chưa sửa | TC-AUTH-3:enumeration | [API](../reports/baseline/api/evidence/009.json) |
| DF-002 | Order | TC-ORD-1 | G02 | High | HTTP thuộc [400, 422] | HTTP [200] | REPRODUCED (2 lần) | OPEN; chưa sửa | TC-ORD-1:0 | [API](../reports/baseline/api/evidence/012.json) |
| DF-003 | Order | TC-ORD-3 | G03 | Medium | HTTP thuộc [400] | HTTP [500] | REPRODUCED (2 lần) | OPEN; chưa sửa | TC-ORD-3:missing-total | [API](../reports/baseline/api/evidence/020.json) |
| DF-004 | Order | TC-ORD-4 | G03 | Medium | HTTP thuộc [400, 422] | HTTP [200, 500] | REPRODUCED (2 lần) | OPEN; chưa sửa | TC-ORD-4:0 | [API](../reports/baseline/api/evidence/021.json) |
| DF-005 | Order | TC-ORD-5 | G04 | High | Từ chối 400/422 hoặc tổng theo catalog | HTTP [200]; response total=2 | REPRODUCED (2 lần) | OPEN; chưa sửa | TC-ORD-5:catalog-price | [API](../reports/baseline/api/evidence/025.json) / [BUG-002](../bug-reports/BUG-002-order-total.md) |
| DF-006 | Order | TC-ORD-6 | G05 | High | HTTP thuộc [400, 422] | HTTP [200] | REPRODUCED (2 lần) | OPEN; chưa sửa | TC-ORD-6:negative-total | [API](../reports/baseline/api/evidence/026.json) |
| DF-007 | Order | TC-ORD-18 | G04 | High | Từ chối 400/422 hoặc tổng theo catalog | HTTP [200]; response total=2 | REPRODUCED (2 lần) | OPEN; chưa sửa | TC-ORD-18:catalog | [API](../reports/baseline/api/evidence/049.json) / [BUG-002](../bug-reports/BUG-002-order-total.md) |
| DF-008 | Order state | TC-OS-1 | G06 | High | HTTP thuộc [401, 403] | HTTP [200] | REPRODUCED (2 lần) | OPEN; chưa sửa | TC-OS-1:None | [API](../reports/baseline/api/evidence/027.json) |
| DF-009 | Order state | TC-OS-2 | G07 | Medium | HTTP thuộc [400, 422] | HTTP [200] | REPRODUCED (2 lần) | OPEN; chưa sửa | TC-OS-2:'' | [API](../reports/baseline/api/evidence/029.json) |
| DF-010 | Order state | TC-OS-3 | G08 | High | HTTP thuộc [400, 409, 422] | HTTP [200] | REPRODUCED (2 lần) | OPEN; chưa sửa | TC-OS-3:revert-delivered | [API](../reports/baseline/api/evidence/031.json) / [BUG-004](../bug-reports/BUG-004-terminal-order-state.md) |
| DF-011 | Order state | TC-OS-4 | G09 | Medium | HTTP thuộc [400, 404, 422] | HTTP [500] | REPRODUCED (2 lần) | OPEN; chưa sửa | TC-OS-4:/api/orders/abc | [API](../reports/baseline/api/evidence/033.json) |
| DF-012 | Order state | TC-OS-21 | G08 | High | Chặn chuyển tiếp, đơn vẫn hủy và dữ liệu không đổi | HTTP [200]; state cuối=Đang giao | REPRODUCED (2 lần) | OPEN; chưa sửa | TC-OS-21:cancelled-terminal | [API](../reports/baseline/api/evidence/051.json) / [BUG-004](../bug-reports/BUG-004-terminal-order-state.md) |
| DF-013 | Product | TC-PRD-1 | G10 | High | HTTP thuộc [401, 403] | HTTP [200] | REPRODUCED (2 lần) | OPEN; chưa sửa | TC-PRD-1:POST-None | [API](../reports/baseline/api/evidence/041.json) |
| DF-014 | Product | TC-PRD-2 | G11 | High | HTTP thuộc [400, 422] | HTTP [200] | REPRODUCED (2 lần) | OPEN; chưa sửa | TC-PRD-2:negative-price | [API](../reports/baseline/api/evidence/045.json) |
| DF-015 | Product | TC-PRD-3 | G12 | Medium | HTTP thuộc [400, 422] | HTTP [500] | REPRODUCED (2 lần) | OPEN; chưa sửa | TC-PRD-3:price-object | [API](../reports/baseline/api/evidence/046.json) |
| DF-016 | Product | TC-PRD-5 | G13 | High | Từ chối trùng hoặc cấp ID mới và giữ nguyên product gốc | HTTP [200] | REPRODUCED (2 lần) | OPEN; chưa sửa | TC-PRD-5:duplicate-id | [API](../reports/baseline/api/evidence/048.json) |
| DF-017 | User | TC-USR-1 | G14 | High | HTTP thuộc [401, 403] | HTTP [200] | REPRODUCED (2 lần) | OPEN; chưa sửa | TC-USR-1:None | [API](../reports/baseline/api/evidence/035.json) / [BUG-003](../bug-reports/BUG-003-user-authorization.md) |
| DF-018 | User | TC-USR-2 | G15 | High | Từ chối hoặc giữ role user | HTTP [200]; response role=admin | REPRODUCED (2 lần) | OPEN; chưa sửa | TC-USR-2:role | [API](../reports/baseline/api/evidence/037.json) / [BUG-001](../bug-reports/BUG-001-role-escalation.md) |
| DF-019 | User | TC-USR-4 | G16 | High | Password là bcrypt, xác minh được và không bằng plaintext | HTTP [200]; audit={"is_bcrypt": false, "verifies": false, "equals_plaintext": true} | REPRODUCED (2 lần) | OPEN; chưa sửa | TC-USR-4:password-storage | [API](../reports/baseline/api/evidence/039.json) / [BUG-005](../bug-reports/BUG-005-plaintext-password.md) |
| DF-020 | User | TC-USR-3 | G17 | Medium | HTTP thuộc [400, 404] | HTTP [500] | REPRODUCED (2 lần) | OPEN; chưa sửa | TC-USR-3:invalid-id | [API](../reports/baseline/api/evidence/038.json) |

## Phân nhóm và giả thuyết nguyên nhân

| Nhóm | Testcase | Họ triệu chứng / nguyên nhân sơ bộ |
|---|---|---|
| G01 | TC-AUTH-3 | Thông báo/status tiết lộ tài khoản: So sánh hai nhánh login; chưa đánh giá khai thác thực tế |
| G02 | TC-ORD-1 | Chấp nhận cấu trúc giỏ không hợp lệ: Thiếu validation cấu trúc/quantity ở tạo đơn |
| G03 | TC-ORD-3, TC-ORD-4 | Xử lý lỗi đầu vào số tiền: Nhóm sơ bộ với ORD-4 theo đường xử lý totalAmount; chưa xác minh cùng lỗi gốc; Xử lý lỗi đầu vào số tiền: Có cả 5xx và ép kiểu được chấp nhận; cần tách tiếp theo nhánh |
| G04 | TC-ORD-5, TC-ORD-18 | Tin giá/tổng tiền client: Cùng route POST orders và oracle catalog với ORD-18; không đếm thành hai bug độc lập; Tin giá/tổng tiền client: Biến thể giả mạo đồng thời giá và tổng; cùng nhóm ORD-5 |
| G05 | TC-ORD-6 | Chấp nhận tổng tiền âm: Thiếu ràng buộc miền totalAmount |
| G06 | TC-OS-1 | Quyền cập nhật đơn: Kiểm tra auth/owner trên route cập nhật trạng thái |
| G07 | TC-OS-2 | Enum trạng thái không hợp lệ: Thiếu allowlist status |
| G08 | TC-OS-3, TC-OS-21 | Phá trạng thái kết thúc: Cùng route trạng thái với OS-21; kiểm tra terminal transition; Phá trạng thái kết thúc: Đơn hủy là biến thể khác của terminal-state invariant |
| G09 | TC-OS-4 | Ngoại lệ ID/status đơn: Hai dạng input trong cùng testcase; có thể cần tách lỗi gốc |
| G10 | TC-PRD-1 | Quyền tạo/sửa sản phẩm: Tạo và sửa là hai endpoint; gom theo họ triệu chứng, chưa xác nhận một lỗi gốc |
| G11 | TC-PRD-2 | Chấp nhận giá âm: Thiếu ràng buộc giá khi cập nhật |
| G12 | TC-PRD-3 | Ngoại lệ giá sai kiểu: Cast price phát sinh HTTP 500 |
| G13 | TC-PRD-5 | ID sản phẩm trùng: Kiểm tra uniqueness và bảo toàn bản gốc |
| G14 | TC-USR-1 | Quyền cập nhật hồ sơ: Kiểm tra auth/owner trước update |
| G15 | TC-USR-2 | Mass assignment role: Không giới hạn trường cập nhật từ self |
| G16 | TC-USR-4 | Password lưu dạng rõ: Đường cập nhật không hash password; audit dữ liệu thực trong harness |
| G17 | TC-USR-3 | Ngoại lệ ID user: Xử lý lỗi identifier trả HTTP 500 |

Nguồn implementation để tiếp tục kiểm tra giả thuyết: [routes](../fuzz-testing/target/index.js),
[models](../fuzz-testing/target/models.js), [oracle](../fuzz-testing/fuzzers/oracles.py).

Regression cố định = scenario xác định đã có và đang FAIL; không có nghĩa bug đã sửa.
Chưa có bug nào được đánh dấu FIXED/CLOSED hoặc retest sau sửa đạt.
Replay kiểm tra hash source trước khi chạy; mỗi lượt reset Node/datastore.
[40 lượt replay đo được](../reports/current/replay/report.md) · [phạm vi bằng chứng](evidence-index.md).
