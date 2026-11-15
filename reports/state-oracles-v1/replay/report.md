# Acceptance failure replay

One failing representative per testcase, fresh Node per attempt. Not every original input; no fixes verified.

| Testcase | Fixed scenario | Replay | Result |
|---|---|---|---|
| TC-AUTH-3 | TC-AUTH-3:enumeration | [1: FAIL](evidence/TC-AUTH-3-1.json), [2: FAIL](evidence/TC-AUTH-3-2.json) | REPRODUCED |
| TC-ORD-1 | TC-ORD-1:0 | [1: FAIL](evidence/TC-ORD-1-1.json), [2: FAIL](evidence/TC-ORD-1-2.json) | REPRODUCED |
| TC-ORD-3 | TC-ORD-3:missing-total | [1: FAIL](evidence/TC-ORD-3-1.json), [2: FAIL](evidence/TC-ORD-3-2.json) | REPRODUCED |
| TC-ORD-4 | TC-ORD-4:0 | [1: FAIL](evidence/TC-ORD-4-1.json), [2: FAIL](evidence/TC-ORD-4-2.json) | REPRODUCED |
| TC-ORD-5 | TC-ORD-5:catalog-price | [1: FAIL](evidence/TC-ORD-5-1.json), [2: FAIL](evidence/TC-ORD-5-2.json) | REPRODUCED |
| TC-ORD-6 | TC-ORD-6:negative-total | [1: FAIL](evidence/TC-ORD-6-1.json), [2: FAIL](evidence/TC-ORD-6-2.json) | REPRODUCED |
| TC-OS-1 | TC-OS-1:None | [1: FAIL](evidence/TC-OS-1-1.json), [2: FAIL](evidence/TC-OS-1-2.json) | REPRODUCED |
| TC-OS-2 | TC-OS-2:'' | [1: FAIL](evidence/TC-OS-2-1.json), [2: FAIL](evidence/TC-OS-2-2.json) | REPRODUCED |
| TC-OS-3 | TC-OS-3:revert-delivered | [1: FAIL](evidence/TC-OS-3-1.json), [2: FAIL](evidence/TC-OS-3-2.json) | REPRODUCED |
| TC-OS-4 | TC-OS-4:/api/orders/abc | [1: FAIL](evidence/TC-OS-4-1.json), [2: FAIL](evidence/TC-OS-4-2.json) | REPRODUCED |
| TC-USR-1 | TC-USR-1:None | [1: FAIL](evidence/TC-USR-1-1.json), [2: FAIL](evidence/TC-USR-1-2.json) | REPRODUCED |
| TC-USR-2 | TC-USR-2:role | [1: FAIL](evidence/TC-USR-2-1.json), [2: FAIL](evidence/TC-USR-2-2.json) | REPRODUCED |
| TC-USR-3 | TC-USR-3:invalid-id | [1: FAIL](evidence/TC-USR-3-1.json), [2: FAIL](evidence/TC-USR-3-2.json) | REPRODUCED |
| TC-USR-4 | TC-USR-4:password-storage | [1: FAIL](evidence/TC-USR-4-1.json), [2: FAIL](evidence/TC-USR-4-2.json) | REPRODUCED |
| TC-PRD-1 | TC-PRD-1:POST-None | [1: FAIL](evidence/TC-PRD-1-1.json), [2: FAIL](evidence/TC-PRD-1-2.json) | REPRODUCED |
| TC-PRD-2 | TC-PRD-2:negative-price | [1: FAIL](evidence/TC-PRD-2-1.json), [2: FAIL](evidence/TC-PRD-2-2.json) | REPRODUCED |
| TC-PRD-3 | TC-PRD-3:price-object | [1: FAIL](evidence/TC-PRD-3-1.json), [2: FAIL](evidence/TC-PRD-3-2.json) | REPRODUCED |
| TC-PRD-5 | TC-PRD-5:duplicate-id | [1: FAIL](evidence/TC-PRD-5-1.json), [2: FAIL](evidence/TC-PRD-5-2.json) | REPRODUCED |
| TC-ORD-18 | TC-ORD-18:catalog | [1: FAIL](evidence/TC-ORD-18-1.json), [2: FAIL](evidence/TC-ORD-18-2.json) | REPRODUCED |
| TC-OS-21 | TC-OS-21:cancelled-terminal | [1: FAIL](evidence/TC-OS-21-1.json), [2: FAIL](evidence/TC-OS-21-2.json) | REPRODUCED |

Exit 0 means all selected failures reproduced; target acceptance still FAIL.
NOT_REPRODUCED needs investigation; it does not prove a fix.
