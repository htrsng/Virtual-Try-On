# Trình bày tiến độ: fuzzing cho hệ thống bán hàng

Tra cứu khi được hỏi một testcase bất kỳ: [SO_TAY_TESTCASE_VA_NGHIEP_VU.md](SO_TAY_TESTCASE_VA_NGHIEP_VU.md). Sổ tay có 5 luồng nghiệp vụ, khung trả lời 6 ý và đủ 104 ID, kèm oracle và mức thực hiện thực tế.

## 1. Mở đầu — 30 giây

“Em áp dụng fuzzing để tìm input bất thường làm hệ thống bán hàng vi phạm điều kiện an toàn. Đối tượng hiện tại là API Express trong harness mô phỏng: request và code xử lý chạy thực, còn datastore/dịch vụ là test double. Em không suy kết quả này thành kết luận cho MongoDB hoặc production.”

Liên hệ Chương 1: bảo mật dữ liệu tài khoản (Confidentiality), chống sửa giá/nâng quyền/phá trạng thái đơn (Integrity, Authorization), xử lý input lỗi có kiểm soát (Availability). Không phải mọi lỗi chức năng đều là lỗ hổng; cần phân tích khả năng tác động đến tài sản và quyền.

## 2. Đặc tả và testcase — 45 giây

Mở một Excel, ví dụ `Module_Orders_Create_spec.xlsx`. Giới thiệu yêu cầu, ràng buộc, rồi `TC-ORD-3` và `TC-ORD-4`: thiếu tiền và tiền sai kiểu đi vào tầng lưu trữ.

- 5 workbook, đủ 10 sheet, tổng 104 testcase thiết kế.
- Campaign theo đặc tả hiện có code cho 29 testcase API, tạo 59 kịch bản với `fuzz-cases=8`.
- 75 testcase ngoài campaign này được ghi lý do trong `excluded_testcases.json`, không được coi là PASS.
- Các điều kiện an toàn bổ sung trong Excel chưa được mọi oracle tự động kiểm tra đầy đủ.
- Mẫu C/Python, số học, race/timing vẫn có trong tài liệu; chưa tuyên bố đã chạy đầy đủ hoặc đã xác nhận lỗi bộ nhớ.

Testcase mô tả mục tiêu; seed là input ban đầu; input đột biến là dữ liệu thực tế fuzzer tạo ra. Ba khái niệm này khác nhau.

Bản Excel đã đồng bộ concolic: mở `ThongTin` để chỉ phạm vi từng module; TC-ORD-3/4 có các bước Z3 riêng. Snapshot và kết quả campaign ứng với bản này nằm ở `results/spec_excel_aligned/`. Các kết quả ở thư mục khác vẫn thuộc phiên bản đã ghi trong snapshot của chúng.

## 3. Luồng fuzzing — 90 giây

```text
Seed JSON và trạng thái ban đầu
  → blackbox: mutation → HTTP → oracle → bằng chứng
  → khảo sát có coverage: replay → lân cận → chọn input mở thêm dòng

Seed đơn hàng hợp lệ, cô lập trường totalAmount
  → nhánh JavaScript được đo trực tiếp
  → tiền tố path condition → phủ định một nhánh → Z3
  → giải mã model thành JSON → gửi lại API → xác nhận tiền tố nhánh
  → chạy lại input vi phạm, lưu evidence
```

Phân biệt: bước khảo sát coverage là coverage-guided/greybox. Whitebox đúng nghĩa bài học nằm ở `--concolic`, có trace + điều kiện tượng trưng + SMT. Luồng này chưa tự phát hiện coverage plateau hoặc trao đổi corpus hai chiều như Driller.

## 4. Demo — 1–2 phút

Mở PowerShell ở thư mục gốc. Cài trước buổi trình bày:

```powershell
python -m pip install -r fuzzing-security-testing/requirements.txt
npm ci --prefix fuzzing-security-testing/node_harness
```

Chạy toàn luồng bằng một lệnh. Không cần server production hay MongoDB:

```powershell
python fuzzing-security-testing/fuzzers/run_fuzzing.py --iterations 42 --iterations-per-case 8 --max-cases 2 --seed 7 --concolic
```

Lệnh in đường dẫn report của lần chạy. Mỗi lần mặc định có thư mục riêng. Nếu mạng/cài đặt gặp trục trặc lúc trình bày, dùng bằng chứng đã chạy trong `results/demo_chuong4_final/`; nói rõ đó là kết quả đã lưu.

Chỉ demo phần whitebox:

```powershell
python fuzzing-security-testing/fuzzers/whitebox_fuzzer.py --concolic --iterations-per-target 12
```

Mở `results/demo_chuong4_final/concolic/report.md`, rồi một file `evidence/input_*.json`. Chỉ vào input, `branch_trace`, HTTP, số đơn được tạo và lần replay. Muốn xem công thức đầy đủ, mở `concolic/report.json` → `solver_events`.

## 5. Giải thích một SAT và một UNSAT — 1 phút

Biến tượng trưng là `total_kind`, miền 0..7: number, numeric string, invalid string, object, null, missing, boolean, array. Đây là tám đại diện, không phải mọi giá trị JSON.

