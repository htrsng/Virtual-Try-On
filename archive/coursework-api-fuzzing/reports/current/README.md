# Current QA evidence — 15/11/2026

Snapshot bổ sung sau baseline, không ghi đè bằng chứng cũ:

- `replay/`: 20 testcase FAIL, một representative mỗi testcase, 2 lượt trên state mới;
  40 lượt tái hiện. Input report SHA và source manifest được kiểm tra trước execution.
- `frontend/`: 14 component checks đạt; typecheck/lint fail; bundle NOT_RUN.
  Phạm vi và source hashes nằm trong report; JUnit và log được giữ cùng snapshot.
- `reporting-regression.txt`: 9 test contract reporting/replay đạt.
- `quality-schema-regression.txt`: 4 test bảo vệ ý nghĩa schema advisory đạt.
- `fuzz-quality/report.json`: campaign 28 mutation HTTP, seed 7, mọi input được ghi;
  tỷ lệ schema advisory khác với tính hợp lệ nghiệp vụ đầy đủ.
- `snapshot-sha256.json`: hash các artifact chọn lọc; README chỉ giải thích scope.

Chạy trên Windows/Python 3.13.2/Node 22.15.0 trong workspace. Frontend cần chạy
ngoài sandbox do esbuild/worker spawn; đây không phải kết quả GitHub Actions.
Mã nguồn được hash theo từng suite, không coi commit nền là bằng chứng worktree sạch.

Các đường dẫn tuyệt đối trong report thuộc máy lúc thực thi. Để xem, dùng
[Evidence index](../../qa/evidence-index.md); để chạy lại, dùng output mới theo README.
Không suy ra API production, WebGL/E2E hoặc toàn bộ frontend đã đạt kiểm thử.
