# API acceptance report

Suite: full; environment: `node_harness_stub`.
Created: 2026-11-15T04:34:00.178336+00:00; git: `414d49a6d91ef1750f43ed084d07b23b1685d15a`.
Scenario counts: {'PASS': 19, 'FAIL': 32}; unexecuted: 0.
Testcase counts in selected scope: {'PASS': 9, 'FAIL': 20}.

All inputs are deterministic; no random mutation is performed by this suite.

| Scenario | Testcase | Status | Evidence |
|---|---|---|---|
| TC-AUTH-1:0 | TC-AUTH-1 | PASS | [evidence/001.json](evidence/001.json) |
| TC-AUTH-1:1 | TC-AUTH-1 | PASS | [evidence/002.json](evidence/002.json) |
| TC-AUTH-1:2 | TC-AUTH-1 | PASS | [evidence/003.json](evidence/003.json) |
| TC-AUTH-2:0 | TC-AUTH-2 | PASS | [evidence/004.json](evidence/004.json) |
| TC-AUTH-2:1 | TC-AUTH-2 | PASS | [evidence/005.json](evidence/005.json) |
| TC-AUTH-2:2 | TC-AUTH-2 | PASS | [evidence/006.json](evidence/006.json) |
| TC-AUTH-2:3 | TC-AUTH-2 | PASS | [evidence/007.json](evidence/007.json) |
| TC-AUTH-2:4 | TC-AUTH-2 | PASS | [evidence/008.json](evidence/008.json) |
| TC-AUTH-3:enumeration | TC-AUTH-3 | FAIL | [evidence/009.json](evidence/009.json) |
| TC-AUTH-5:jwt-role | TC-AUTH-5 | PASS | [evidence/010.json](evidence/010.json) |
| TC-AUTH-7:long-email | TC-AUTH-7 | PASS | [evidence/011.json](evidence/011.json) |
| TC-ORD-1:0 | TC-ORD-1 | FAIL | [evidence/012.json](evidence/012.json) |
| TC-ORD-1:1 | TC-ORD-1 | FAIL | [evidence/013.json](evidence/013.json) |
| TC-ORD-1:2 | TC-ORD-1 | PASS | [evidence/014.json](evidence/014.json) |
| TC-ORD-1:3 | TC-ORD-1 | FAIL | [evidence/015.json](evidence/015.json) |
| TC-ORD-2:shippingInfo | TC-ORD-2 | PASS | [evidence/016.json](evidence/016.json) |
| TC-ORD-2:fullName | TC-ORD-2 | PASS | [evidence/017.json](evidence/017.json) |
| TC-ORD-2:phone | TC-ORD-2 | PASS | [evidence/018.json](evidence/018.json) |
| TC-ORD-2:address | TC-ORD-2 | PASS | [evidence/019.json](evidence/019.json) |
| TC-ORD-3:missing-total | TC-ORD-3 | FAIL | [evidence/020.json](evidence/020.json) |
| TC-ORD-4:0 | TC-ORD-4 | FAIL | [evidence/021.json](evidence/021.json) |
| TC-ORD-4:1 | TC-ORD-4 | FAIL | [evidence/022.json](evidence/022.json) |
| TC-ORD-4:2 | TC-ORD-4 | FAIL | [evidence/023.json](evidence/023.json) |
| TC-ORD-4:3 | TC-ORD-4 | FAIL | [evidence/024.json](evidence/024.json) |
| TC-ORD-5:catalog-price | TC-ORD-5 | FAIL | [evidence/025.json](evidence/025.json) |
| TC-ORD-6:negative-total | TC-ORD-6 | FAIL | [evidence/026.json](evidence/026.json) |
| TC-OS-1:None | TC-OS-1 | FAIL | [evidence/027.json](evidence/027.json) |
| TC-OS-1:victim | TC-OS-1 | FAIL | [evidence/028.json](evidence/028.json) |
| TC-OS-2:'' | TC-OS-2 | FAIL | [evidence/029.json](evidence/029.json) |
| TC-OS-2:'0000000000' | TC-OS-2 | FAIL | [evidence/030.json](evidence/030.json) |
| TC-OS-3:revert-delivered | TC-OS-3 | FAIL | [evidence/031.json](evidence/031.json) |
| TC-OS-5:positive-control | TC-OS-5 | PASS | [evidence/032.json](evidence/032.json) |
| TC-OS-4:/api/orders/abc | TC-OS-4 | FAIL | [evidence/033.json](evidence/033.json) |
| TC-OS-4:/api/orders/{order} | TC-OS-4 | FAIL | [evidence/034.json](evidence/034.json) |
| TC-USR-1:None | TC-USR-1 | FAIL | [evidence/035.json](evidence/035.json) |
| TC-USR-1:self | TC-USR-1 | FAIL | [evidence/036.json](evidence/036.json) |
| TC-USR-2:role | TC-USR-2 | FAIL | [evidence/037.json](evidence/037.json) |
| TC-USR-3:invalid-id | TC-USR-3 | FAIL | [evidence/038.json](evidence/038.json) |
| TC-USR-4:password-storage | TC-USR-4 | FAIL | [evidence/039.json](evidence/039.json) |
| TC-USR-5:wrong-secret | TC-USR-5 | PASS | [evidence/040.json](evidence/040.json) |
| TC-PRD-1:POST-None | TC-PRD-1 | FAIL | [evidence/041.json](evidence/041.json) |
| TC-PRD-1:POST-self | TC-PRD-1 | FAIL | [evidence/042.json](evidence/042.json) |
| TC-PRD-1:PUT-None | TC-PRD-1 | FAIL | [evidence/043.json](evidence/043.json) |
| TC-PRD-1:PUT-self | TC-PRD-1 | FAIL | [evidence/044.json](evidence/044.json) |
| TC-PRD-2:negative-price | TC-PRD-2 | FAIL | [evidence/045.json](evidence/045.json) |
| TC-PRD-3:price-object | TC-PRD-3 | FAIL | [evidence/046.json](evidence/046.json) |
| TC-PRD-4:missing-product | TC-PRD-4 | PASS | [evidence/047.json](evidence/047.json) |
| TC-PRD-5:duplicate-id | TC-PRD-5 | FAIL | [evidence/048.json](evidence/048.json) |
| TC-ORD-18:catalog | TC-ORD-18 | FAIL | [evidence/049.json](evidence/049.json) |
| TC-ORD-19:catalog | TC-ORD-19 | PASS | [evidence/050.json](evidence/050.json) |
| TC-OS-21:cancelled-terminal | TC-OS-21 | FAIL | [evidence/051.json](evidence/051.json) |

FAIL means the target violated the acceptance oracle. ERROR means a runner,
setup or oracle failure. Neither is converted into PASS for CI.
Smoke covers only its named controls; it is not the full acceptance suite.
Findings are not a count of independent root causes. Target uses simulated storage.
