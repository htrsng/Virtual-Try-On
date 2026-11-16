# Baseline QA portfolio — 15/11/2026

Lần chạy: `reports/runs/portfolio-verified-20261115/`, bắt đầu từ repo tại commit
`414d49a` cùng các file portfolio mới chưa commit. Đây là commit nền, không phải
cam kết worktree sạch khi chạy. Hash từng file mã API/target nằm trong
[`api/report.json`](api/report.json); hash các artifact snapshot nằm trong
[`snapshot-sha256.json`](snapshot-sha256.json).

**Môi trường:** Windows, Python 3.13.2, Node.js 22.15.0; chạy ngoài sandbox để
Node có quyền spawn và Python tạo thư mục tạm. CI cấu hình Python 3.12/Node 24,
chưa xác nhận workflow remote cho thay đổi này trước khi push.

## Lệnh và kết quả

```sh
python tools/run_checks.py --suite full --output reports/runs/portfolio-verified-20261115
```

| Nhóm | Kết quả | Bằng chứng |
|---|---|---|
| Unit trên mã TypeScript ứng dụng | 14 PASS, 0 FAIL | [JUnit](unit-junit.xml) |
| Regression reporting | 4/4 đạt | [Log](reporting-regression.txt) |
| Regression công cụ fuzzing | 34/34 đạt | [Log](fuzz-tool-regression.txt) |
| API full — scenario | 51 thực thi: 19 PASS, 32 FAIL, 0 ERROR | [Report](api/report.md), [JUnit](api/junit.xml) |
| API full — testcase | 29 testcase: 9 PASS, 20 FAIL; 0 NOT_RUN | [JSON và source hash](api/report.json) |
| Fuzzing ngắn, có Z3 | Hoàn tất, exit 0; vẫn có quan sát vi phạm | [Summary](fuzz-summary.json), [log](fuzz-smoke.txt) |
| Manual/UI | 12 testcase thiết kế, NOT_RUN | [Catalogue](../../manual-testing/test-cases.md) |

Lệnh full trả **exit 1**, đúng contract vì acceptance target còn vi phạm yêu cầu.
Không có lỗi runner trong lần full này. Các bước được giữ trong
[`execution-summary.json`](execution-summary.json).

Smoke API được chạy riêng cùng phiên bản source:

```sh
python api-testing/run_suite.py --suite smoke --output reports/runs/portfolio-smoke-20261115
```

Bốn scenario TC-AUTH-5, TC-OS-5, TC-PRD-4 và TC-ORD-19 đều PASS, exit 0. Report
smoke đầy đủ chỉ lưu local; snapshot ở đây tập trung full suite.

## Cách đọc và tái hiện

Chọn một testcase trong report, chạy `api-testing/run_suite.py --suite full
--testcase <TC-ID>` với output mới. ID actor và timestamp có thể khác; so sánh
oracle và hành vi, không so sánh JSON byte-for-byte của các lần chạy.

File API giữ nguyên bằng chứng request/response và metadata của lần chạy. Các đường
dẫn tuyệt đối trong JSON/log chỉ vị trí local lúc chạy. Log `.log` được chép sang
`.txt` trong snapshot; log fuzzing bỏ dòng trống thừa cuối file, giữ nguyên nội dung đo.
Trường `log` của execution summary giữ tên gốc. `fuzz-summary`
là bản chọn lọc; bằng chứng concolic/coverage chi tiết vẫn trong thư mục lần chạy local.

Không cộng số unit test, regression, scenario, testcase và input fuzzing thành một
chỉ số coverage hoặc số lỗi độc lập. Ba bug report chỉ minh họa ba triệu chứng từ
full suite, chưa bao quát 20 testcase FAIL hoặc xác nhận mọi lỗi gốc.

Lần đầu chạy trong sandbox gặp `spawn EPERM` và `PermissionError`; không dùng kết
quả đó làm baseline. Không đổi assertion hoặc bỏ qua test để có lần chạy đạt.
