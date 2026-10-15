# Fuzzing cho hệ thống bán hàng trong môi trường mô phỏng

Trước khi đưa dự án lên GitHub, xem [CHUAN_BI_GITHUB.md](CHUAN_BI_GITHUB.md)
về cấu hình cục bộ, bằng chứng cần giữ và phiên bản mã băm kết quả.

Đối tượng thực nghiệm là ứng dụng Express trong `node_harness/`, với datastore
trong bộ nhớ và dịch vụ mô phỏng. Bộ chạy chính không khởi động server thật,
không kết nối MongoDB và không dùng dữ liệu người dùng thật. Request được thực
thi qua Supertest; kết quả có giá trị trong phạm vi hành vi mà harness mô phỏng.

## Luồng chính

Đặc tả/ràng buộc Excel → testcase và mutation → node_harness → oracle → báo cáo.

| File trong `fuzzers/` | Vai trò |
|---|---|
| `run_ch4.py` | Một lệnh chạy campaign và tạo báo cáo |
| `spec_campaign.py` | Đọc đặc tả, điều phối scenario, lưu bằng chứng |
| `testcases.py` | Seed, kịch bản API, giá trị biên và dữ liệu sinh thêm |
| `oracles.py` | Đánh giá đúng/sai từ response và dữ liệu trong harness |
| `fuzzer_common.py` | Mutation JSON và oracle dùng chung cho các fuzzer |
| `runtime.py` | Gọi Node, kiểm tra giao thức kết quả, ghi JSON và quản lý tiến trình |
| `blackbox_fuzzer.py` | Tự mở HTTP harness riêng trên loopback rồi fuzz response |
| `whitebox_fuzzer.py` | Chọn input theo coverage dòng của harness |
| `controlled_comparison.py` | So sánh baseline và coverage feedback cùng điều kiện |

Phần hỗ trợ được đặt ngoài `fuzzers/`:

- `supporting-analysis/tools/build_report.py`: tạo bản thảo từ kết quả được chọn.
- `tests/test_campaign.py`: kiểm tra hồi quy bộ công cụ.

File sinh báo cáo không phải thuật toán fuzzing. Giữ nó ngoài thư mục chính
để tiện tổng hợp kết quả khi viết báo cáo; `run_ch4.py` vẫn gọi được công cụ này.

## Cài đặt và chạy

Yêu cầu Python 3.10+, Node.js 20+.

```powershell
python -m pip install -r fuzzing-security-testing/requirements.txt
npm ci --prefix fuzzing-security-testing/node_harness

# Xem kế hoạch, không gửi request
python fuzzing-security-testing/fuzzers/run_ch4.py --audit-only

# Chạy các kịch bản API trong harness mô phỏng
python fuzzing-security-testing/fuzzers/run_ch4.py --seed 7 --fuzz-cases 8

# Thêm so sánh chiến lược chọn input (tốn thời gian hơn)
python fuzzing-security-testing/fuzzers/run_ch4.py --compare --iterations-per-target 8

# Tái hiện riêng một testcase; giữ kết quả lần chạy chính
python fuzzing-security-testing/fuzzers/spec_campaign.py --testcase TC-OS-3 --output fuzzing-security-testing/results/replay_order

python -m unittest discover -s fuzzing-security-testing/tests -p test_campaign.py
```

Chạy riêng từng phương pháp, với ngân sách nhỏ để kiểm tra:

```powershell
python fuzzing-security-testing/fuzzers/blackbox_fuzzer.py --iterations 21 --output fuzzing-security-testing/results/blackbox_check
python fuzzing-security-testing/fuzzers/whitebox_fuzzer.py --iterations-per-target 7 --output fuzzing-security-testing/results/whitebox_check
```

### Chạy bằng hai PowerShell như trước

Mở cả hai terminal tại thư mục gốc dự án. PowerShell 1 chạy môi trường mô phỏng:

```powershell
node fuzzing-security-testing/node_harness/http_server.js
```

PowerShell 2 chạy blackbox vào môi trường đó:

```powershell
python fuzzing-security-testing/fuzzers/blackbox_fuzzer.py --base-url http://127.0.0.1:5050 --iterations 100 --seed 7
```

