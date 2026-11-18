# Bug reports

Five detailed reports document symptoms observed on the simulated API. All are **OPEN**. The [defect register](../qa/defect-register.md) tracks all 20 failing cases, provisional groupings, expected and actual behavior, replay evidence, regression scenarios, and fix status.

| Bug ID | Observed behavior | Proposed severity | Test case | Status |
| --- | --- | --- | --- | --- |
| [BUG-001](BUG-001-role-escalation.md) | API accepted an unauthorized administrator role change | High | TC-USR-2 | OPEN |
| [BUG-002](BUG-002-order-total.md) | API accepted an incorrect client-supplied order total | High | TC-ORD-18 | OPEN |
| [BUG-003](BUG-003-user-authorization.md) | API allowed an unauthorized account update | High | TC-USR-1 | OPEN |
| [BUG-004](BUG-004-terminal-order-state.md) | A canceled order could transition to shipping | High | TC-OS-21 | OPEN |
| [BUG-005](BUG-005-plaintext-password.md) | Updated passwords were stored in plaintext | High | TC-USR-4 | OPEN |

Severity reflects impact in the simulated business model. The target remains at the observed revision. After a fix, rerun the same case and oracle, save the result, and verify related data and permissions before closing the report.