Seed ban đầu có `totalAmount=400000`. Nhánh `order.total.required` là false. Phủ định nhánh đó: `kind=4 hoặc kind=5`. Z3 sinh một model, ví dụ null. Gửi model qua API thực tế và kiểm tra nhánh required được đi qua. HTTP 500 cho trường hợp này là xử lý lỗi đầu vào không phù hợp, không phải bằng chứng crash hoặc buffer overflow.

Ví dụ UNSAT:

```text
Đã qua kiểm tra required: NOT(kind=4 OR kind=5)
Muốn vào nhánh cast.empty:    kind=4 OR kind=5
```

Hai điều kiện mâu thuẫn, solver trả UNSAT. Kết luận chỉ áp dụng tiền tố và miền mô hình này. Khi phủ định một nhánh phải bỏ hậu tố đường đi cũ; code `solve_flip()` thực hiện điều đó.

## 6. Những hàm cần biết để trả lời thầy

| File / hàm | Giải thích ngắn |
|---|---|
| `fuzzer_common.py / mutate_json()` | Sao chép seed, chọn một mutation cấu trúc/giá trị |
| `blackbox_fuzzer.py / run_campaign()` | Gửi HTTP, áp oracle và lưu input bất thường |
| `whitebox_fuzzer.py / fuzz_target()` | Giữ input mở thêm coverage; đây là coverage-guided |
| `whitebox_fuzzer.py / focus_blackbox()` | Chạy lại và khảo sát lân cận input blackbox |
| `concolic.py / predicates()` | Mô hình thủ công của các điều kiện kiểu được chọn |
| `concolic.py / solve_flip()` | Giữ tiền tố, phủ định nhánh, gọi Z3; phân biệt SAT/UNSAT/unknown |
| `concolic.py / validate_trace()` | Phát hiện mô hình lệch khỏi nhánh JavaScript thực chạy |
| `concolic.py / run_concolic()` | Sinh input, xác nhận nhánh, replay và lưu bằng chứng |
| `node_harness/branch_trace.js` | Ghi các điều kiện thực tế khi bật tracing; không đổi kết quả điều kiện |
| `node_harness/models.js` | Nơi xử lý required và ép kiểu của datastore mô phỏng |

## 7. Số liệu đã chạy và cách đọc

Trong `results/demo_chuong4_final/`, seed 7:

| Giai đoạn | Input mới | HTTP 5xx | Quan sát vi phạm |
|---|---:|---:|---:|
| Blackbox | 42 | 1 | 22 finding occurrences |
| Khảo sát coverage | 16 | 6 | 6 finding occurrences |
| Concolic | 5 | 2 | 4 input vi phạm oracle |

Concolic chạy thêm 4 lượt replay; có 1 truy vấn UNSAT. Không cộng ba cột “vi phạm” để báo số lỗi gốc. Model solver có thể chọn đại diện khác giữa phiên bản Z3; đọc số liệu của lần chạy thực tế.

Trong 5 input concolic, chuỗi số và boolean được chấp nhận qua ép kiểu. Đây là vi phạm hợp đồng API yêu cầu kiểu số, chưa tự chứng minh khả năng khai thác hoặc thiệt hại tài chính.

Các lỗi runtime bộ nhớ chưa có sanitizer xác nhận. `confirmed_memory_errors` và `confirmed_process_crashes` để null vì chưa đo, không phải bằng 0.

## 8. Câu hỏi thường gặp

**Vì sao dùng mô phỏng?** Để chạy lặp, kiểm soát dữ liệu và tái hiện. Đổi lại, lỗi ở datastore giả lập phải được xác minh lại trên hệ thống thật trước khi kết luận production.

**Có phải sinh kết quả giả không?** Input được sinh, nhưng response, nhánh thực thi và dữ liệu thay đổi được đo khi chạy Node. Mẫu lỗi cấy độc lập phải ghi rõ, không gộp với phát hiện API.

**Vì sao chỉ mô hình tám kiểu?** Đây là concolic có chọn lọc để hiểu sâu một vùng xử lý đang có thật. Không tuyên bố SMT tốt hơn enumeration trong miền tám đại diện, hoặc đã symbolic toàn bộ API. Điểm thực hành là liên kết trace, giải ràng buộc và xác nhận input.

**Có đủ 100% coverage không?** Không khẳng định. Đang đo dòng trong `node_harness/index.js`, gồm setup; chưa phải branch/edge coverage toàn hệ thống. Coverage cao cũng không chứng minh không có lỗi.

**Crash/hang khác HTTP 500 thế nào?** Crash cần tiến trình dừng bất thường và log/mã thoát; HTTP 500 vẫn có thể được trả bởi catch khi server đang sống. Timeout là nghi vấn hang, cần loại trừ setup và kết nối.

**Đã hoàn thiện toàn bộ môn học chưa?** Chưa. Đã có blackbox, coverage feedback và concolic giới hạn qua API. Còn sanitizer/native runtime, corpus minimization, crash minimization/dedup theo stack và symbolic phạm vi rộng hơn.

Kết thúc: “Em ưu tiên liên kết yêu cầu → input → nhánh thực thi → bằng chứng; không dùng số testcase hay số finding để thay cho kết luận an toàn.”