Có thể dùng biến `TARGET_URL` thay cho `--base-url` như bản cũ. Blackbox kiểm tra
định danh harness trước khi fuzz và không đóng server do bạn mở. Nhấn Ctrl+C ở
PowerShell 1 để dừng; khởi động lại để đặt lại dữ liệu trong bộ nhớ.

Whitebox chạy như kiến trúc bản cũ: tự mở một tiến trình Node mới cho mỗi input
để đo coverage và cô lập dữ liệu; không gửi vào HTTP server của PowerShell 1:

```powershell
python fuzzing-security-testing/fuzzers/whitebox_fuzzer.py --iterations-per-target 20 --seed 7
```

### Khác biệt so với bản cũ trong Git

| Nội dung | Bản cũ | Bản hiện tại |
|---|---|---|
| Blackbox | Kết nối server qua `TARGET_URL` | Giữ cách chạy này qua `--base-url`/`TARGET_URL`; thêm tùy chọn tự mở harness khi không chỉ định URL |
| Whitebox | Node mới mỗi input, coverage, LIFO, energy=6 | Giữ cơ chế đó; dùng đúng ngân sách input |
| Setup | Một số bước dùng kết quả ngay dù setup có thể thất bại | Kiểm tra HTTP setup và token trước khi fuzz |
| Phân loại lỗi | Gom HTTP 500 và lỗi tiến trình vào crash | Tách HTTP 5xx, timeout và lỗi bộ chạy |
| Giá đơn hàng | Đối chiếu dữ liệu giá do client gửi | Có đối chiếu với giá danh mục trong harness |
| Lưu kết quả | Tên file cố định, có thể ghi đè lần trước | Mặc định mỗi lần chạy có thư mục riêng; ghi JSON qua file tạm |

Hai terminal giúp quan sát HTTP server và dữ liệu tồn tại qua nhiều request.
Độ thực tế của phép thử phụ thuộc hành vi được mô phỏng; số terminal không làm
datastore trong bộ nhớ trở thành MongoDB thật. `--audit-only` chỉ lập kế hoạch,
không khởi động môi trường và không thực thi request.

Khi không chỉ định `--base-url` hoặc `TARGET_URL`, blackbox tự khởi động
`node_harness/http_server.js` ở cổng ngẫu nhiên trên
`127.0.0.1`, giữ dữ liệu trong lần chạy rồi đóng tiến trình. Không cần tự mở
server hay cấu hình `TARGET_URL`. Whitebox mở một tiến trình mới cho mỗi input.
Hai kiểu cô lập khác nhau; không so sánh trực tiếp số lỗi giữa hai lần chạy này.
Dùng `--compare` để so sánh chiến lược chọn input trong cùng điều kiện cô lập.

Kết quả mặc định ở `results/sales_campaign/`: `spec_snapshot.json`,
`generated_cases.json`, `report.json`, `report.md` và `BaoCao_Fuzzing.md`.
Chọn `--output` khác để lưu riêng từng lần chạy. Khi chạy audit, các testcase
chưa thực thi ghi `NOT_RUN`; mới chạy một phần scenario thì ghi `PARTIAL`
(nếu chưa có FAIL/ERROR). Khi bộ chạy lỗi, ghi `ERROR`, không mặc định là lỗi
ứng dụng. Mã thoát 0 là chạy hoàn tất (vẫn có thể phát hiện FAIL); 2 là lỗi bộ chạy.

File tạm nằm trong `.runtime/`, được xóa sau mỗi job. JSON được ghi đầy đủ vào
file tạm trước khi thay file đích; không xóa kết quả cũ trước khi ghi. Chạy riêng
blackbox/whitebox không chỉ định output sẽ tạo thư mục kết quả có ID riêng.
Các fuzzer dùng `errors` để lưu HTTP 5xx, timeout và lỗi runner với loại riêng;
không gọi tất cả là crash. Kết quả được lưu riêng cho từng lần chạy.

## Phạm vi số liệu

### Bằng chứng cho 48 testcase

- `results/spec_completed_48/report.md`: tổng hợp 48 testcase/96 kịch bản.
- `results/spec_completed_48/KetQuaKiemThu.xlsx`: bảng kết quả riêng, không sửa đặc tả.
- `results/reproduced_48/report.md`: chạy lại hai lần một kịch bản FAIL đại diện mỗi testcase.
- `results/reproduced_48/PhanNhom_PhatHien.md`: nhóm dấu hiệu để điều tra, chưa phải số lỗi gốc.

