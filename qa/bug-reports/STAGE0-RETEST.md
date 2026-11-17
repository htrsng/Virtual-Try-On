# Stage 0 retest / triage register

Source `3d61097`, clone local sạch, 16/11/2026. Không thay đổi trạng thái lịch sử
trong `BASELINE-001.md`; đây là run mới, không phải retest business fixes.

| ID | Kết quả lần này | Phân loại / bước tiếp |
|---|---|---|
| QA-BL-001 | Tái hiện 112 TypeScript diagnostics | Application Defect; OPEN |
| QA-BL-002 | Tái hiện 210 errors, 14 warnings | Application/config debt; OPEN |
| QA-BL-003 | Tái hiện `useGLTF.preload`; 14 tests khác Pass | Test Defect; OPEN |
| QA-BL-004 | Diagnostic glob: 10 Pass/6 Fail; auth không parse | Test Defect/contract cần triage; OPEN |
| QA-BL-005 | Chromium đã cài; 3 specs launch và Pass với config cô lập | Environment Issue RESOLVED trên máy này; chưa xác minh CI |
| QA-BL-006 | 3 specs Pass trên database không có product/user fixtures | Test Defect; conditional steps vẫn tồn tại, OPEN; không tính là checkout coverage |
| QA-BL-007 | Không gọi route destructive; chưa có negative RBAC run | Review pending; không kết luận vulnerability |
| QA-S0-008 | Jest nguyên config: `No tests found` tại clone Windows; glob tương đối collect được 7 suites | Test config / P1; OPEN. Repro: chạy `qa-baseline.cjs` trên clean clone, sau đó diagnostic trong setup guide |

Startup còn warning duplicate schema index và email verify thiếu credentials;
MongoDB vẫn connected, API/UI/proxy HTTP 200. Email/Gemini là integration ngoài
phạm vi baseline, **Blocked/Not verified**, không ghi Pass. Thông báo server ghi
“MongoDB Atlas” dù kết nối localhost là log chưa chính xác, không phải bằng chứng
đã kết nối Atlas. Không thêm credentials để làm sạch log.
