# Product scope and unfinished integrations

| Capability | Current behavior | Verification / next requirement |
| --- | --- | --- |
| Local auth/catalog/cart/COD/orders/admin | Implemented in the tested contract | UI/API/Mongo regression; role, totals, stock/coupon and persistence |
| Online payment | No provider; owner request503, unknown payment404; never fabricated success | Integrate an approved sandbox/provider and credentials before success-path cases |
| Social login | Disabled Google/Facebook controls with explicit explanation | Provider registration, callback and account-linking requirements not implemented |
| Password recovery | Explicitly unavailable; no clickable fake recovery flow | Specify verified delivery/token expiry/revocation flow before implementation |
| Gemini styling | Optional provider; deterministic fallback/error behavior | No live provider quality/availability claim; needs approved sandbox/key for external acceptance |
| Email delivery | Optional server integration | Delivery and recipient verification require approved sandbox; Not Run |
| 3D visual | Approved fixed Windows profile; Linux candidates captured independently | Review/approve each platform, repeat stability and detector before adding a gate |
| Accessibility/device acceptance | Automated audits, keyboard and CSS zoom are implemented | Human NVDA/VoiceOver, native zoom and physical phones remain pending |

No real provider secrets, account defaults, public reset endpoint or production
payment simulation is introduced to complete the portfolio.150 business cases is
not used as a reason to invent missing functionality or duplicate executions.
