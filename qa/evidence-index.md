# Evidence index

## Hiện hành cho QA portfolio

| Bằng chứng | Phiên bản / nguồn | Cách dùng |
|---|---|---|
| [State-oracle v1](../reports/state-oracles-v1/README.md) | Đợt hiện hành cho API/oracle/replay; contract stored-state-v1 | 55 regression đạt, 51 scenario, 40 replay, đối chiếu baseline và source hash |
| [State-v1 source/artifact hashes](../reports/state-oracles-v1/snapshot-sha256.json) | Snapshot mới, không ghi đè các giai đoạn trước | Integrity; không đồng nghĩa mọi lỗi target đã sửa |
| [API baseline](../reports/baseline/api/report.json) | 15/11/2026, hash source trong JSON | 29 testcase / 51 scenario; mỗi scenario có file evidence |
| [Baseline summary](../reports/baseline/README.md) | Trước khi mở rộng component/replay | 14 unit, 34 regression fuzz tool; 4 reporting test tại thời điểm đó |
| [Replay mới](../reports/current/replay/report.json) | 15/11/2026; input report và source hash được kiểm tra | 20 testcase FAIL × 2; 40 bằng chứng state sạch |
| [Frontend verification](../reports/current/frontend/report.json) | 15/11/2026; hash frontend/config/test trong report | Component và diagnostic build/lint tách riêng |
| [Regression reporting/replay mới](../reports/current/reporting-regression.txt) | 9 test sau bổ sung replay guard | Không dùng số 4 của baseline làm số hiện hành |
| [Quality schema contract](../reports/current/quality-schema-regression.txt) | 4 test cho phép phân loại advisory | Không phải acceptance testcase mới |
| [Fuzz quality mới](../reports/current/fuzz-quality/report.json) | 28 mutation HTTP, seed 7 | Mọi input, tỷ lệ schema advisory, status, oracle và thời gian |
| [Snapshot hashes](../reports/current/snapshot-sha256.json) | Hash artifact mới | Kiểm tra tính toàn vẹn; không tự chứng minh coverage |
| [Defect register](defect-register.md) | Tổng hợp từ API/replay state-v1 | 20 FAIL testcase, 17 nhóm triage; không phải số bug độc lập |

## Lịch sử

`reports/baseline/` và `reports/current/` giữ phiên bản trước contract state-v1.
Frontend và fuzz-quality từ giai đoạn đó vẫn có scope/date/hash riêng; không tự gán
chúng cho mã đã đổi. API/replay mới ở `reports/state-oracles-v1/`. Việc hash cũ khác
code hiện tại là dự kiến; muốn replay trên checkout hiện tại phải tạo report mới.

- `fuzz-testing/evidence/legacy/`: snapshot giai đoạn cũ. Đường dẫn, mã nguồn và số
  liệu thuộc phiên bản đã ghi, không thay thế kết quả hiện hành.
- `fuzz-testing/evidence/current/`: tên `current` từ lần sửa cấu trúc trước khi làm
  QA portfolio; xem ngày/hash trong artifact, không mặc định mới nhất.
- `fuzz-testing/docs/verification.md`: có cả lần xác minh từ remote và lần merge;
  không cộng các số liệu của nhiều lần chạy.
- `archive/vfitai/doc/`: ảnh ứng dụng, chưa phải execution evidence cho manual suite.
- `reports/runs/`: output local bị Git bỏ qua, không coi là bằng chứng public nếu
  chưa chọn lọc đưa vào snapshot. Không ghi đè các thư mục có dữ liệu.

Snapshot giữ metadata/lệnh và đường dẫn lúc chạy; đường dẫn tuyệt đối trên máy cũ
có thể không mở được. Dùng liên kết tương đối của trang này và lệnh README để tái hiện.
