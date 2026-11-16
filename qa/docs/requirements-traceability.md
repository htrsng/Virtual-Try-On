# Requirements traceability

Mã REQ là đề xuất QA từ source. DESIGNED không đồng nghĩa implemented hoặc passed.

| Requirement | Scenario | Test case | Automation hiện có / kế hoạch | Kết quả liên quan | Finding |
|---|---|---|---|---|---|
| REQ-SMOKE-001 | SC-001 | TC-SMOKE-001 | Selenium planned; home.spec.ts chỉ kiểm tra shell | Existing Playwright BLOCKED | QA-BL-005/006 |
| REQ-AUTH-001 | SC-002 | TC-AUTH-001 | Selenium planned; auth.test.js legacy | Legacy suite parse FAIL; Edge restore login PASS giới hạn | QA-BL-004 |
| REQ-AUTH-002 | SC-003 | TC-AUTH-002 | Selenium/API planned; concurrency counter có case liên quan | Counter test PASS không thay thế UI test | QA-BL-004 |
| REQ-PROD-001 | SC-004 | TC-PROD-001 | Selenium planned; product.test.js legacy | Legacy product cases FAIL | QA-BL-004 |
| REQ-CART-001 | SC-005 | TC-CART-001 | Selenium planned | Edge restore kiểm tra giới hạn PASS; chưa có Selenium | QA-BL-006 |
| REQ-CART-002 | SC-006 | TC-CART-002 | Selenium planned | NOT RUN | — |
| REQ-DATA-001 | SC-007 | TC-DATA-001 | API/Mongo planned | NOT RUN | — |
| REQ-ACCESS-001 | SC-008 | TC-ACCESS-001 | API planned | NOT RUN trong baseline case mới | QA-BL-007 |
| REQ-ORDER-001 | SC-009 | TC-ORDER-001 | Selenium/API planned; order.test.js legacy | Legacy API order cases FAIL 403 | QA-BL-004 |
| REQ-3D-001 | SC-010 | TC-3D-001 | Playwright/manual planned | jsdom test FAIL import; chưa đánh giá render | QA-BL-003 |
| REQ-3D-002 | SC-011 | TC-3D-002 | Playwright planned | NOT RUN | — |
| REQ-API-001 | SC-012 | TC-API-001 | Existing concurrency.test.js test.each | 3 entity version-update cases PASS | — |

Các finding IDs tra tại `../bug-reports/BASELINE-001.md`. Một case legacy có thể
chỉ liên quan một phần requirement; không tính thành coverage hoàn chỉnh.
