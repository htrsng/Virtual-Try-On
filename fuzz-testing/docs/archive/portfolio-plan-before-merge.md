# Kế hoạch nâng cấp fuzz testing cho VFitAI

## Cấu trúc hiện tại

```text
fuzz-testing/
├── README.md
├── requirements.txt
├── fuzzers/                 # Runner, mutation, oracle, coverage và concolic
├── node_harness/            # Express target, datastore và dịch vụ mô phỏng
├── seeds/                   # JSON hợp lệ làm điểm xuất phát
├── tests/                   # Regression test cho chính công cụ fuzzing
├── reports/                 # Bằng chứng theo từng campaign
├── docs/                    # Kế hoạch và hướng dẫn phát triển
├── supporting-analysis/     # Công cụ tạo báo cáo và replay
└── BaoCaoATPM/              # Đặc tả Excel, báo cáo và tài liệu học phần
```

Module này nằm ngang hàng với `client/` và `tests/` ở gốc repo. `tests/`
ở gốc chứa Playwright E2E; `fuzz-testing/tests/` kiểm tra công cụ fuzzing.
Workspace hiện không có `server/`, `manual-testing/`, `api-testing/` hay
`automation-testing/`; không tạo các thư mục đó chỉ để khớp một template.

Python điều phối campaign, Node.js chạy target. Giữ nền tảng hiện có để tận dụng
mutation, coverage và Z3. Chưa thêm fast-check hoặc một bộ runner JavaScript thứ hai.

## Ánh xạ với cấu trúc generators / suites / oracles

| Trách nhiệm | Mã hiện tại | Hướng tách khi refactor |
|---|---|---|
| Sinh input | `fuzzers/fuzzer_common.py`: `mutate_json`, `DICTIONARY` | `generators/` theo auth, order, product |
| Oracle response | Các hàm `check_*` trong `fuzzer_common.py` | `oracles/` theo nghiệp vụ |
| Oracle đặc tả | `fuzzers/oracles.py` | Giữ riêng với oracle response |
| Kịch bản | `testcases.py`, `spec_campaign.py`, các runner | `suites/` theo auth, order, user, product, workflow |
| Dữ liệu hợp lệ | `seeds/*.json`, dữ liệu mô phỏng trong harness | Dùng lại; chỉ thêm `fixtures/` khi có nhu cầu tách dữ liệu setup |
| Kết quả | `reports/<campaign>/` | Tách finding, replay và input tối giản trong mỗi campaign |

Các thư mục ở cột cuối là thiết kế bước tiếp theo, chưa được tạo. Khi tách mã,
duy trì CLI và kiểm tra import trước khi chuyển từng nhóm. Không dùng tên
appointment/patient/doctor của ví dụ phòng khám cho nghiệp vụ VFitAI.

## Thứ tự triển khai

1. **Foundation:** khôi phục hoặc thay thế dependency `server/concurrency` còn thiếu;
   đối chiếu 29 testcase API và số testcase ngoài campaign với workbook thực tế;
   xử lý lỗi quyền thư mục tạm; cập nhật CI theo cấu trúc repo thực tế.
   Hoàn thành khi harness khởi động và bộ test công cụ chạy thành công.
2. **Business fuzzing:** ưu tiên auth, tạo đơn, trạng thái đơn, cập nhật user và
   sản phẩm. Kiểm tra dữ liệu sau request, tổng tiền từ catalog, quyền truy cập
   và chuyển trạng thái; bổ sung chuỗi thao tác với trạng thái khởi đầu rõ ràng.
3. **Regression & reporting:** lưu seed, input, auth context và chuỗi thao tác;
   replay trên dữ liệu sạch; thu nhỏ input mà vẫn giữ cùng vi phạm oracle;
   gom triệu chứng, xác minh lỗi gốc và gắn Bug ID. Với mỗi lỗi đã sửa, giữ regression test.
4. **CI & portfolio:** campaign ngắn có seed cố định, timeout và artifact trên PR;
   campaign dài chạy riêng với nhiều seed. Báo cáo throughput, coverage đúng phạm vi,
   thời gian phát hiện và tỷ lệ replay. README có lệnh demo và bằng chứng đối chiếu
   target chứa lỗi với target đã sửa.

## Quy ước bằng chứng

- Chạy local/test với dữ liệu giả và ngân sách hữu hạn.
- `seeds/` chứa payload khởi đầu; random seed là tham số `--seed`, được lưu trong report.
- Mỗi campaign mới dùng thư mục riêng; không ghi đè snapshot dùng cho báo cáo cũ.
- Snapshot trong `reports/` và `BaoCaoATPM/` được giữ nguyên nội dung khi đổi cấu trúc.
  Chúng có thể chứa đường dẫn `fuzzing-security-testing/results/` hoặc
  `seed_corpus/` của phiên bản cũ. Đường dẫn tương ứng hiện là
  `fuzz-testing/reports/` và `seeds/`. Hash nguồn cũ không chứng nhận phiên bản mới;
  cần campaign mới trước khi công bố số liệu mới.
- Finding là lượt vi phạm oracle, chưa phải số lỗi gốc. HTTP 5xx không tự chứng minh
  process crash; line coverage không phải branch coverage.
- Concolic hiện giới hạn ở các kiểu đại diện của `totalAmount`; kết luận chỉ áp dụng
  cho harness mô phỏng, chưa đại diện cho backend production.

## Kiểm tra ban đầu trước khi đổi cấu trúc

`python -m unittest discover -s fuzzing-security-testing/tests -p "test_*.py"`:
34 test, 31 thành công, 1 failure và 2 error. Các vấn đề quan sát được:
workbook trả về 105 testcase ngoài campaign trong khi test kỳ vọng 75;
thiếu `../../server/concurrency`; `PermissionError` trong `.runtime`.
Đây là baseline để đối chiếu, chưa phải kết quả fuzzing mới.
