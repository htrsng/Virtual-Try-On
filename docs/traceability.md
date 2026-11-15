# Ma trận yêu cầu và kiểm thử

[Matrix hiện hành theo từng API testcase và trạng thái](../qa/test-coverage.md)
bổ sung bảng tổng hợp dưới đây; [105 ca ngoài phạm vi](../qa/excluded-testcases.csv)
giữ đủ ID và lý do, không gán PASS.

Các mã `QA-*` là nhóm yêu cầu tổng hợp cho portfolio. ID `TC-*` và expected result
gốc đến từ Excel trong `fuzz-testing/docs/specifications/`. API suite chỉ thực thi
các oracle cụ thể ghi trong catalogue, chưa tự động kiểm chứng mọi câu trong Excel.

| Nhóm yêu cầu | API testcase | Unit test | Manual testcase |
|---|---|---|---|
| QA-AUTH: xác thực và phản hồi đầu vào | TC-AUTH-1/2/3/5/7 | — | MAN-01/02/03 |
| QA-ORDER: giỏ và tổng tiền theo catalog | TC-ORD-1/2/3/4/5/6/18/19 | — | MAN-04/05/06/07 |
| QA-STATE: chuyển trạng thái đơn | TC-OS-1/2/3/4/5/21 | — | MAN-08 |
| QA-USER: owner, role, password | TC-USR-1/2/3/4/5 | — | MAN-09 |
| QA-PRODUCT: quyền, giá, ID | TC-PRD-1/2/3/4/5 | — | MAN-10 |
| QA-SIZE: chọn size và biên số đo | — | UNIT-SIZE-01…10 | MAN-11/12 |
| QA-HTTP: request và timeout | — | UNIT-HTTP-01…04 | — |

Catalogue chứa **29 testcase API / 51 scenario xác định**. Thêm fuzz campaign tạo
ra input mới nhưng không tự tăng số testcase đã xác minh. **12 testcase manual**
được thiết kế riêng và chưa chạy. **14 unit test** chạy trên hai hàm ứng dụng gốc.

[CSV API với từng ID, bước, expected và oracle](../api-testing/test-cases.csv).
ExecutionStatus trong CSV trỏ sang report; không gán PASS mặc định cho testcase.

Coverage ở đây là ánh xạ phạm vi, không phải phần trăm line/branch coverage.
