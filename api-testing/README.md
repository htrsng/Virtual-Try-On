# Deterministic API acceptance testing

Chạy kịch bản cố định theo đặc tả, không mutation: **29 testcase / 51 scenario**.
Tận dụng `testcases.py`, oracle và Express harness hiện có trong `fuzz-testing/`;
không sao chép backend. Mỗi scenario mở Node mới để reset datastore và actor giả.

Từ repo root sau khi cài dependency theo README:

```sh
python api-testing/run_suite.py --suite smoke
python api-testing/run_suite.py --suite full
python api-testing/run_suite.py --suite full --testcase TC-USR-2
```

Smoke chọn TC-AUTH-5, TC-ORD-19, TC-OS-5, TC-PRD-4: token role, đơn hợp lệ,
thông báo chuyển trạng thái và product không tồn tại. Đây là bốn đối chứng, không
phải toàn bộ nghiệp vụ đã đạt. Full suite kiểm tra cả các hành vi hiện đang có lỗi.

Mặc định report vào `reports/runs/api-<id>/`. Có thể dùng `--output <thư_mục_mới>`;
runner từ chối ghi đè thư mục có bằng chứng. Report gồm JSON, Markdown, JUnit XML,
response/state đã đo, source hash, môi trường, traceability và số scenario chưa chạy.
Token đăng nhập được harness redact trước khi lưu.

Exit **0**: tất cả ca đã chọn PASS; **1**: có vi phạm oracle; **2**: runner/setup lỗi
hoặc có ca chưa thực thi. Target cố ý được giữ nguyên để tái hiện lỗi: full suite
có FAIL là kết quả kiểm thử, không được sửa assertion để biến thành PASS.

[Testcase catalogue](test-cases.csv) được xuất từ Excel bằng
`python tools/export_api_catalog.py`. Cột `ExecutableOracles` là phạm vi thực sự
được runner đánh giá; phần mô tả Excel rộng hơn chưa được coi là đã kiểm chứng hết.
Test reporting tại `api-testing/tests/` bảo vệ exit code và phân loại JUnit.

## Replay → regression

```sh
python api-testing/replay_failures.py --repeats 2 --output reports/runs/replay-demo
```

Chọn một scenario FAIL đại diện cho mỗi testcase, kiểm tra hash nguồn và workbook,
reset Node cho từng lượt rồi dùng lại oracle. `--testcase TC-USR-2` chọn một ca;
nguồn mặc định là baseline portfolio, có thể dùng `--report <API report mới>`.
Output có dữ liệu sẽ bị từ chối; source đổi phải chạy acceptance mới, không bypass hash.

Exit replay 0 nghĩa mọi lỗi đã chọn tái hiện, 1 nghĩa có NOT_REPRODUCED cần khảo sát,
2 là lỗi setup/manifest/runner. Không coi NOT_REPRODUCED là FIXED. Scenario cố định
đã có trong full suite nhưng còn FAIL; chưa xác minh bản sửa target.
[Tracking 20 testcase](../qa/defect-register.md) · [Replay hiện hành](../reports/current/replay/report.md).