Tái hiện từ đúng phiên bản code/workbook của campaign:

```powershell
python fuzzing-security-testing/supporting-analysis/tools/replay_failures.py --campaign fuzzing-security-testing/results/spec_completed_48/report.json --output fuzzing-security-testing/results/replay_new --repeats 2
```

Công cụ từ chối tái hiện nếu mã băm nguồn hoặc đặc tả đã đổi. Khi đó cần chạy
campaign mới trước, không dùng lại bằng chứng của phiên bản khác.

### Giới hạn kết luận

### Xác minh mô hình CTL/SMT và mã minh họa

Đây là bộ xác minh riêng của dự án theo quy tắc PDF, không phải `core.spec_pipeline`
gốc. Giữ kết quả mô hình tách khỏi campaign API:

```powershell
python -m pip install -r fuzzing-security-testing/supporting-analysis/requirements.txt
python -m unittest discover -s fuzzing-security-testing/tests -p "test_*.py"
python fuzzing-security-testing/supporting-analysis/tools/verify_spec_workbooks.py
```

Cần GCC có `-fanalyzer`. Kết quả ở `results/formal_verification/report.md` và
`report.json`, có phản ví dụ CTL, witness SMT, mã sinh và log compiler.
VALID nghĩa là cấu trúc đọc được, không có nghĩa mọi công thức CTL đều đúng.
Các workbook có nhiều trạng thái khởi tạo rời nhau: EF được kiểm tra tại tất cả
trạng thái khởi tạo nên có thể sai ở nhánh không nối tới cụm khóa.

### Phạm vi campaign API

- Luồng chính đối chiếu đủ 48 testcase API trong 5 workbook đặc tả. Có thể sinh nhiều
  scenario/input cho một testcase. PASS chỉ áp dụng các mẫu đã chạy.
- 50 testcase sinh mã C/Python/SMT được liệt kê trong `excluded_testcases.json`,
  không đưa vào số test đạt hay lỗi của hệ thống bán hàng mô phỏng.
- HTTP 500, timeout và lỗi tiến trình là các hiện tượng khác nhau. Không đếm
  từng input gây cùng lỗi thành một lỗ hổng độc lập.
- Coverage chỉ thuộc `node_harness/index.js`, có cả setup/khởi tạo; không phải
  coverage toàn ứng dụng thật. So sánh ngân sách nhỏ chỉ có tính thăm dò.
- Kết quả không chứng minh MongoDB thật, email, rate limiting, hiệu năng triển
  khai hoặc mọi thuộc tính CTL. Kết quả mô hình CTL/SMT được lưu riêng.

## Phần hỗ trợ ngoài luồng chính

`supporting-analysis/tools/` chứa công cụ tạo báo cáo, tái hiện FAIL và xác minh
workbook; `verification/ctl_checker.py` đánh giá CTL. `simulation_campaign.py`
cung cấp bộ dựng biểu thức Z3 và mẫu mã C dùng bởi bộ xác minh. Các công cụ lab,
mô hình JSON và báo cáo lịch sử không còn dùng đã được bỏ.
Không được tự cộng kết quả mô hình minh họa vào campaign API chính.
Z3 chỉ cần cho công cụ hỗ trợ, cài bằng `supporting-analysis/requirements.txt`.

Testcase được quản lý trong sheet `TestCase` của 5 workbook đặc tả tại `BaoCaoATPM/`.
Hai bộ Excel testcase riêng đã được gộp; `TestCases/` và `CapNhat_TestCase/`
đã được xóa. Nội dung bổ sung dùng định dạng của workbook gốc.
`results/` chỉ giữ 6 nhóm bằng chứng đang dùng: blackbox, whitebox,
spec_completed_48, reproduced_48, comparison_3seeds và formal_verification.
16 testcase bổ sung đã có kịch bản thực thi: version cũ/sai/mới nhất/không gửi,
bộ đếm từ giá trị khác 0, kiểm tra giá danh mục và trạng thái sau hủy. Mặc định
`--fuzz-cases 8` tạo 96 kịch bản cho 48 testcase API. Khi viết báo cáo, ghi rõ mô hình/harness và
giới hạn mô phỏng, kèm input và bằng chứng thực thi.
