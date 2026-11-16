# Test Coverage Matrix

Coverage ở đây là ánh xạ đặc tả → scenario → kết quả, không phải line/branch coverage.
**134 testcase Excel: 29 ca API đã thực thi / 105 ca ngoài campaign API.**
29 ca được triển khai thành 51 scenario xác định: 19 PASS, 32 FAIL, 0 ERROR/NOT_RUN.
Tổng hợp testcase: 9 PASS, 20 FAIL, 0 ERROR/NOT_RUN. Không cộng với regression test của công cụ.

Lần chạy hiện hành: [API http-and-stored-state-v1](../reports/state-oracles-v1/api/report.md).

| Testcase | Nhóm chức năng | Requirement gốc | Scenario PASS/FAIL | Kết quả | Fuzz target cùng module | Replay đại diện |
|---|---|---|---|---|---|---|
| TC-AUTH-1 | AUTH | REQ-AUTH-1 | 3 / 0 | PASS | login | Không chọn (API PASS) |
| TC-AUTH-2 | AUTH | REQ-AUTH-2 | 5 / 0 | PASS | login | Không chọn (API PASS) |
| TC-AUTH-3 | AUTH | REQ-AUTH-3 | 0 / 1 | FAIL | login | REPRODUCED |
| TC-AUTH-5 | AUTH | REQ-AUTH-5 | 1 / 0 | PASS | login | Không chọn (API PASS) |
| TC-AUTH-7 | AUTH | REQ-AUTH-8 | 1 / 0 | PASS | login | Không chọn (API PASS) |
| TC-ORD-1 | ORD | REQ-ORD-1, REQ-ORD-8 | 1 / 3 | FAIL | orders | REPRODUCED |
| TC-ORD-2 | ORD | REQ-ORD-2 | 4 / 0 | PASS | orders | Không chọn (API PASS) |
| TC-ORD-3 | ORD | REQ-ORD-3 | 0 / 1 | FAIL | orders | REPRODUCED |
| TC-ORD-4 | ORD | REQ-ORD-4 | 0 / 4 | FAIL | orders | REPRODUCED |
| TC-ORD-5 | ORD | REQ-ORD-5 | 0 / 1 | FAIL | orders | REPRODUCED |
| TC-ORD-6 | ORD | REQ-ORD-6 | 0 / 1 | FAIL | orders | REPRODUCED |
| TC-ORD-18 | ORD | REQ-ORD-5 | 0 / 1 | FAIL | orders | REPRODUCED |
| TC-ORD-19 | ORD | REQ-ORD-2, REQ-ORD-5, REQ-ORD-8 | 1 / 0 | PASS | orders | Không chọn (API PASS) |
| TC-OS-1 | OS | REQ-OS-1, REQ-OS-2 | 0 / 2 | FAIL | order_status | REPRODUCED |
| TC-OS-2 | OS | REQ-OS-3 | 0 / 2 | FAIL | order_status | REPRODUCED |
| TC-OS-3 | OS | REQ-OS-4 | 0 / 1 | FAIL | order_status | REPRODUCED |
| TC-OS-4 | OS | REQ-OS-5 | 0 / 2 | FAIL | order_status | REPRODUCED |
| TC-OS-21 | OS | REQ-OS-4 | 0 / 1 | FAIL | order_status | REPRODUCED |
| TC-OS-5 | OS | REQ-OS-7 | 1 / 0 | PASS | order_status | Không chọn (API PASS) |
| TC-PRD-1 | PRD | REQ-PRD-1 | 0 / 4 | FAIL | product_create/update | REPRODUCED |
| TC-PRD-2 | PRD | REQ-PRD-2 | 0 / 1 | FAIL | product_create/update | REPRODUCED |
| TC-PRD-3 | PRD | REQ-PRD-3 | 0 / 1 | FAIL | product_create/update | REPRODUCED |
| TC-PRD-5 | PRD | REQ-PRD-4 | 0 / 1 | FAIL | product_create/update | REPRODUCED |
| TC-PRD-4 | PRD | REQ-PRD-6 | 1 / 0 | PASS | product_create/update | Không chọn (API PASS) |
| TC-USR-1 | USR | REQ-USR-1, REQ-USR-2 | 0 / 2 | FAIL | user_update_self/victim | REPRODUCED |
| TC-USR-2 | USR | REQ-USR-3 | 0 / 1 | FAIL | user_update_self/victim | REPRODUCED |
| TC-USR-4 | USR | REQ-USR-5, NFR-USR-5 | 0 / 1 | FAIL | user_update_self/victim | REPRODUCED |
| TC-USR-3 | USR | REQ-USR-4 | 0 / 1 | FAIL | user_update_self/victim | REPRODUCED |
| TC-USR-5 | USR | REQ-USR-6 | 1 / 0 | PASS | user_update_self/victim | Không chọn (API PASS) |

Cột fuzz target là điểm liên hệ kiến trúc, **không xác nhận từng testcase đã được fuzz oracle bao phủ**.
Login chỉ thuộc blackbox; greybox/concolic hỗ trợ target có giới hạn như mô tả trong module fuzzing.

- [105 testcase ngoài campaign](excluded-testcases.csv): giữ ID/module/title/lý do; không ghi PASS.
- [29 API definitions và oracle cụ thể](../api-testing/test-cases.csv).
- [12 manual UI case](../manual-testing/test-cases.md): NOT_RUN, không thuộc 134 ca Excel.
- [14 unit logic](../automation-testing/README.md) và [14 component checks](frontend-quality.md) là phạm vi khác.
- Regression hạ tầng: 55 test fuzz tool/oracle/snapshot; 9 test API reporting/replay, không phải acceptance coverage.
