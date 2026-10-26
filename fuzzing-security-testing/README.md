# Fuzzing cho hệ thống bán hàng mô phỏng

## Mục tiêu và luồng chính

Tìm hành vi bất thường bằng input sinh từ seed, sau đó chạy lại và khảo sát chi tiết:

```text
Trạng thái ban đầu + seed
          ↓
Blackbox: đột biến → gửi HTTP → lưu input bất thường
          ↓
Khảo sát coverage: chạy lại → thử lân cận → giữ input mở dòng mới
          ↓
Whitebox có giới hạn: trace totalAmount → phủ định nhánh → Z3 → xác nhận API
          ↓
Bằng chứng: input, response, loại lỗi, coverage và giới hạn
```

Đối tượng là `node_harness/`: Express với datastore trong bộ nhớ và dịch vụ mô phỏng.
Request thực sự được xử lý; không cần MongoDB hoặc server production.

## Cài đặt

```powershell
python -m pip install -r fuzzing-security-testing/requirements.txt
npm ci --prefix fuzzing-security-testing/node_harness
```

## Chạy một lệnh để demo luồng chính

Mở PowerShell tại thư mục gốc dự án:

```powershell
python fuzzing-security-testing/fuzzers/run_fuzzing.py --iterations 42 --iterations-per-case 8 --max-cases 2 --seed 7 --concolic
```

Mặc định mỗi lần chạy có thư mục riêng `results/fuzzing/<ID>/`:

- `blackbox/report.json`: các điểm input có triệu chứng.
- `whitebox/report.json` và `whitebox/evidence/`: chạy lại, lân cận, coverage.
- `report.json`: tổng hợp các bước đã chọn. Nếu không có ứng viên phù hợp cho khảo sát coverage, mục whitebox_status ghi SKIPPED_NO_CANDIDATE; không suy ra hệ thống an toàn. Concolic là bước tùy chọn riêng.
- Khi có `--concolic`: `concolic/report.md`, `report.json` và `evidence/` lưu trace nhánh totalAmount, công thức Z3, model, input xác nhận và replay. Đây là bước whitebox có giới hạn, chạy riêng từ seed đơn hợp lệ; không tự chuyển toàn bộ trạng thái blackbox sang symbolic executor.

Phân biệt kỹ thuật: chế độ cũ trong `whitebox_fuzzer.py` là coverage-guided/greybox. Whitebox theo bài giảng dùng `--concolic`: mô hình kiểu thủ công, trace nhánh thực trong `OrderModel.save`/`castNumberOrThrow`, phủ định tiền tố và Z3. Không tự symbolic JavaScript, không có sanitizer và không tuyên bố toàn bộ hệ thống đã được kiểm chứng. Hướng dẫn trình bày và giới hạn chi tiết: [TRINH_BAY_TIEN_DO.md](TRINH_BAY_TIEN_DO.md).

Chạy riêng whitebox Z3:

```powershell
python fuzzing-security-testing/fuzzers/whitebox_fuzzer.py --concolic --iterations-per-target 12
```

Có thể thêm `--output <thư_mục_mới>` để chọn nơi lưu. Input login chưa thuộc các target khảo sát whitebox; danh sách chuyển giao bị giới hạn bởi target được hỗ trợ và max-cases.

## Chạy riêng để quan sát hai giai đoạn

```powershell
python fuzzing-security-testing/fuzzers/blackbox_fuzzer.py --iterations 100 --seed 7 --output fuzzing-security-testing/results/demo/blackbox
python fuzzing-security-testing/fuzzers/whitebox_fuzzer.py --blackbox-report fuzzing-security-testing/results/demo/blackbox/report.json --iterations-per-target 12 --max-cases 6 --seed 7 --output fuzzing-security-testing/results/demo/whitebox
```

Muốn mở môi trường ở PowerShell riêng, chạy `node fuzzing-security-testing/node_harness/http_server.js`, rồi thêm `--base-url http://127.0.0.1:5050` vào lệnh blackbox hoặc run_fuzzing. Không chỉ định URL thì tự mở/đóng harness.

## Những file cần trình bày

Chuẩn bị phần hỏi đáp theo từng testcase: [Sổ tay testcase và nghiệp vụ](SO_TAY_TESTCASE_VA_NGHIEP_VU.md). Tài liệu này giải thích luồng, nhóm lỗi và giới hạn bằng chứng; không gán kết quả đã chạy cho các testcase ngoài campaign.

| File trong fuzzers/ | Vai trò |
|---|---|
| run_fuzzing.py | Điều phối luồng chính bằng một lệnh |
| blackbox_fuzzer.py | Khám phá input bất thường qua HTTP |
| whitebox_fuzzer.py | Khảo sát coverage; CLI whitebox Z3 bằng --concolic |
| concolic.py | Trace → tiền tố điều kiện → Z3 → xác nhận nhánh API |
| fuzzer_common.py | Mutation và oracle response dùng chung |
| finding_types.py | Phân loại bằng chứng và mẫu lân cận |
| runtime.py | Tiến trình, timeout và file kết quả |

## Đặc tả và kiểm tra bổ trợ

