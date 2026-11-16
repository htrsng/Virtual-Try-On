# QA Overview — VFitAI

Trang dành cho reviewer CV: xem phạm vi → kết quả → testcase → lỗi → bằng chứng.
Dự án kiểm thử dùng API Express mô phỏng và một phần logic/component ứng dụng
VFitAI gốc. **Frontend và target API chưa tích hợp thành hệ thống E2E hoàn chỉnh.**

| Điểm cần xem | Tài liệu |
|---|---|
| Mục tiêu, rủi ro và môi trường | [Test plan](test-plan.md) |
| Toàn bộ 29 API case và 105 ca ngoài phạm vi | [Coverage Matrix](test-coverage.md) |
| Phân biệt test công cụ, acceptance và frontend | [Test execution](test-execution.md) |
| 20 testcase FAIL, phân nhóm sơ bộ, replay và regression | [Defect register](defect-register.md) |
| Báo cáo hiện hành so với tài liệu lịch sử | [Evidence index](evidence-index.md) |
| Component scope, lỗi build/lint và CI | [Frontend quality](frontend-quality.md) |
| Chất lượng và giới hạn phép đo fuzzing | [Fuzzing quality](fuzzing-quality.md) |
| Dữ liệu trước/sau và chống false-green | [Stored-state oracle v1](state-oracle-contract.md) |

## Các kết quả không được gộp

- **55/55**: regression công cụ/oracle/snapshot, gồm 34 test cũ và 21 test mới; không phải nghiệp vụ ứng dụng đạt.
- **29 API testcase / 51 scenario:** 9 testcase PASS, 20 FAIL; tương ứng 19 scenario
  PASS, 32 FAIL; không có ERROR/NOT_RUN trong baseline.
- **20/20 FAIL testcase tái hiện:** hai lượt trên một scenario đại diện mỗi testcase,
  40 lượt FAIL. Không xác nhận mọi input hoặc số lỗi gốc độc lập.
- **14 unit logic + 14 component checks:** hai suite và hai phạm vi riêng.
- **12 manual UI case:** thiết kế, NOT_RUN; 105 ca Excel ngoài API campaign.

## Demo trong vài phút

Sau khi cài dependency ở [README](../README.md):

```sh
python tools/run_checks.py --suite smoke
python api-testing/run_suite.py --suite full --testcase TC-USR-2 --output reports/runs/demo-acceptance
python api-testing/replay_failures.py --report reports/runs/demo-acceptance/report.json --repeats 2 --output reports/runs/demo-replay
```

Lệnh API trên cần trả exit 1 vì oracle nghiệp vụ FAIL. Lệnh replay trả 0 khi lỗi
tái hiện đúng; không có nghĩa bug đã được sửa. Dùng output mới cho mỗi lần chạy.
Đổi source phải tạo campaign mới; replay từ chối hash lệch, không có tùy chọn bypass.
Lệnh API exit 1 là kết quả mong đợi của demo; chạy lệnh replay tiếp theo riêng,
không nối bằng `&&` khiến shell bỏ qua replay. Baseline cũ có thể lệch hash do
source hoặc line ending của checkout; dùng report mới từ chính môi trường đang chạy.

[Năm bug report chi tiết](../bug-reports/README.md) · [Mẫu CV](../docs/cv.md).

Lần chạy API/replay hiện hành: [state-oracles-v1](../reports/state-oracles-v1/README.md).
Baseline trước nâng cấp được giữ nguyên. Replay từ report cũ trên code mới phải
từ chối source hash lệch; demo trên tạo report mới trước khi replay.
