# Test execution — các phạm vi tách riêng

| Suite / định nghĩa | Đã thực thi | PASS | FAIL | ERROR | NOT_RUN / ngoài phạm vi | Bằng chứng |
|---|---:|---:|---:|---:|---|---|
| Fuzz-tool regression | 34 | 34 | 0 | 0 | 0 | [baseline log](../reports/baseline/fuzz-tool-regression.txt) |
| API reporting/replay regression hiện hành | 9 | 9 | 0 | 0 | 0 | [current log](../reports/current/reporting-regression.txt) |
| Fuzz quality schema contract | 4 | 4 | 0 | 0 | 0 | [current log](../reports/current/quality-schema-regression.txt) |
| API scenario xác định | 51 | 19 | 32 | 0 | 0 | [API report](../reports/baseline/api/report.md) |
| API testcase tổng hợp từ scenario | 29 | 9 | 20 | 0 | 0 | [traceability](test-coverage.md) |
| Replay đại diện testcase FAIL | 40 lượt / 20 testcase | Không áp dụng | 40 lượt còn FAIL | 0 | Không replay mọi input | [replay report](../reports/current/replay/report.md) |
| Unit logic ứng dụng | 14 | 14 | 0 | 0 | 0 trong hai hàm đã chọn | [unit JUnit](../reports/baseline/unit-junit.xml) |
| Component ProductList/Toast | 14 | 14 | 0 | 0 | Test integration 3D ngoài scope | [component JUnit](../reports/current/frontend/components-junit.xml) |
| Manual UI | 0 | 0 | 0 | 0 | 12 NOT_RUN | [testcase](../manual-testing/test-cases.md) |
| Excel ngoài API campaign | 0 trong campaign này | Không gán | Không gán | Không gán | 105 ngoài phạm vi | [105 ID và lý do](excluded-testcases.csv) |

34 và 9 ở hai hàng regression là chất lượng bộ kiểm thử, không phải số ca nghiệp vụ
đạt. Hàng scenario và testcase là hai cách tổng hợp cùng một dữ liệu, không cộng nhau.
Không tính một tỷ lệ PASS chung cho toàn bảng.

## Defect triage và retest

20 testcase không đạt được phân thành **17 nhóm triệu chứng sơ bộ**, chưa xác định
số lỗi gốc độc lập. Tất cả còn OPEN; chưa sửa target; chưa có FIXED/CLOSED hoặc
retest sau sửa. Mỗi testcase có scenario regression cố định; hiện các scenario đó
vẫn FAIL theo oracle. Xem [defect register](defect-register.md).

Replay mới ngày 15/11/2026 kiểm tra hash source/workbook từ baseline, rồi mở Node
mới cho từng lượt. Kết luận REPRODUCED yêu cầu cả hai lượt đều FAIL theo cùng oracle.
HTTP, timestamp, ID mới có thể khác; không so sánh byte-for-byte hoặc quy thành lỗi gốc.

## Frontend diagnostics

Component suite đạt không xóa các lỗi ứng dụng cũ: **112 TypeScript diagnostic**,
**210 lint error, 14 warning**; bước Vite bundle **NOT_RUN** vì typecheck thất bại.
Đây là số diagnostic theo công cụ, chưa phải số bug độc lập.
[Log và giới hạn](frontend-quality.md). Chưa có kết quả GitHub Actions remote cho thay đổi này.