Năm Excel trong `BaoCaoATPM/` giữ đủ 10 sheet theo cấu trúc cũ và 104 testcase: login 19, tạo đơn 21, trạng thái đơn 22, người dùng 21, sản phẩm 21. Giữ nguyên ID và các cột; nội dung testcase đã được chỉnh về an toàn phần mềm. Thứ tự trình bày: API an toàn đầu vào/quyền/trạng thái → tái hiện và phân loại bằng chứng → mẫu ngoại lệ/bộ nhớ độc lập → concurrency/timing/số học → seed đối chứng; trong mỗi nhóm ưu tiên HIGH → MEDIUM → LOW. Các sheet mô hình được giữ nguyên, không đồng nghĩa đã được kiểm chứng lại.

`KetQuaMongDoi` mô tả điều kiện an toàn, không chứa kết luận thực nghiệm cũ. HTTP 500 không tự chứng minh crash; timeout chưa chứng minh hang; mẫu lỗi bộ nhớ cần chẩn đoán công cụ. Mô hình số học không mặc định SAT. Các điều kiện bổ sung trong Excel là mục tiêu kiểm tra, chưa được oracle hiện tại tự động bao phủ đầy đủ. Report Word/PDF và dữ liệu đã lưu trước lần chỉnh này cần được đọc theo snapshot tại thời điểm chạy, không coi là kết quả xác minh toàn bộ nội dung mới.

Code hiện có kịch bản cho 29 testcase API: login 5, tạo đơn 8, trạng thái đơn 6, người dùng 5, sản phẩm 5. Campaign ghi riêng 75 testcase còn lại trong `excluded_testcases.json` với lý do chưa thực thi ở campaign API; không gán PASS/FAIL cho chúng. Việc khôi phục Excel không khôi phục các công cụ CTL/SMT hoặc bộ chạy bổ sung đã bỏ trước đó.

`testcases.py`, `oracles.py`, `spec_campaign.py` dùng để đối chiếu yêu cầu và kiểm tra oracle, không phải luồng demo chính. Khi cần kiểm thử theo đặc tả:

```powershell
python fuzzing-security-testing/fuzzers/run_ch4.py --seed 7 --fuzz-cases 8
python -m unittest discover -s fuzzing-security-testing/tests -p "test_*.py"
```

`controlled_comparison.py` là thực nghiệm bổ trợ so sánh chiến lược với cùng điều kiện. `supporting-analysis/tools/` chỉ giữ công cụ tạo báo cáo API và tái hiện FAIL. Đã bỏ bộ kiểm chứng mô hình, mẫu native và các công cụ thêm testcase phụ.

## Cách đọc kết quả

- Finding: vi phạm oracle nghiệp vụ/bảo mật, chưa phải số lỗi gốc độc lập.
- HTTP 5xx: lỗi phản hồi ứng dụng, không tự chứng minh process crash.
- TIMEOUT: nghi vấn hang; cần loại trừ setup/kết nối và kiểm tra tiến trình.
- Coverage mới giúp chọn input, không đồng nghĩa có lỗi.
- Lân cận chỉ là các điểm khảo sát, chưa chứng minh biên đầy đủ.
- Chưa có sanitizer xác nhận memory corruption runtime của ứng dụng Node.js.
- Blackbox giữ trạng thái; whitebox dùng Node mới. Chưa tự khôi phục mọi chuỗi thao tác trước đó.

Bằng chứng theo từng phiên bản (snapshot và mã băm thuộc lần chạy tương ứng):

- `results/api_core_29/`: 29 testcase, 9 PASS và 20 FAIL; 59 lượt thực thi, không có ERROR.
- `results/api_fuzz_29/`: luồng blackbox → whitebox với 21 và 16 input; đây là lượt demo nhỏ, không dùng để kết luận chiến lược nào tốt hơn.
- Bộ kiểm tra hồi quy hiện tại: 28 test đều đạt, gồm xác nhận mô hình với 8 đại diện input qua API.

Bằng chứng demo mới: `results/demo_chuong4_final/` gồm blackbox, khảo sát coverage và concolic; đọc riêng số liệu từng giai đoạn, không cộng thành số lỗi gốc. `results/spec_safety_current/` là campaign theo Excel hiện tại, tách 29 testcase API có kịch bản và 75 testcase ngoài campaign.

Sau lần đồng bộ Excel với concolic, snapshot và kết quả tương ứng nằm tại `results/spec_excel_aligned/`; `spec_safety_current/` giữ bằng chứng của phiên bản đặc tả trước đó. Trong Excel, `ThongTin` ghi phạm vi tự động hóa từng module; TC-ORD-3/4 mô tả riêng phần API và concolic, còn TC-ORD-20 phân biệt khảo sát coverage với symbolic execution. Các sheet mô hình hình thức giữ nguyên; không suy ra chúng đã được công cụ hiện tại kiểm chứng.

Kết quả cũ đã chuyển vào bản sao lưu `BaoCaoATPM/SaoLuu_TruocLamRo/`. Các kết quả là bằng chứng theo phiên bản có mã băm ghi kèm. Không gán các số liệu lịch sử cho lần chạy hoặc cấu hình mới. Báo cáo Word cần đọc cùng giới hạn này.
# Bổ sung khoanh biên thực nghiệm

Luồng `run_fuzzing.py` đã bổ sung khảo sát biên qua HTTP và kiểm tra chi tiết trong miền tìm được. Xem [hướng dẫn chạy và đọc kết quả](HUONG_DAN_KHOANH_BIEN.md). Phạm vi: số nguyên, độ dài ký tự Unicode; các điểm chưa đo không được coi là đã xác nhận. Concolic Z3 vẫn là bước riêng.

