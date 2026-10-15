# Tái hiện testcase FAIL

Mỗi lần chạy dùng tiến trình Node mới và dữ liệu sạch. Chọn một kịch bản đại diện mỗi testcase.

| Testcase | Kịch bản | Trạng thái chạy lại | Kết luận |
|---|---|---|---|
| TC-AUTH-3 | TC-AUTH-3:enumeration | FAIL, FAIL | REPRODUCED |
| TC-AUTH-6 | TC-AUTH-6:timing-100 | FAIL, FAIL | REPRODUCED |
| TC-ORD-1 | TC-ORD-1:0 | FAIL, FAIL | REPRODUCED |
| TC-ORD-3 | TC-ORD-3:missing-total | FAIL, FAIL | REPRODUCED |
| TC-ORD-4 | TC-ORD-4:0 | FAIL, FAIL | REPRODUCED |
| TC-ORD-5 | TC-ORD-5:catalog-price | FAIL, FAIL | REPRODUCED |
| TC-ORD-6 | TC-ORD-6:negative-total | FAIL, FAIL | REPRODUCED |
| TC-OS-1 | TC-OS-1:None | FAIL, FAIL | REPRODUCED |
| TC-OS-2 | TC-OS-2:'' | FAIL, FAIL | REPRODUCED |
| TC-OS-3 | TC-OS-3:revert-delivered | FAIL, FAIL | REPRODUCED |
| TC-OS-4 | TC-OS-4:/api/orders/abc | FAIL, FAIL | REPRODUCED |
| TC-USR-1 | TC-USR-1:None | FAIL, FAIL | REPRODUCED |
| TC-USR-2 | TC-USR-2:role | FAIL, FAIL | REPRODUCED |
| TC-USR-3 | TC-USR-3:invalid-id | FAIL, FAIL | REPRODUCED |
| TC-USR-4 | TC-USR-4:password-storage | FAIL, FAIL | REPRODUCED |
| TC-PRD-1 | TC-PRD-1:POST-None | FAIL, FAIL | REPRODUCED |
| TC-PRD-2 | TC-PRD-2:negative-price | FAIL, FAIL | REPRODUCED |
| TC-PRD-3 | TC-PRD-3:price-object | FAIL, FAIL | REPRODUCED |
| TC-PRD-5 | TC-PRD-5:duplicate-id | FAIL, FAIL | REPRODUCED |
| TC-ORD-18 | TC-ORD-18:catalog | FAIL, FAIL | REPRODUCED |
| TC-OS-21 | TC-OS-21:cancelled-terminal | FAIL, FAIL | REPRODUCED |

REPRODUCED: các lần thử lại đều FAIL theo oracle. NOT_STABLE: chưa tái hiện ổn định. INCONCLUSIVE: có lỗi bộ chạy.
Các nhóm này chưa xác định số lỗi gốc. Bằng chứng nằm trong evidence/.
