# Stored-state oracles v1 — 15/11/2026

Đợt này sửa độ tin cậy của harness/oracle, **không sửa routes hoặc models của target**.
Baseline và snapshot giai đoạn trước được giữ nguyên. API/replay ở đây dùng contract
`http-and-stored-state-v1`; xem [quy tắc](../../qa/state-oracle-contract.md).

## Kết quả đã chạy

| Kiểm tra | Kết quả | Bằng chứng |
|---|---|---|
| Regression fuzz-tool/oracle/harness | 55/55 đạt: 34 test trước đó + 16 oracle + 5 integration mới | [Log](fuzz-regression.txt) |
| Reporting/replay regression | 9/9 đạt | [Log](reporting-regression.txt) |
| Acceptance mới | 51 scenario: 19 PASS / 32 FAIL, 0 ERROR/NOT_RUN | [Report](api/report.md), [JUnit](api/junit.xml) |
| Testcase tổng hợp | 29 ca: 9 PASS / 20 FAIL | [Traceability](api/report.json) |
| Replay cùng phiên bản nguồn | 20 testcase FAIL × 2 lượt, 40 lượt tái hiện | [Report](replay/report.md) |
| So sánh kết quả nghiệp vụ | Không scenario nào đổi PASS/FAIL so với baseline | [Comparison](comparison.json) |

Acceptance exit 1 là kết quả đúng vì target còn vi phạm yêu cầu. Replay exit 0
nghĩa vi phạm tái hiện, không phải đã sửa. 52 mutation observation có snapshot
trước/sau, gồm cả bước setup trong chuỗi; không phải 52 testcase mới.

## Kiểm chứng điểm mù của oracle cũ

[Probe](old-oracle-probe.json) nạp riêng `oracles.py` từ commit `1d3468b` trong một
process Python và chạy 16 test mới: có **27 assertion failure tính cả subtest**,
không có lỗi runner. Các failure được kỳ vọng để chỉ ra false-green của oracle cũ;
không phải số lỗi ứng dụng. [Log chi tiết](old-oracle-probe.txt).

Test tích hợp dùng faulty app riêng trong `fuzz-testing/tests/fixtures/` để kiểm tra
“ghi dữ liệu rồi trả 4xx”. Fixture không được API acceptance hay fuzz campaign load.

## Môi trường và nguồn

Windows, Python 3.13.2, Node.js 22.15.0. Bộ regression đầy đủ chạy ngoài sandbox
để tránh lỗi ACL thư mục tạm đã biết. API và replay chạy cùng mã trong workspace.
CI vẫn cấu hình Python 3.12/Node 24; chưa xác nhận workflow remote cho đợt này.

`git_commit` trong API report là commit nền `1d3468b` trước khi commit thay đổi mới,
không phải worktree sạch khi chạy. Source hash trong report xác định mã đã dùng;
[comparison](comparison.json) ghi khác biệt với baseline. Artifact hashes nằm trong
[manifest](snapshot-sha256.json). Các đường dẫn tuyệt đối thuộc máy lúc chạy.

## Lệnh tái hiện từ repo root

```sh
python -m unittest discover -s fuzz-testing/tests -p "test_*.py"
python api-testing/run_suite.py --suite full --output reports/runs/state-demo-api
python api-testing/replay_failures.py --report reports/runs/state-demo-api/report.json --repeats 2 --output reports/runs/state-demo-replay
```

Chạy riêng các lệnh vì acceptance có thể exit 1. Output phải mới; không ghi đè
bằng chứng. Replay từ baseline cũ trên mã mới sẽ từ chối hash lệch, đúng thiết kế.
Chưa có bản sửa target hoặc retest sau sửa; mọi bug ứng dụng vẫn OPEN.
