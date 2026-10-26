# Sổ tay trả lời theo luồng nghiệp vụ và testcase

Đọc phần đầu để hiểu luồng; khi thầy hỏi ID, dùng Ctrl+F tìm `TC-...` trong phần tra cứu. Nội dung lấy từ 5 Excel và evidence hiện có, không phải kết quả giả lập trên giấy. Hướng dẫn demo: [TRINH_BAY_TIEN_DO.md](TRINH_BAY_TIEN_DO.md).

## Cách trả lời một testcase trong 30–45 giây

1. **Bối cảnh:** người nào đang thực hiện thao tác gì, dữ liệu/trạng thái ban đầu là gì?
2. **Điểm nguy hiểm:** dữ liệu không tin cậy đi vào bước nào; giả định nào có thể bị phá?
3. **Input và phương pháp:** seed nào, thay đổi trường nào, blackbox/coverage/concolic hay thử đồng thời?
4. **Oracle:** nhìn vào điều gì để kết luận: HTTP, dữ liệu lưu, quyền, trace hay sanitizer?
5. **Bằng chứng:** đã chạy chưa; case/evidence nào; kết quả chỉ áp dụng phạm vi nào?
6. **Nguyên nhân và hướng sửa:** xác nhận đến đâu nói đến đó; muốn sửa cần kiểm tra đầu vào, quyền, bất biến hoặc vòng đời bộ nhớ ở đâu?

Mẫu nói: “TC-X nằm ở bước … của luồng …. Em thay … trong seed để kiểm tra giả định …. Oracle là …. Campaign hiện …; bằng chứng nằm ở …. Em chưa kết luận … vì chưa có ….”

## Bản đồ liên kết toàn hệ thống

```text
Admin → quản lý sản phẩm → catalog tin cậy
                               ↓
Khách → đăng nhập → JWT → chọn hàng → tạo đơn → cập nhật trạng thái
                      ↘ sửa hồ sơ (chỉ phạm vi quyền được cấp)

Các biên tin cậy: client → API; token → quyền; body → dữ liệu lưu;
giá client → catalog server; thao tác cập nhật → trạng thái trước/sau.
```

Code mô phỏng có thể thiếu bước bảo vệ. Đừng trình bày luồng mong đợi như thể code hiện đã làm đủ. Request chạy thực trong Express; datastore và một số dịch vụ là test double. Kết quả chưa chứng minh mức an toàn production/MongoDB.

## Phân biệt phương pháp trước khi nói về lỗi

- Blackbox: seed + mutation + request/response; không dùng nhánh bên trong để sinh input.
- Coverage-guided: giữ input mở thêm dòng; file whitebox ở chế độ cũ thực hiện kỹ thuật này.
- Concolic có giới hạn: trace thật của totalAmount → mô hình kiểu thủ công → phủ định tiền tố → Z3 → input → xác nhận nhánh qua API. Chỉ có ở tạo đơn, không symbolic cả 5 module.
- Fuzzing tìm các input phản ví dụ; testcase là mục tiêu/điều kiện, không phải danh sách khẳng định mọi lỗi đã tồn tại.
- C/Python lỗi cấy và mô hình số học là thiết kế minh họa độc lập. Không gọi buffer overflow minh họa là lỗi đã tìm thấy trong API Node.js.

## Sáu câu trả lời mẫu cần nắm chắc

**TC-AUTH-3 — lộ sự tồn tại tài khoản.** Trong đăng nhập, nhánh không tìm thấy tài khoản trả 404, nhánh sai mật khẩu trả 401. Hai response giúp người ngoài phân biệt tài khoản có tồn tại. Oracle so hai response, không phải đo lỗi bộ nhớ. Campaign hiện FAIL. Hướng sửa là phản hồi công khai thống nhất; timing cần phép đo riêng, không suy ra từ mã HTTP.

**TC-ORD-3/4 — đầu vào đi xuống tầng lưu trữ.** Token và giỏ/địa chỉ giữ hợp lệ để đi tới OrderModel.save. Thiếu/null bị kiểm tra required; object/chuỗi sai bị ép kiểu. Ngoại lệ được route bắt và trả HTTP 500: lỗi xử lý input, không phải crash tiến trình. Concolic ghi điều kiện đó, Z3 sinh đại diện đi vào nhánh khác và API chạy lại xác nhận. UNSAT của required=false cùng cast.empty=true chỉ chứng minh tiền tố mâu thuẫn trong mô hình đã mã hóa.

**TC-ORD-18 — giá giả tự khớp tổng.** Catalog giá 200000, số lượng 2; client gửi price=1 và totalAmount=2. Nếu oracle chỉ tính 1×2 từ body, nó sẽ bỏ sót. Oracle đúng đối chiếu catalog, tổng mong đợi 400000 khi không phí/giảm giá. Đây là mất toàn vẹn nghiệp vụ, không phải integer overflow.

**TC-OS-21 — đơn đã hủy vẫn được giao.** Tạo đơn hợp lệ → hủy thành công → yêu cầu chuyển sang đang giao. Phải xác nhận bước hủy thành công trước, rồi xem cả HTTP và trạng thái cuối. Nếu bước chuẩn bị lỗi thì không được nói đã kiểm tra trạng thái kết thúc. Hướng sửa là cưỡng chế chuyển trạng thái hợp lệ và quyền ở server.

**TC-USR-2 — mass assignment.** User thường sửa hồ sơ nhưng thêm role=admin. Nếu route chuyển body vào cập nhật mà không whitelist, role có thể bị thay đổi. Oracle kiểm tra role còn là user hoặc request bị từ chối. Không có token, có token người khác và tự nâng role là ba tình huống cần phân biệt.

**Một testcase C buffer overflow.** Tên hàm C trong Excel chỉ là mô hình xử lý dữ liệu tương ứng, chưa là lời gọi native của API. Cần nói kích thước buffer tính theo byte, xét ký tự kết thúc, input biên và bằng chứng ASan nếu thực thi. Hiện campaign API chưa chạy mẫu này. Không nói “email dài nên đã buffer overflow”.

## Phân biệt kết quả ứng dụng với kết quả công cụ

| Tình huống | Cách kết luận |
|---|---|
| API nhận input sai rồi trả 500 | Vi phạm xử lý lỗi/đầu vào theo oracle; chưa phải crash |
| Z3 sinh input đúng tiền tố nhưng API lỗi | Công cụ đạt mục tiêu nhánh, ứng dụng vẫn có vi phạm |
| Z3 model lệch trace thực | Lỗi mô hình/công cụ; không xác nhận khám phá nhánh |
| TIMEOUT | Nghi vấn hang; cần loại trừ setup/kết nối và quan sát tiến trình |
| SAT mô hình số học | Có nghiệm trong giả định; chưa là integer overflow của Number JavaScript |
| Không gặp lỗi trong ngân sách | Chưa tìm thấy, không chứng minh an toàn |
| Nhiều input cùng vi phạm | Finding occurrences, chưa phải nhiều lỗi gốc |

## Nguồn bằng chứng và giới hạn

- Campaign: `results/spec_excel_aligned/report.json`, có snapshot/hash của đúng 5 Excel: 29 testcase được chạy, 9 PASS/20 FAIL; 59 kịch bản, 19 PASS/40 FAIL, không ERROR; 75 testcase ngoài campaign.
- Demo: `results/demo_chuong4_final/`; concolic có model, công thức, branch_trace và replay. Không gán kết quả concolic cho mọi mẫu C/SMT trong Excel.
- PASS của testcase chỉ bao phủ các input và oracle đã cài, không có nghĩa mọi điều kiện bổ sung trong đặc tả đã được đo.
- Muốn sửa lỗi ứng dụng cần thay route/model tương ứng rồi chạy lại regression. Lần hoàn thiện công cụ không có nghĩa các lỗi ở ứng dụng đã được vá.

## Tra cứu đủ 104 testcase

Các bước và yêu cầu bên dưới lấy từ Excel hiện tại. Dòng “đã chạy” dùng evidence đã kiểm tra khớp hash; nhóm còn lại có cách kiểm tra dự kiến, không gán PASS/FAIL giả.

### Module AUTH: Đăng nhập

**Luồng nghiệp vụ mong đợi:** Client gửi email/password → chuẩn hóa/kiểm tra đầu vào → tìm tài khoản → bcrypt.compare → lấy role từ dữ liệu → ký JWT → trả response.

**Tài sản/biên tin cậy:** Tài khoản, mật khẩu, JWT và danh tính. Chuẩn hóa/chuyển kiểu đang có trong code không đồng nghĩa đã validation chặt theo hợp đồng.

**Điểm đọc code:** [node_harness/index.js:391](D:/Virtual-Try-On-sync/fuzzing-security-testing/node_harness/index.js:391). Đây là code harness; mẫu C/Python không tự nằm trên đường gọi này.

#### TC-AUTH-1 — Xử lý an toàn trường xác thực bị thiếu hoặc rỗng

- **Yêu cầu / ưu tiên:** REQ-AUTH-1; HIGH. Nguồn: `Module_Auth_Login_spec.xlsx` → `TestCase`.
- **Nhóm lỗi / mục tiêu:** Kiểm tra đầu vào / xử lý lỗi; không phải tự động là lỗ hổng bộ nhớ.
- **Vị trí trong luồng:** Client gửi email/password → chuẩn hóa/kiểm tra đầu vào → tìm tài khoản → bcrypt.compare → lấy role từ dữ liệu → ký JWT → trả response. Đối chiếu vị trí input/thao tác trong testcase với luồng này; không mặc định code hiện đã cưỡng chế đủ điều kiện an toàn.
- **Điều kiện ban đầu:** Server đang chạy
- **Cách kiểm tra:** Input có chủ đích/đột biến và oracle theo đặc tả. Concurrency/timing/version ngoài 29 ID chưa được campaign này thực thi.
- **Bước/input cụ thể:** Gửi POST /api/auth/login với body rỗng → Gửi với chỉ có email, thiếu password → Lưu seed, input thực tế, ngữ cảnh xác thực/trạng thái, response và thời gian. Chỉ kết luận crash khi có mã thoát/signal và log tiến trình; timeout là nghi vấn hang.
- **Điều kiện an toàn mong đợi:** HTTP 400 cho input thiếu/rỗng; không trả stack trace hoặc phát hành token.
- **Mức thực hiện:** PASS theo oracle hiện tại; 3 kịch bản. Ví dụ `TC-AUTH-1:0`, oracle `status`, chuỗi HTTP `[400]`. Chi tiết input và dữ liệu trong `results/spec_excel_aligned/report.json` → `executions`. Không suy rộng trạng thái này sang các điều kiện chưa được oracle kiểm tra.

#### TC-AUTH-2 — Ngoại lệ khi email/password sai kiểu dữ liệu

- **Yêu cầu / ưu tiên:** REQ-AUTH-2; HIGH. Nguồn: `Module_Auth_Login_spec.xlsx` → `TestCase`.
- **Nhóm lỗi / mục tiêu:** Kiểm tra đầu vào / ngoại lệ do sai kiểu.
- **Vị trí trong luồng:** Client gửi email/password → chuẩn hóa/kiểm tra đầu vào → tìm tài khoản → bcrypt.compare → lấy role từ dữ liệu → ký JWT → trả response. Đối chiếu vị trí input/thao tác trong testcase với luồng này; không mặc định code hiện đã cưỡng chế đủ điều kiện an toàn.
- **Điều kiện ban đầu:** Server đang chạy
- **Cách kiểm tra:** Input có chủ đích/đột biến và oracle theo đặc tả. Concurrency/timing/version ngoài 29 ID chưa được campaign này thực thi.
- **Bước/input cụ thể:** Gửi email là object/array → Lặp lại 2000 lần bằng blackbox_fuzzer.py → Lưu seed, input thực tế, ngữ cảnh xác thực/trạng thái, response và thời gian. Chỉ kết luận crash khi có mã thoát/signal và log tiến trình; timeout là nghi vấn hang.
- **Điều kiện an toàn mong đợi:** Không phát sinh HTTP 5xx do sai kiểu; không phát hành token cho thông tin không hợp lệ. HTTP 500 là lỗi ứng dụng, chưa phải crash tiến trình.
- **Mức thực hiện:** PASS theo oracle hiện tại; 5 kịch bản. Ví dụ `TC-AUTH-2:0`, oracle `no_5xx`, chuỗi HTTP `[404]`. Chi tiết input và dữ liệu trong `results/spec_excel_aligned/report.json` → `executions`. Không suy rộng trạng thái này sang các điều kiện chưa được oracle kiểm tra.

#### TC-AUTH-3 — Rò rỉ sự tồn tại tài khoản qua phản hồi đăng nhập

- **Yêu cầu / ưu tiên:** REQ-AUTH-3; HIGH. Nguồn: `Module_Auth_Login_spec.xlsx` → `TestCase`.
- **Nhóm lỗi / mục tiêu:** Rò rỉ thông tin tài khoản (Confidentiality).
- **Vị trí trong luồng:** Client gửi email/password → chuẩn hóa/kiểm tra đầu vào → tìm tài khoản → bcrypt.compare → lấy role từ dữ liệu → ký JWT → trả response. Đối chiếu vị trí input/thao tác trong testcase với luồng này; không mặc định code hiện đã cưỡng chế đủ điều kiện an toàn.
- **Điều kiện ban đầu:** Có 1 tài khoản hợp lệ đã seed
- **Cách kiểm tra:** Input có chủ đích/đột biến và oracle theo đặc tả. Concurrency/timing/version ngoài 29 ID chưa được campaign này thực thi.
- **Bước/input cụ thể:** 1. Chuẩn bị trạng thái và dữ liệu như điều kiện tiên quyết. → 2. So sánh mã HTTP và message giữa email sai vs password sai → 3. Thu thập phản hồi/trạng thái cuối và đối chiếu kết quả mong đợi. → Lưu seed, input thực tế, ngữ cảnh xác thực/trạng thái, response và thời gian. Chỉ kết luận crash khi có mã thoát/signal và log tiến trình; timeout là nghi vấn hang.
- **Điều kiện an toàn mong đợi:** Hai trường hợp tài khoản không tồn tại và sai mật khẩu có cùng mã trạng thái và thông báo công khai; không cấp token.
- **Mức thực hiện:** FAIL theo oracle hiện tại; 1 kịch bản. Ví dụ `TC-AUTH-3:enumeration`, oracle `same_response`, chuỗi HTTP `[404, 401]`. Chi tiết input và dữ liệu trong `results/spec_excel_aligned/report.json` → `executions`. Không suy rộng trạng thái này sang các điều kiện chưa được oracle kiểm tra.

#### TC-AUTH-5 — Chèn role vào input xác thực để nâng quyền

- **Yêu cầu / ưu tiên:** REQ-AUTH-5; HIGH. Nguồn: `Module_Auth_Login_spec.xlsx` → `TestCase`.
- **Nhóm lỗi / mục tiêu:** Nâng quyền qua dữ liệu xác thực (Authorization).
- **Vị trí trong luồng:** Client gửi email/password → chuẩn hóa/kiểm tra đầu vào → tìm tài khoản → bcrypt.compare → lấy role từ dữ liệu → ký JWT → trả response. Đối chiếu vị trí input/thao tác trong testcase với luồng này; không mặc định code hiện đã cưỡng chế đủ điều kiện an toàn.
- **Điều kiện ban đầu:** Có tài khoản role=user và role=admin
- **Cách kiểm tra:** Input có chủ đích/đột biến và oracle theo đặc tả. Concurrency/timing/version ngoài 29 ID chưa được campaign này thực thi.
- **Bước/input cụ thể:** 1. Chuẩn bị trạng thái và dữ liệu như điều kiện tiên quyết. → 2. Đăng nhập bằng tài khoản role=user, decode token, kiểm tra role → 3. Thu thập phản hồi/trạng thái cuối và đối chiếu kết quả mong đợi. → Lưu seed, input thực tế, ngữ cảnh xác thực/trạng thái, response và thời gian. Chỉ kết luận crash khi có mã thoát/signal và log tiến trình; timeout là nghi vấn hang.
- **Điều kiện an toàn mong đợi:** Role trong token lấy từ dữ liệu tài khoản phía server, không lấy từ role do client gửi.
- **Mức thực hiện:** PASS theo oracle hiện tại; 1 kịch bản. Ví dụ `TC-AUTH-5:jwt-role`, oracle `jwt`, chuỗi HTTP `[200]`. Chi tiết input và dữ liệu trong `results/spec_excel_aligned/report.json` → `executions`. Không suy rộng trạng thái này sang các điều kiện chưa được oracle kiểm tra.

#### TC-AUTH-7 — Khả năng xử lý email dài bất thường

- **Yêu cầu / ưu tiên:** REQ-AUTH-8; HIGH. Nguồn: `Module_Auth_Login_spec.xlsx` → `TestCase`.
- **Nhóm lỗi / mục tiêu:** Giới hạn đầu vào / khả năng xử lý; chưa chứng minh DoS hoặc buffer overflow.
- **Vị trí trong luồng:** Client gửi email/password → chuẩn hóa/kiểm tra đầu vào → tìm tài khoản → bcrypt.compare → lấy role từ dữ liệu → ký JWT → trả response. Đối chiếu vị trí input/thao tác trong testcase với luồng này; không mặc định code hiện đã cưỡng chế đủ điều kiện an toàn.
- **Điều kiện ban đầu:** Server đang chạy
- **Cách kiểm tra:** Input có chủ đích/đột biến và oracle theo đặc tả. Concurrency/timing/version ngoài 29 ID chưa được campaign này thực thi.
- **Bước/input cụ thể:** 1. Chuẩn bị trạng thái và dữ liệu như điều kiện tiên quyết. → 2. Gửi email = chuỗi 5000 ký tự 'A' → 3. Thu thập phản hồi/trạng thái cuối và đối chiếu kết quả mong đợi. → Lưu seed, input thực tế, ngữ cảnh xác thực/trạng thái, response và thời gian. Chỉ kết luận crash khi có mã thoát/signal và log tiến trình; timeout là nghi vấn hang.
- **Điều kiện an toàn mong đợi:** Với mẫu email 5000 ký tự, trả HTTP 400/404 có kiểm soát, không HTTP 5xx. Kết luận crash/hang cần bằng chứng tiến trình; không suy ra tràn buffer từ độ dài input.
- **Mức thực hiện:** PASS theo oracle hiện tại; 1 kịch bản. Ví dụ `TC-AUTH-7:long-email`, oracle `status`, chuỗi HTTP `[404]`. Chi tiết input và dữ liệu trong `results/spec_excel_aligned/report.json` → `executions`. Không suy rộng trạng thái này sang các điều kiện chưa được oracle kiểm tra.

#### TC-AUTH-19 — Kiểm tra quy trình fuzzing: Phân biệt timeout với hang

- **Yêu cầu / ưu tiên:** REQ-AUTH-FUZZ-19; HIGH. Nguồn: `Module_Auth_Login_spec.xlsx` → `TestCase`.
- **Nhóm lỗi / mục tiêu:** Độ đúng công cụ fuzzing và bằng chứng; không tự là lỗ hổng nghiệp vụ.
- **Vị trí trong luồng:** Kiểm tra chính công cụ điều phối, replay hoặc phân loại bằng chứng; không phải mặc định một lỗ hổng trong nghiệp vụ bán hàng.
- **Điều kiện ban đầu:** Có fixture đối chứng phản hồi sau 0,1 giây và fixture bị giữ chờ; có PID, log, bộ giám sát và giới hạn mỗi lượt T=2 giây.
- **Cách kiểm tra:** Đối chiếu input/ngữ cảnh/log với từng pha công cụ; phân biệt kiểm tra quy trình và xác nhận lỗi ứng dụng.
- **Bước/input cụ thể:** 1. Chạy fixture nhanh từ trạng thái sạch với T=2 giây. → 2. Chạy fixture bị giữ chờ cùng input ba lần, mỗi lần là tiến trình mới. → 3. Ghi PID, thời gian, mã thoát và phản hồi tiến trình sau timeout; kết thúc tiến trình thử còn sống. → 4. Loại trừ lỗi khởi động, cổng, kết nối và tải máy trước khi kết luận.
- **Điều kiện an toàn mong đợi:** Fixture nhanh không bị đánh dấu hang. Fixture chờ được ghi TIMEOUT/SUSPECTED_HANG; không gọi là crash hoặc lỗi bộ nhớ. Chỉ nâng thành hang tái hiện khi có bằng chứng tiến trình và điều kiện kiểm soát; thiếu công cụ thì chưa đánh giá.
- **Mức thực hiện:** chưa được campaign API hiện tại thực thi; giữ trong 75 testcase ngoài campaign. Nội dung ở trên là thiết kế kiểm tra, không phải phát hiện đã xác nhận.

#### TC-AUTH-8 — Hàm sinh mã C: parse_login_email (buffer-overflow)

- **Yêu cầu / ưu tiên:** REQ-AUTH-FIX-parse_login_email; HIGH. Nguồn: `Module_Auth_Login_spec.xlsx` → `TestCase`.
- **Nhóm lỗi / mục tiêu:** An toàn bộ nhớ / quản lý tài nguyên trong mẫu C độc lập: buffer-overflow
- **Vị trí trong luồng:** Mẫu C độc lập lấy dữ liệu nghiệp vụ làm bối cảnh. Không coi là bước gọi native đã xác nhận của API; cần xem HamSinhMa và build/instrument mẫu trước khi kết luận runtime.
- **Điều kiện ban đầu:** Mẫu C parse_login_email, lỗi cấy buffer-overflow; có driver gọi hàm, compiler và AddressSanitizer hoạt động. Phạm vi native fixture, không phải API Node.js.
Chỉ chạy trên hàm C minh họa độc lập; cần compiler và instrumentation phù hợp. Không phải đường thực thi native đã xác nhận của API Node.js.
- **Cách kiểm tra:** Fuzz input của hàm C + instrumentation ASan/LSan phù hợp + đối chứng an toàn; đây là phương pháp dự kiến, chưa chạy trong campaign API.
- **Bước/input cụ thể:** 1. Sinh mã C và chạy kiểm tra tĩnh như testcase gốc. → 2. Tạo driver gọi parse_login_email, biên dịch -g -O0 và instrumentation phù hợp; kiểm tra đối chứng công cụ. → 3. Chạy chuỗi ASCII dài B-1, B, B+1 với B=254 byte và đối chứng ngắn. → 4. Lưu input, binary/source hash, stderr, exit code/signal và vị trí chẩn đoán. → 5. Tái hiện từ tiến trình sạch; chạy đối chứng an toàn cùng input. → Chạy cả mẫu lỗi cấy và đối chứng an toàn trên cùng input; lưu input, build flags, stderr, mã thoát và vị trí lỗi; lặp lại input gây lỗi.
- **Điều kiện an toàn mong đợi:** Đối chứng an toàn không có chẩn đoán buffer-overflow; mẫu lỗi cấy phải có chẩn đoán buffer-overflow tại hàm mục tiêu từ AddressSanitizer hoặc công cụ phát hiện lỗi bộ nhớ tương đương. Mẫu lỗi bị phát hiện là xác nhận đối chứng công cụ, không phải ứng dụng đã an toàn. Thiếu công cụ/bằng chứng: chưa xác minh. Không dùng HTTP 500 làm bằng chứng; leak không bắt buộc làm tiến trình crash.
- **Mức thực hiện:** chưa được campaign API hiện tại thực thi; giữ trong 75 testcase ngoài campaign. Nội dung ở trên là thiết kế kiểm tra, không phải phát hiện đã xác nhận.

#### TC-AUTH-11 — Hàm sinh mã C: write_login_attempt_log (memory-leak)

- **Yêu cầu / ưu tiên:** REQ-AUTH-FIX-write_login_attempt_log; HIGH. Nguồn: `Module_Auth_Login_spec.xlsx` → `TestCase`.
- **Nhóm lỗi / mục tiêu:** An toàn bộ nhớ / quản lý tài nguyên trong mẫu C độc lập: memory-leak
- **Vị trí trong luồng:** Mẫu C độc lập lấy dữ liệu nghiệp vụ làm bối cảnh. Không coi là bước gọi native đã xác nhận của API; cần xem HamSinhMa và build/instrument mẫu trước khi kết luận runtime.
- **Điều kiện ban đầu:** Mẫu C write_login_attempt_log, lỗi cấy memory-leak; có driver gọi hàm, compiler và LeakSanitizer hoặc công cụ kiểm tra leak tương đương hoạt động. Phạm vi native fixture, không phải API Node.js.
Chỉ chạy trên hàm C minh họa độc lập; cần compiler và instrumentation phù hợp. Không phải đường thực thi native đã xác nhận của API Node.js.
- **Cách kiểm tra:** Fuzz input của hàm C + instrumentation ASan/LSan phù hợp + đối chứng an toàn; đây là phương pháp dự kiến, chưa chạy trong campaign API.
- **Bước/input cụ thể:** 1. Sinh mã C và chạy kiểm tra tĩnh như testcase gốc. → 2. Tạo driver gọi write_login_attempt_log, biên dịch -g -O0 và instrumentation phù hợp; kiểm tra đối chứng công cụ. → 3. Chạy đường thực thi hàm một lần trên mỗi tiến trình mới; có đối chứng đã sửa tương ứng. → 4. Lưu input, binary/source hash, stderr, exit code/signal và vị trí chẩn đoán. → 5. Tái hiện từ tiến trình sạch; chạy đối chứng an toàn cùng input. → Chạy cả mẫu lỗi cấy và đối chứng an toàn trên cùng input; lưu input, build flags, stderr, mã thoát và vị trí lỗi; lặp lại input gây lỗi.
- **Điều kiện an toàn mong đợi:** Đối chứng an toàn không có chẩn đoán memory-leak; mẫu lỗi cấy phải có chẩn đoán memory-leak tại hàm mục tiêu từ LeakSanitizer hoặc công cụ phát hiện leak tương đương. Mẫu lỗi bị phát hiện là xác nhận đối chứng công cụ, không phải ứng dụng đã an toàn. Thiếu công cụ/bằng chứng: chưa xác minh. Không dùng HTTP 500 làm bằng chứng; leak không bắt buộc làm tiến trình crash.
- **Mức thực hiện:** chưa được campaign API hiện tại thực thi; giữ trong 75 testcase ngoài campaign. Nội dung ở trên là thiết kế kiểm tra, không phải phát hiện đã xác nhận.

#### TC-AUTH-12 — Hàm sinh mã C: close_login_session (double-free)

- **Yêu cầu / ưu tiên:** REQ-AUTH-FIX-close_login_session; HIGH. Nguồn: `Module_Auth_Login_spec.xlsx` → `TestCase`.
- **Nhóm lỗi / mục tiêu:** An toàn bộ nhớ / quản lý tài nguyên trong mẫu C độc lập: double-free
- **Vị trí trong luồng:** Mẫu C độc lập lấy dữ liệu nghiệp vụ làm bối cảnh. Không coi là bước gọi native đã xác nhận của API; cần xem HamSinhMa và build/instrument mẫu trước khi kết luận runtime.
- **Điều kiện ban đầu:** Mẫu C close_login_session, lỗi cấy double-free; có driver gọi hàm, compiler và AddressSanitizer hoạt động. Phạm vi native fixture, không phải API Node.js.
Chỉ chạy trên hàm C minh họa độc lập; cần compiler và instrumentation phù hợp. Không phải đường thực thi native đã xác nhận của API Node.js.
- **Cách kiểm tra:** Fuzz input của hàm C + instrumentation ASan/LSan phù hợp + đối chứng an toàn; đây là phương pháp dự kiến, chưa chạy trong campaign API.
- **Bước/input cụ thể:** 1. Sinh mã C và chạy kiểm tra tĩnh như testcase gốc. → 2. Tạo driver gọi close_login_session, biên dịch -g -O0 và instrumentation phù hợp; kiểm tra đối chứng công cụ. → 3. Chạy đường thực thi hàm một lần trên mỗi tiến trình mới; có đối chứng đã sửa tương ứng. → 4. Lưu input, binary/source hash, stderr, exit code/signal và vị trí chẩn đoán. → 5. Tái hiện từ tiến trình sạch; chạy đối chứng an toàn cùng input. → Chạy cả mẫu lỗi cấy và đối chứng an toàn trên cùng input; lưu input, build flags, stderr, mã thoát và vị trí lỗi; lặp lại input gây lỗi.
- **Điều kiện an toàn mong đợi:** Đối chứng an toàn không có chẩn đoán double-free; mẫu lỗi cấy phải có chẩn đoán double-free tại hàm mục tiêu từ AddressSanitizer hoặc công cụ phát hiện lỗi bộ nhớ tương đương. Mẫu lỗi bị phát hiện là xác nhận đối chứng công cụ, không phải ứng dụng đã an toàn. Thiếu công cụ/bằng chứng: chưa xác minh. Không dùng HTTP 500 làm bằng chứng; leak không bắt buộc làm tiến trình crash.
- **Mức thực hiện:** chưa được campaign API hiện tại thực thi; giữ trong 75 testcase ngoài campaign. Nội dung ở trên là thiết kế kiểm tra, không phải phát hiện đã xác nhận.

#### TC-AUTH-13 — Hàm sinh mã C: release_token_cache_buffer (use-after-free)

- **Yêu cầu / ưu tiên:** REQ-AUTH-FIX-release_token_cache_buffer; HIGH. Nguồn: `Module_Auth_Login_spec.xlsx` → `TestCase`.
- **Nhóm lỗi / mục tiêu:** An toàn bộ nhớ / quản lý tài nguyên trong mẫu C độc lập: use-after-free
- **Vị trí trong luồng:** Mẫu C độc lập lấy dữ liệu nghiệp vụ làm bối cảnh. Không coi là bước gọi native đã xác nhận của API; cần xem HamSinhMa và build/instrument mẫu trước khi kết luận runtime.
- **Điều kiện ban đầu:** Mẫu C release_token_cache_buffer, lỗi cấy use-after-free; có driver gọi hàm, compiler và AddressSanitizer hoạt động. Phạm vi native fixture, không phải API Node.js.
Chỉ chạy trên hàm C minh họa độc lập; cần compiler và instrumentation phù hợp. Không phải đường thực thi native đã xác nhận của API Node.js.
- **Cách kiểm tra:** Fuzz input của hàm C + instrumentation ASan/LSan phù hợp + đối chứng an toàn; đây là phương pháp dự kiến, chưa chạy trong campaign API.
- **Bước/input cụ thể:** 1. Sinh mã C và chạy kiểm tra tĩnh như testcase gốc. → 2. Tạo driver gọi release_token_cache_buffer, biên dịch -g -O0 và instrumentation phù hợp; kiểm tra đối chứng công cụ. → 3. Chạy đường thực thi hàm một lần trên mỗi tiến trình mới; có đối chứng đã sửa tương ứng. → 4. Lưu input, binary/source hash, stderr, exit code/signal và vị trí chẩn đoán. → 5. Tái hiện từ tiến trình sạch; chạy đối chứng an toàn cùng input. → Chạy cả mẫu lỗi cấy và đối chứng an toàn trên cùng input; lưu input, build flags, stderr, mã thoát và vị trí lỗi; lặp lại input gây lỗi.
- **Điều kiện an toàn mong đợi:** Đối chứng an toàn không có chẩn đoán use-after-free; mẫu lỗi cấy phải có chẩn đoán use-after-free tại hàm mục tiêu từ AddressSanitizer hoặc công cụ phát hiện lỗi bộ nhớ tương đương. Mẫu lỗi bị phát hiện là xác nhận đối chứng công cụ, không phải ứng dụng đã an toàn. Thiếu công cụ/bằng chứng: chưa xác minh. Không dùng HTTP 500 làm bằng chứng; leak không bắt buộc làm tiến trình crash.
- **Mức thực hiện:** chưa được campaign API hiện tại thực thi; giữ trong 75 testcase ngoài campaign. Nội dung ở trên là thiết kế kiểm tra, không phải phát hiện đã xác nhận.

#### TC-AUTH-9 — Hàm Python: failed_login_ratio chia cho 0

- **Yêu cầu / ưu tiên:** REQ-AUTH-FIX-failed_login_ratio; MEDIUM. Nguồn: `Module_Auth_Login_spec.xlsx` → `TestCase`.
- **Nhóm lỗi / mục tiêu:** Ngoại lệ tính toán trong mẫu Python độc lập.
- **Vị trí trong luồng:** Hàm Python minh họa độc lập của bước thống kê/tính toán; không đồng nhất traceback Python với server Node.js bị crash.
- **Điều kiện ban đầu:** Đã sinh mã Python cho hàm failed_login_ratio Phạm vi mô hình minh họa theo template, không phải lỗi API Node.js.
- **Cách kiểm tra:** Sinh/đột biến đối số, bắt ngoại lệ và lưu traceback; cần mẫu đối chứng. Chưa được campaign API thực thi.
- **Bước/input cụ thể:** 1. Chuẩn bị trạng thái và dữ liệu như điều kiện tiên quyết. → 2. Chạy blackbox_fuzz() với total_attempts=0 → 3. Thu thập phản hồi/trạng thái cuối và đối chiếu kết quả mong đợi.
- **Điều kiện an toàn mong đợi:** Mẫu lỗi cấy phát sinh ZeroDivisionError với input chia cho 0; lưu traceback, input và cách gọi. Đối chứng an toàn xử lý trường hợp này có kiểm soát. Ngoại lệ Python chưa chứng minh crash server hoặc lỗi bộ nhớ native; thiếu thực thi thì chưa xác minh.
- **Mức thực hiện:** chưa được campaign API hiện tại thực thi; giữ trong 75 testcase ngoài campaign. Nội dung ở trên là thiết kế kiểm tra, không phải phát hiện đã xác nhận.

#### TC-AUTH-18 — Bộ đếm tăng tương đối từ giá trị khác 0

- **Yêu cầu / ưu tiên:** REQ-AUTH-4; HIGH. Nguồn: `Module_Auth_Login_spec.xlsx` → `TestCase`.
- **Nhóm lỗi / mục tiêu:** Đồng bộ / toàn vẹn cập nhật / tương thích version; xác định rõ ngữ cảnh đồng thời hoặc tuần tự trong bước thử.
- **Vị trí trong luồng:** Client gửi email/password → chuẩn hóa/kiểm tra đầu vào → tìm tài khoản → bcrypt.compare → lấy role từ dữ liệu → ký JWT → trả response. Đối chiếu vị trí input/thao tác trong testcase với luồng này; không mặc định code hiện đã cưỡng chế đủ điều kiện an toàn.
- **Điều kiện ban đầu:** Seed failedLoginCount=7 trong datastore mô phỏng; tài khoản hợp lệ. Phạm vi: harness mô phỏng; testcase mới chưa có kịch bản thực thi tự động.
- **Cách kiểm tra:** Input có chủ đích/đột biến và oracle theo đặc tả. Concurrency/timing/version ngoài 29 ID chưa được campaign này thực thi.
- **Bước/input cụ thể:** 1. Qua bước setup nội bộ của harness, đặt failedLoginCount=7. Gửi 50 login sai đồng thời; đọc bộ đếm nội bộ sau khi toàn bộ request hoàn tất. Không cần MongoDB. → 2. Thu thập response và dữ liệu cuối để đối chiếu kết quả mong đợi. → Dữ liệu thử: failedLoginCount ban đầu=7; 50 mật khẩu sai.
- **Điều kiện an toàn mong đợi:** 50 phản hồi 401; bộ đếm cuối=57, không reset hoặc mất cập nhật.
- **Mức thực hiện:** chưa được campaign API hiện tại thực thi; giữ trong 75 testcase ngoài campaign. Nội dung ở trên là thiết kế kiểm tra, không phải phát hiện đã xác nhận.

#### TC-AUTH-4 — Đăng nhập sai đồng thời (race trên bộ đếm)

- **Yêu cầu / ưu tiên:** REQ-AUTH-4, NFR-AUTH-5; MEDIUM. Nguồn: `Module_Auth_Login_spec.xlsx` → `TestCase`.
- **Nhóm lỗi / mục tiêu:** Đồng bộ / toàn vẹn cập nhật / tương thích version; xác định rõ ngữ cảnh đồng thời hoặc tuần tự trong bước thử.
- **Vị trí trong luồng:** Client gửi email/password → chuẩn hóa/kiểm tra đầu vào → tìm tài khoản → bcrypt.compare → lấy role từ dữ liệu → ký JWT → trả response. Đối chiếu vị trí input/thao tác trong testcase với luồng này; không mặc định code hiện đã cưỡng chế đủ điều kiện an toàn.
- **Điều kiện ban đầu:** Có 1 tài khoản hợp lệ đã seed
- **Cách kiểm tra:** Input có chủ đích/đột biến và oracle theo đặc tả. Concurrency/timing/version ngoài 29 ID chưa được campaign này thực thi.
- **Bước/input cụ thể:** Gửi 50 request login sai password ĐỒNG THỜI (không tuần tự) tới cùng 1 tài khoản → Đọc lại bộ đếm thất bại sau khi hoàn tất
- **Điều kiện an toàn mong đợi:** 50 phản hồi HTTP 401; failedLoginCount cuối bằng 50 khi ban đầu bằng 0. Không kết luận rate limiting từ phép thử này.
- **Mức thực hiện:** chưa được campaign API hiện tại thực thi; giữ trong 75 testcase ngoài campaign. Nội dung ở trên là thiết kế kiểm tra, không phải phát hiện đã xác nhận.

#### TC-AUTH-6 — Đo chênh lệch thời gian 404 vs 401

- **Yêu cầu / ưu tiên:** REQ-AUTH-6; MEDIUM. Nguồn: `Module_Auth_Login_spec.xlsx` → `TestCase`.
- **Nhóm lỗi / mục tiêu:** Timing side-channel cần phép đo kiểm soát nhiễu.
- **Vị trí trong luồng:** Client gửi email/password → chuẩn hóa/kiểm tra đầu vào → tìm tài khoản → bcrypt.compare → lấy role từ dữ liệu → ký JWT → trả response. Đối chiếu vị trí input/thao tác trong testcase với luồng này; không mặc định code hiện đã cưỡng chế đủ điều kiện an toàn.
- **Điều kiện ban đầu:** Có 1 tài khoản hợp lệ đã seed
- **Cách kiểm tra:** Input có chủ đích/đột biến và oracle theo đặc tả. Concurrency/timing/version ngoài 29 ID chưa được campaign này thực thi.
- **Bước/input cụ thể:** 1. Chuẩn bị trạng thái và dữ liệu như điều kiện tiên quyết. → 2. Đo thời gian trung bình 50 request 404 và 50 request 401, so sánh → 3. Thu thập phản hồi/trạng thái cuối và đối chiếu kết quả mong đợi.
- **Điều kiện an toàn mong đợi:** Ghi phân phối thời gian cho hai nhánh dưới cùng điều kiện đo và seed, cùng ngưỡng/kiểm định đã chốt trước chạy. Chỉ kết luận rò rỉ thời gian khi có phép đo lặp lại và kiểm soát nhiễu; không mặc định có lỗi từ việc một nhánh gọi bcrypt. Chưa chốt ngưỡng thì chưa kết luận PASS/FAIL.
- **Mức thực hiện:** chưa được campaign API hiện tại thực thi; giữ trong 75 testcase ngoài campaign. Nội dung ở trên là thiết kế kiểm tra, không phải phát hiện đã xác nhận.

#### TC-AUTH-10 — Kiểm tra tràn số: total_login_attempt_counter

- **Yêu cầu / ưu tiên:** REQ-AUTH-SMT-total_login_attempt_counter; LOW. Nguồn: `Module_Auth_Login_spec.xlsx` → `TestCase`.
- **Nhóm lỗi / mục tiêu:** Số học: kiểm tra overflow trong mô hình hữu hạn, chưa là phát hiện runtime.
- **Vị trí trong luồng:** Mô hình phép toán/bộ đếm trong KiemTraSoHoc. Cần xác định signedness, miền và độ rộng bit; không gắn int32 của mô hình cho mọi số trong JavaScript.
- **Điều kiện ban đầu:** Đã khai báo biến SMT tương ứng Phạm vi mô hình minh họa theo template, không phải lỗi API Node.js.
- **Cách kiểm tra:** Giải các ràng buộc đã khai báo, lưu SAT/model hoặc UNSAT/unknown. Sau đó mới đối chiếu phép toán của triển khai nếu có.
- **Bước/input cụ thể:** 1. Chuẩn bị trạng thái và dữ liệu như điều kiện tiên quyết. → 2. Chạy check_int32_overflow() bằng Z3 trên BieuThucTran → 3. Thu thập phản hồi/trạng thái cuối và đối chiếu kết quả mong đợi.
- **Điều kiện an toàn mong đợi:** Đánh giá công thức theo đúng miền, signedness và độ rộng bit trong sheet KiemTraSoHoc. Nếu SAT, lưu giá trị chứng minh và phép toán gây vượt miền; nếu UNSAT, lưu giả định và phạm vi đã kiểm tra. Không mặc định SAT và không suy ra tràn số runtime Node.js từ mô hình số nguyên hữu hạn. Chưa chạy solver: chưa xác minh.
- **Mức thực hiện:** chưa được campaign API hiện tại thực thi; giữ trong 75 testcase ngoài campaign. Nội dung ở trên là thiết kế kiểm tra, không phải phát hiện đã xác nhận.

#### TC-AUTH-14 — Kiểm tra tràn số: daily_failed_login_counter

- **Yêu cầu / ưu tiên:** REQ-AUTH-SMT-daily_failed_login_counter; LOW. Nguồn: `Module_Auth_Login_spec.xlsx` → `TestCase`.
- **Nhóm lỗi / mục tiêu:** Số học: kiểm tra overflow trong mô hình hữu hạn, chưa là phát hiện runtime.
- **Vị trí trong luồng:** Mô hình phép toán/bộ đếm trong KiemTraSoHoc. Cần xác định signedness, miền và độ rộng bit; không gắn int32 của mô hình cho mọi số trong JavaScript.
- **Điều kiện ban đầu:** Đã khai báo biến SMT tương ứng cho dòng 'daily_failed_login_counter' Phạm vi mô hình minh họa theo template, không phải lỗi API Node.js.
- **Cách kiểm tra:** Giải các ràng buộc đã khai báo, lưu SAT/model hoặc UNSAT/unknown. Sau đó mới đối chiếu phép toán của triển khai nếu có.
- **Bước/input cụ thể:** 1. Chuẩn bị trạng thái và dữ liệu như điều kiện tiên quyết. → 2. Chạy check_int32_overflow() bằng Z3 trên BieuThucTran của dòng 'daily_failed_login_counter' → 3. Thu thập phản hồi/trạng thái cuối và đối chiếu kết quả mong đợi.
- **Điều kiện an toàn mong đợi:** Đánh giá công thức theo đúng miền, signedness và độ rộng bit trong sheet KiemTraSoHoc. Nếu SAT, lưu giá trị chứng minh và phép toán gây vượt miền; nếu UNSAT, lưu giả định và phạm vi đã kiểm tra. Không mặc định SAT và không suy ra tràn số runtime Node.js từ mô hình số nguyên hữu hạn. Chưa chạy solver: chưa xác minh.
- **Mức thực hiện:** chưa được campaign API hiện tại thực thi; giữ trong 75 testcase ngoài campaign. Nội dung ở trên là thiết kế kiểm tra, không phải phát hiện đã xác nhận.

#### TC-AUTH-15 — Kiểm tra tràn số: concurrent_session_counter

- **Yêu cầu / ưu tiên:** REQ-AUTH-SMT-concurrent_session_counter; LOW. Nguồn: `Module_Auth_Login_spec.xlsx` → `TestCase`.
- **Nhóm lỗi / mục tiêu:** Số học: kiểm tra overflow trong mô hình hữu hạn, chưa là phát hiện runtime.
- **Vị trí trong luồng:** Mô hình phép toán/bộ đếm trong KiemTraSoHoc. Cần xác định signedness, miền và độ rộng bit; không gắn int32 của mô hình cho mọi số trong JavaScript.
- **Điều kiện ban đầu:** Đã khai báo biến SMT tương ứng cho dòng 'concurrent_session_counter' Phạm vi mô hình minh họa theo template, không phải lỗi API Node.js.
- **Cách kiểm tra:** Giải các ràng buộc đã khai báo, lưu SAT/model hoặc UNSAT/unknown. Sau đó mới đối chiếu phép toán của triển khai nếu có.
- **Bước/input cụ thể:** 1. Chuẩn bị trạng thái và dữ liệu như điều kiện tiên quyết. → 2. Chạy check_int32_overflow() bằng Z3 trên BieuThucTran của dòng 'concurrent_session_counter' → 3. Thu thập phản hồi/trạng thái cuối và đối chiếu kết quả mong đợi.
- **Điều kiện an toàn mong đợi:** Đánh giá công thức theo đúng miền, signedness và độ rộng bit trong sheet KiemTraSoHoc. Nếu SAT, lưu giá trị chứng minh và phép toán gây vượt miền; nếu UNSAT, lưu giả định và phạm vi đã kiểm tra. Không mặc định SAT và không suy ra tràn số runtime Node.js từ mô hình số nguyên hữu hạn. Chưa chạy solver: chưa xác minh.
- **Mức thực hiện:** chưa được campaign API hiện tại thực thi; giữ trong 75 testcase ngoài campaign. Nội dung ở trên là thiết kế kiểm tra, không phải phát hiện đã xác nhận.

#### TC-AUTH-16 — Kiểm tra tràn số: token_issued_counter

- **Yêu cầu / ưu tiên:** REQ-AUTH-SMT-token_issued_counter; LOW. Nguồn: `Module_Auth_Login_spec.xlsx` → `TestCase`.
- **Nhóm lỗi / mục tiêu:** Số học: kiểm tra overflow trong mô hình hữu hạn, chưa là phát hiện runtime.
- **Vị trí trong luồng:** Mô hình phép toán/bộ đếm trong KiemTraSoHoc. Cần xác định signedness, miền và độ rộng bit; không gắn int32 của mô hình cho mọi số trong JavaScript.
- **Điều kiện ban đầu:** Đã khai báo biến SMT tương ứng cho dòng 'token_issued_counter' Phạm vi mô hình minh họa theo template, không phải lỗi API Node.js.
- **Cách kiểm tra:** Giải các ràng buộc đã khai báo, lưu SAT/model hoặc UNSAT/unknown. Sau đó mới đối chiếu phép toán của triển khai nếu có.
- **Bước/input cụ thể:** 1. Chuẩn bị trạng thái và dữ liệu như điều kiện tiên quyết. → 2. Chạy check_int32_overflow() bằng Z3 trên BieuThucTran của dòng 'token_issued_counter' → 3. Thu thập phản hồi/trạng thái cuối và đối chiếu kết quả mong đợi.
- **Điều kiện an toàn mong đợi:** Đánh giá công thức theo đúng miền, signedness và độ rộng bit trong sheet KiemTraSoHoc. Nếu SAT, lưu giá trị chứng minh và phép toán gây vượt miền; nếu UNSAT, lưu giả định và phạm vi đã kiểm tra. Không mặc định SAT và không suy ra tràn số runtime Node.js từ mô hình số nguyên hữu hạn. Chưa chạy solver: chưa xác minh.
- **Mức thực hiện:** chưa được campaign API hiện tại thực thi; giữ trong 75 testcase ngoài campaign. Nội dung ở trên là thiết kế kiểm tra, không phải phát hiện đã xác nhận.

#### TC-AUTH-17 — Kiểm tra tràn số: account_lockout_counter

- **Yêu cầu / ưu tiên:** REQ-AUTH-SMT-account_lockout_counter; LOW. Nguồn: `Module_Auth_Login_spec.xlsx` → `TestCase`.
- **Nhóm lỗi / mục tiêu:** Số học: kiểm tra overflow trong mô hình hữu hạn, chưa là phát hiện runtime.
- **Vị trí trong luồng:** Mô hình phép toán/bộ đếm trong KiemTraSoHoc. Cần xác định signedness, miền và độ rộng bit; không gắn int32 của mô hình cho mọi số trong JavaScript.
- **Điều kiện ban đầu:** Đã khai báo biến SMT tương ứng cho dòng 'account_lockout_counter' Phạm vi mô hình minh họa theo template, không phải lỗi API Node.js.
- **Cách kiểm tra:** Giải các ràng buộc đã khai báo, lưu SAT/model hoặc UNSAT/unknown. Sau đó mới đối chiếu phép toán của triển khai nếu có.
- **Bước/input cụ thể:** 1. Chuẩn bị trạng thái và dữ liệu như điều kiện tiên quyết. → 2. Chạy check_int32_overflow() bằng Z3 trên BieuThucTran của dòng 'account_lockout_counter' → 3. Thu thập phản hồi/trạng thái cuối và đối chiếu kết quả mong đợi.
- **Điều kiện an toàn mong đợi:** Đánh giá công thức theo đúng miền, signedness và độ rộng bit trong sheet KiemTraSoHoc. Nếu SAT, lưu giá trị chứng minh và phép toán gây vượt miền; nếu UNSAT, lưu giả định và phạm vi đã kiểm tra. Không mặc định SAT và không suy ra tràn số runtime Node.js từ mô hình số nguyên hữu hạn. Chưa chạy solver: chưa xác minh.
- **Mức thực hiện:** chưa được campaign API hiện tại thực thi; giữ trong 75 testcase ngoài campaign. Nội dung ở trên là thiết kế kiểm tra, không phải phát hiện đã xác nhận.

### Module ORD: Tạo đơn hàng

**Luồng nghiệp vụ mong đợi:** Đăng nhập lấy token → chọn sản phẩm/catalog → giỏ hàng và địa chỉ → POST /api/orders → authenticateToken → kiểm tra trường → tạo OrderModel → required/ép kiểu → save → tác dụng phụ/thông báo.

**Tài sản/biên tin cậy:** Đơn giá và tổng tiền là dữ liệu từ client không đáng tin. Server phải xác nhận theo catalog. Điều kiện tiền không hợp lệ phải được xử lý trước khi lưu.

**Điểm đọc code:** [node_harness/index.js:641](D:/Virtual-Try-On-sync/fuzzing-security-testing/node_harness/index.js:641). Đây là code harness; mẫu C/Python không tự nằm trên đường gọi này.

#### TC-ORD-1 — Sai kiểu và cấu trúc giỏ hàng đi vào tầng xử lý đơn

- **Yêu cầu / ưu tiên:** REQ-ORD-1, REQ-ORD-8; HIGH. Nguồn: `Module_Orders_Create_spec.xlsx` → `TestCase`.
- **Nhóm lỗi / mục tiêu:** Kiểm tra cấu trúc đầu vào và toàn vẹn dữ liệu.
- **Vị trí trong luồng:** Đăng nhập lấy token → chọn sản phẩm/catalog → giỏ hàng và địa chỉ → POST /api/orders → authenticateToken → kiểm tra trường → tạo OrderModel → required/ép kiểu → save → tác dụng phụ/thông báo. Đối chiếu vị trí input/thao tác trong testcase với luồng này; không mặc định code hiện đã cưỡng chế đủ điều kiện an toàn.
- **Điều kiện ban đầu:** Đã đăng nhập, có token
- **Cách kiểm tra:** Input có chủ đích/đột biến và oracle theo đặc tả. Concurrency/timing/version ngoài 29 ID chưa được campaign này thực thi.
- **Bước/input cụ thể:** Gửi products: {} (object rỗng) → Gửi products: 'abc' (chuỗi) → Lưu seed, input thực tế, ngữ cảnh xác thực/trạng thái, response và thời gian. Chỉ kết luận crash khi có mã thoát/signal và log tiến trình; timeout là nghi vấn hang.
- **Điều kiện an toàn mong đợi:** HTTP 400/422 cho products sai cấu trúc hoặc số lượng âm; không coi đơn sai cấu trúc là đơn hợp lệ.
- **Mức thực hiện:** FAIL theo oracle hiện tại; 4 kịch bản. Ví dụ `TC-ORD-1:0`, oracle `status`, chuỗi HTTP `[200]`. Chi tiết input và dữ liệu trong `results/spec_excel_aligned/report.json` → `executions`. Không suy rộng trạng thái này sang các điều kiện chưa được oracle kiểm tra.

#### TC-ORD-2 — Thiếu cấu trúc lồng shippingInfo gây ngoại lệ

- **Yêu cầu / ưu tiên:** REQ-ORD-2; HIGH. Nguồn: `Module_Orders_Create_spec.xlsx` → `TestCase`.
- **Nhóm lỗi / mục tiêu:** Kiểm tra cấu trúc lồng / xử lý ngoại lệ.
- **Vị trí trong luồng:** Đăng nhập lấy token → chọn sản phẩm/catalog → giỏ hàng và địa chỉ → POST /api/orders → authenticateToken → kiểm tra trường → tạo OrderModel → required/ép kiểu → save → tác dụng phụ/thông báo. Đối chiếu vị trí input/thao tác trong testcase với luồng này; không mặc định code hiện đã cưỡng chế đủ điều kiện an toàn.
- **Điều kiện ban đầu:** Đã đăng nhập, có token
- **Cách kiểm tra:** Input có chủ đích/đột biến và oracle theo đặc tả. Concurrency/timing/version ngoài 29 ID chưa được campaign này thực thi.
- **Bước/input cụ thể:** 1. Chuẩn bị trạng thái và dữ liệu như điều kiện tiên quyết. → 2. Xóa lần lượt shippingInfo/fullName/phone/address → 3. Thu thập phản hồi/trạng thái cuối và đối chiếu kết quả mong đợi. → Lưu seed, input thực tế, ngữ cảnh xác thực/trạng thái, response và thời gian. Chỉ kết luận crash khi có mã thoát/signal và log tiến trình; timeout là nghi vấn hang.
- **Điều kiện an toàn mong đợi:** HTTP 400 khi thiếu shippingInfo hoặc trường bắt buộc; không phát sinh ngoại lệ chưa xử lý.
- **Mức thực hiện:** PASS theo oracle hiện tại; 4 kịch bản. Ví dụ `TC-ORD-2:shippingInfo`, oracle `status`, chuỗi HTTP `[400]`. Chi tiết input và dữ liệu trong `results/spec_excel_aligned/report.json` → `executions`. Không suy rộng trạng thái này sang các điều kiện chưa được oracle kiểm tra.

#### TC-ORD-3 — Xử lý an toàn totalAmount thiếu/null và xác nhận nhánh required

- **Yêu cầu / ưu tiên:** REQ-ORD-3; HIGH. Nguồn: `Module_Orders_Create_spec.xlsx` → `TestCase`.
- **Nhóm lỗi / mục tiêu:** Xử lý thiếu trường bắt buộc, lỗi required bị đẩy xuống datastore.
- **Vị trí trong luồng:** Đăng nhập lấy token → chọn sản phẩm/catalog → giỏ hàng và địa chỉ → POST /api/orders → authenticateToken → kiểm tra trường → tạo OrderModel → required/ép kiểu → save → tác dụng phụ/thông báo. Đối chiếu vị trí input/thao tác trong testcase với luồng này; không mặc định code hiện đã cưỡng chế đủ điều kiện an toàn.
- **Điều kiện ban đầu:** Harness node_harness chạy được; seed_order_valid.json tạo đơn hợp lệ, có token và catalog/shipping hợp lệ. Phần concolic cần z3-solver trong requirements.txt; chạy từ thư mục gốc. Không cần MongoDB/production.
- **Cách kiểm tra:** Campaign API có kịch bản tương ứng; concolic riêng ở concolic.py dùng trace totalAmount và Z3. Xem cả hai report, không gộp lượt chạy hoặc khẳng định bao phủ toàn miền.
- **Bước/input cụ thể:** A. Kịch bản API: giữ seed hợp lệ, xóa totalAmount; gửi POST /api/orders bằng token hợp lệ, lưu response. → B. Concolic: chạy python fuzzing-security-testing/fuzzers/whitebox_fuzzer.py --concolic --iterations-per-target 12. Bắt đầu totalAmount=400000; thu branch_trace thật tại OrderModel.save. → Giữ tiền tố và phủ định order.total.required từ false sang true; Z3 có thể chọn đại diện null hoặc missing. Lưu công thức/model, giải mã thành JSON và gửi lại API. Đối chiếu nhánh required=true với tiền tố đã giải. Không bắt buộc solver chọn cả null và missing trong một lần chạy. → Xem concolic/report.json và evidence: input, result.branch_trace, orders_created, violations và replay. Phân biệt lỗi ứng dụng với lỗi setup, timeout hoặc tiến trình kết thúc bất thường.
- **Điều kiện an toàn mong đợi:** Yêu cầu ứng dụng: thiếu/null trả HTTP 400 có kiểm soát, không tạo đơn; HTTP 500 là vi phạm xử lý lỗi đầu vào, chưa chứng minh crash/bộ nhớ. Yêu cầu công cụ concolic: SAT phải sinh input có tiền tố nhánh thực đo đúng với model; lệch mô hình/trace phải báo lỗi công cụ, không ghi xác nhận nhánh thành công. Input vi phạm được replay từ dữ liệu sạch và lưu kết quả. Chưa chạy hoặc không có bằng chứng thì chưa xác minh.
- **Mức thực hiện:** FAIL theo oracle hiện tại; 1 kịch bản. Ví dụ `TC-ORD-3:missing-total`, oracle `status`, chuỗi HTTP `[500]`. Chi tiết input và dữ liệu trong `results/spec_excel_aligned/report.json` → `executions`. Không suy rộng trạng thái này sang các điều kiện chưa được oracle kiểm tra.

#### TC-ORD-4 — Sai kiểu totalAmount: mutation và concolic xác nhận đường ép kiểu

- **Yêu cầu / ưu tiên:** REQ-ORD-4; HIGH. Nguồn: `Module_Orders_Create_spec.xlsx` → `TestCase`.
- **Nhóm lỗi / mục tiêu:** Kiểm tra kiểu / xử lý ngoại lệ; không phải integer overflow.
- **Vị trí trong luồng:** Đăng nhập lấy token → chọn sản phẩm/catalog → giỏ hàng và địa chỉ → POST /api/orders → authenticateToken → kiểm tra trường → tạo OrderModel → required/ép kiểu → save → tác dụng phụ/thông báo. Đối chiếu vị trí input/thao tác trong testcase với luồng này; không mặc định code hiện đã cưỡng chế đủ điều kiện an toàn.
- **Điều kiện ban đầu:** Đăng nhập thành công, seed đơn hợp lệ, catalog/shipping giữ cố định. Cài z3-solver; có thể chạy harness Node và đọc evidence. Chỉ biến đổi totalAmount trong phần concolic.
- **Cách kiểm tra:** Campaign API có kịch bản tương ứng; concolic riêng ở concolic.py dùng trace totalAmount và Z3. Xem cả hai report, không gộp lượt chạy hoặc khẳng định bao phủ toàn miền.
- **Bước/input cụ thể:** A. Campaign API: thử totalAmount là object, array, chuỗi "NaN"/"Infinity" và các mutation đã khai báo; đây là chuỗi JSON, không phải literal NaN/Infinity ngoài chuẩn JSON. → B. Chạy python fuzzing-security-testing/fuzzers/whitebox_fuzzer.py --concolic --iterations-per-target 12. Biến total_kind là Int từ 0 đến 7, lần lượt đại diện number=400000, numeric_string="400000", invalid_string="not-a-number", object={}, null, missing, boolean=true, array=[]. Các trường khác dùng seed hợp lệ. → Lấy trace order.total.required, cast.empty, cast.number, cast.boolean, cast.invalid thực sự đi qua. Với mỗi nhánh được chọn, giữ tiền tố, phủ định nhánh và bỏ hậu tố cũ; giải bằng Z3 rồi gửi JSON mới qua POST /api/orders để xác nhận tiền tố. → Lưu SAT/model, UNSAT hoặc unknown riêng; UNSAT chỉ áp dụng miền/prefix đã mã hóa. Trong tiền tố required=false, yêu cầu cast.empty=true là mâu thuẫn. Không coi UNSAT này là chứng minh API an toàn. → Kiểm tra HTTP và orders_created; chạy lại input có vi phạm. Chiến dịch chọn đại diện để mở đường mới, không cam kết thử cả 8 đại diện; test hồi quy của công cụ đối chiếu cả 8 đại diện với nhánh Node.
- **Điều kiện an toàn mong đợi:** Yêu cầu ứng dụng: sai kiểu từ chối HTTP 400/422; không HTTP 5xx hoặc tạo đơn khi từ chối. Chuỗi số/boolean được chấp nhận qua ép kiểu là vi phạm hợp đồng kiểu, chưa tự chứng minh thiệt hại hoặc khả năng khai thác. Yêu cầu công cụ: model phải khớp trace và tiền tố mục tiêu; báo lỗi nếu lệch, không ghi xác nhận giả. UNKNOWN không được coi là UNSAT. Lưu điều kiện, input, response, trạng thái dữ liệu và replay; số input vi phạm không phải số lỗi gốc. Không suy ra lỗi bộ nhớ từ HTTP 500.
- **Mức thực hiện:** FAIL theo oracle hiện tại; 12 kịch bản. Ví dụ `TC-ORD-4:0`, oracle `status`, chuỗi HTTP `[500]`. Chi tiết input và dữ liệu trong `results/spec_excel_aligned/report.json` → `executions`. Không suy rộng trạng thái này sang các điều kiện chưa được oracle kiểm tra.

#### TC-ORD-5 — Tin cậy giá từ client làm sai toàn vẹn đơn hàng

- **Yêu cầu / ưu tiên:** REQ-ORD-5; HIGH. Nguồn: `Module_Orders_Create_spec.xlsx` → `TestCase`.
- **Nhóm lỗi / mục tiêu:** Toàn vẹn nghiệp vụ: tin cậy giá client.
- **Vị trí trong luồng:** Đăng nhập lấy token → chọn sản phẩm/catalog → giỏ hàng và địa chỉ → POST /api/orders → authenticateToken → kiểm tra trường → tạo OrderModel → required/ép kiểu → save → tác dụng phụ/thông báo. Đối chiếu vị trí input/thao tác trong testcase với luồng này; không mặc định code hiện đã cưỡng chế đủ điều kiện an toàn.
- **Điều kiện ban đầu:** Đã đăng nhập, có token, 1 sản phẩm giá 200000
- **Cách kiểm tra:** Input có chủ đích/đột biến và oracle theo đặc tả. Concurrency/timing/version ngoài 29 ID chưa được campaign này thực thi.
- **Bước/input cụ thể:** 1. Chuẩn bị trạng thái và dữ liệu như điều kiện tiên quyết. → 2. Gửi totalAmount=400000, sản phẩm thật giá 200000 x1 → 3. Thu thập phản hồi/trạng thái cuối và đối chiếu kết quả mong đợi. → Lưu seed, input thực tế, ngữ cảnh xác thực/trạng thái, response và thời gian. Chỉ kết luận crash khi có mã thoát/signal và log tiến trình; timeout là nghi vấn hang.
- **Điều kiện an toàn mong đợi:** Server từ chối giá/tổng bị sửa hoặc tính lại từ catalog tin cậy; không lưu tổng bị giả mạo.
- **Mức thực hiện:** FAIL theo oracle hiện tại; 1 kịch bản. Ví dụ `TC-ORD-5:catalog-price`, oracle `catalog_total`, chuỗi HTTP `[200]`. Chi tiết input và dữ liệu trong `results/spec_excel_aligned/report.json` → `executions`. Không suy rộng trạng thái này sang các điều kiện chưa được oracle kiểm tra.

#### TC-ORD-6 — Giá trị âm vượt qua kiểm tra miền số tiền

- **Yêu cầu / ưu tiên:** REQ-ORD-6; HIGH. Nguồn: `Module_Orders_Create_spec.xlsx` → `TestCase`.
- **Nhóm lỗi / mục tiêu:** Kiểm tra miền số tiền; số âm không đồng nghĩa overflow.
- **Vị trí trong luồng:** Đăng nhập lấy token → chọn sản phẩm/catalog → giỏ hàng và địa chỉ → POST /api/orders → authenticateToken → kiểm tra trường → tạo OrderModel → required/ép kiểu → save → tác dụng phụ/thông báo. Đối chiếu vị trí input/thao tác trong testcase với luồng này; không mặc định code hiện đã cưỡng chế đủ điều kiện an toàn.
- **Điều kiện ban đầu:** Đã đăng nhập, có token
- **Cách kiểm tra:** Input có chủ đích/đột biến và oracle theo đặc tả. Concurrency/timing/version ngoài 29 ID chưa được campaign này thực thi.
- **Bước/input cụ thể:** 1. Chuẩn bị trạng thái và dữ liệu như điều kiện tiên quyết. → 2. Gửi totalAmount = -999999999 → 3. Thu thập phản hồi/trạng thái cuối và đối chiếu kết quả mong đợi. → Lưu seed, input thực tế, ngữ cảnh xác thực/trạng thái, response và thời gian. Chỉ kết luận crash khi có mã thoát/signal và log tiến trình; timeout là nghi vấn hang.
- **Điều kiện an toàn mong đợi:** HTTP 400/422; không chấp nhận tổng tiền âm.
- **Mức thực hiện:** FAIL theo oracle hiện tại; 1 kịch bản. Ví dụ `TC-ORD-6:negative-total`, oracle `status`, chuỗi HTTP `[200]`. Chi tiết input và dữ liệu trong `results/spec_excel_aligned/report.json` → `executions`. Không suy rộng trạng thái này sang các điều kiện chưa được oracle kiểm tra.

#### TC-ORD-18 — Giả mạo đồng thời đơn giá và tổng tiền để vượt oracle

- **Yêu cầu / ưu tiên:** REQ-ORD-5; HIGH. Nguồn: `Module_Orders_Create_spec.xlsx` → `TestCase`.
- **Nhóm lỗi / mục tiêu:** Toàn vẹn nghiệp vụ / độ đúng của oracle giá.
- **Vị trí trong luồng:** Đăng nhập lấy token → chọn sản phẩm/catalog → giỏ hàng và địa chỉ → POST /api/orders → authenticateToken → kiểm tra trường → tạo OrderModel → required/ép kiểu → save → tác dụng phụ/thông báo. Đối chiếu vị trí input/thao tác trong testcase với luồng này; không mặc định code hiện đã cưỡng chế đủ điều kiện an toàn.
- **Điều kiện ban đầu:** Catalog productId=1 có giá 200000; actor hợp lệ. Phạm vi: harness mô phỏng; testcase mới chưa có kịch bản thực thi tự động.
- **Cách kiểm tra:** Input có chủ đích/đột biến và oracle theo đặc tả. Concurrency/timing/version ngoài 29 ID chưa được campaign này thực thi.
- **Bước/input cụ thể:** 1. Gửi sản phẩm price=1, quantity=2, totalAmount=2; đọc giá trị đơn đã lưu nếu thành công. → 2. Thu thập response và dữ liệu cuối để đối chiếu kết quả mong đợi. → Dữ liệu thử: {"products":[{"productId":1,"price":1,"quantity":2}],"totalAmount":2} → Lưu seed, input thực tế, ngữ cảnh xác thực/trạng thái, response và thời gian. Chỉ kết luận crash khi có mã thoát/signal và log tiến trình; timeout là nghi vấn hang.
- **Điều kiện an toàn mong đợi:** Từ chối 400/422 hoặc tính lại từ catalog thành 400000 trong seed không phí/giảm giá; không lưu tổng 2.
- **Mức thực hiện:** FAIL theo oracle hiện tại; 1 kịch bản. Ví dụ `TC-ORD-18:catalog`, oracle `catalog_total`, chuỗi HTTP `[200]`. Chi tiết input và dữ liệu trong `results/spec_excel_aligned/report.json` → `executions`. Không suy rộng trạng thái này sang các điều kiện chưa được oracle kiểm tra.

#### TC-ORD-20 — Kiểm tra quy trình fuzzing: Chuyển input blackbox sang khảo sát coverage

- **Yêu cầu / ưu tiên:** REQ-ORD-FUZZ-20; HIGH. Nguồn: `Module_Orders_Create_spec.xlsx` → `TestCase`.
- **Nhóm lỗi / mục tiêu:** Độ đúng công cụ fuzzing và bằng chứng; không tự là lỗ hổng nghiệp vụ.
- **Vị trí trong luồng:** Kiểm tra chính công cụ điều phối, replay hoặc phân loại bằng chứng; không phải mặc định một lỗ hổng trong nghiệp vụ bán hàng.
- **Điều kiện ban đầu:** Có report blackbox mới chứa target=orders, input và had_auth; target được hỗ trợ; dữ liệu harness được seed sạch. Chế độ --blackbox-report là coverage-guided, khác --concolic.
- **Cách kiểm tra:** Đối chiếu input/ngữ cảnh/log với từng pha công cụ; phân biệt kiểm tra quy trình và xác nhận lỗi ứng dụng.
- **Bước/input cụ thể:** 1. Chọn input blackbox có triệu chứng, lưu đường dẫn report và trạng thái đã biết. → 2. Chạy whitebox_fuzzer.py với --blackbox-report <report.json> --iterations-per-target 12, không kết hợp --concolic. → 3. So sánh target, input và had_auth tại exact_replay. → 4. Phân biệt các pha exact_replay, neighbor_probe, coverage_mutation. → 5. Kiểm tra cách bỏ qua report thiếu had_auth; không đoán token/quyền. → 6. Nếu chạy --concolic riêng, dùng seed_order_valid.json và trace các nhánh totalAmount, không mô tả đây là replay đầy đủ ngữ cảnh blackbox.
- **Điều kiện an toàn mong đợi:** Khảo sát coverage giữ input và trạng thái bật/tắt xác thực ở lần đầu; không cam kết cùng token/ID hoặc lịch sử dữ liệu. Không tái hiện từ dữ liệu sạch phải ghi khác biệt trạng thái, không tự bác bỏ phát hiện. Coverage và lân cận không được trình bày thành symbolic execution. Concolic báo cáo riêng model, trace và tiền tố nhánh được xác nhận.
- **Mức thực hiện:** chưa được campaign API hiện tại thực thi; giữ trong 75 testcase ngoài campaign. Nội dung ở trên là thiết kế kiểm tra, không phải phát hiện đã xác nhận.

#### TC-ORD-21 — Kiểm tra quy trình fuzzing: Khảo sát giá trị số quanh input gây lỗi

- **Yêu cầu / ưu tiên:** REQ-ORD-FUZZ-21; HIGH. Nguồn: `Module_Orders_Create_spec.xlsx` → `TestCase`.
- **Nhóm lỗi / mục tiêu:** Độ đúng công cụ fuzzing và bằng chứng; không tự là lỗ hổng nghiệp vụ.
- **Vị trí trong luồng:** Kiểm tra chính công cụ điều phối, replay hoặc phân loại bằng chứng; không phải mặc định một lỗ hổng trong nghiệp vụ bán hàng.
- **Điều kiện ban đầu:** Có input orders bất thường với trường số hữu hạn x; cùng catalog, actor, phí/giảm giá và trạng thái seed ở mỗi lượt; công cụ khảo sát chạy độc lập.
- **Cách kiểm tra:** Đối chiếu input/ngữ cảnh/log với từng pha công cụ; phân biệt kiểm tra quy trình và xác nhận lỗi ứng dụng.
- **Bước/input cụ thể:** 1. Lưu input gốc x và triệu chứng. → 2. Giữ các trường khác, thử x-1, x, x+1 và 0 từ trạng thái sạch; đổi một trường mỗi lượt. → 3. Lặp lại ba lần từng điểm có triệu chứng. → 4. Lưu HTTP, dữ liệu cuối, timeout, coverage nếu có; đối chiếu oracle nghiệp vụ và lỗi tiến trình riêng.
- **Điều kiện an toàn mong đợi:** Có bảng điểm đã thử và triệu chứng từng điểm. HTTP 500 chỉ ghi lỗi ứng dụng, không ghi memory crash. Chỉ báo miền đã khảo sát; chưa được nhận biên nhỏ nhất/lớn nhất hay tính đơn điệu nếu chưa chứng minh.
- **Mức thực hiện:** chưa được campaign API hiện tại thực thi; giữ trong 75 testcase ngoài campaign. Nội dung ở trên là thiết kế kiểm tra, không phải phát hiện đã xác nhận.

#### TC-ORD-8 — Hàm sinh mã C: parse_discount_code (buffer-overflow)

- **Yêu cầu / ưu tiên:** REQ-ORD-FIX-parse_discount_code; HIGH. Nguồn: `Module_Orders_Create_spec.xlsx` → `TestCase`.
- **Nhóm lỗi / mục tiêu:** An toàn bộ nhớ / quản lý tài nguyên trong mẫu C độc lập: buffer-overflow
- **Vị trí trong luồng:** Mẫu C độc lập lấy dữ liệu nghiệp vụ làm bối cảnh. Không coi là bước gọi native đã xác nhận của API; cần xem HamSinhMa và build/instrument mẫu trước khi kết luận runtime.
- **Điều kiện ban đầu:** Mẫu C parse_discount_code, lỗi cấy buffer-overflow; có driver gọi hàm, compiler và AddressSanitizer hoạt động. Phạm vi native fixture, không phải API Node.js.
Chỉ chạy trên hàm C minh họa độc lập; cần compiler và instrumentation phù hợp. Không phải đường thực thi native đã xác nhận của API Node.js.
- **Cách kiểm tra:** Fuzz input của hàm C + instrumentation ASan/LSan phù hợp + đối chứng an toàn; đây là phương pháp dự kiến, chưa chạy trong campaign API.
- **Bước/input cụ thể:** 1. Sinh mã C và chạy kiểm tra tĩnh như testcase gốc. → 2. Tạo driver gọi parse_discount_code, biên dịch -g -O0 và instrumentation phù hợp; kiểm tra đối chứng công cụ. → 3. Chạy chuỗi ASCII dài B-1, B, B+1 với B=32 byte và đối chứng ngắn. → 4. Lưu input, binary/source hash, stderr, exit code/signal và vị trí chẩn đoán. → 5. Tái hiện từ tiến trình sạch; chạy đối chứng an toàn cùng input. → Chạy cả mẫu lỗi cấy và đối chứng an toàn trên cùng input; lưu input, build flags, stderr, mã thoát và vị trí lỗi; lặp lại input gây lỗi.
- **Điều kiện an toàn mong đợi:** Đối chứng an toàn không có chẩn đoán buffer-overflow; mẫu lỗi cấy phải có chẩn đoán buffer-overflow tại hàm mục tiêu từ AddressSanitizer hoặc công cụ phát hiện lỗi bộ nhớ tương đương. Mẫu lỗi bị phát hiện là xác nhận đối chứng công cụ, không phải ứng dụng đã an toàn. Thiếu công cụ/bằng chứng: chưa xác minh. Không dùng HTTP 500 làm bằng chứng; leak không bắt buộc làm tiến trình crash.
- **Mức thực hiện:** chưa được campaign API hiện tại thực thi; giữ trong 75 testcase ngoài campaign. Nội dung ở trên là thiết kế kiểm tra, không phải phát hiện đã xác nhận.

#### TC-ORD-11 — Hàm sinh mã C: write_order_transaction_log (memory-leak)

- **Yêu cầu / ưu tiên:** REQ-ORD-FIX-write_order_transaction_log; HIGH. Nguồn: `Module_Orders_Create_spec.xlsx` → `TestCase`.
- **Nhóm lỗi / mục tiêu:** An toàn bộ nhớ / quản lý tài nguyên trong mẫu C độc lập: memory-leak
- **Vị trí trong luồng:** Mẫu C độc lập lấy dữ liệu nghiệp vụ làm bối cảnh. Không coi là bước gọi native đã xác nhận của API; cần xem HamSinhMa và build/instrument mẫu trước khi kết luận runtime.
- **Điều kiện ban đầu:** Mẫu C write_order_transaction_log, lỗi cấy memory-leak; có driver gọi hàm, compiler và LeakSanitizer hoặc công cụ kiểm tra leak tương đương hoạt động. Phạm vi native fixture, không phải API Node.js.
Chỉ chạy trên hàm C minh họa độc lập; cần compiler và instrumentation phù hợp. Không phải đường thực thi native đã xác nhận của API Node.js.
- **Cách kiểm tra:** Fuzz input của hàm C + instrumentation ASan/LSan phù hợp + đối chứng an toàn; đây là phương pháp dự kiến, chưa chạy trong campaign API.
- **Bước/input cụ thể:** 1. Sinh mã C và chạy kiểm tra tĩnh như testcase gốc. → 2. Tạo driver gọi write_order_transaction_log, biên dịch -g -O0 và instrumentation phù hợp; kiểm tra đối chứng công cụ. → 3. Chạy đường thực thi hàm một lần trên mỗi tiến trình mới; có đối chứng đã sửa tương ứng. → 4. Lưu input, binary/source hash, stderr, exit code/signal và vị trí chẩn đoán. → 5. Tái hiện từ tiến trình sạch; chạy đối chứng an toàn cùng input. → Chạy cả mẫu lỗi cấy và đối chứng an toàn trên cùng input; lưu input, build flags, stderr, mã thoát và vị trí lỗi; lặp lại input gây lỗi.
- **Điều kiện an toàn mong đợi:** Đối chứng an toàn không có chẩn đoán memory-leak; mẫu lỗi cấy phải có chẩn đoán memory-leak tại hàm mục tiêu từ LeakSanitizer hoặc công cụ phát hiện leak tương đương. Mẫu lỗi bị phát hiện là xác nhận đối chứng công cụ, không phải ứng dụng đã an toàn. Thiếu công cụ/bằng chứng: chưa xác minh. Không dùng HTTP 500 làm bằng chứng; leak không bắt buộc làm tiến trình crash.
- **Mức thực hiện:** chưa được campaign API hiện tại thực thi; giữ trong 75 testcase ngoài campaign. Nội dung ở trên là thiết kế kiểm tra, không phải phát hiện đã xác nhận.

#### TC-ORD-12 — Hàm sinh mã C: close_order_checkout_session (double-free)

- **Yêu cầu / ưu tiên:** REQ-ORD-FIX-close_order_checkout_session; HIGH. Nguồn: `Module_Orders_Create_spec.xlsx` → `TestCase`.
- **Nhóm lỗi / mục tiêu:** An toàn bộ nhớ / quản lý tài nguyên trong mẫu C độc lập: double-free
- **Vị trí trong luồng:** Mẫu C độc lập lấy dữ liệu nghiệp vụ làm bối cảnh. Không coi là bước gọi native đã xác nhận của API; cần xem HamSinhMa và build/instrument mẫu trước khi kết luận runtime.
- **Điều kiện ban đầu:** Mẫu C close_order_checkout_session, lỗi cấy double-free; có driver gọi hàm, compiler và AddressSanitizer hoạt động. Phạm vi native fixture, không phải API Node.js.
Chỉ chạy trên hàm C minh họa độc lập; cần compiler và instrumentation phù hợp. Không phải đường thực thi native đã xác nhận của API Node.js.
- **Cách kiểm tra:** Fuzz input của hàm C + instrumentation ASan/LSan phù hợp + đối chứng an toàn; đây là phương pháp dự kiến, chưa chạy trong campaign API.
- **Bước/input cụ thể:** 1. Sinh mã C và chạy kiểm tra tĩnh như testcase gốc. → 2. Tạo driver gọi close_order_checkout_session, biên dịch -g -O0 và instrumentation phù hợp; kiểm tra đối chứng công cụ. → 3. Chạy đường thực thi hàm một lần trên mỗi tiến trình mới; có đối chứng đã sửa tương ứng. → 4. Lưu input, binary/source hash, stderr, exit code/signal và vị trí chẩn đoán. → 5. Tái hiện từ tiến trình sạch; chạy đối chứng an toàn cùng input. → Chạy cả mẫu lỗi cấy và đối chứng an toàn trên cùng input; lưu input, build flags, stderr, mã thoát và vị trí lỗi; lặp lại input gây lỗi.
- **Điều kiện an toàn mong đợi:** Đối chứng an toàn không có chẩn đoán double-free; mẫu lỗi cấy phải có chẩn đoán double-free tại hàm mục tiêu từ AddressSanitizer hoặc công cụ phát hiện lỗi bộ nhớ tương đương. Mẫu lỗi bị phát hiện là xác nhận đối chứng công cụ, không phải ứng dụng đã an toàn. Thiếu công cụ/bằng chứng: chưa xác minh. Không dùng HTTP 500 làm bằng chứng; leak không bắt buộc làm tiến trình crash.
- **Mức thực hiện:** chưa được campaign API hiện tại thực thi; giữ trong 75 testcase ngoài campaign. Nội dung ở trên là thiết kế kiểm tra, không phải phát hiện đã xác nhận.

#### TC-ORD-13 — Hàm sinh mã C: release_cart_cache_buffer (use-after-free)

- **Yêu cầu / ưu tiên:** REQ-ORD-FIX-release_cart_cache_buffer; HIGH. Nguồn: `Module_Orders_Create_spec.xlsx` → `TestCase`.
- **Nhóm lỗi / mục tiêu:** An toàn bộ nhớ / quản lý tài nguyên trong mẫu C độc lập: use-after-free
- **Vị trí trong luồng:** Mẫu C độc lập lấy dữ liệu nghiệp vụ làm bối cảnh. Không coi là bước gọi native đã xác nhận của API; cần xem HamSinhMa và build/instrument mẫu trước khi kết luận runtime.
- **Điều kiện ban đầu:** Mẫu C release_cart_cache_buffer, lỗi cấy use-after-free; có driver gọi hàm, compiler và AddressSanitizer hoạt động. Phạm vi native fixture, không phải API Node.js.
Chỉ chạy trên hàm C minh họa độc lập; cần compiler và instrumentation phù hợp. Không phải đường thực thi native đã xác nhận của API Node.js.
- **Cách kiểm tra:** Fuzz input của hàm C + instrumentation ASan/LSan phù hợp + đối chứng an toàn; đây là phương pháp dự kiến, chưa chạy trong campaign API.
- **Bước/input cụ thể:** 1. Sinh mã C và chạy kiểm tra tĩnh như testcase gốc. → 2. Tạo driver gọi release_cart_cache_buffer, biên dịch -g -O0 và instrumentation phù hợp; kiểm tra đối chứng công cụ. → 3. Chạy đường thực thi hàm một lần trên mỗi tiến trình mới; có đối chứng đã sửa tương ứng. → 4. Lưu input, binary/source hash, stderr, exit code/signal và vị trí chẩn đoán. → 5. Tái hiện từ tiến trình sạch; chạy đối chứng an toàn cùng input. → Chạy cả mẫu lỗi cấy và đối chứng an toàn trên cùng input; lưu input, build flags, stderr, mã thoát và vị trí lỗi; lặp lại input gây lỗi.
- **Điều kiện an toàn mong đợi:** Đối chứng an toàn không có chẩn đoán use-after-free; mẫu lỗi cấy phải có chẩn đoán use-after-free tại hàm mục tiêu từ AddressSanitizer hoặc công cụ phát hiện lỗi bộ nhớ tương đương. Mẫu lỗi bị phát hiện là xác nhận đối chứng công cụ, không phải ứng dụng đã an toàn. Thiếu công cụ/bằng chứng: chưa xác minh. Không dùng HTTP 500 làm bằng chứng; leak không bắt buộc làm tiến trình crash.
- **Mức thực hiện:** chưa được campaign API hiện tại thực thi; giữ trong 75 testcase ngoài campaign. Nội dung ở trên là thiết kế kiểm tra, không phải phát hiện đã xác nhận.

#### TC-ORD-9 — Hàm Python: order_error_rate chia cho 0

- **Yêu cầu / ưu tiên:** REQ-ORD-FIX-order_error_rate; MEDIUM. Nguồn: `Module_Orders_Create_spec.xlsx` → `TestCase`.
- **Nhóm lỗi / mục tiêu:** Ngoại lệ tính toán trong mẫu Python độc lập.
- **Vị trí trong luồng:** Hàm Python minh họa độc lập của bước thống kê/tính toán; không đồng nhất traceback Python với server Node.js bị crash.
- **Điều kiện ban đầu:** Đã sinh mã Python Phạm vi mô hình minh họa theo template, không phải lỗi API Node.js.
- **Cách kiểm tra:** Sinh/đột biến đối số, bắt ngoại lệ và lưu traceback; cần mẫu đối chứng. Chưa được campaign API thực thi.
- **Bước/input cụ thể:** 1. Chuẩn bị trạng thái và dữ liệu như điều kiện tiên quyết. → 2. Chạy blackbox_fuzz() với total_orders=0 → 3. Thu thập phản hồi/trạng thái cuối và đối chiếu kết quả mong đợi.
- **Điều kiện an toàn mong đợi:** Mẫu lỗi cấy phát sinh ZeroDivisionError với input chia cho 0; lưu traceback, input và cách gọi. Đối chứng an toàn xử lý trường hợp này có kiểm soát. Ngoại lệ Python chưa chứng minh crash server hoặc lỗi bộ nhớ native; thiếu thực thi thì chưa xác minh.
- **Mức thực hiện:** chưa được campaign API hiện tại thực thi; giữ trong 75 testcase ngoài campaign. Nội dung ở trên là thiết kế kiểm tra, không phải phát hiện đã xác nhận.

#### TC-ORD-7 — Sử dụng discountCode ĐỒNG THỜI (race)

- **Yêu cầu / ưu tiên:** REQ-ORD-7, NFR-ORD-4; HIGH. Nguồn: `Module_Orders_Create_spec.xlsx` → `TestCase`.
- **Nhóm lỗi / mục tiêu:** Đồng bộ / toàn vẹn cập nhật / tương thích version; xác định rõ ngữ cảnh đồng thời hoặc tuần tự trong bước thử.
- **Vị trí trong luồng:** Đăng nhập lấy token → chọn sản phẩm/catalog → giỏ hàng và địa chỉ → POST /api/orders → authenticateToken → kiểm tra trường → tạo OrderModel → required/ép kiểu → save → tác dụng phụ/thông báo. Đối chiếu vị trí input/thao tác trong testcase với luồng này; không mặc định code hiện đã cưỡng chế đủ điều kiện an toàn.
- **Điều kiện ban đầu:** Đã đăng nhập, có token, mã SALE10 chưa dùng
- **Cách kiểm tra:** Input có chủ đích/đột biến và oracle theo đặc tả. Concurrency/timing/version ngoài 29 ID chưa được campaign này thực thi.
- **Bước/input cụ thể:** 1. Chuẩn bị trạng thái và dữ liệu như điều kiện tiên quyết. → 2. Gửi 2 request tạo đơn hàng CÙNG discountCode=SALE10 ĐỒNG THỜI (không tuần tự) → 3. Thu thập phản hồi/trạng thái cuối và đối chiếu kết quả mong đợi.
- **Điều kiện an toàn mong đợi:** Với discountCode dùng một lần và hai request thực sự đồng thời, chỉ một request áp dụng mã thành công; kiểm tra cả dữ liệu lưu. Lưu lịch gửi/nhận để xác nhận đồng thời; chạy tuần tự chưa chứng minh không có race.
- **Mức thực hiện:** chưa được campaign API hiện tại thực thi; giữ trong 75 testcase ngoài campaign. Nội dung ở trên là thiết kế kiểm tra, không phải phát hiện đã xác nhận.

#### TC-ORD-10 — Kiểm tra tràn số: total_order_value_counter

- **Yêu cầu / ưu tiên:** REQ-ORD-SMT-total_order_value_counter; LOW. Nguồn: `Module_Orders_Create_spec.xlsx` → `TestCase`.
- **Nhóm lỗi / mục tiêu:** Số học: kiểm tra overflow trong mô hình hữu hạn, chưa là phát hiện runtime.
- **Vị trí trong luồng:** Mô hình phép toán/bộ đếm trong KiemTraSoHoc. Cần xác định signedness, miền và độ rộng bit; không gắn int32 của mô hình cho mọi số trong JavaScript.
- **Điều kiện ban đầu:** Đã khai báo biến SMT Phạm vi mô hình minh họa theo template, không phải lỗi API Node.js.
- **Cách kiểm tra:** Giải các ràng buộc đã khai báo, lưu SAT/model hoặc UNSAT/unknown. Sau đó mới đối chiếu phép toán của triển khai nếu có.
- **Bước/input cụ thể:** 1. Chuẩn bị trạng thái và dữ liệu như điều kiện tiên quyết. → 2. Chạy check_int32_overflow() bằng Z3 → 3. Thu thập phản hồi/trạng thái cuối và đối chiếu kết quả mong đợi.
- **Điều kiện an toàn mong đợi:** Đánh giá công thức theo đúng miền, signedness và độ rộng bit trong sheet KiemTraSoHoc. Nếu SAT, lưu giá trị chứng minh và phép toán gây vượt miền; nếu UNSAT, lưu giả định và phạm vi đã kiểm tra. Không mặc định SAT và không suy ra tràn số runtime Node.js từ mô hình số nguyên hữu hạn. Chưa chạy solver: chưa xác minh.
- **Mức thực hiện:** chưa được campaign API hiện tại thực thi; giữ trong 75 testcase ngoài campaign. Nội dung ở trên là thiết kế kiểm tra, không phải phát hiện đã xác nhận.

#### TC-ORD-14 — Kiểm tra tràn số: daily_order_counter

- **Yêu cầu / ưu tiên:** REQ-ORD-SMT-daily_order_counter; LOW. Nguồn: `Module_Orders_Create_spec.xlsx` → `TestCase`.
- **Nhóm lỗi / mục tiêu:** Số học: kiểm tra overflow trong mô hình hữu hạn, chưa là phát hiện runtime.
- **Vị trí trong luồng:** Mô hình phép toán/bộ đếm trong KiemTraSoHoc. Cần xác định signedness, miền và độ rộng bit; không gắn int32 của mô hình cho mọi số trong JavaScript.
- **Điều kiện ban đầu:** Đã khai báo biến SMT tương ứng cho dòng 'daily_order_counter' Phạm vi mô hình minh họa theo template, không phải lỗi API Node.js.
- **Cách kiểm tra:** Giải các ràng buộc đã khai báo, lưu SAT/model hoặc UNSAT/unknown. Sau đó mới đối chiếu phép toán của triển khai nếu có.
- **Bước/input cụ thể:** 1. Chuẩn bị trạng thái và dữ liệu như điều kiện tiên quyết. → 2. Chạy check_int32_overflow() bằng Z3 trên BieuThucTran của dòng 'daily_order_counter' → 3. Thu thập phản hồi/trạng thái cuối và đối chiếu kết quả mong đợi.
- **Điều kiện an toàn mong đợi:** Đánh giá công thức theo đúng miền, signedness và độ rộng bit trong sheet KiemTraSoHoc. Nếu SAT, lưu giá trị chứng minh và phép toán gây vượt miền; nếu UNSAT, lưu giả định và phạm vi đã kiểm tra. Không mặc định SAT và không suy ra tràn số runtime Node.js từ mô hình số nguyên hữu hạn. Chưa chạy solver: chưa xác minh.
- **Mức thực hiện:** chưa được campaign API hiện tại thực thi; giữ trong 75 testcase ngoài campaign. Nội dung ở trên là thiết kế kiểm tra, không phải phát hiện đã xác nhận.

#### TC-ORD-15 — Kiểm tra tràn số: concurrent_discount_redeem_counter

- **Yêu cầu / ưu tiên:** REQ-ORD-SMT-concurrent_discount_redeem_counter; LOW. Nguồn: `Module_Orders_Create_spec.xlsx` → `TestCase`.
- **Nhóm lỗi / mục tiêu:** Số học: kiểm tra overflow trong mô hình hữu hạn, chưa là phát hiện runtime.
- **Vị trí trong luồng:** Mô hình phép toán/bộ đếm trong KiemTraSoHoc. Cần xác định signedness, miền và độ rộng bit; không gắn int32 của mô hình cho mọi số trong JavaScript.
- **Điều kiện ban đầu:** Đã khai báo biến SMT tương ứng cho dòng 'concurrent_discount_redeem_counter' Phạm vi mô hình minh họa theo template, không phải lỗi API Node.js.
- **Cách kiểm tra:** Giải các ràng buộc đã khai báo, lưu SAT/model hoặc UNSAT/unknown. Sau đó mới đối chiếu phép toán của triển khai nếu có.
- **Bước/input cụ thể:** 1. Chuẩn bị trạng thái và dữ liệu như điều kiện tiên quyết. → 2. Chạy check_int32_overflow() bằng Z3 trên BieuThucTran của dòng 'concurrent_discount_redeem_counter' → 3. Thu thập phản hồi/trạng thái cuối và đối chiếu kết quả mong đợi.
- **Điều kiện an toàn mong đợi:** Đánh giá công thức theo đúng miền, signedness và độ rộng bit trong sheet KiemTraSoHoc. Nếu SAT, lưu giá trị chứng minh và phép toán gây vượt miền; nếu UNSAT, lưu giả định và phạm vi đã kiểm tra. Không mặc định SAT và không suy ra tràn số runtime Node.js từ mô hình số nguyên hữu hạn. Chưa chạy solver: chưa xác minh.
- **Mức thực hiện:** chưa được campaign API hiện tại thực thi; giữ trong 75 testcase ngoài campaign. Nội dung ở trên là thiết kế kiểm tra, không phải phát hiện đã xác nhận.

#### TC-ORD-16 — Kiểm tra tràn số: active_discount_code_counter

- **Yêu cầu / ưu tiên:** REQ-ORD-SMT-active_discount_code_counter; LOW. Nguồn: `Module_Orders_Create_spec.xlsx` → `TestCase`.
- **Nhóm lỗi / mục tiêu:** Số học: kiểm tra overflow trong mô hình hữu hạn, chưa là phát hiện runtime.
- **Vị trí trong luồng:** Mô hình phép toán/bộ đếm trong KiemTraSoHoc. Cần xác định signedness, miền và độ rộng bit; không gắn int32 của mô hình cho mọi số trong JavaScript.
- **Điều kiện ban đầu:** Đã khai báo biến SMT tương ứng cho dòng 'active_discount_code_counter' Phạm vi mô hình minh họa theo template, không phải lỗi API Node.js.
- **Cách kiểm tra:** Giải các ràng buộc đã khai báo, lưu SAT/model hoặc UNSAT/unknown. Sau đó mới đối chiếu phép toán của triển khai nếu có.
- **Bước/input cụ thể:** 1. Chuẩn bị trạng thái và dữ liệu như điều kiện tiên quyết. → 2. Chạy check_int32_overflow() bằng Z3 trên BieuThucTran của dòng 'active_discount_code_counter' → 3. Thu thập phản hồi/trạng thái cuối và đối chiếu kết quả mong đợi.
- **Điều kiện an toàn mong đợi:** Đánh giá công thức theo đúng miền, signedness và độ rộng bit trong sheet KiemTraSoHoc. Nếu SAT, lưu giá trị chứng minh và phép toán gây vượt miền; nếu UNSAT, lưu giả định và phạm vi đã kiểm tra. Không mặc định SAT và không suy ra tràn số runtime Node.js từ mô hình số nguyên hữu hạn. Chưa chạy solver: chưa xác minh.
- **Mức thực hiện:** chưa được campaign API hiện tại thực thi; giữ trong 75 testcase ngoài campaign. Nội dung ở trên là thiết kế kiểm tra, không phải phát hiện đã xác nhận.

#### TC-ORD-17 — Kiểm tra tràn số: order_crash_counter

- **Yêu cầu / ưu tiên:** REQ-ORD-SMT-order_crash_counter; LOW. Nguồn: `Module_Orders_Create_spec.xlsx` → `TestCase`.
- **Nhóm lỗi / mục tiêu:** Số học: kiểm tra overflow trong mô hình hữu hạn, chưa là phát hiện runtime.
- **Vị trí trong luồng:** Mô hình phép toán/bộ đếm trong KiemTraSoHoc. Cần xác định signedness, miền và độ rộng bit; không gắn int32 của mô hình cho mọi số trong JavaScript.
- **Điều kiện ban đầu:** Đã khai báo biến SMT tương ứng cho dòng 'order_crash_counter' Phạm vi mô hình minh họa theo template, không phải lỗi API Node.js.
- **Cách kiểm tra:** Giải các ràng buộc đã khai báo, lưu SAT/model hoặc UNSAT/unknown. Sau đó mới đối chiếu phép toán của triển khai nếu có.
- **Bước/input cụ thể:** 1. Chuẩn bị trạng thái và dữ liệu như điều kiện tiên quyết. → 2. Chạy check_int32_overflow() bằng Z3 trên BieuThucTran của dòng 'order_crash_counter' → 3. Thu thập phản hồi/trạng thái cuối và đối chiếu kết quả mong đợi.
- **Điều kiện an toàn mong đợi:** Đánh giá công thức theo đúng miền, signedness và độ rộng bit trong sheet KiemTraSoHoc. Nếu SAT, lưu giá trị chứng minh và phép toán gây vượt miền; nếu UNSAT, lưu giả định và phạm vi đã kiểm tra. Không mặc định SAT và không suy ra tràn số runtime Node.js từ mô hình số nguyên hữu hạn. Chưa chạy solver: chưa xác minh.
- **Mức thực hiện:** chưa được campaign API hiện tại thực thi; giữ trong 75 testcase ngoài campaign. Nội dung ở trên là thiết kế kiểm tra, không phải phát hiện đã xác nhận.

#### TC-ORD-19 — Đối chứng seed hợp lệ trước khi đột biến đơn hàng

- **Yêu cầu / ưu tiên:** REQ-ORD-2, REQ-ORD-5, REQ-ORD-8; MEDIUM. Nguồn: `Module_Orders_Create_spec.xlsx` → `TestCase`.
- **Nhóm lỗi / mục tiêu:** Đối chứng hợp lệ để phát hiện lỗi setup, không là lỗ hổng tự thân.
- **Vị trí trong luồng:** Đăng nhập lấy token → chọn sản phẩm/catalog → giỏ hàng và địa chỉ → POST /api/orders → authenticateToken → kiểm tra trường → tạo OrderModel → required/ép kiểu → save → tác dụng phụ/thông báo. Đối chiếu vị trí input/thao tác trong testcase với luồng này; không mặc định code hiện đã cưỡng chế đủ điều kiện an toàn.
- **Điều kiện ban đầu:** User hợp lệ; sản phẩm còn hàng; giá catalog tin cậy. Phạm vi: harness mô phỏng; testcase mới chưa có kịch bản thực thi tự động.
- **Cách kiểm tra:** Input có chủ đích/đột biến và oracle theo đặc tả. Concurrency/timing/version ngoài 29 ID chưa được campaign này thực thi.
- **Bước/input cụ thể:** 1. Gửi giỏ hàng và giao hàng hợp lệ; đọc đơn lưu và đối chiếu catalog. → 2. Thu thập response và dữ liệu cuối để đối chiếu kết quả mong đợi. → Dữ liệu thử: Seed order hợp lệ, không voucher/phí; quantity=2, giá catalog=200000. → Lưu seed, input thực tế, ngữ cảnh xác thực/trạng thái, response và thời gian. Chỉ kết luận crash khi có mã thoát/signal và log tiến trình; timeout là nghi vấn hang.
- **Điều kiện an toàn mong đợi:** HTTP 200/201; đơn có đúng user, sản phẩm, số lượng và tổng 400000 của seed. Seed không chạy được thì không quy lỗi cho input đột biến.
- **Mức thực hiện:** PASS theo oracle hiện tại; 1 kịch bản. Ví dụ `TC-ORD-19:catalog`, oracle `valid_order`, chuỗi HTTP `[200]`. Chi tiết input và dữ liệu trong `results/spec_excel_aligned/report.json` → `executions`. Không suy rộng trạng thái này sang các điều kiện chưa được oracle kiểm tra.

### Module OS: Cập nhật trạng thái đơn

**Luồng nghiệp vụ mong đợi:** Tạo đơn hợp lệ → xác định chủ đơn/người có quyền → PUT /api/orders/:id → kiểm tra quyền, ID và trạng thái → kiểm tra chuyển trạng thái → lưu và thông báo.

**Tài sản/biên tin cậy:** Quyền sở hữu đơn và bất biến trạng thái kết thúc. Đây là luồng an toàn mong đợi; route hiện tại có thể thiếu các bước bảo vệ.

**Điểm đọc code:** [node_harness/index.js:807](D:/Virtual-Try-On-sync/fuzzing-security-testing/node_harness/index.js:807). Đây là code harness; mẫu C/Python không tự nằm trên đường gọi này.

#### TC-OS-1 — Vượt quyền cập nhật tài nguyên đơn hàng

- **Yêu cầu / ưu tiên:** REQ-OS-1, REQ-OS-2; HIGH. Nguồn: `Module_OrderStatus_spec.xlsx` → `TestCase`.
- **Nhóm lỗi / mục tiêu:** Broken access control / truy cập đơn trái phép.
- **Vị trí trong luồng:** Tạo đơn hợp lệ → xác định chủ đơn/người có quyền → PUT /api/orders/:id → kiểm tra quyền, ID và trạng thái → kiểm tra chuyển trạng thái → lưu và thông báo. Đối chiếu vị trí input/thao tác trong testcase với luồng này; không mặc định code hiện đã cưỡng chế đủ điều kiện an toàn.
- **Điều kiện ban đầu:** Có 1 đơn hàng đã tạo, có 1 token user khác (không phải chủ đơn)
- **Cách kiểm tra:** Input có chủ đích/đột biến và oracle theo đặc tả. Concurrency/timing/version ngoài 29 ID chưa được campaign này thực thi.
- **Bước/input cụ thể:** Gọi PUT /api/orders/:id không header Authorization → Gọi lại với token của user khác → Lưu seed, input thực tế, ngữ cảnh xác thực/trạng thái, response và thời gian. Chỉ kết luận crash khi có mã thoát/signal và log tiến trình; timeout là nghi vấn hang.
- **Điều kiện an toàn mong đợi:** HTTP 401/403 khi thiếu token hoặc dùng tài khoản khác; request không được coi là cập nhật hợp lệ.
- **Mức thực hiện:** FAIL theo oracle hiện tại; 2 kịch bản. Ví dụ `TC-OS-1:None`, oracle `status`, chuỗi HTTP `[200, 200]`. Chi tiết input và dữ liệu trong `results/spec_excel_aligned/report.json` → `executions`. Không suy rộng trạng thái này sang các điều kiện chưa được oracle kiểm tra.

#### TC-OS-2 — Giá trị enum bất thường đi vào xử lý trạng thái

- **Yêu cầu / ưu tiên:** REQ-OS-3; HIGH. Nguồn: `Module_OrderStatus_spec.xlsx` → `TestCase`.
- **Nhóm lỗi / mục tiêu:** Validation enum / bất biến trạng thái.
- **Vị trí trong luồng:** Tạo đơn hợp lệ → xác định chủ đơn/người có quyền → PUT /api/orders/:id → kiểm tra quyền, ID và trạng thái → kiểm tra chuyển trạng thái → lưu và thông báo. Đối chiếu vị trí input/thao tác trong testcase với luồng này; không mặc định code hiện đã cưỡng chế đủ điều kiện an toàn.
- **Điều kiện ban đầu:** Có 1 đơn hàng đã tạo
- **Cách kiểm tra:** Input có chủ đích/đột biến và oracle theo đặc tả. Concurrency/timing/version ngoài 29 ID chưa được campaign này thực thi.
- **Bước/input cụ thể:** Gửi status='' (rỗng) → Gửi status='0000000000' → Lưu seed, input thực tế, ngữ cảnh xác thực/trạng thái, response và thời gian. Chỉ kết luận crash khi có mã thoát/signal và log tiến trình; timeout là nghi vấn hang.
- **Điều kiện an toàn mong đợi:** HTTP 400/422 khi status ngoài tập hợp cho phép; không chấp nhận trạng thái tùy ý.
- **Mức thực hiện:** FAIL theo oracle hiện tại; 2 kịch bản. Ví dụ `TC-OS-2:''`, oracle `status`, chuỗi HTTP `[200, 200]`. Chi tiết input và dữ liệu trong `results/spec_excel_aligned/report.json` → `executions`. Không suy rộng trạng thái này sang các điều kiện chưa được oracle kiểm tra.

#### TC-OS-3 — Phá vỡ bất biến sau trạng thái đã giao

- **Yêu cầu / ưu tiên:** REQ-OS-4; HIGH. Nguồn: `Module_OrderStatus_spec.xlsx` → `TestCase`.
- **Nhóm lỗi / mục tiêu:** Logic trạng thái / toàn vẹn vòng đời đơn.
- **Vị trí trong luồng:** Tạo đơn hợp lệ → xác định chủ đơn/người có quyền → PUT /api/orders/:id → kiểm tra quyền, ID và trạng thái → kiểm tra chuyển trạng thái → lưu và thông báo. Đối chiếu vị trí input/thao tác trong testcase với luồng này; không mặc định code hiện đã cưỡng chế đủ điều kiện an toàn.
- **Điều kiện ban đầu:** Đơn hàng đã ở trạng thái Da_giao
- **Cách kiểm tra:** Input có chủ đích/đột biến và oracle theo đặc tả. Concurrency/timing/version ngoài 29 ID chưa được campaign này thực thi.
- **Bước/input cụ thể:** 1. Chuẩn bị trạng thái và dữ liệu như điều kiện tiên quyết. → 2. Gửi PUT status='Dang xu ly' cho đơn đã ở trạng thái Da_giao → 3. Thu thập phản hồi/trạng thái cuối và đối chiếu kết quả mong đợi. → Lưu seed, input thực tế, ngữ cảnh xác thực/trạng thái, response và thời gian. Chỉ kết luận crash khi có mã thoát/signal và log tiến trình; timeout là nghi vấn hang.
- **Điều kiện an toàn mong đợi:** Sau khi các bước chuẩn bị thành công, request chuyển ngược bị từ chối HTTP 400/409/422.
- **Mức thực hiện:** FAIL theo oracle hiện tại; 1 kịch bản. Ví dụ `TC-OS-3:revert-delivered`, oracle `status`, chuỗi HTTP `[200, 200, 200, 200]`. Chi tiết input và dữ liệu trong `results/spec_excel_aligned/report.json` → `executions`. Không suy rộng trạng thái này sang các điều kiện chưa được oracle kiểm tra.

#### TC-OS-4 — ID hoặc status sai kiểu gây lỗi tầng xử lý

- **Yêu cầu / ưu tiên:** REQ-OS-5; HIGH. Nguồn: `Module_OrderStatus_spec.xlsx` → `TestCase`.
- **Nhóm lỗi / mục tiêu:** Validation ID/kiểu / xử lý lỗi truy vấn.
- **Vị trí trong luồng:** Tạo đơn hợp lệ → xác định chủ đơn/người có quyền → PUT /api/orders/:id → kiểm tra quyền, ID và trạng thái → kiểm tra chuyển trạng thái → lưu và thông báo. Đối chiếu vị trí input/thao tác trong testcase với luồng này; không mặc định code hiện đã cưỡng chế đủ điều kiện an toàn.
- **Điều kiện ban đầu:** Server đang chạy
- **Cách kiểm tra:** Input có chủ đích/đột biến và oracle theo đặc tả. Concurrency/timing/version ngoài 29 ID chưa được campaign này thực thi.
- **Bước/input cụ thể:** Gọi PUT /api/orders/abc → Gọi PUT với status={"a":1} → Lưu seed, input thực tế, ngữ cảnh xác thực/trạng thái, response và thời gian. Chỉ kết luận crash khi có mã thoát/signal và log tiến trình; timeout là nghi vấn hang.
- **Điều kiện an toàn mong đợi:** HTTP 400/404/422 có kiểm soát, không HTTP 500 do lỗi chuyển kiểu hoặc truy cập dữ liệu.
- **Mức thực hiện:** FAIL theo oracle hiện tại; 2 kịch bản. Ví dụ `TC-OS-4:/api/orders/abc`, oracle `status`, chuỗi HTTP `[200, 500]`. Chi tiết input và dữ liệu trong `results/spec_excel_aligned/report.json` → `executions`. Không suy rộng trạng thái này sang các điều kiện chưa được oracle kiểm tra.

#### TC-OS-21 — Phá vỡ trạng thái kết thúc sau khi hủy đơn

- **Yêu cầu / ưu tiên:** REQ-OS-4; HIGH. Nguồn: `Module_OrderStatus_spec.xlsx` → `TestCase`.
- **Nhóm lỗi / mục tiêu:** Logic trạng thái kết thúc / toàn vẹn nghiệp vụ.
- **Vị trí trong luồng:** Tạo đơn hợp lệ → xác định chủ đơn/người có quyền → PUT /api/orders/:id → kiểm tra quyền, ID và trạng thái → kiểm tra chuyển trạng thái → lưu và thông báo. Đối chiếu vị trí input/thao tác trong testcase với luồng này; không mặc định code hiện đã cưỡng chế đủ điều kiện an toàn.
- **Điều kiện ban đầu:** Đơn mới hợp lệ và đúng quyền thao tác. Phạm vi: harness mô phỏng; testcase mới chưa có kịch bản thực thi tự động.
- **Cách kiểm tra:** Input có chủ đích/đột biến và oracle theo đặc tả. Concurrency/timing/version ngoài 29 ID chưa được campaign này thực thi.
- **Bước/input cụ thể:** 1. Tạo đơn; chuyển đã hủy; yêu cầu chuyển đang giao; đọc lại đơn. → 2. Thu thập response và dữ liệu cuối để đối chiếu kết quả mong đợi. → Dữ liệu thử: Dùng chính xác chuỗi status của hệ thống, không tự thay bằng alias. → Lưu seed, input thực tế, ngữ cảnh xác thực/trạng thái, response và thời gian. Chỉ kết luận crash khi có mã thoát/signal và log tiến trình; timeout là nghi vấn hang.
- **Điều kiện an toàn mong đợi:** Sau khi hủy thành công, từ chối tiếp tục giao bằng HTTP 400/409/422; trạng thái lưu vẫn là đã hủy.
- **Mức thực hiện:** FAIL theo oracle hiện tại; 1 kịch bản. Ví dụ `TC-OS-21:cancelled-terminal`, oracle `cancelled_terminal`, chuỗi HTTP `[200, 200, 200]`. Chi tiết input và dữ liệu trong `results/spec_excel_aligned/report.json` → `executions`. Không suy rộng trạng thái này sang các điều kiện chưa được oracle kiểm tra.

#### TC-OS-22 — Kiểm tra quy trình fuzzing: Tái hiện input phụ thuộc trạng thái đơn

- **Yêu cầu / ưu tiên:** REQ-OS-FUZZ-22; HIGH. Nguồn: `Module_OrderStatus_spec.xlsx` → `TestCase`.
- **Nhóm lỗi / mục tiêu:** Độ đúng công cụ fuzzing và bằng chứng; không tự là lỗ hổng nghiệp vụ.
- **Vị trí trong luồng:** Kiểm tra chính công cụ điều phối, replay hoặc phân loại bằng chứng; không phải mặc định một lỗ hổng trong nghiệp vụ bán hàng.
- **Điều kiện ban đầu:** Có input cập nhật trạng thái do blackbox tìm thấy và bản ghi chuỗi thao tác, phiên bản, actor của đơn; có thể tạo đơn mới và chạy lại chuỗi.
- **Cách kiểm tra:** Đối chiếu input/ngữ cảnh/log với từng pha công cụ; phân biệt kiểm tra quy trình và xác nhận lỗi ứng dụng.
- **Bước/input cụ thể:** 1. Tạo đơn sạch và chạy nguyên input, lưu kết quả. → 2. Tạo đơn sạch khác, chạy chuỗi chuẩn bị đã ghi rồi gửi cùng input. → 3. Giữ nguyên auth và version tương ứng ở từng lượt; chạy lại hai lần. → 4. Đối chiếu trạng thái trước/sau, response, coverage và lý do khác biệt.
- **Điều kiện an toàn mong đợi:** Bằng chứng phân biệt tái hiện độc lập với tái hiện phụ thuộc chuỗi. Nếu không có đủ trạng thái chuẩn bị phải ghi INCONCLUSIVE, không ghi phát hiện sai và không tự coi lỗi version là crash.
- **Mức thực hiện:** chưa được campaign API hiện tại thực thi; giữ trong 75 testcase ngoài campaign. Nội dung ở trên là thiết kế kiểm tra, không phải phát hiện đã xác nhận.

#### TC-OS-7 — Hàm sinh mã C: parse_order_status_value (buffer-overflow)

- **Yêu cầu / ưu tiên:** REQ-OS-FIX-parse_order_status_value; HIGH. Nguồn: `Module_OrderStatus_spec.xlsx` → `TestCase`.
- **Nhóm lỗi / mục tiêu:** An toàn bộ nhớ / quản lý tài nguyên trong mẫu C độc lập: buffer-overflow
- **Vị trí trong luồng:** Mẫu C độc lập lấy dữ liệu nghiệp vụ làm bối cảnh. Không coi là bước gọi native đã xác nhận của API; cần xem HamSinhMa và build/instrument mẫu trước khi kết luận runtime.
- **Điều kiện ban đầu:** Mẫu C parse_order_status_value, lỗi cấy buffer-overflow; có driver gọi hàm, compiler và AddressSanitizer hoạt động. Phạm vi native fixture, không phải API Node.js.
Chỉ chạy trên hàm C minh họa độc lập; cần compiler và instrumentation phù hợp. Không phải đường thực thi native đã xác nhận của API Node.js.
- **Cách kiểm tra:** Fuzz input của hàm C + instrumentation ASan/LSan phù hợp + đối chứng an toàn; đây là phương pháp dự kiến, chưa chạy trong campaign API.
- **Bước/input cụ thể:** 1. Sinh mã C và chạy kiểm tra tĩnh như testcase gốc. → 2. Tạo driver gọi parse_order_status_value, biên dịch -g -O0 và instrumentation phù hợp; kiểm tra đối chứng công cụ. → 3. Chạy chuỗi ASCII dài B-1, B, B+1 với B=32 byte và đối chứng ngắn. → 4. Lưu input, binary/source hash, stderr, exit code/signal và vị trí chẩn đoán. → 5. Tái hiện từ tiến trình sạch; chạy đối chứng an toàn cùng input. → Chạy cả mẫu lỗi cấy và đối chứng an toàn trên cùng input; lưu input, build flags, stderr, mã thoát và vị trí lỗi; lặp lại input gây lỗi.
- **Điều kiện an toàn mong đợi:** Đối chứng an toàn không có chẩn đoán buffer-overflow; mẫu lỗi cấy phải có chẩn đoán buffer-overflow tại hàm mục tiêu từ AddressSanitizer hoặc công cụ phát hiện lỗi bộ nhớ tương đương. Mẫu lỗi bị phát hiện là xác nhận đối chứng công cụ, không phải ứng dụng đã an toàn. Thiếu công cụ/bằng chứng: chưa xác minh. Không dùng HTTP 500 làm bằng chứng; leak không bắt buộc làm tiến trình crash.
- **Mức thực hiện:** chưa được campaign API hiện tại thực thi; giữ trong 75 testcase ngoài campaign. Nội dung ở trên là thiết kế kiểm tra, không phải phát hiện đã xác nhận.

#### TC-OS-10 — Hàm sinh mã C: write_order_status_notification_log (memory-leak)

- **Yêu cầu / ưu tiên:** REQ-OS-FIX-write_order_status_notification_log; HIGH. Nguồn: `Module_OrderStatus_spec.xlsx` → `TestCase`.
- **Nhóm lỗi / mục tiêu:** An toàn bộ nhớ / quản lý tài nguyên trong mẫu C độc lập: memory-leak
- **Vị trí trong luồng:** Mẫu C độc lập lấy dữ liệu nghiệp vụ làm bối cảnh. Không coi là bước gọi native đã xác nhận của API; cần xem HamSinhMa và build/instrument mẫu trước khi kết luận runtime.
- **Điều kiện ban đầu:** Mẫu C write_order_status_notification_log, lỗi cấy memory-leak; có driver gọi hàm, compiler và LeakSanitizer hoặc công cụ kiểm tra leak tương đương hoạt động. Phạm vi native fixture, không phải API Node.js.
Chỉ chạy trên hàm C minh họa độc lập; cần compiler và instrumentation phù hợp. Không phải đường thực thi native đã xác nhận của API Node.js.
- **Cách kiểm tra:** Fuzz input của hàm C + instrumentation ASan/LSan phù hợp + đối chứng an toàn; đây là phương pháp dự kiến, chưa chạy trong campaign API.
- **Bước/input cụ thể:** 1. Sinh mã C và chạy kiểm tra tĩnh như testcase gốc. → 2. Tạo driver gọi write_order_status_notification_log, biên dịch -g -O0 và instrumentation phù hợp; kiểm tra đối chứng công cụ. → 3. Chạy đường thực thi hàm một lần trên mỗi tiến trình mới; có đối chứng đã sửa tương ứng. → 4. Lưu input, binary/source hash, stderr, exit code/signal và vị trí chẩn đoán. → 5. Tái hiện từ tiến trình sạch; chạy đối chứng an toàn cùng input. → Chạy cả mẫu lỗi cấy và đối chứng an toàn trên cùng input; lưu input, build flags, stderr, mã thoát và vị trí lỗi; lặp lại input gây lỗi.
- **Điều kiện an toàn mong đợi:** Đối chứng an toàn không có chẩn đoán memory-leak; mẫu lỗi cấy phải có chẩn đoán memory-leak tại hàm mục tiêu từ LeakSanitizer hoặc công cụ phát hiện leak tương đương. Mẫu lỗi bị phát hiện là xác nhận đối chứng công cụ, không phải ứng dụng đã an toàn. Thiếu công cụ/bằng chứng: chưa xác minh. Không dùng HTTP 500 làm bằng chứng; leak không bắt buộc làm tiến trình crash.
- **Mức thực hiện:** chưa được campaign API hiện tại thực thi; giữ trong 75 testcase ngoài campaign. Nội dung ở trên là thiết kế kiểm tra, không phải phát hiện đã xác nhận.

#### TC-OS-11 — Hàm sinh mã C: close_order_update_transaction (double-free)

- **Yêu cầu / ưu tiên:** REQ-OS-FIX-close_order_update_transaction; HIGH. Nguồn: `Module_OrderStatus_spec.xlsx` → `TestCase`.
- **Nhóm lỗi / mục tiêu:** An toàn bộ nhớ / quản lý tài nguyên trong mẫu C độc lập: double-free
- **Vị trí trong luồng:** Mẫu C độc lập lấy dữ liệu nghiệp vụ làm bối cảnh. Không coi là bước gọi native đã xác nhận của API; cần xem HamSinhMa và build/instrument mẫu trước khi kết luận runtime.
- **Điều kiện ban đầu:** Mẫu C close_order_update_transaction, lỗi cấy double-free; có driver gọi hàm, compiler và AddressSanitizer hoạt động. Phạm vi native fixture, không phải API Node.js.
Chỉ chạy trên hàm C minh họa độc lập; cần compiler và instrumentation phù hợp. Không phải đường thực thi native đã xác nhận của API Node.js.
- **Cách kiểm tra:** Fuzz input của hàm C + instrumentation ASan/LSan phù hợp + đối chứng an toàn; đây là phương pháp dự kiến, chưa chạy trong campaign API.
- **Bước/input cụ thể:** 1. Sinh mã C và chạy kiểm tra tĩnh như testcase gốc. → 2. Tạo driver gọi close_order_update_transaction, biên dịch -g -O0 và instrumentation phù hợp; kiểm tra đối chứng công cụ. → 3. Chạy đường thực thi hàm một lần trên mỗi tiến trình mới; có đối chứng đã sửa tương ứng. → 4. Lưu input, binary/source hash, stderr, exit code/signal và vị trí chẩn đoán. → 5. Tái hiện từ tiến trình sạch; chạy đối chứng an toàn cùng input. → Chạy cả mẫu lỗi cấy và đối chứng an toàn trên cùng input; lưu input, build flags, stderr, mã thoát và vị trí lỗi; lặp lại input gây lỗi.
- **Điều kiện an toàn mong đợi:** Đối chứng an toàn không có chẩn đoán double-free; mẫu lỗi cấy phải có chẩn đoán double-free tại hàm mục tiêu từ AddressSanitizer hoặc công cụ phát hiện lỗi bộ nhớ tương đương. Mẫu lỗi bị phát hiện là xác nhận đối chứng công cụ, không phải ứng dụng đã an toàn. Thiếu công cụ/bằng chứng: chưa xác minh. Không dùng HTTP 500 làm bằng chứng; leak không bắt buộc làm tiến trình crash.
- **Mức thực hiện:** chưa được campaign API hiện tại thực thi; giữ trong 75 testcase ngoài campaign. Nội dung ở trên là thiết kế kiểm tra, không phải phát hiện đã xác nhận.

#### TC-OS-12 — Hàm sinh mã C: release_order_cache_after_update (use-after-free)

- **Yêu cầu / ưu tiên:** REQ-OS-FIX-release_order_cache_after_update; HIGH. Nguồn: `Module_OrderStatus_spec.xlsx` → `TestCase`.
- **Nhóm lỗi / mục tiêu:** An toàn bộ nhớ / quản lý tài nguyên trong mẫu C độc lập: use-after-free
- **Vị trí trong luồng:** Mẫu C độc lập lấy dữ liệu nghiệp vụ làm bối cảnh. Không coi là bước gọi native đã xác nhận của API; cần xem HamSinhMa và build/instrument mẫu trước khi kết luận runtime.
- **Điều kiện ban đầu:** Mẫu C release_order_cache_after_update, lỗi cấy use-after-free; có driver gọi hàm, compiler và AddressSanitizer hoạt động. Phạm vi native fixture, không phải API Node.js.
Chỉ chạy trên hàm C minh họa độc lập; cần compiler và instrumentation phù hợp. Không phải đường thực thi native đã xác nhận của API Node.js.
- **Cách kiểm tra:** Fuzz input của hàm C + instrumentation ASan/LSan phù hợp + đối chứng an toàn; đây là phương pháp dự kiến, chưa chạy trong campaign API.
- **Bước/input cụ thể:** 1. Sinh mã C và chạy kiểm tra tĩnh như testcase gốc. → 2. Tạo driver gọi release_order_cache_after_update, biên dịch -g -O0 và instrumentation phù hợp; kiểm tra đối chứng công cụ. → 3. Chạy đường thực thi hàm một lần trên mỗi tiến trình mới; có đối chứng đã sửa tương ứng. → 4. Lưu input, binary/source hash, stderr, exit code/signal và vị trí chẩn đoán. → 5. Tái hiện từ tiến trình sạch; chạy đối chứng an toàn cùng input. → Chạy cả mẫu lỗi cấy và đối chứng an toàn trên cùng input; lưu input, build flags, stderr, mã thoát và vị trí lỗi; lặp lại input gây lỗi.
- **Điều kiện an toàn mong đợi:** Đối chứng an toàn không có chẩn đoán use-after-free; mẫu lỗi cấy phải có chẩn đoán use-after-free tại hàm mục tiêu từ AddressSanitizer hoặc công cụ phát hiện lỗi bộ nhớ tương đương. Mẫu lỗi bị phát hiện là xác nhận đối chứng công cụ, không phải ứng dụng đã an toàn. Thiếu công cụ/bằng chứng: chưa xác minh. Không dùng HTTP 500 làm bằng chứng; leak không bắt buộc làm tiến trình crash.
- **Mức thực hiện:** chưa được campaign API hiện tại thực thi; giữ trong 75 testcase ngoài campaign. Nội dung ở trên là thiết kế kiểm tra, không phải phát hiện đã xác nhận.

#### TC-OS-8 — Hàm Python: order_delivery_success_ratio chia cho 0

- **Yêu cầu / ưu tiên:** REQ-OS-FIX-order_delivery_success_ratio; MEDIUM. Nguồn: `Module_OrderStatus_spec.xlsx` → `TestCase`.
- **Nhóm lỗi / mục tiêu:** Ngoại lệ tính toán trong mẫu Python độc lập.
- **Vị trí trong luồng:** Hàm Python minh họa độc lập của bước thống kê/tính toán; không đồng nhất traceback Python với server Node.js bị crash.
- **Điều kiện ban đầu:** Đã sinh mã Python Phạm vi mô hình minh họa theo template, không phải lỗi API Node.js.
- **Cách kiểm tra:** Sinh/đột biến đối số, bắt ngoại lệ và lưu traceback; cần mẫu đối chứng. Chưa được campaign API thực thi.
- **Bước/input cụ thể:** 1. Chuẩn bị trạng thái và dữ liệu như điều kiện tiên quyết. → 2. Chạy blackbox_fuzz() với total_orders_updated=0 → 3. Thu thập phản hồi/trạng thái cuối và đối chiếu kết quả mong đợi.
- **Điều kiện an toàn mong đợi:** Mẫu lỗi cấy phát sinh ZeroDivisionError với input chia cho 0; lưu traceback, input và cách gọi. Đối chứng an toàn xử lý trường hợp này có kiểm soát. Ngoại lệ Python chưa chứng minh crash server hoặc lỗi bộ nhớ native; thiếu thực thi thì chưa xác minh.
- **Mức thực hiện:** chưa được campaign API hiện tại thực thi; giữ trong 75 testcase ngoài campaign. Nội dung ở trên là thiết kế kiểm tra, không phải phát hiện đã xác nhận.

#### TC-OS-17 — Version cũ sau cập nhật thành công

- **Yêu cầu / ưu tiên:** REQ-CONC-OS-1; HIGH. Nguồn: `Module_OrderStatus_spec.xlsx` → `TestCase`.
- **Nhóm lỗi / mục tiêu:** Đồng bộ / toàn vẹn cập nhật / tương thích version; xác định rõ ngữ cảnh đồng thời hoặc tuần tự trong bước thử.
- **Vị trí trong luồng:** Tạo đơn hợp lệ → xác định chủ đơn/người có quyền → PUT /api/orders/:id → kiểm tra quyền, ID và trạng thái → kiểm tra chuyển trạng thái → lưu và thông báo. Đối chiếu vị trí input/thao tác trong testcase với luồng này; không mặc định code hiện đã cưỡng chế đủ điều kiện an toàn.
- **Điều kiện ban đầu:** Tài nguyên v=0, actor được phép sửa. Phạm vi: harness mô phỏng; testcase mới chưa có kịch bản thực thi tự động.
- **Cách kiểm tra:** Input có chủ đích/đột biến và oracle theo đặc tả. Concurrency/timing/version ngoài 29 ID chưa được campaign này thực thi.
- **Bước/input cụ thể:** 1. PUT /api/orders/{order_id} với __v=0; gửi PUT lần hai vẫn __v=0; đọc lại dữ liệu. → 2. Thu thập response và dữ liệu cuối để đối chiếu kết quả mong đợi. → Dữ liệu thử: {"status":"Đang giao","__v":0}
- **Điều kiện an toàn mong đợi:** Lần đầu 200/v=1; lần hai 409; dữ liệu và version không đổi sau lần bị từ chối.
- **Mức thực hiện:** chưa được campaign API hiện tại thực thi; giữ trong 75 testcase ngoài campaign. Nội dung ở trên là thiết kế kiểm tra, không phải phát hiện đã xác nhận.

#### TC-OS-18 — Version sai kiểu hoặc ngoài miền

- **Yêu cầu / ưu tiên:** REQ-CONC-OS-1; HIGH. Nguồn: `Module_OrderStatus_spec.xlsx` → `TestCase`.
- **Nhóm lỗi / mục tiêu:** Đồng bộ / toàn vẹn cập nhật / tương thích version; xác định rõ ngữ cảnh đồng thời hoặc tuần tự trong bước thử.
- **Vị trí trong luồng:** Tạo đơn hợp lệ → xác định chủ đơn/người có quyền → PUT /api/orders/:id → kiểm tra quyền, ID và trạng thái → kiểm tra chuyển trạng thái → lưu và thông báo. Đối chiếu vị trí input/thao tác trong testcase với luồng này; không mặc định code hiện đã cưỡng chế đủ điều kiện an toàn.
- **Điều kiện ban đầu:** Tài nguyên tồn tại trong harness. Phạm vi: harness mô phỏng; testcase mới chưa có kịch bản thực thi tự động.
- **Cách kiểm tra:** Input có chủ đích/đột biến và oracle theo đặc tả. Concurrency/timing/version ngoài 29 ID chưa được campaign này thực thi.
- **Bước/input cụ thể:** 1. PUT /api/orders/{order_id} với lần lượt các giá trị __v; kiểm tra dữ liệu sau mỗi lần. → 2. Thu thập response và dữ liệu cuối để đối chiếu kết quả mong đợi. → Dữ liệu thử: __v: -1, 0.5, "0", null, true, {}, []
- **Điều kiện an toàn mong đợi:** Mỗi request trả 400; dữ liệu/version không thay đổi.
- **Mức thực hiện:** chưa được campaign API hiện tại thực thi; giữ trong 75 testcase ngoài campaign. Nội dung ở trên là thiết kế kiểm tra, không phải phát hiện đã xác nhận.

#### TC-OS-19 — Cập nhật tuần tự với version mới nhất

- **Yêu cầu / ưu tiên:** REQ-CONC-OS-1; HIGH. Nguồn: `Module_OrderStatus_spec.xlsx` → `TestCase`.
- **Nhóm lỗi / mục tiêu:** Đồng bộ / toàn vẹn cập nhật / tương thích version; xác định rõ ngữ cảnh đồng thời hoặc tuần tự trong bước thử.
- **Vị trí trong luồng:** Tạo đơn hợp lệ → xác định chủ đơn/người có quyền → PUT /api/orders/:id → kiểm tra quyền, ID và trạng thái → kiểm tra chuyển trạng thái → lưu và thông báo. Đối chiếu vị trí input/thao tác trong testcase với luồng này; không mặc định code hiện đã cưỡng chế đủ điều kiện an toàn.
- **Điều kiện ban đầu:** Tài nguyên v=0, actor được phép sửa. Phạm vi: harness mô phỏng; testcase mới chưa có kịch bản thực thi tự động.
- **Cách kiểm tra:** Input có chủ đích/đột biến và oracle theo đặc tả. Concurrency/timing/version ngoài 29 ID chưa được campaign này thực thi.
- **Bước/input cụ thể:** 1. PUT __v=0; đọc __v=1; PUT giá trị khác với __v=1; đọc lại. → 2. Thu thập response và dữ liệu cuối để đối chiếu kết quả mong đợi. → Dữ liệu thử: [{"status":"Đang giao","__v":0},{"status":"Đã giao","__v":1}]
- **Điều kiện an toàn mong đợi:** Cả hai trả 200; version cuối bằng 2; dữ liệu khớp lần thứ hai.
- **Mức thực hiện:** chưa được campaign API hiện tại thực thi; giữ trong 75 testcase ngoài campaign. Nội dung ở trên là thiết kế kiểm tra, không phải phát hiện đã xác nhận.

#### TC-OS-20 — Client cũ không gửi version

- **Yêu cầu / ưu tiên:** REQ-CONC-OS-1; HIGH. Nguồn: `Module_OrderStatus_spec.xlsx` → `TestCase`.
- **Nhóm lỗi / mục tiêu:** Đồng bộ / toàn vẹn cập nhật / tương thích version; xác định rõ ngữ cảnh đồng thời hoặc tuần tự trong bước thử.
- **Vị trí trong luồng:** Tạo đơn hợp lệ → xác định chủ đơn/người có quyền → PUT /api/orders/:id → kiểm tra quyền, ID và trạng thái → kiểm tra chuyển trạng thái → lưu và thông báo. Đối chiếu vị trí input/thao tác trong testcase với luồng này; không mặc định code hiện đã cưỡng chế đủ điều kiện an toàn.
- **Điều kiện ban đầu:** Tài nguyên tồn tại trong harness; giao thức tương thích hiện tại. Phạm vi: harness mô phỏng; testcase mới chưa có kịch bản thực thi tự động.
- **Cách kiểm tra:** Input có chủ đích/đột biến và oracle theo đặc tả. Concurrency/timing/version ngoài 29 ID chưa được campaign này thực thi.
- **Bước/input cụ thể:** 1. PUT /api/orders/{order_id} với dữ liệu hợp lệ, không có trường __v; đọc lại. → 2. Thu thập response và dữ liệu cuối để đối chiếu kết quả mong đợi. → Dữ liệu thử: {"status":"Đang giao"}
- **Điều kiện an toàn mong đợi:** Theo hành vi tương thích hiện tại: 200 và version tăng 1. Không kết luận chống stale-write cho client bỏ version.
- **Mức thực hiện:** chưa được campaign API hiện tại thực thi; giữ trong 75 testcase ngoài campaign. Nội dung ở trên là thiết kế kiểm tra, không phải phát hiện đã xác nhận.

#### TC-OS-6 — 2 request PUT đồng thời cùng 1 đơn hàng

- **Yêu cầu / ưu tiên:** REQ-OS-2, NFR-OS-4, REQ-CONC-OS-1; MEDIUM. Nguồn: `Module_OrderStatus_spec.xlsx` → `TestCase`.
- **Nhóm lỗi / mục tiêu:** Đồng bộ / toàn vẹn cập nhật / tương thích version; xác định rõ ngữ cảnh đồng thời hoặc tuần tự trong bước thử.
- **Vị trí trong luồng:** Tạo đơn hợp lệ → xác định chủ đơn/người có quyền → PUT /api/orders/:id → kiểm tra quyền, ID và trạng thái → kiểm tra chuyển trạng thái → lưu và thông báo. Đối chiếu vị trí input/thao tác trong testcase với luồng này; không mặc định code hiện đã cưỡng chế đủ điều kiện an toàn.
- **Điều kiện ban đầu:** Có 1 đơn hàng đã tạo
- **Cách kiểm tra:** Input có chủ đích/đột biến và oracle theo đặc tả. Concurrency/timing/version ngoài 29 ID chưa được campaign này thực thi.
- **Bước/input cụ thể:** 1. Seed đối tượng __v=0; dùng actor có quyền theo kịch bản. → 2. Gửi đồng thời hai PUT dữ liệu khác nhau, cùng __v=0. → 3. Đọc phản hồi, version và dữ liệu cuối.
- **Điều kiện an toàn mong đợi:** Một HTTP 200 và một HTTP 409; __v cuối bằng 1; dữ liệu cuối khớp request thành công.
- **Mức thực hiện:** chưa được campaign API hiện tại thực thi; giữ trong 75 testcase ngoài campaign. Nội dung ở trên là thiết kế kiểm tra, không phải phát hiện đã xác nhận.

#### TC-OS-9 — Kiểm tra tràn số: total_status_update_counter

- **Yêu cầu / ưu tiên:** REQ-OS-SMT-total_status_update_counter; LOW. Nguồn: `Module_OrderStatus_spec.xlsx` → `TestCase`.
- **Nhóm lỗi / mục tiêu:** Số học: kiểm tra overflow trong mô hình hữu hạn, chưa là phát hiện runtime.
- **Vị trí trong luồng:** Mô hình phép toán/bộ đếm trong KiemTraSoHoc. Cần xác định signedness, miền và độ rộng bit; không gắn int32 của mô hình cho mọi số trong JavaScript.
- **Điều kiện ban đầu:** Đã khai báo biến SMT Phạm vi mô hình minh họa theo template, không phải lỗi API Node.js.
- **Cách kiểm tra:** Giải các ràng buộc đã khai báo, lưu SAT/model hoặc UNSAT/unknown. Sau đó mới đối chiếu phép toán của triển khai nếu có.
- **Bước/input cụ thể:** 1. Chuẩn bị trạng thái và dữ liệu như điều kiện tiên quyết. → 2. Chạy check_int32_overflow() bằng Z3 → 3. Thu thập phản hồi/trạng thái cuối và đối chiếu kết quả mong đợi.
- **Điều kiện an toàn mong đợi:** Đánh giá công thức theo đúng miền, signedness và độ rộng bit trong sheet KiemTraSoHoc. Nếu SAT, lưu giá trị chứng minh và phép toán gây vượt miền; nếu UNSAT, lưu giả định và phạm vi đã kiểm tra. Không mặc định SAT và không suy ra tràn số runtime Node.js từ mô hình số nguyên hữu hạn. Chưa chạy solver: chưa xác minh.
- **Mức thực hiện:** chưa được campaign API hiện tại thực thi; giữ trong 75 testcase ngoài campaign. Nội dung ở trên là thiết kế kiểm tra, không phải phát hiện đã xác nhận.

#### TC-OS-13 — Kiểm tra tràn số: daily_status_update_counter

- **Yêu cầu / ưu tiên:** REQ-OS-SMT-daily_status_update_counter; LOW. Nguồn: `Module_OrderStatus_spec.xlsx` → `TestCase`.
- **Nhóm lỗi / mục tiêu:** Số học: kiểm tra overflow trong mô hình hữu hạn, chưa là phát hiện runtime.
- **Vị trí trong luồng:** Mô hình phép toán/bộ đếm trong KiemTraSoHoc. Cần xác định signedness, miền và độ rộng bit; không gắn int32 của mô hình cho mọi số trong JavaScript.
- **Điều kiện ban đầu:** Đã khai báo biến SMT tương ứng cho dòng 'daily_status_update_counter' Phạm vi mô hình minh họa theo template, không phải lỗi API Node.js.
- **Cách kiểm tra:** Giải các ràng buộc đã khai báo, lưu SAT/model hoặc UNSAT/unknown. Sau đó mới đối chiếu phép toán của triển khai nếu có.
- **Bước/input cụ thể:** 1. Chuẩn bị trạng thái và dữ liệu như điều kiện tiên quyết. → 2. Chạy check_int32_overflow() bằng Z3 trên BieuThucTran của dòng 'daily_status_update_counter' → 3. Thu thập phản hồi/trạng thái cuối và đối chiếu kết quả mong đợi.
- **Điều kiện an toàn mong đợi:** Đánh giá công thức theo đúng miền, signedness và độ rộng bit trong sheet KiemTraSoHoc. Nếu SAT, lưu giá trị chứng minh và phép toán gây vượt miền; nếu UNSAT, lưu giả định và phạm vi đã kiểm tra. Không mặc định SAT và không suy ra tràn số runtime Node.js từ mô hình số nguyên hữu hạn. Chưa chạy solver: chưa xác minh.
- **Mức thực hiện:** chưa được campaign API hiện tại thực thi; giữ trong 75 testcase ngoài campaign. Nội dung ở trên là thiết kế kiểm tra, không phải phát hiện đã xác nhận.

#### TC-OS-14 — Kiểm tra tràn số: concurrent_order_update_counter

- **Yêu cầu / ưu tiên:** REQ-OS-SMT-concurrent_order_update_counter; LOW. Nguồn: `Module_OrderStatus_spec.xlsx` → `TestCase`.
- **Nhóm lỗi / mục tiêu:** Số học: kiểm tra overflow trong mô hình hữu hạn, chưa là phát hiện runtime.
- **Vị trí trong luồng:** Mô hình phép toán/bộ đếm trong KiemTraSoHoc. Cần xác định signedness, miền và độ rộng bit; không gắn int32 của mô hình cho mọi số trong JavaScript.
- **Điều kiện ban đầu:** Đã khai báo biến SMT tương ứng cho dòng 'concurrent_order_update_counter' Phạm vi mô hình minh họa theo template, không phải lỗi API Node.js.
- **Cách kiểm tra:** Giải các ràng buộc đã khai báo, lưu SAT/model hoặc UNSAT/unknown. Sau đó mới đối chiếu phép toán của triển khai nếu có.
- **Bước/input cụ thể:** 1. Chuẩn bị trạng thái và dữ liệu như điều kiện tiên quyết. → 2. Chạy check_int32_overflow() bằng Z3 trên BieuThucTran của dòng 'concurrent_order_update_counter' → 3. Thu thập phản hồi/trạng thái cuối và đối chiếu kết quả mong đợi.
- **Điều kiện an toàn mong đợi:** Đánh giá công thức theo đúng miền, signedness và độ rộng bit trong sheet KiemTraSoHoc. Nếu SAT, lưu giá trị chứng minh và phép toán gây vượt miền; nếu UNSAT, lưu giả định và phạm vi đã kiểm tra. Không mặc định SAT và không suy ra tràn số runtime Node.js từ mô hình số nguyên hữu hạn. Chưa chạy solver: chưa xác minh.
- **Mức thực hiện:** chưa được campaign API hiện tại thực thi; giữ trong 75 testcase ngoài campaign. Nội dung ở trên là thiết kế kiểm tra, không phải phát hiện đã xác nhận.

#### TC-OS-15 — Kiểm tra tràn số: delivered_order_counter

- **Yêu cầu / ưu tiên:** REQ-OS-SMT-delivered_order_counter; LOW. Nguồn: `Module_OrderStatus_spec.xlsx` → `TestCase`.
- **Nhóm lỗi / mục tiêu:** Số học: kiểm tra overflow trong mô hình hữu hạn, chưa là phát hiện runtime.
- **Vị trí trong luồng:** Mô hình phép toán/bộ đếm trong KiemTraSoHoc. Cần xác định signedness, miền và độ rộng bit; không gắn int32 của mô hình cho mọi số trong JavaScript.
- **Điều kiện ban đầu:** Đã khai báo biến SMT tương ứng cho dòng 'delivered_order_counter' Phạm vi mô hình minh họa theo template, không phải lỗi API Node.js.
- **Cách kiểm tra:** Giải các ràng buộc đã khai báo, lưu SAT/model hoặc UNSAT/unknown. Sau đó mới đối chiếu phép toán của triển khai nếu có.
- **Bước/input cụ thể:** 1. Chuẩn bị trạng thái và dữ liệu như điều kiện tiên quyết. → 2. Chạy check_int32_overflow() bằng Z3 trên BieuThucTran của dòng 'delivered_order_counter' → 3. Thu thập phản hồi/trạng thái cuối và đối chiếu kết quả mong đợi.
- **Điều kiện an toàn mong đợi:** Đánh giá công thức theo đúng miền, signedness và độ rộng bit trong sheet KiemTraSoHoc. Nếu SAT, lưu giá trị chứng minh và phép toán gây vượt miền; nếu UNSAT, lưu giả định và phạm vi đã kiểm tra. Không mặc định SAT và không suy ra tràn số runtime Node.js từ mô hình số nguyên hữu hạn. Chưa chạy solver: chưa xác minh.
- **Mức thực hiện:** chưa được campaign API hiện tại thực thi; giữ trong 75 testcase ngoài campaign. Nội dung ở trên là thiết kế kiểm tra, không phải phát hiện đã xác nhận.

#### TC-OS-16 — Kiểm tra tràn số: cancelled_order_counter

- **Yêu cầu / ưu tiên:** REQ-OS-SMT-cancelled_order_counter; LOW. Nguồn: `Module_OrderStatus_spec.xlsx` → `TestCase`.
- **Nhóm lỗi / mục tiêu:** Số học: kiểm tra overflow trong mô hình hữu hạn, chưa là phát hiện runtime.
- **Vị trí trong luồng:** Mô hình phép toán/bộ đếm trong KiemTraSoHoc. Cần xác định signedness, miền và độ rộng bit; không gắn int32 của mô hình cho mọi số trong JavaScript.
- **Điều kiện ban đầu:** Đã khai báo biến SMT tương ứng cho dòng 'cancelled_order_counter' Phạm vi mô hình minh họa theo template, không phải lỗi API Node.js.
- **Cách kiểm tra:** Giải các ràng buộc đã khai báo, lưu SAT/model hoặc UNSAT/unknown. Sau đó mới đối chiếu phép toán của triển khai nếu có.
- **Bước/input cụ thể:** 1. Chuẩn bị trạng thái và dữ liệu như điều kiện tiên quyết. → 2. Chạy check_int32_overflow() bằng Z3 trên BieuThucTran của dòng 'cancelled_order_counter' → 3. Thu thập phản hồi/trạng thái cuối và đối chiếu kết quả mong đợi.
- **Điều kiện an toàn mong đợi:** Đánh giá công thức theo đúng miền, signedness và độ rộng bit trong sheet KiemTraSoHoc. Nếu SAT, lưu giá trị chứng minh và phép toán gây vượt miền; nếu UNSAT, lưu giả định và phạm vi đã kiểm tra. Không mặc định SAT và không suy ra tràn số runtime Node.js từ mô hình số nguyên hữu hạn. Chưa chạy solver: chưa xác minh.
- **Mức thực hiện:** chưa được campaign API hiện tại thực thi; giữ trong 75 testcase ngoài campaign. Nội dung ở trên là thiết kế kiểm tra, không phải phát hiện đã xác nhận.

#### TC-OS-5 — Đối chứng luồng và tác dụng phụ thông báo

- **Yêu cầu / ưu tiên:** REQ-OS-7; MEDIUM. Nguồn: `Module_OrderStatus_spec.xlsx` → `TestCase`.
- **Nhóm lỗi / mục tiêu:** Đối chứng luồng và tác dụng phụ; không phải tự thân một lỗ hổng.
- **Vị trí trong luồng:** Tạo đơn hợp lệ → xác định chủ đơn/người có quyền → PUT /api/orders/:id → kiểm tra quyền, ID và trạng thái → kiểm tra chuyển trạng thái → lưu và thông báo. Đối chiếu vị trí input/thao tác trong testcase với luồng này; không mặc định code hiện đã cưỡng chế đủ điều kiện an toàn.
- **Điều kiện ban đầu:** Có 1 đơn hàng mới tạo, đúng token chủ đơn
- **Cách kiểm tra:** Input có chủ đích/đột biến và oracle theo đặc tả. Concurrency/timing/version ngoài 29 ID chưa được campaign này thực thi.
- **Bước/input cụ thể:** 1. Chuẩn bị trạng thái và dữ liệu như điều kiện tiên quyết. → 2. Gửi PUT status='Dang giao' với token chủ sở hữu → 3. Thu thập phản hồi/trạng thái cuối và đối chiếu kết quả mong đợi. → Lưu seed, input thực tế, ngữ cảnh xác thực/trạng thái, response và thời gian. Chỉ kết luận crash khi có mã thoát/signal và log tiến trình; timeout là nghi vấn hang.
- **Điều kiện an toàn mong đợi:** Cập nhật trạng thái hợp lệ thành công; nội dung thông báo khớp đơn và trạng thái mới, không dùng lỗi setup làm bằng chứng fuzzing.
- **Mức thực hiện:** PASS theo oracle hiện tại; 1 kịch bản. Ví dụ `TC-OS-5:positive-control`, oracle `notification`, chuỗi HTTP `[200, 200]`. Chi tiết input và dữ liệu trong `results/spec_excel_aligned/report.json` → `executions`. Không suy rộng trạng thái này sang các điều kiện chưa được oracle kiểm tra.

### Module PRD: Quản lý sản phẩm

**Luồng nghiệp vụ mong đợi:** Admin đăng nhập → POST/PUT sản phẩm → kiểm tra quyền quản trị → lọc/kiểm tra ID, giá, tồn kho → chống trùng định danh → lưu → đọc lại dữ liệu.

**Tài sản/biên tin cậy:** Giá, tồn kho và định danh duy nhất. Luồng mong đợi phải tách dữ liệu catalog tin cậy khỏi giá do người mua gửi.

**Điểm đọc code:** [node_harness/index.js:281](D:/Virtual-Try-On-sync/fuzzing-security-testing/node_harness/index.js:281). Đây là code harness; mẫu C/Python không tự nằm trên đường gọi này.

#### TC-PRD-1 — Vượt quyền tạo hoặc sửa dữ liệu sản phẩm

- **Yêu cầu / ưu tiên:** REQ-PRD-1; HIGH. Nguồn: `Module_Products_Manage_spec.xlsx` → `TestCase`.
- **Nhóm lỗi / mục tiêu:** Broken access control trên tài nguyên quản trị.
- **Vị trí trong luồng:** Admin đăng nhập → POST/PUT sản phẩm → kiểm tra quyền quản trị → lọc/kiểm tra ID, giá, tồn kho → chống trùng định danh → lưu → đọc lại dữ liệu. Đối chiếu vị trí input/thao tác trong testcase với luồng này; không mặc định code hiện đã cưỡng chế đủ điều kiện an toàn.
- **Điều kiện ban đầu:** Server đang chạy
- **Cách kiểm tra:** Input có chủ đích/đột biến và oracle theo đặc tả. Concurrency/timing/version ngoài 29 ID chưa được campaign này thực thi.
- **Bước/input cụ thể:** POST /api/products không token → PUT /api/products/1 không token → Lưu seed, input thực tế, ngữ cảnh xác thực/trạng thái, response và thời gian. Chỉ kết luận crash khi có mã thoát/signal và log tiến trình; timeout là nghi vấn hang.
- **Điều kiện an toàn mong đợi:** HTTP 401/403 khi thiếu token hoặc dùng tài khoản thường cho thao tác quản trị.
- **Mức thực hiện:** FAIL theo oracle hiện tại; 4 kịch bản. Ví dụ `TC-PRD-1:POST-None`, oracle `status`, chuỗi HTTP `[200]`. Chi tiết input và dữ liệu trong `results/spec_excel_aligned/report.json` → `executions`. Không suy rộng trạng thái này sang các điều kiện chưa được oracle kiểm tra.

#### TC-PRD-2 — Giá âm vượt qua ràng buộc miền dữ liệu

- **Yêu cầu / ưu tiên:** REQ-PRD-2; HIGH. Nguồn: `Module_Products_Manage_spec.xlsx` → `TestCase`.
- **Nhóm lỗi / mục tiêu:** Validation miền giá / toàn vẹn catalog.
- **Vị trí trong luồng:** Admin đăng nhập → POST/PUT sản phẩm → kiểm tra quyền quản trị → lọc/kiểm tra ID, giá, tồn kho → chống trùng định danh → lưu → đọc lại dữ liệu. Đối chiếu vị trí input/thao tác trong testcase với luồng này; không mặc định code hiện đã cưỡng chế đủ điều kiện an toàn.
- **Điều kiện ban đầu:** Server đang chạy
- **Cách kiểm tra:** Input có chủ đích/đột biến và oracle theo đặc tả. Concurrency/timing/version ngoài 29 ID chưa được campaign này thực thi.
- **Bước/input cụ thể:** 1. Chuẩn bị trạng thái và dữ liệu như điều kiện tiên quyết. → 2. PUT /api/products/1 với body {"price":-500} → 3. Thu thập phản hồi/trạng thái cuối và đối chiếu kết quả mong đợi. → Lưu seed, input thực tế, ngữ cảnh xác thực/trạng thái, response và thời gian. Chỉ kết luận crash khi có mã thoát/signal và log tiến trình; timeout là nghi vấn hang.
- **Điều kiện an toàn mong đợi:** HTTP 400/422 cho giá âm; không coi cập nhật là hợp lệ.
- **Mức thực hiện:** FAIL theo oracle hiện tại; 1 kịch bản. Ví dụ `TC-PRD-2:negative-price`, oracle `status`, chuỗi HTTP `[200]`. Chi tiết input và dữ liệu trong `results/spec_excel_aligned/report.json` → `executions`. Không suy rộng trạng thái này sang các điều kiện chưa được oracle kiểm tra.

#### TC-PRD-3 — Giá sản phẩm sai kiểu gây ngoại lệ xử lý

- **Yêu cầu / ưu tiên:** REQ-PRD-3; HIGH. Nguồn: `Module_Products_Manage_spec.xlsx` → `TestCase`.
- **Nhóm lỗi / mục tiêu:** Validation kiểu / xử lý ngoại lệ.
- **Vị trí trong luồng:** Admin đăng nhập → POST/PUT sản phẩm → kiểm tra quyền quản trị → lọc/kiểm tra ID, giá, tồn kho → chống trùng định danh → lưu → đọc lại dữ liệu. Đối chiếu vị trí input/thao tác trong testcase với luồng này; không mặc định code hiện đã cưỡng chế đủ điều kiện an toàn.
- **Điều kiện ban đầu:** Server đang chạy
- **Cách kiểm tra:** Input có chủ đích/đột biến và oracle theo đặc tả. Concurrency/timing/version ngoài 29 ID chưa được campaign này thực thi.
- **Bước/input cụ thể:** 1. Chuẩn bị trạng thái và dữ liệu như điều kiện tiên quyết. → 2. PUT /api/products/1 với body {"price":{"a":1}} → 3. Thu thập phản hồi/trạng thái cuối và đối chiếu kết quả mong đợi. → Lưu seed, input thực tế, ngữ cảnh xác thực/trạng thái, response và thời gian. Chỉ kết luận crash khi có mã thoát/signal và log tiến trình; timeout là nghi vấn hang.
- **Điều kiện an toàn mong đợi:** HTTP 400/422 cho object thay vì số; không để lỗi chuyển kiểu gây HTTP 500.
- **Mức thực hiện:** FAIL theo oracle hiện tại; 1 kịch bản. Ví dụ `TC-PRD-3:price-object`, oracle `status`, chuỗi HTTP `[500]`. Chi tiết input và dữ liệu trong `results/spec_excel_aligned/report.json` → `executions`. Không suy rộng trạng thái này sang các điều kiện chưa được oracle kiểm tra.

#### TC-PRD-5 — ID trùng gây ghi đè hoặc mơ hồ định danh sản phẩm

- **Yêu cầu / ưu tiên:** REQ-PRD-4; HIGH. Nguồn: `Module_Products_Manage_spec.xlsx` → `TestCase`.
- **Nhóm lỗi / mục tiêu:** Toàn vẹn định danh / nguy cơ ghi đè dữ liệu.
- **Vị trí trong luồng:** Admin đăng nhập → POST/PUT sản phẩm → kiểm tra quyền quản trị → lọc/kiểm tra ID, giá, tồn kho → chống trùng định danh → lưu → đọc lại dữ liệu. Đối chiếu vị trí input/thao tác trong testcase với luồng này; không mặc định code hiện đã cưỡng chế đủ điều kiện an toàn.
- **Điều kiện ban đầu:** Đã có sản phẩm id=1
- **Cách kiểm tra:** Input có chủ đích/đột biến và oracle theo đặc tả. Concurrency/timing/version ngoài 29 ID chưa được campaign này thực thi.
- **Bước/input cụ thể:** 1. Chuẩn bị trạng thái và dữ liệu như điều kiện tiên quyết. → 2. POST /api/products với body {"id":1,...} → 3. Thu thập phản hồi/trạng thái cuối và đối chiếu kết quả mong đợi. → Lưu seed, input thực tế, ngữ cảnh xác thực/trạng thái, response và thời gian. Chỉ kết luận crash khi có mã thoát/signal và log tiến trình; timeout là nghi vấn hang.
- **Điều kiện an toàn mong đợi:** Từ chối ID trùng hoặc cấp ID mới duy nhất; không tạo hai sản phẩm cùng định danh hoặc ghi đè trái phép.
- **Mức thực hiện:** FAIL theo oracle hiện tại; 1 kịch bản. Ví dụ `TC-PRD-5:duplicate-id`, oracle `duplicate_id`, chuỗi HTTP `[200]`. Chi tiết input và dữ liệu trong `results/spec_excel_aligned/report.json` → `executions`. Không suy rộng trạng thái này sang các điều kiện chưa được oracle kiểm tra.

#### TC-PRD-21 — Kiểm tra quy trình fuzzing: Khảo sát chiều dài name và buffer mẫu C

- **Yêu cầu / ưu tiên:** REQ-PRD-FUZZ-21; HIGH. Nguồn: `Module_Products_Manage_spec.xlsx` → `TestCase`.
- **Nhóm lỗi / mục tiêu:** Độ đúng công cụ fuzzing và bằng chứng; không tự là lỗ hổng nghiệp vụ.
- **Vị trí trong luồng:** Kiểm tra chính công cụ điều phối, replay hoặc phân loại bằng chứng; không phải mặc định một lỗ hổng trong nghiệp vụ bán hàng.
- **Điều kiện ban đầu:** name API có giới hạn 200 ký tự theo đặc tả; mẫu parse_product_name có buffer B=200 byte, có native driver và AddressSanitizer hoạt động; bắt đầu bằng ASCII để đồng nhất byte/ký tự.
- **Cách kiểm tra:** Đối chiếu input/ngữ cảnh/log với từng pha công cụ; phân biệt kiểm tra quy trình và xác nhận lỗi ứng dụng.
- **Bước/input cụ thể:** 1. Gửi name ASCII dài 199, 200, 201 ký tự tới API từ trạng thái sạch và lưu response. → 2. Gửi riêng chuỗi ASCII dài B-1, B, B+1 tới driver C với sanitizer, kể cả ký tự kết thúc chuỗi. → 3. Lưu từng input, lệnh biên dịch, stderr, exit code và stack trace. → 4. Chạy lại điểm lỗi và đối chứng ngắn; thử UTF-8 riêng, ghi cả byte và số ký tự.
- **Điều kiện an toàn mong đợi:** Có hai bảng kết quả riêng API và native C. Với strcpy vào buffer B, chuỗi B ký tự còn cần byte kết thúc; chỉ xác nhận overflow bằng sanitizer ở binary C. API trả 500 hoặc từ chối name không đủ để kết luận lỗi bộ nhớ. Không có công cụ thì chưa đánh giá.
- **Mức thực hiện:** chưa được campaign API hiện tại thực thi; giữ trong 75 testcase ngoài campaign. Nội dung ở trên là thiết kế kiểm tra, không phải phát hiện đã xác nhận.

#### TC-PRD-7 — Hàm sinh mã C: parse_product_name (buffer-overflow)

- **Yêu cầu / ưu tiên:** REQ-PRD-FIX-parse_product_name; HIGH. Nguồn: `Module_Products_Manage_spec.xlsx` → `TestCase`.
- **Nhóm lỗi / mục tiêu:** An toàn bộ nhớ / quản lý tài nguyên trong mẫu C độc lập: buffer-overflow
- **Vị trí trong luồng:** Mẫu C độc lập lấy dữ liệu nghiệp vụ làm bối cảnh. Không coi là bước gọi native đã xác nhận của API; cần xem HamSinhMa và build/instrument mẫu trước khi kết luận runtime.
- **Điều kiện ban đầu:** Mẫu C parse_product_name, lỗi cấy buffer-overflow; có driver gọi hàm, compiler và AddressSanitizer hoạt động. Phạm vi native fixture, không phải API Node.js.
Chỉ chạy trên hàm C minh họa độc lập; cần compiler và instrumentation phù hợp. Không phải đường thực thi native đã xác nhận của API Node.js.
- **Cách kiểm tra:** Fuzz input của hàm C + instrumentation ASan/LSan phù hợp + đối chứng an toàn; đây là phương pháp dự kiến, chưa chạy trong campaign API.
- **Bước/input cụ thể:** 1. Sinh mã C và chạy kiểm tra tĩnh như testcase gốc. → 2. Tạo driver gọi parse_product_name, biên dịch -g -O0 và instrumentation phù hợp; kiểm tra đối chứng công cụ. → 3. Chạy chuỗi ASCII dài B-1, B, B+1 với B=200 byte và đối chứng ngắn. → 4. Lưu input, binary/source hash, stderr, exit code/signal và vị trí chẩn đoán. → 5. Tái hiện từ tiến trình sạch; chạy đối chứng an toàn cùng input. → Chạy cả mẫu lỗi cấy và đối chứng an toàn trên cùng input; lưu input, build flags, stderr, mã thoát và vị trí lỗi; lặp lại input gây lỗi.
- **Điều kiện an toàn mong đợi:** Đối chứng an toàn không có chẩn đoán buffer-overflow; mẫu lỗi cấy phải có chẩn đoán buffer-overflow tại hàm mục tiêu từ AddressSanitizer hoặc công cụ phát hiện lỗi bộ nhớ tương đương. Mẫu lỗi bị phát hiện là xác nhận đối chứng công cụ, không phải ứng dụng đã an toàn. Thiếu công cụ/bằng chứng: chưa xác minh. Không dùng HTTP 500 làm bằng chứng; leak không bắt buộc làm tiến trình crash.
- **Mức thực hiện:** chưa được campaign API hiện tại thực thi; giữ trong 75 testcase ngoài campaign. Nội dung ở trên là thiết kế kiểm tra, không phải phát hiện đã xác nhận.

#### TC-PRD-10 — Hàm sinh mã C: write_product_update_log (memory-leak)

- **Yêu cầu / ưu tiên:** REQ-PRD-FIX-write_product_update_log; HIGH. Nguồn: `Module_Products_Manage_spec.xlsx` → `TestCase`.
- **Nhóm lỗi / mục tiêu:** An toàn bộ nhớ / quản lý tài nguyên trong mẫu C độc lập: memory-leak
- **Vị trí trong luồng:** Mẫu C độc lập lấy dữ liệu nghiệp vụ làm bối cảnh. Không coi là bước gọi native đã xác nhận của API; cần xem HamSinhMa và build/instrument mẫu trước khi kết luận runtime.
- **Điều kiện ban đầu:** Mẫu C write_product_update_log, lỗi cấy memory-leak; có driver gọi hàm, compiler và LeakSanitizer hoặc công cụ kiểm tra leak tương đương hoạt động. Phạm vi native fixture, không phải API Node.js.
Chỉ chạy trên hàm C minh họa độc lập; cần compiler và instrumentation phù hợp. Không phải đường thực thi native đã xác nhận của API Node.js.
- **Cách kiểm tra:** Fuzz input của hàm C + instrumentation ASan/LSan phù hợp + đối chứng an toàn; đây là phương pháp dự kiến, chưa chạy trong campaign API.
- **Bước/input cụ thể:** 1. Sinh mã C và chạy kiểm tra tĩnh như testcase gốc. → 2. Tạo driver gọi write_product_update_log, biên dịch -g -O0 và instrumentation phù hợp; kiểm tra đối chứng công cụ. → 3. Chạy đường thực thi hàm một lần trên mỗi tiến trình mới; có đối chứng đã sửa tương ứng. → 4. Lưu input, binary/source hash, stderr, exit code/signal và vị trí chẩn đoán. → 5. Tái hiện từ tiến trình sạch; chạy đối chứng an toàn cùng input. → Chạy cả mẫu lỗi cấy và đối chứng an toàn trên cùng input; lưu input, build flags, stderr, mã thoát và vị trí lỗi; lặp lại input gây lỗi.
- **Điều kiện an toàn mong đợi:** Đối chứng an toàn không có chẩn đoán memory-leak; mẫu lỗi cấy phải có chẩn đoán memory-leak tại hàm mục tiêu từ LeakSanitizer hoặc công cụ phát hiện leak tương đương. Mẫu lỗi bị phát hiện là xác nhận đối chứng công cụ, không phải ứng dụng đã an toàn. Thiếu công cụ/bằng chứng: chưa xác minh. Không dùng HTTP 500 làm bằng chứng; leak không bắt buộc làm tiến trình crash.
- **Mức thực hiện:** chưa được campaign API hiện tại thực thi; giữ trong 75 testcase ngoài campaign. Nội dung ở trên là thiết kế kiểm tra, không phải phát hiện đã xác nhận.

#### TC-PRD-11 — Hàm sinh mã C: close_product_edit_session (double-free)

- **Yêu cầu / ưu tiên:** REQ-PRD-FIX-close_product_edit_session; HIGH. Nguồn: `Module_Products_Manage_spec.xlsx` → `TestCase`.
- **Nhóm lỗi / mục tiêu:** An toàn bộ nhớ / quản lý tài nguyên trong mẫu C độc lập: double-free
- **Vị trí trong luồng:** Mẫu C độc lập lấy dữ liệu nghiệp vụ làm bối cảnh. Không coi là bước gọi native đã xác nhận của API; cần xem HamSinhMa và build/instrument mẫu trước khi kết luận runtime.
- **Điều kiện ban đầu:** Mẫu C close_product_edit_session, lỗi cấy double-free; có driver gọi hàm, compiler và AddressSanitizer hoạt động. Phạm vi native fixture, không phải API Node.js.
Chỉ chạy trên hàm C minh họa độc lập; cần compiler và instrumentation phù hợp. Không phải đường thực thi native đã xác nhận của API Node.js.
- **Cách kiểm tra:** Fuzz input của hàm C + instrumentation ASan/LSan phù hợp + đối chứng an toàn; đây là phương pháp dự kiến, chưa chạy trong campaign API.
- **Bước/input cụ thể:** 1. Sinh mã C và chạy kiểm tra tĩnh như testcase gốc. → 2. Tạo driver gọi close_product_edit_session, biên dịch -g -O0 và instrumentation phù hợp; kiểm tra đối chứng công cụ. → 3. Chạy đường thực thi hàm một lần trên mỗi tiến trình mới; có đối chứng đã sửa tương ứng. → 4. Lưu input, binary/source hash, stderr, exit code/signal và vị trí chẩn đoán. → 5. Tái hiện từ tiến trình sạch; chạy đối chứng an toàn cùng input. → Chạy cả mẫu lỗi cấy và đối chứng an toàn trên cùng input; lưu input, build flags, stderr, mã thoát và vị trí lỗi; lặp lại input gây lỗi.
- **Điều kiện an toàn mong đợi:** Đối chứng an toàn không có chẩn đoán double-free; mẫu lỗi cấy phải có chẩn đoán double-free tại hàm mục tiêu từ AddressSanitizer hoặc công cụ phát hiện lỗi bộ nhớ tương đương. Mẫu lỗi bị phát hiện là xác nhận đối chứng công cụ, không phải ứng dụng đã an toàn. Thiếu công cụ/bằng chứng: chưa xác minh. Không dùng HTTP 500 làm bằng chứng; leak không bắt buộc làm tiến trình crash.
- **Mức thực hiện:** chưa được campaign API hiện tại thực thi; giữ trong 75 testcase ngoài campaign. Nội dung ở trên là thiết kế kiểm tra, không phải phát hiện đã xác nhận.

#### TC-PRD-12 — Hàm sinh mã C: release_product_list_cache (use-after-free)

- **Yêu cầu / ưu tiên:** REQ-PRD-FIX-release_product_list_cache; HIGH. Nguồn: `Module_Products_Manage_spec.xlsx` → `TestCase`.
- **Nhóm lỗi / mục tiêu:** An toàn bộ nhớ / quản lý tài nguyên trong mẫu C độc lập: use-after-free
- **Vị trí trong luồng:** Mẫu C độc lập lấy dữ liệu nghiệp vụ làm bối cảnh. Không coi là bước gọi native đã xác nhận của API; cần xem HamSinhMa và build/instrument mẫu trước khi kết luận runtime.
- **Điều kiện ban đầu:** Mẫu C release_product_list_cache, lỗi cấy use-after-free; có driver gọi hàm, compiler và AddressSanitizer hoạt động. Phạm vi native fixture, không phải API Node.js.
Chỉ chạy trên hàm C minh họa độc lập; cần compiler và instrumentation phù hợp. Không phải đường thực thi native đã xác nhận của API Node.js.
- **Cách kiểm tra:** Fuzz input của hàm C + instrumentation ASan/LSan phù hợp + đối chứng an toàn; đây là phương pháp dự kiến, chưa chạy trong campaign API.
- **Bước/input cụ thể:** 1. Sinh mã C và chạy kiểm tra tĩnh như testcase gốc. → 2. Tạo driver gọi release_product_list_cache, biên dịch -g -O0 và instrumentation phù hợp; kiểm tra đối chứng công cụ. → 3. Chạy đường thực thi hàm một lần trên mỗi tiến trình mới; có đối chứng đã sửa tương ứng. → 4. Lưu input, binary/source hash, stderr, exit code/signal và vị trí chẩn đoán. → 5. Tái hiện từ tiến trình sạch; chạy đối chứng an toàn cùng input. → Chạy cả mẫu lỗi cấy và đối chứng an toàn trên cùng input; lưu input, build flags, stderr, mã thoát và vị trí lỗi; lặp lại input gây lỗi.
- **Điều kiện an toàn mong đợi:** Đối chứng an toàn không có chẩn đoán use-after-free; mẫu lỗi cấy phải có chẩn đoán use-after-free tại hàm mục tiêu từ AddressSanitizer hoặc công cụ phát hiện lỗi bộ nhớ tương đương. Mẫu lỗi bị phát hiện là xác nhận đối chứng công cụ, không phải ứng dụng đã an toàn. Thiếu công cụ/bằng chứng: chưa xác minh. Không dùng HTTP 500 làm bằng chứng; leak không bắt buộc làm tiến trình crash.
- **Mức thực hiện:** chưa được campaign API hiện tại thực thi; giữ trong 75 testcase ngoài campaign. Nội dung ở trên là thiết kế kiểm tra, không phải phát hiện đã xác nhận.

#### TC-PRD-8 — Hàm Python: out_of_stock_ratio chia cho 0

- **Yêu cầu / ưu tiên:** REQ-PRD-FIX-out_of_stock_ratio; MEDIUM. Nguồn: `Module_Products_Manage_spec.xlsx` → `TestCase`.
- **Nhóm lỗi / mục tiêu:** Ngoại lệ tính toán trong mẫu Python độc lập.
- **Vị trí trong luồng:** Hàm Python minh họa độc lập của bước thống kê/tính toán; không đồng nhất traceback Python với server Node.js bị crash.
- **Điều kiện ban đầu:** Đã sinh mã Python Phạm vi mô hình minh họa theo template, không phải lỗi API Node.js.
- **Cách kiểm tra:** Sinh/đột biến đối số, bắt ngoại lệ và lưu traceback; cần mẫu đối chứng. Chưa được campaign API thực thi.
- **Bước/input cụ thể:** 1. Chuẩn bị trạng thái và dữ liệu như điều kiện tiên quyết. → 2. Chạy blackbox_fuzz() với initial_stock=0 → 3. Thu thập phản hồi/trạng thái cuối và đối chiếu kết quả mong đợi.
- **Điều kiện an toàn mong đợi:** Mẫu lỗi cấy phát sinh ZeroDivisionError với input chia cho 0; lưu traceback, input và cách gọi. Đối chứng an toàn xử lý trường hợp này có kiểm soát. Ngoại lệ Python chưa chứng minh crash server hoặc lỗi bộ nhớ native; thiếu thực thi thì chưa xác minh.
- **Mức thực hiện:** chưa được campaign API hiện tại thực thi; giữ trong 75 testcase ngoài campaign. Nội dung ở trên là thiết kế kiểm tra, không phải phát hiện đã xác nhận.

#### TC-PRD-6 — 2 request PUT đồng thời cùng 1 sản phẩm (race tồn kho)

- **Yêu cầu / ưu tiên:** REQ-PRD-1, NFR-PRD-4, REQ-CONC-PRD-1; HIGH. Nguồn: `Module_Products_Manage_spec.xlsx` → `TestCase`.
- **Nhóm lỗi / mục tiêu:** Đồng bộ / toàn vẹn cập nhật / tương thích version; xác định rõ ngữ cảnh đồng thời hoặc tuần tự trong bước thử.
- **Vị trí trong luồng:** Admin đăng nhập → POST/PUT sản phẩm → kiểm tra quyền quản trị → lọc/kiểm tra ID, giá, tồn kho → chống trùng định danh → lưu → đọc lại dữ liệu. Đối chiếu vị trí input/thao tác trong testcase với luồng này; không mặc định code hiện đã cưỡng chế đủ điều kiện an toàn.
- **Điều kiện ban đầu:** Đã có sản phẩm id=1, stock=10
- **Cách kiểm tra:** Input có chủ đích/đột biến và oracle theo đặc tả. Concurrency/timing/version ngoài 29 ID chưa được campaign này thực thi.
- **Bước/input cụ thể:** 1. Seed đối tượng __v=0; dùng actor có quyền theo kịch bản. → 2. Gửi đồng thời hai PUT dữ liệu khác nhau, cùng __v=0. → 3. Đọc phản hồi, version và dữ liệu cuối.
- **Điều kiện an toàn mong đợi:** Một HTTP 200 và một HTTP 409; __v cuối bằng 1; dữ liệu cuối khớp request thành công.
- **Mức thực hiện:** chưa được campaign API hiện tại thực thi; giữ trong 75 testcase ngoài campaign. Nội dung ở trên là thiết kế kiểm tra, không phải phát hiện đã xác nhận.

#### TC-PRD-17 — Version cũ sau cập nhật thành công

- **Yêu cầu / ưu tiên:** REQ-CONC-PRD-1; HIGH. Nguồn: `Module_Products_Manage_spec.xlsx` → `TestCase`.
- **Nhóm lỗi / mục tiêu:** Đồng bộ / toàn vẹn cập nhật / tương thích version; xác định rõ ngữ cảnh đồng thời hoặc tuần tự trong bước thử.
- **Vị trí trong luồng:** Admin đăng nhập → POST/PUT sản phẩm → kiểm tra quyền quản trị → lọc/kiểm tra ID, giá, tồn kho → chống trùng định danh → lưu → đọc lại dữ liệu. Đối chiếu vị trí input/thao tác trong testcase với luồng này; không mặc định code hiện đã cưỡng chế đủ điều kiện an toàn.
- **Điều kiện ban đầu:** Tài nguyên v=0, actor được phép sửa. Phạm vi: harness mô phỏng; testcase mới chưa có kịch bản thực thi tự động.
- **Cách kiểm tra:** Input có chủ đích/đột biến và oracle theo đặc tả. Concurrency/timing/version ngoài 29 ID chưa được campaign này thực thi.
- **Bước/input cụ thể:** 1. PUT /api/products/{product_id} với __v=0; gửi PUT lần hai vẫn __v=0; đọc lại dữ liệu. → 2. Thu thập response và dữ liệu cuối để đối chiếu kết quả mong đợi. → Dữ liệu thử: {"stock":11,"__v":0}
- **Điều kiện an toàn mong đợi:** Lần đầu 200/v=1; lần hai 409; dữ liệu và version không đổi sau lần bị từ chối.
- **Mức thực hiện:** chưa được campaign API hiện tại thực thi; giữ trong 75 testcase ngoài campaign. Nội dung ở trên là thiết kế kiểm tra, không phải phát hiện đã xác nhận.

#### TC-PRD-18 — Version sai kiểu hoặc ngoài miền

- **Yêu cầu / ưu tiên:** REQ-CONC-PRD-1; HIGH. Nguồn: `Module_Products_Manage_spec.xlsx` → `TestCase`.
- **Nhóm lỗi / mục tiêu:** Đồng bộ / toàn vẹn cập nhật / tương thích version; xác định rõ ngữ cảnh đồng thời hoặc tuần tự trong bước thử.
- **Vị trí trong luồng:** Admin đăng nhập → POST/PUT sản phẩm → kiểm tra quyền quản trị → lọc/kiểm tra ID, giá, tồn kho → chống trùng định danh → lưu → đọc lại dữ liệu. Đối chiếu vị trí input/thao tác trong testcase với luồng này; không mặc định code hiện đã cưỡng chế đủ điều kiện an toàn.
- **Điều kiện ban đầu:** Tài nguyên tồn tại trong harness. Phạm vi: harness mô phỏng; testcase mới chưa có kịch bản thực thi tự động.
- **Cách kiểm tra:** Input có chủ đích/đột biến và oracle theo đặc tả. Concurrency/timing/version ngoài 29 ID chưa được campaign này thực thi.
- **Bước/input cụ thể:** 1. PUT /api/products/{product_id} với lần lượt các giá trị __v; kiểm tra dữ liệu sau mỗi lần. → 2. Thu thập response và dữ liệu cuối để đối chiếu kết quả mong đợi. → Dữ liệu thử: __v: -1, 0.5, "0", null, true, {}, []
- **Điều kiện an toàn mong đợi:** Mỗi request trả 400; dữ liệu/version không thay đổi.
- **Mức thực hiện:** chưa được campaign API hiện tại thực thi; giữ trong 75 testcase ngoài campaign. Nội dung ở trên là thiết kế kiểm tra, không phải phát hiện đã xác nhận.

#### TC-PRD-19 — Cập nhật tuần tự với version mới nhất

- **Yêu cầu / ưu tiên:** REQ-CONC-PRD-1; HIGH. Nguồn: `Module_Products_Manage_spec.xlsx` → `TestCase`.
- **Nhóm lỗi / mục tiêu:** Đồng bộ / toàn vẹn cập nhật / tương thích version; xác định rõ ngữ cảnh đồng thời hoặc tuần tự trong bước thử.
- **Vị trí trong luồng:** Admin đăng nhập → POST/PUT sản phẩm → kiểm tra quyền quản trị → lọc/kiểm tra ID, giá, tồn kho → chống trùng định danh → lưu → đọc lại dữ liệu. Đối chiếu vị trí input/thao tác trong testcase với luồng này; không mặc định code hiện đã cưỡng chế đủ điều kiện an toàn.
- **Điều kiện ban đầu:** Tài nguyên v=0, actor được phép sửa. Phạm vi: harness mô phỏng; testcase mới chưa có kịch bản thực thi tự động.
- **Cách kiểm tra:** Input có chủ đích/đột biến và oracle theo đặc tả. Concurrency/timing/version ngoài 29 ID chưa được campaign này thực thi.
- **Bước/input cụ thể:** 1. PUT __v=0; đọc __v=1; PUT giá trị khác với __v=1; đọc lại. → 2. Thu thập response và dữ liệu cuối để đối chiếu kết quả mong đợi. → Dữ liệu thử: [{"stock":11,"__v":0},{"stock":12,"__v":1}]
- **Điều kiện an toàn mong đợi:** Cả hai trả 200; version cuối bằng 2; dữ liệu khớp lần thứ hai.
- **Mức thực hiện:** chưa được campaign API hiện tại thực thi; giữ trong 75 testcase ngoài campaign. Nội dung ở trên là thiết kế kiểm tra, không phải phát hiện đã xác nhận.

#### TC-PRD-20 — Client cũ không gửi version

- **Yêu cầu / ưu tiên:** CON-PRD-5; HIGH. Nguồn: `Module_Products_Manage_spec.xlsx` → `TestCase`.
- **Nhóm lỗi / mục tiêu:** Đồng bộ / toàn vẹn cập nhật / tương thích version; xác định rõ ngữ cảnh đồng thời hoặc tuần tự trong bước thử.
- **Vị trí trong luồng:** Admin đăng nhập → POST/PUT sản phẩm → kiểm tra quyền quản trị → lọc/kiểm tra ID, giá, tồn kho → chống trùng định danh → lưu → đọc lại dữ liệu. Đối chiếu vị trí input/thao tác trong testcase với luồng này; không mặc định code hiện đã cưỡng chế đủ điều kiện an toàn.
- **Điều kiện ban đầu:** Tài nguyên tồn tại trong harness; giao thức tương thích hiện tại. Phạm vi: harness mô phỏng; testcase mới chưa có kịch bản thực thi tự động.
- **Cách kiểm tra:** Input có chủ đích/đột biến và oracle theo đặc tả. Concurrency/timing/version ngoài 29 ID chưa được campaign này thực thi.
- **Bước/input cụ thể:** 1. PUT /api/products/{product_id} với dữ liệu hợp lệ, không có trường __v; đọc lại. → 2. Thu thập response và dữ liệu cuối để đối chiếu kết quả mong đợi. → Dữ liệu thử: {"stock":11}
- **Điều kiện an toàn mong đợi:** Theo hành vi tương thích hiện tại: 200 và version tăng 1. Không kết luận chống stale-write cho client bỏ version.
- **Mức thực hiện:** chưa được campaign API hiện tại thực thi; giữ trong 75 testcase ngoài campaign. Nội dung ở trên là thiết kế kiểm tra, không phải phát hiện đã xác nhận.

#### TC-PRD-9 — Kiểm tra tràn số: total_stock_movement_counter

- **Yêu cầu / ưu tiên:** REQ-PRD-SMT-total_stock_movement_counter; LOW. Nguồn: `Module_Products_Manage_spec.xlsx` → `TestCase`.
- **Nhóm lỗi / mục tiêu:** Số học: kiểm tra overflow trong mô hình hữu hạn, chưa là phát hiện runtime.
- **Vị trí trong luồng:** Mô hình phép toán/bộ đếm trong KiemTraSoHoc. Cần xác định signedness, miền và độ rộng bit; không gắn int32 của mô hình cho mọi số trong JavaScript.
- **Điều kiện ban đầu:** Đã khai báo biến SMT Phạm vi mô hình minh họa theo template, không phải lỗi API Node.js.
- **Cách kiểm tra:** Giải các ràng buộc đã khai báo, lưu SAT/model hoặc UNSAT/unknown. Sau đó mới đối chiếu phép toán của triển khai nếu có.
- **Bước/input cụ thể:** 1. Chuẩn bị trạng thái và dữ liệu như điều kiện tiên quyết. → 2. Chạy check_int32_overflow() bằng Z3 → 3. Thu thập phản hồi/trạng thái cuối và đối chiếu kết quả mong đợi.
- **Điều kiện an toàn mong đợi:** Đánh giá công thức theo đúng miền, signedness và độ rộng bit trong sheet KiemTraSoHoc. Nếu SAT, lưu giá trị chứng minh và phép toán gây vượt miền; nếu UNSAT, lưu giả định và phạm vi đã kiểm tra. Không mặc định SAT và không suy ra tràn số runtime Node.js từ mô hình số nguyên hữu hạn. Chưa chạy solver: chưa xác minh.
- **Mức thực hiện:** chưa được campaign API hiện tại thực thi; giữ trong 75 testcase ngoài campaign. Nội dung ở trên là thiết kế kiểm tra, không phải phát hiện đã xác nhận.

#### TC-PRD-13 — Kiểm tra tràn số: daily_product_update_counter

- **Yêu cầu / ưu tiên:** REQ-PRD-SMT-daily_product_update_counter; LOW. Nguồn: `Module_Products_Manage_spec.xlsx` → `TestCase`.
- **Nhóm lỗi / mục tiêu:** Số học: kiểm tra overflow trong mô hình hữu hạn, chưa là phát hiện runtime.
- **Vị trí trong luồng:** Mô hình phép toán/bộ đếm trong KiemTraSoHoc. Cần xác định signedness, miền và độ rộng bit; không gắn int32 của mô hình cho mọi số trong JavaScript.
- **Điều kiện ban đầu:** Đã khai báo biến SMT tương ứng cho dòng 'daily_product_update_counter' Phạm vi mô hình minh họa theo template, không phải lỗi API Node.js.
- **Cách kiểm tra:** Giải các ràng buộc đã khai báo, lưu SAT/model hoặc UNSAT/unknown. Sau đó mới đối chiếu phép toán của triển khai nếu có.
- **Bước/input cụ thể:** 1. Chuẩn bị trạng thái và dữ liệu như điều kiện tiên quyết. → 2. Chạy check_int32_overflow() bằng Z3 trên BieuThucTran của dòng 'daily_product_update_counter' → 3. Thu thập phản hồi/trạng thái cuối và đối chiếu kết quả mong đợi.
- **Điều kiện an toàn mong đợi:** Đánh giá công thức theo đúng miền, signedness và độ rộng bit trong sheet KiemTraSoHoc. Nếu SAT, lưu giá trị chứng minh và phép toán gây vượt miền; nếu UNSAT, lưu giả định và phạm vi đã kiểm tra. Không mặc định SAT và không suy ra tràn số runtime Node.js từ mô hình số nguyên hữu hạn. Chưa chạy solver: chưa xác minh.
- **Mức thực hiện:** chưa được campaign API hiện tại thực thi; giữ trong 75 testcase ngoài campaign. Nội dung ở trên là thiết kế kiểm tra, không phải phát hiện đã xác nhận.

#### TC-PRD-14 — Kiểm tra tràn số: concurrent_stock_update_counter

- **Yêu cầu / ưu tiên:** REQ-PRD-SMT-concurrent_stock_update_counter; LOW. Nguồn: `Module_Products_Manage_spec.xlsx` → `TestCase`.
- **Nhóm lỗi / mục tiêu:** Số học: kiểm tra overflow trong mô hình hữu hạn, chưa là phát hiện runtime.
- **Vị trí trong luồng:** Mô hình phép toán/bộ đếm trong KiemTraSoHoc. Cần xác định signedness, miền và độ rộng bit; không gắn int32 của mô hình cho mọi số trong JavaScript.
- **Điều kiện ban đầu:** Đã khai báo biến SMT tương ứng cho dòng 'concurrent_stock_update_counter' Phạm vi mô hình minh họa theo template, không phải lỗi API Node.js.
- **Cách kiểm tra:** Giải các ràng buộc đã khai báo, lưu SAT/model hoặc UNSAT/unknown. Sau đó mới đối chiếu phép toán của triển khai nếu có.
- **Bước/input cụ thể:** 1. Chuẩn bị trạng thái và dữ liệu như điều kiện tiên quyết. → 2. Chạy check_int32_overflow() bằng Z3 trên BieuThucTran của dòng 'concurrent_stock_update_counter' → 3. Thu thập phản hồi/trạng thái cuối và đối chiếu kết quả mong đợi.
- **Điều kiện an toàn mong đợi:** Đánh giá công thức theo đúng miền, signedness và độ rộng bit trong sheet KiemTraSoHoc. Nếu SAT, lưu giá trị chứng minh và phép toán gây vượt miền; nếu UNSAT, lưu giả định và phạm vi đã kiểm tra. Không mặc định SAT và không suy ra tràn số runtime Node.js từ mô hình số nguyên hữu hạn. Chưa chạy solver: chưa xác minh.
- **Mức thực hiện:** chưa được campaign API hiện tại thực thi; giữ trong 75 testcase ngoài campaign. Nội dung ở trên là thiết kế kiểm tra, không phải phát hiện đã xác nhận.

#### TC-PRD-15 — Kiểm tra tràn số: total_product_create_counter

- **Yêu cầu / ưu tiên:** REQ-PRD-SMT-total_product_create_counter; LOW. Nguồn: `Module_Products_Manage_spec.xlsx` → `TestCase`.
- **Nhóm lỗi / mục tiêu:** Số học: kiểm tra overflow trong mô hình hữu hạn, chưa là phát hiện runtime.
- **Vị trí trong luồng:** Mô hình phép toán/bộ đếm trong KiemTraSoHoc. Cần xác định signedness, miền và độ rộng bit; không gắn int32 của mô hình cho mọi số trong JavaScript.
- **Điều kiện ban đầu:** Đã khai báo biến SMT tương ứng cho dòng 'total_product_create_counter' Phạm vi mô hình minh họa theo template, không phải lỗi API Node.js.
- **Cách kiểm tra:** Giải các ràng buộc đã khai báo, lưu SAT/model hoặc UNSAT/unknown. Sau đó mới đối chiếu phép toán của triển khai nếu có.
- **Bước/input cụ thể:** 1. Chuẩn bị trạng thái và dữ liệu như điều kiện tiên quyết. → 2. Chạy check_int32_overflow() bằng Z3 trên BieuThucTran của dòng 'total_product_create_counter' → 3. Thu thập phản hồi/trạng thái cuối và đối chiếu kết quả mong đợi.
- **Điều kiện an toàn mong đợi:** Đánh giá công thức theo đúng miền, signedness và độ rộng bit trong sheet KiemTraSoHoc. Nếu SAT, lưu giá trị chứng minh và phép toán gây vượt miền; nếu UNSAT, lưu giả định và phạm vi đã kiểm tra. Không mặc định SAT và không suy ra tràn số runtime Node.js từ mô hình số nguyên hữu hạn. Chưa chạy solver: chưa xác minh.
- **Mức thực hiện:** chưa được campaign API hiện tại thực thi; giữ trong 75 testcase ngoài campaign. Nội dung ở trên là thiết kế kiểm tra, không phải phát hiện đã xác nhận.

#### TC-PRD-16 — Kiểm tra tràn số: out_of_stock_event_counter

- **Yêu cầu / ưu tiên:** REQ-PRD-SMT-out_of_stock_event_counter; LOW. Nguồn: `Module_Products_Manage_spec.xlsx` → `TestCase`.
- **Nhóm lỗi / mục tiêu:** Số học: kiểm tra overflow trong mô hình hữu hạn, chưa là phát hiện runtime.
- **Vị trí trong luồng:** Mô hình phép toán/bộ đếm trong KiemTraSoHoc. Cần xác định signedness, miền và độ rộng bit; không gắn int32 của mô hình cho mọi số trong JavaScript.
- **Điều kiện ban đầu:** Đã khai báo biến SMT tương ứng cho dòng 'out_of_stock_event_counter' Phạm vi mô hình minh họa theo template, không phải lỗi API Node.js.
- **Cách kiểm tra:** Giải các ràng buộc đã khai báo, lưu SAT/model hoặc UNSAT/unknown. Sau đó mới đối chiếu phép toán của triển khai nếu có.
- **Bước/input cụ thể:** 1. Chuẩn bị trạng thái và dữ liệu như điều kiện tiên quyết. → 2. Chạy check_int32_overflow() bằng Z3 trên BieuThucTran của dòng 'out_of_stock_event_counter' → 3. Thu thập phản hồi/trạng thái cuối và đối chiếu kết quả mong đợi.
- **Điều kiện an toàn mong đợi:** Đánh giá công thức theo đúng miền, signedness và độ rộng bit trong sheet KiemTraSoHoc. Nếu SAT, lưu giá trị chứng minh và phép toán gây vượt miền; nếu UNSAT, lưu giả định và phạm vi đã kiểm tra. Không mặc định SAT và không suy ra tràn số runtime Node.js từ mô hình số nguyên hữu hạn. Chưa chạy solver: chưa xác minh.
- **Mức thực hiện:** chưa được campaign API hiện tại thực thi; giữ trong 75 testcase ngoài campaign. Nội dung ở trên là thiết kế kiểm tra, không phải phát hiện đã xác nhận.

#### TC-PRD-4 — Đối chứng lỗi truy cập sản phẩm không tồn tại

- **Yêu cầu / ưu tiên:** REQ-PRD-6; MEDIUM. Nguồn: `Module_Products_Manage_spec.xlsx` → `TestCase`.
- **Nhóm lỗi / mục tiêu:** Đối chứng xử lý tài nguyên không tồn tại.
- **Vị trí trong luồng:** Admin đăng nhập → POST/PUT sản phẩm → kiểm tra quyền quản trị → lọc/kiểm tra ID, giá, tồn kho → chống trùng định danh → lưu → đọc lại dữ liệu. Đối chiếu vị trí input/thao tác trong testcase với luồng này; không mặc định code hiện đã cưỡng chế đủ điều kiện an toàn.
- **Điều kiện ban đầu:** Server đang chạy
- **Cách kiểm tra:** Input có chủ đích/đột biến và oracle theo đặc tả. Concurrency/timing/version ngoài 29 ID chưa được campaign này thực thi.
- **Bước/input cụ thể:** 1. Chuẩn bị trạng thái và dữ liệu như điều kiện tiên quyết. → 2. PUT /api/products/999999 (id không tồn tại) → 3. Thu thập phản hồi/trạng thái cuối và đối chiếu kết quả mong đợi. → Lưu seed, input thực tế, ngữ cảnh xác thực/trạng thái, response và thời gian. Chỉ kết luận crash khi có mã thoát/signal và log tiến trình; timeout là nghi vấn hang.
- **Điều kiện an toàn mong đợi:** HTTP 404 có kiểm soát; không báo lỗi tiến trình khi tài nguyên không tồn tại.
- **Mức thực hiện:** PASS theo oracle hiện tại; 1 kịch bản. Ví dụ `TC-PRD-4:missing-product`, oracle `status`, chuỗi HTTP `[404]`. Chi tiết input và dữ liệu trong `results/spec_excel_aligned/report.json` → `executions`. Không suy rộng trạng thái này sang các điều kiện chưa được oracle kiểm tra.

### Module USR: Hồ sơ và quản trị tài khoản

**Luồng nghiệp vụ mong đợi:** Xác thực người gọi → xác định user đích → kiểm tra chủ tài khoản/admin → lọc trường được sửa → hash password nếu đổi → lưu → response không lộ bí mật. create-admin là endpoint riêng.

**Tài sản/biên tin cậy:** Role, mật khẩu, hồ sơ người khác và secretKey. Xác thực khác phân quyền: có token không có nghĩa được sửa mọi user.

**Điểm đọc code:** [node_harness/index.js:563](D:/Virtual-Try-On-sync/fuzzing-security-testing/node_harness/index.js:563). Đây là code harness; mẫu C/Python không tự nằm trên đường gọi này.

#### TC-USR-1 — Truy cập trái phép hồ sơ tài khoản khác

- **Yêu cầu / ưu tiên:** REQ-USR-1, REQ-USR-2; HIGH. Nguồn: `Module_Users_Admin_spec.xlsx` → `TestCase`.
- **Nhóm lỗi / mục tiêu:** Broken access control / IDOR-BOLA.
- **Vị trí trong luồng:** Xác thực người gọi → xác định user đích → kiểm tra chủ tài khoản/admin → lọc trường được sửa → hash password nếu đổi → lưu → response không lộ bí mật. create-admin là endpoint riêng. Đối chiếu vị trí input/thao tác trong testcase với luồng này; không mặc định code hiện đã cưỡng chế đủ điều kiện an toàn.
- **Điều kiện ban đầu:** Có 2 user đã seed (fuzzuser, victim)
- **Cách kiểm tra:** Input có chủ đích/đột biến và oracle theo đặc tả. Concurrency/timing/version ngoài 29 ID chưa được campaign này thực thi.
- **Bước/input cụ thể:** PUT /api/users/:victim_id không token → PUT /api/users/:victim_id với token của fuzzuser → Lưu seed, input thực tế, ngữ cảnh xác thực/trạng thái, response và thời gian. Chỉ kết luận crash khi có mã thoát/signal và log tiến trình; timeout là nghi vấn hang.
- **Điều kiện an toàn mong đợi:** HTTP 401/403 khi thiếu token hoặc sửa hồ sơ người khác; không coi request là cập nhật hợp lệ.
- **Mức thực hiện:** FAIL theo oracle hiện tại; 2 kịch bản. Ví dụ `TC-USR-1:None`, oracle `status`, chuỗi HTTP `[200]`. Chi tiết input và dữ liệu trong `results/spec_excel_aligned/report.json` → `executions`. Không suy rộng trạng thái này sang các điều kiện chưa được oracle kiểm tra.

#### TC-USR-2 — Mass assignment làm thay đổi quyền tài khoản

- **Yêu cầu / ưu tiên:** REQ-USR-3; HIGH. Nguồn: `Module_Users_Admin_spec.xlsx` → `TestCase`.
- **Nhóm lỗi / mục tiêu:** Mass assignment / nâng quyền.
- **Vị trí trong luồng:** Xác thực người gọi → xác định user đích → kiểm tra chủ tài khoản/admin → lọc trường được sửa → hash password nếu đổi → lưu → response không lộ bí mật. create-admin là endpoint riêng. Đối chiếu vị trí input/thao tác trong testcase với luồng này; không mặc định code hiện đã cưỡng chế đủ điều kiện an toàn.
- **Điều kiện ban đầu:** Có 1 user thường đã seed
- **Cách kiểm tra:** Input có chủ đích/đột biến và oracle theo đặc tả. Concurrency/timing/version ngoài 29 ID chưa được campaign này thực thi.
- **Bước/input cụ thể:** 1. Chuẩn bị trạng thái và dữ liệu như điều kiện tiên quyết. → 2. Gửi PUT với body {"role":"admin"} → 3. Thu thập phản hồi/trạng thái cuối và đối chiếu kết quả mong đợi. → Lưu seed, input thực tế, ngữ cảnh xác thực/trạng thái, response và thời gian. Chỉ kết luận crash khi có mã thoát/signal và log tiến trình; timeout là nghi vấn hang.
- **Điều kiện an toàn mong đợi:** Role lưu trong dữ liệu vẫn giữ nguyên khi người dùng thường gửi role=admin; không nâng quyền theo body.
- **Mức thực hiện:** FAIL theo oracle hiện tại; 1 kịch bản. Ví dụ `TC-USR-2:role`, oracle `role_unchanged`, chuỗi HTTP `[200]`. Chi tiết input và dữ liệu trong `results/spec_excel_aligned/report.json` → `executions`. Không suy rộng trạng thái này sang các điều kiện chưa được oracle kiểm tra.

#### TC-USR-4 — Dữ liệu mật khẩu nhạy cảm bị lưu dạng rõ

- **Yêu cầu / ưu tiên:** REQ-USR-5, NFR-USR-5; HIGH. Nguồn: `Module_Users_Admin_spec.xlsx` → `TestCase`.
- **Nhóm lỗi / mục tiêu:** Bảo vệ dữ liệu mật khẩu nhạy cảm.
- **Vị trí trong luồng:** Xác thực người gọi → xác định user đích → kiểm tra chủ tài khoản/admin → lọc trường được sửa → hash password nếu đổi → lưu → response không lộ bí mật. create-admin là endpoint riêng. Đối chiếu vị trí input/thao tác trong testcase với luồng này; không mặc định code hiện đã cưỡng chế đủ điều kiện an toàn.
- **Điều kiện ban đầu:** Có 1 user đã seed (victim)
- **Cách kiểm tra:** Input có chủ đích/đột biến và oracle theo đặc tả. Concurrency/timing/version ngoài 29 ID chưa được campaign này thực thi.
- **Bước/input cụ thể:** Gửi PUT với body {"password":"plaintext_hack"} → Thử đăng nhập lại bằng password mới 'plaintext_hack' → Lưu seed, input thực tế, ngữ cảnh xác thực/trạng thái, response và thời gian. Chỉ kết luận crash khi có mã thoát/signal và log tiến trình; timeout là nghi vấn hang.
- **Điều kiện an toàn mong đợi:** Sau cập nhật hợp lệ, mật khẩu không được lưu bằng chuỗi plaintext đầu vào; phải kiểm tra dữ liệu lưu, không suy ra từ đăng nhập thành công.
- **Mức thực hiện:** FAIL theo oracle hiện tại; 1 kịch bản. Ví dụ `TC-USR-4:password-storage`, oracle `password`, chuỗi HTTP `[200]`. Chi tiết input và dữ liệu trong `results/spec_excel_aligned/report.json` → `executions`. Không suy rộng trạng thái này sang các điều kiện chưa được oracle kiểm tra.

#### TC-USR-3 — ID sai định dạng gây ngoại lệ truy vấn hồ sơ

- **Yêu cầu / ưu tiên:** REQ-USR-4; HIGH. Nguồn: `Module_Users_Admin_spec.xlsx` → `TestCase`.
- **Nhóm lỗi / mục tiêu:** Validation ID / xử lý ngoại lệ.
- **Vị trí trong luồng:** Xác thực người gọi → xác định user đích → kiểm tra chủ tài khoản/admin → lọc trường được sửa → hash password nếu đổi → lưu → response không lộ bí mật. create-admin là endpoint riêng. Đối chiếu vị trí input/thao tác trong testcase với luồng này; không mặc định code hiện đã cưỡng chế đủ điều kiện an toàn.
- **Điều kiện ban đầu:** Server đang chạy
- **Cách kiểm tra:** Input có chủ đích/đột biến và oracle theo đặc tả. Concurrency/timing/version ngoài 29 ID chưa được campaign này thực thi.
- **Bước/input cụ thể:** 1. Chuẩn bị trạng thái và dữ liệu như điều kiện tiên quyết. → 2. Gửi PUT /api/users/abc → 3. Thu thập phản hồi/trạng thái cuối và đối chiếu kết quả mong đợi. → Lưu seed, input thực tế, ngữ cảnh xác thực/trạng thái, response và thời gian. Chỉ kết luận crash khi có mã thoát/signal và log tiến trình; timeout là nghi vấn hang.
- **Điều kiện an toàn mong đợi:** HTTP 400/404 có kiểm soát; không HTTP 500 do ID sai định dạng.
- **Mức thực hiện:** FAIL theo oracle hiện tại; 1 kịch bản. Ví dụ `TC-USR-3:invalid-id`, oracle `status`, chuỗi HTTP `[500]`. Chi tiết input và dữ liệu trong `results/spec_excel_aligned/report.json` → `executions`. Không suy rộng trạng thái này sang các điều kiện chưa được oracle kiểm tra.

#### TC-USR-5 — Vượt cơ chế bảo vệ khởi tạo tài khoản admin

- **Yêu cầu / ưu tiên:** REQ-USR-6; HIGH. Nguồn: `Module_Users_Admin_spec.xlsx` → `TestCase`.
- **Nhóm lỗi / mục tiêu:** Kiểm soát quyền khởi tạo admin.
- **Vị trí trong luồng:** Xác thực người gọi → xác định user đích → kiểm tra chủ tài khoản/admin → lọc trường được sửa → hash password nếu đổi → lưu → response không lộ bí mật. create-admin là endpoint riêng. Đối chiếu vị trí input/thao tác trong testcase với luồng này; không mặc định code hiện đã cưỡng chế đủ điều kiện an toàn.
- **Điều kiện ban đầu:** Server đang chạy
- **Cách kiểm tra:** Input có chủ đích/đột biến và oracle theo đặc tả. Concurrency/timing/version ngoài 29 ID chưa được campaign này thực thi.
- **Bước/input cụ thể:** 1. Chuẩn bị trạng thái và dữ liệu như điều kiện tiên quyết. → 2. Gửi POST /api/auth/create-admin với secretKey='wrong' → 3. Thu thập phản hồi/trạng thái cuối và đối chiếu kết quả mong đợi. → Lưu seed, input thực tế, ngữ cảnh xác thực/trạng thái, response và thời gian. Chỉ kết luận crash khi có mã thoát/signal và log tiến trình; timeout là nghi vấn hang.
- **Điều kiện an toàn mong đợi:** HTTP 403 khi secretKey sai; không tạo tài khoản admin từ request này.
- **Mức thực hiện:** PASS theo oracle hiện tại; 1 kịch bản. Ví dụ `TC-USR-5:wrong-secret`, oracle `status`, chuỗi HTTP `[403]`. Chi tiết input và dữ liệu trong `results/spec_excel_aligned/report.json` → `executions`. Không suy rộng trạng thái này sang các điều kiện chưa được oracle kiểm tra.

#### TC-USR-21 — Kiểm tra quy trình fuzzing: Phân biệt ngoại lệ, HTTP 500 và crash tiến trình

- **Yêu cầu / ưu tiên:** REQ-USR-FUZZ-21; HIGH. Nguồn: `Module_Users_Admin_spec.xlsx` → `TestCase`.
- **Nhóm lỗi / mục tiêu:** Độ đúng công cụ fuzzing và bằng chứng; không tự là lỗ hổng nghiệp vụ.
- **Vị trí trong luồng:** Kiểm tra chính công cụ điều phối, replay hoặc phân loại bằng chứng; không phải mặc định một lỗ hổng trong nghiệp vụ bán hàng.
- **Điều kiện ban đầu:** Có ba đối chứng: HTTP trả 500 nhưng server còn sống; Python ném ngoại lệ được bắt; binary C đóng phiên có double-free được biên dịch với sanitizer hỗ trợ và chạy trong tiến trình con.
- **Cách kiểm tra:** Đối chiếu input/ngữ cảnh/log với từng pha công cụ; phân biệt kiểm tra quy trình và xác nhận lỗi ứng dụng.
- **Bước/input cụ thể:** 1. Gửi đối chứng HTTP 500, kiểm tra PID và request kiểm tra sống tiếp theo. → 2. Chạy đối chứng ngoại lệ Python đã bắt, ghi mã thoát. → 3. Thực thi close_admin_setup_session trong binary instrumented; lưu stderr, exit code/signal, input và stack trace. → 4. Chạy lại binary từ trạng thái sạch để đối chiếu cùng chẩn đoán.
- **Điều kiện an toàn mong đợi:** HTTP 500 với server còn sống là APPLICATION_HTTP_ERROR; exception được bắt không là process crash. Chỉ báo target kết thúc bất thường khi có mã thoát/signal và log; double-free chỉ xác nhận khi có chẩn đoán công cụ tại hàm mục tiêu. Thiếu sanitizer thì chưa đánh giá.
- **Mức thực hiện:** chưa được campaign API hiện tại thực thi; giữ trong 75 testcase ngoài campaign. Nội dung ở trên là thiết kế kiểm tra, không phải phát hiện đã xác nhận.

#### TC-USR-7 — Hàm sinh mã C: parse_user_fullname (buffer-overflow)

- **Yêu cầu / ưu tiên:** REQ-USR-FIX-parse_user_fullname; HIGH. Nguồn: `Module_Users_Admin_spec.xlsx` → `TestCase`.
- **Nhóm lỗi / mục tiêu:** An toàn bộ nhớ / quản lý tài nguyên trong mẫu C độc lập: buffer-overflow
- **Vị trí trong luồng:** Mẫu C độc lập lấy dữ liệu nghiệp vụ làm bối cảnh. Không coi là bước gọi native đã xác nhận của API; cần xem HamSinhMa và build/instrument mẫu trước khi kết luận runtime.
- **Điều kiện ban đầu:** Mẫu C parse_user_fullname, lỗi cấy buffer-overflow; có driver gọi hàm, compiler và AddressSanitizer hoạt động. Phạm vi native fixture, không phải API Node.js.
Chỉ chạy trên hàm C minh họa độc lập; cần compiler và instrumentation phù hợp. Không phải đường thực thi native đã xác nhận của API Node.js.
- **Cách kiểm tra:** Fuzz input của hàm C + instrumentation ASan/LSan phù hợp + đối chứng an toàn; đây là phương pháp dự kiến, chưa chạy trong campaign API.
- **Bước/input cụ thể:** 1. Sinh mã C và chạy kiểm tra tĩnh như testcase gốc. → 2. Tạo driver gọi parse_user_fullname, biên dịch -g -O0 và instrumentation phù hợp; kiểm tra đối chứng công cụ. → 3. Chạy chuỗi ASCII dài B-1, B, B+1 với B=100 byte và đối chứng ngắn. → 4. Lưu input, binary/source hash, stderr, exit code/signal và vị trí chẩn đoán. → 5. Tái hiện từ tiến trình sạch; chạy đối chứng an toàn cùng input. → Chạy cả mẫu lỗi cấy và đối chứng an toàn trên cùng input; lưu input, build flags, stderr, mã thoát và vị trí lỗi; lặp lại input gây lỗi.
- **Điều kiện an toàn mong đợi:** Đối chứng an toàn không có chẩn đoán buffer-overflow; mẫu lỗi cấy phải có chẩn đoán buffer-overflow tại hàm mục tiêu từ AddressSanitizer hoặc công cụ phát hiện lỗi bộ nhớ tương đương. Mẫu lỗi bị phát hiện là xác nhận đối chứng công cụ, không phải ứng dụng đã an toàn. Thiếu công cụ/bằng chứng: chưa xác minh. Không dùng HTTP 500 làm bằng chứng; leak không bắt buộc làm tiến trình crash.
- **Mức thực hiện:** chưa được campaign API hiện tại thực thi; giữ trong 75 testcase ngoài campaign. Nội dung ở trên là thiết kế kiểm tra, không phải phát hiện đã xác nhận.

#### TC-USR-10 — Hàm sinh mã C: write_profile_update_log (memory-leak)

- **Yêu cầu / ưu tiên:** REQ-USR-FIX-write_profile_update_log; HIGH. Nguồn: `Module_Users_Admin_spec.xlsx` → `TestCase`.
- **Nhóm lỗi / mục tiêu:** An toàn bộ nhớ / quản lý tài nguyên trong mẫu C độc lập: memory-leak
- **Vị trí trong luồng:** Mẫu C độc lập lấy dữ liệu nghiệp vụ làm bối cảnh. Không coi là bước gọi native đã xác nhận của API; cần xem HamSinhMa và build/instrument mẫu trước khi kết luận runtime.
- **Điều kiện ban đầu:** Mẫu C write_profile_update_log, lỗi cấy memory-leak; có driver gọi hàm, compiler và LeakSanitizer hoặc công cụ kiểm tra leak tương đương hoạt động. Phạm vi native fixture, không phải API Node.js.
Chỉ chạy trên hàm C minh họa độc lập; cần compiler và instrumentation phù hợp. Không phải đường thực thi native đã xác nhận của API Node.js.
- **Cách kiểm tra:** Fuzz input của hàm C + instrumentation ASan/LSan phù hợp + đối chứng an toàn; đây là phương pháp dự kiến, chưa chạy trong campaign API.
- **Bước/input cụ thể:** 1. Sinh mã C và chạy kiểm tra tĩnh như testcase gốc. → 2. Tạo driver gọi write_profile_update_log, biên dịch -g -O0 và instrumentation phù hợp; kiểm tra đối chứng công cụ. → 3. Chạy đường thực thi hàm một lần trên mỗi tiến trình mới; có đối chứng đã sửa tương ứng. → 4. Lưu input, binary/source hash, stderr, exit code/signal và vị trí chẩn đoán. → 5. Tái hiện từ tiến trình sạch; chạy đối chứng an toàn cùng input. → Chạy cả mẫu lỗi cấy và đối chứng an toàn trên cùng input; lưu input, build flags, stderr, mã thoát và vị trí lỗi; lặp lại input gây lỗi.
- **Điều kiện an toàn mong đợi:** Đối chứng an toàn không có chẩn đoán memory-leak; mẫu lỗi cấy phải có chẩn đoán memory-leak tại hàm mục tiêu từ LeakSanitizer hoặc công cụ phát hiện leak tương đương. Mẫu lỗi bị phát hiện là xác nhận đối chứng công cụ, không phải ứng dụng đã an toàn. Thiếu công cụ/bằng chứng: chưa xác minh. Không dùng HTTP 500 làm bằng chứng; leak không bắt buộc làm tiến trình crash.
- **Mức thực hiện:** chưa được campaign API hiện tại thực thi; giữ trong 75 testcase ngoài campaign. Nội dung ở trên là thiết kế kiểm tra, không phải phát hiện đã xác nhận.

#### TC-USR-11 — Hàm sinh mã C: close_admin_setup_session (double-free)

- **Yêu cầu / ưu tiên:** REQ-USR-FIX-close_admin_setup_session; HIGH. Nguồn: `Module_Users_Admin_spec.xlsx` → `TestCase`.
- **Nhóm lỗi / mục tiêu:** An toàn bộ nhớ / quản lý tài nguyên trong mẫu C độc lập: double-free
- **Vị trí trong luồng:** Mẫu C độc lập lấy dữ liệu nghiệp vụ làm bối cảnh. Không coi là bước gọi native đã xác nhận của API; cần xem HamSinhMa và build/instrument mẫu trước khi kết luận runtime.
- **Điều kiện ban đầu:** Mẫu C close_admin_setup_session, lỗi cấy double-free; có driver gọi hàm, compiler và AddressSanitizer hoạt động. Phạm vi native fixture, không phải API Node.js.
Chỉ chạy trên hàm C minh họa độc lập; cần compiler và instrumentation phù hợp. Không phải đường thực thi native đã xác nhận của API Node.js.
- **Cách kiểm tra:** Fuzz input của hàm C + instrumentation ASan/LSan phù hợp + đối chứng an toàn; đây là phương pháp dự kiến, chưa chạy trong campaign API.
- **Bước/input cụ thể:** 1. Sinh mã C và chạy kiểm tra tĩnh như testcase gốc. → 2. Tạo driver gọi close_admin_setup_session, biên dịch -g -O0 và instrumentation phù hợp; kiểm tra đối chứng công cụ. → 3. Chạy đường thực thi hàm một lần trên mỗi tiến trình mới; có đối chứng đã sửa tương ứng. → 4. Lưu input, binary/source hash, stderr, exit code/signal và vị trí chẩn đoán. → 5. Tái hiện từ tiến trình sạch; chạy đối chứng an toàn cùng input. → Chạy cả mẫu lỗi cấy và đối chứng an toàn trên cùng input; lưu input, build flags, stderr, mã thoát và vị trí lỗi; lặp lại input gây lỗi.
- **Điều kiện an toàn mong đợi:** Đối chứng an toàn không có chẩn đoán double-free; mẫu lỗi cấy phải có chẩn đoán double-free tại hàm mục tiêu từ AddressSanitizer hoặc công cụ phát hiện lỗi bộ nhớ tương đương. Mẫu lỗi bị phát hiện là xác nhận đối chứng công cụ, không phải ứng dụng đã an toàn. Thiếu công cụ/bằng chứng: chưa xác minh. Không dùng HTTP 500 làm bằng chứng; leak không bắt buộc làm tiến trình crash.
- **Mức thực hiện:** chưa được campaign API hiện tại thực thi; giữ trong 75 testcase ngoài campaign. Nội dung ở trên là thiết kế kiểm tra, không phải phát hiện đã xác nhận.

#### TC-USR-12 — Hàm sinh mã C: release_user_profile_cache (use-after-free)

- **Yêu cầu / ưu tiên:** REQ-USR-FIX-release_user_profile_cache; HIGH. Nguồn: `Module_Users_Admin_spec.xlsx` → `TestCase`.
- **Nhóm lỗi / mục tiêu:** An toàn bộ nhớ / quản lý tài nguyên trong mẫu C độc lập: use-after-free
- **Vị trí trong luồng:** Mẫu C độc lập lấy dữ liệu nghiệp vụ làm bối cảnh. Không coi là bước gọi native đã xác nhận của API; cần xem HamSinhMa và build/instrument mẫu trước khi kết luận runtime.
- **Điều kiện ban đầu:** Mẫu C release_user_profile_cache, lỗi cấy use-after-free; có driver gọi hàm, compiler và AddressSanitizer hoạt động. Phạm vi native fixture, không phải API Node.js.
Chỉ chạy trên hàm C minh họa độc lập; cần compiler và instrumentation phù hợp. Không phải đường thực thi native đã xác nhận của API Node.js.
- **Cách kiểm tra:** Fuzz input của hàm C + instrumentation ASan/LSan phù hợp + đối chứng an toàn; đây là phương pháp dự kiến, chưa chạy trong campaign API.
- **Bước/input cụ thể:** 1. Sinh mã C và chạy kiểm tra tĩnh như testcase gốc. → 2. Tạo driver gọi release_user_profile_cache, biên dịch -g -O0 và instrumentation phù hợp; kiểm tra đối chứng công cụ. → 3. Chạy đường thực thi hàm một lần trên mỗi tiến trình mới; có đối chứng đã sửa tương ứng. → 4. Lưu input, binary/source hash, stderr, exit code/signal và vị trí chẩn đoán. → 5. Tái hiện từ tiến trình sạch; chạy đối chứng an toàn cùng input. → Chạy cả mẫu lỗi cấy và đối chứng an toàn trên cùng input; lưu input, build flags, stderr, mã thoát và vị trí lỗi; lặp lại input gây lỗi.
- **Điều kiện an toàn mong đợi:** Đối chứng an toàn không có chẩn đoán use-after-free; mẫu lỗi cấy phải có chẩn đoán use-after-free tại hàm mục tiêu từ AddressSanitizer hoặc công cụ phát hiện lỗi bộ nhớ tương đương. Mẫu lỗi bị phát hiện là xác nhận đối chứng công cụ, không phải ứng dụng đã an toàn. Thiếu công cụ/bằng chứng: chưa xác minh. Không dùng HTTP 500 làm bằng chứng; leak không bắt buộc làm tiến trình crash.
- **Mức thực hiện:** chưa được campaign API hiện tại thực thi; giữ trong 75 testcase ngoài campaign. Nội dung ở trên là thiết kế kiểm tra, không phải phát hiện đã xác nhận.

#### TC-USR-8 — Hàm Python: admin_promotion_ratio chia cho 0

- **Yêu cầu / ưu tiên:** REQ-USR-FIX-admin_promotion_ratio; MEDIUM. Nguồn: `Module_Users_Admin_spec.xlsx` → `TestCase`.
- **Nhóm lỗi / mục tiêu:** Ngoại lệ tính toán trong mẫu Python độc lập.
- **Vị trí trong luồng:** Hàm Python minh họa độc lập của bước thống kê/tính toán; không đồng nhất traceback Python với server Node.js bị crash.
- **Điều kiện ban đầu:** Đã sinh mã Python Phạm vi mô hình minh họa theo template, không phải lỗi API Node.js.
- **Cách kiểm tra:** Sinh/đột biến đối số, bắt ngoại lệ và lưu traceback; cần mẫu đối chứng. Chưa được campaign API thực thi.
- **Bước/input cụ thể:** 1. Chuẩn bị trạng thái và dữ liệu như điều kiện tiên quyết. → 2. Chạy blackbox_fuzz() với total_create_admin_calls=0 → 3. Thu thập phản hồi/trạng thái cuối và đối chiếu kết quả mong đợi.
- **Điều kiện an toàn mong đợi:** Mẫu lỗi cấy phát sinh ZeroDivisionError với input chia cho 0; lưu traceback, input và cách gọi. Đối chứng an toàn xử lý trường hợp này có kiểm soát. Ngoại lệ Python chưa chứng minh crash server hoặc lỗi bộ nhớ native; thiếu thực thi thì chưa xác minh.
- **Mức thực hiện:** chưa được campaign API hiện tại thực thi; giữ trong 75 testcase ngoài campaign. Nội dung ở trên là thiết kế kiểm tra, không phải phát hiện đã xác nhận.

#### TC-USR-17 — Version cũ sau cập nhật thành công

- **Yêu cầu / ưu tiên:** REQ-CONC-USR-1; HIGH. Nguồn: `Module_Users_Admin_spec.xlsx` → `TestCase`.
- **Nhóm lỗi / mục tiêu:** Đồng bộ / toàn vẹn cập nhật / tương thích version; xác định rõ ngữ cảnh đồng thời hoặc tuần tự trong bước thử.
- **Vị trí trong luồng:** Xác thực người gọi → xác định user đích → kiểm tra chủ tài khoản/admin → lọc trường được sửa → hash password nếu đổi → lưu → response không lộ bí mật. create-admin là endpoint riêng. Đối chiếu vị trí input/thao tác trong testcase với luồng này; không mặc định code hiện đã cưỡng chế đủ điều kiện an toàn.
- **Điều kiện ban đầu:** Tài nguyên v=0, actor được phép sửa. Phạm vi: harness mô phỏng; testcase mới chưa có kịch bản thực thi tự động.
- **Cách kiểm tra:** Input có chủ đích/đột biến và oracle theo đặc tả. Concurrency/timing/version ngoài 29 ID chưa được campaign này thực thi.
- **Bước/input cụ thể:** 1. PUT /api/users/{user_id} với __v=0; gửi PUT lần hai vẫn __v=0; đọc lại dữ liệu. → 2. Thu thập response và dữ liệu cuối để đối chiếu kết quả mong đợi. → Dữ liệu thử: {"fullName":"Fuzz Updated","__v":0}
- **Điều kiện an toàn mong đợi:** Lần đầu 200/v=1; lần hai 409; dữ liệu và version không đổi sau lần bị từ chối.
- **Mức thực hiện:** chưa được campaign API hiện tại thực thi; giữ trong 75 testcase ngoài campaign. Nội dung ở trên là thiết kế kiểm tra, không phải phát hiện đã xác nhận.

#### TC-USR-18 — Version sai kiểu hoặc ngoài miền

- **Yêu cầu / ưu tiên:** REQ-CONC-USR-1; HIGH. Nguồn: `Module_Users_Admin_spec.xlsx` → `TestCase`.
- **Nhóm lỗi / mục tiêu:** Đồng bộ / toàn vẹn cập nhật / tương thích version; xác định rõ ngữ cảnh đồng thời hoặc tuần tự trong bước thử.
- **Vị trí trong luồng:** Xác thực người gọi → xác định user đích → kiểm tra chủ tài khoản/admin → lọc trường được sửa → hash password nếu đổi → lưu → response không lộ bí mật. create-admin là endpoint riêng. Đối chiếu vị trí input/thao tác trong testcase với luồng này; không mặc định code hiện đã cưỡng chế đủ điều kiện an toàn.
- **Điều kiện ban đầu:** Tài nguyên tồn tại trong harness. Phạm vi: harness mô phỏng; testcase mới chưa có kịch bản thực thi tự động.
- **Cách kiểm tra:** Input có chủ đích/đột biến và oracle theo đặc tả. Concurrency/timing/version ngoài 29 ID chưa được campaign này thực thi.
- **Bước/input cụ thể:** 1. PUT /api/users/{user_id} với lần lượt các giá trị __v; kiểm tra dữ liệu sau mỗi lần. → 2. Thu thập response và dữ liệu cuối để đối chiếu kết quả mong đợi. → Dữ liệu thử: __v: -1, 0.5, "0", null, true, {}, []
- **Điều kiện an toàn mong đợi:** Mỗi request trả 400; dữ liệu/version không thay đổi.
- **Mức thực hiện:** chưa được campaign API hiện tại thực thi; giữ trong 75 testcase ngoài campaign. Nội dung ở trên là thiết kế kiểm tra, không phải phát hiện đã xác nhận.

#### TC-USR-19 — Cập nhật tuần tự với version mới nhất

- **Yêu cầu / ưu tiên:** REQ-CONC-USR-1; HIGH. Nguồn: `Module_Users_Admin_spec.xlsx` → `TestCase`.
- **Nhóm lỗi / mục tiêu:** Đồng bộ / toàn vẹn cập nhật / tương thích version; xác định rõ ngữ cảnh đồng thời hoặc tuần tự trong bước thử.
- **Vị trí trong luồng:** Xác thực người gọi → xác định user đích → kiểm tra chủ tài khoản/admin → lọc trường được sửa → hash password nếu đổi → lưu → response không lộ bí mật. create-admin là endpoint riêng. Đối chiếu vị trí input/thao tác trong testcase với luồng này; không mặc định code hiện đã cưỡng chế đủ điều kiện an toàn.
- **Điều kiện ban đầu:** Tài nguyên v=0, actor được phép sửa. Phạm vi: harness mô phỏng; testcase mới chưa có kịch bản thực thi tự động.
- **Cách kiểm tra:** Input có chủ đích/đột biến và oracle theo đặc tả. Concurrency/timing/version ngoài 29 ID chưa được campaign này thực thi.
- **Bước/input cụ thể:** 1. PUT __v=0; đọc __v=1; PUT giá trị khác với __v=1; đọc lại. → 2. Thu thập response và dữ liệu cuối để đối chiếu kết quả mong đợi. → Dữ liệu thử: [{"fullName":"Fuzz Updated","__v":0},{"fullName":"Fuzz Updated Again","__v":1}]
- **Điều kiện an toàn mong đợi:** Cả hai trả 200; version cuối bằng 2; dữ liệu khớp lần thứ hai.
- **Mức thực hiện:** chưa được campaign API hiện tại thực thi; giữ trong 75 testcase ngoài campaign. Nội dung ở trên là thiết kế kiểm tra, không phải phát hiện đã xác nhận.

#### TC-USR-20 — Client cũ không gửi version

- **Yêu cầu / ưu tiên:** CON-USR-5; HIGH. Nguồn: `Module_Users_Admin_spec.xlsx` → `TestCase`.
- **Nhóm lỗi / mục tiêu:** Đồng bộ / toàn vẹn cập nhật / tương thích version; xác định rõ ngữ cảnh đồng thời hoặc tuần tự trong bước thử.
- **Vị trí trong luồng:** Xác thực người gọi → xác định user đích → kiểm tra chủ tài khoản/admin → lọc trường được sửa → hash password nếu đổi → lưu → response không lộ bí mật. create-admin là endpoint riêng. Đối chiếu vị trí input/thao tác trong testcase với luồng này; không mặc định code hiện đã cưỡng chế đủ điều kiện an toàn.
- **Điều kiện ban đầu:** Tài nguyên tồn tại trong harness; giao thức tương thích hiện tại. Phạm vi: harness mô phỏng; testcase mới chưa có kịch bản thực thi tự động.
- **Cách kiểm tra:** Input có chủ đích/đột biến và oracle theo đặc tả. Concurrency/timing/version ngoài 29 ID chưa được campaign này thực thi.
- **Bước/input cụ thể:** 1. PUT /api/users/{user_id} với dữ liệu hợp lệ, không có trường __v; đọc lại. → 2. Thu thập response và dữ liệu cuối để đối chiếu kết quả mong đợi. → Dữ liệu thử: {"fullName":"Fuzz Updated"}
- **Điều kiện an toàn mong đợi:** Theo hành vi tương thích hiện tại: 200 và version tăng 1. Không kết luận chống stale-write cho client bỏ version.
- **Mức thực hiện:** chưa được campaign API hiện tại thực thi; giữ trong 75 testcase ngoài campaign. Nội dung ở trên là thiết kế kiểm tra, không phải phát hiện đã xác nhận.

#### TC-USR-6 — 2 request PUT đồng thời cùng 1 user

- **Yêu cầu / ưu tiên:** REQ-USR-2, NFR-USR-4, REQ-CONC-USR-1; MEDIUM. Nguồn: `Module_Users_Admin_spec.xlsx` → `TestCase`.
- **Nhóm lỗi / mục tiêu:** Đồng bộ / toàn vẹn cập nhật / tương thích version; xác định rõ ngữ cảnh đồng thời hoặc tuần tự trong bước thử.
- **Vị trí trong luồng:** Xác thực người gọi → xác định user đích → kiểm tra chủ tài khoản/admin → lọc trường được sửa → hash password nếu đổi → lưu → response không lộ bí mật. create-admin là endpoint riêng. Đối chiếu vị trí input/thao tác trong testcase với luồng này; không mặc định code hiện đã cưỡng chế đủ điều kiện an toàn.
- **Điều kiện ban đầu:** Có 1 user đã seed
- **Cách kiểm tra:** Input có chủ đích/đột biến và oracle theo đặc tả. Concurrency/timing/version ngoài 29 ID chưa được campaign này thực thi.
- **Bước/input cụ thể:** 1. Seed đối tượng __v=0; dùng actor có quyền theo kịch bản. → 2. Gửi đồng thời hai PUT dữ liệu khác nhau, cùng __v=0. → 3. Đọc phản hồi, version và dữ liệu cuối.
- **Điều kiện an toàn mong đợi:** Một HTTP 200 và một HTTP 409; __v cuối bằng 1; dữ liệu cuối khớp request thành công.
- **Mức thực hiện:** chưa được campaign API hiện tại thực thi; giữ trong 75 testcase ngoài campaign. Nội dung ở trên là thiết kế kiểm tra, không phải phát hiện đã xác nhận.

#### TC-USR-9 — Kiểm tra tràn số: total_create_admin_attempt_counter

- **Yêu cầu / ưu tiên:** REQ-USR-SMT-total_create_admin_attempt_counter; LOW. Nguồn: `Module_Users_Admin_spec.xlsx` → `TestCase`.
- **Nhóm lỗi / mục tiêu:** Số học: kiểm tra overflow trong mô hình hữu hạn, chưa là phát hiện runtime.
- **Vị trí trong luồng:** Mô hình phép toán/bộ đếm trong KiemTraSoHoc. Cần xác định signedness, miền và độ rộng bit; không gắn int32 của mô hình cho mọi số trong JavaScript.
- **Điều kiện ban đầu:** Đã khai báo biến SMT Phạm vi mô hình minh họa theo template, không phải lỗi API Node.js.
- **Cách kiểm tra:** Giải các ràng buộc đã khai báo, lưu SAT/model hoặc UNSAT/unknown. Sau đó mới đối chiếu phép toán của triển khai nếu có.
- **Bước/input cụ thể:** 1. Chuẩn bị trạng thái và dữ liệu như điều kiện tiên quyết. → 2. Chạy check_int32_overflow() bằng Z3 → 3. Thu thập phản hồi/trạng thái cuối và đối chiếu kết quả mong đợi.
- **Điều kiện an toàn mong đợi:** Đánh giá công thức theo đúng miền, signedness và độ rộng bit trong sheet KiemTraSoHoc. Nếu SAT, lưu giá trị chứng minh và phép toán gây vượt miền; nếu UNSAT, lưu giả định và phạm vi đã kiểm tra. Không mặc định SAT và không suy ra tràn số runtime Node.js từ mô hình số nguyên hữu hạn. Chưa chạy solver: chưa xác minh.
- **Mức thực hiện:** chưa được campaign API hiện tại thực thi; giữ trong 75 testcase ngoài campaign. Nội dung ở trên là thiết kế kiểm tra, không phải phát hiện đã xác nhận.

#### TC-USR-13 — Kiểm tra tràn số: daily_profile_update_counter

- **Yêu cầu / ưu tiên:** REQ-USR-SMT-daily_profile_update_counter; LOW. Nguồn: `Module_Users_Admin_spec.xlsx` → `TestCase`.
- **Nhóm lỗi / mục tiêu:** Số học: kiểm tra overflow trong mô hình hữu hạn, chưa là phát hiện runtime.
- **Vị trí trong luồng:** Mô hình phép toán/bộ đếm trong KiemTraSoHoc. Cần xác định signedness, miền và độ rộng bit; không gắn int32 của mô hình cho mọi số trong JavaScript.
- **Điều kiện ban đầu:** Đã khai báo biến SMT tương ứng cho dòng 'daily_profile_update_counter' Phạm vi mô hình minh họa theo template, không phải lỗi API Node.js.
- **Cách kiểm tra:** Giải các ràng buộc đã khai báo, lưu SAT/model hoặc UNSAT/unknown. Sau đó mới đối chiếu phép toán của triển khai nếu có.
- **Bước/input cụ thể:** 1. Chuẩn bị trạng thái và dữ liệu như điều kiện tiên quyết. → 2. Chạy check_int32_overflow() bằng Z3 trên BieuThucTran của dòng 'daily_profile_update_counter' → 3. Thu thập phản hồi/trạng thái cuối và đối chiếu kết quả mong đợi.
- **Điều kiện an toàn mong đợi:** Đánh giá công thức theo đúng miền, signedness và độ rộng bit trong sheet KiemTraSoHoc. Nếu SAT, lưu giá trị chứng minh và phép toán gây vượt miền; nếu UNSAT, lưu giả định và phạm vi đã kiểm tra. Không mặc định SAT và không suy ra tràn số runtime Node.js từ mô hình số nguyên hữu hạn. Chưa chạy solver: chưa xác minh.
- **Mức thực hiện:** chưa được campaign API hiện tại thực thi; giữ trong 75 testcase ngoài campaign. Nội dung ở trên là thiết kế kiểm tra, không phải phát hiện đã xác nhận.

#### TC-USR-14 — Kiểm tra tràn số: concurrent_profile_update_counter

- **Yêu cầu / ưu tiên:** REQ-USR-SMT-concurrent_profile_update_counter; LOW. Nguồn: `Module_Users_Admin_spec.xlsx` → `TestCase`.
- **Nhóm lỗi / mục tiêu:** Số học: kiểm tra overflow trong mô hình hữu hạn, chưa là phát hiện runtime.
- **Vị trí trong luồng:** Mô hình phép toán/bộ đếm trong KiemTraSoHoc. Cần xác định signedness, miền và độ rộng bit; không gắn int32 của mô hình cho mọi số trong JavaScript.
- **Điều kiện ban đầu:** Đã khai báo biến SMT tương ứng cho dòng 'concurrent_profile_update_counter' Phạm vi mô hình minh họa theo template, không phải lỗi API Node.js.
- **Cách kiểm tra:** Giải các ràng buộc đã khai báo, lưu SAT/model hoặc UNSAT/unknown. Sau đó mới đối chiếu phép toán của triển khai nếu có.
- **Bước/input cụ thể:** 1. Chuẩn bị trạng thái và dữ liệu như điều kiện tiên quyết. → 2. Chạy check_int32_overflow() bằng Z3 trên BieuThucTran của dòng 'concurrent_profile_update_counter' → 3. Thu thập phản hồi/trạng thái cuối và đối chiếu kết quả mong đợi.
- **Điều kiện an toàn mong đợi:** Đánh giá công thức theo đúng miền, signedness và độ rộng bit trong sheet KiemTraSoHoc. Nếu SAT, lưu giá trị chứng minh và phép toán gây vượt miền; nếu UNSAT, lưu giả định và phạm vi đã kiểm tra. Không mặc định SAT và không suy ra tràn số runtime Node.js từ mô hình số nguyên hữu hạn. Chưa chạy solver: chưa xác minh.
- **Mức thực hiện:** chưa được campaign API hiện tại thực thi; giữ trong 75 testcase ngoài campaign. Nội dung ở trên là thiết kế kiểm tra, không phải phát hiện đã xác nhận.

#### TC-USR-15 — Kiểm tra tràn số: active_user_counter

- **Yêu cầu / ưu tiên:** REQ-USR-SMT-active_user_counter; LOW. Nguồn: `Module_Users_Admin_spec.xlsx` → `TestCase`.
- **Nhóm lỗi / mục tiêu:** Số học: kiểm tra overflow trong mô hình hữu hạn, chưa là phát hiện runtime.
- **Vị trí trong luồng:** Mô hình phép toán/bộ đếm trong KiemTraSoHoc. Cần xác định signedness, miền và độ rộng bit; không gắn int32 của mô hình cho mọi số trong JavaScript.
- **Điều kiện ban đầu:** Đã khai báo biến SMT tương ứng cho dòng 'active_user_counter' Phạm vi mô hình minh họa theo template, không phải lỗi API Node.js.
- **Cách kiểm tra:** Giải các ràng buộc đã khai báo, lưu SAT/model hoặc UNSAT/unknown. Sau đó mới đối chiếu phép toán của triển khai nếu có.
- **Bước/input cụ thể:** 1. Chuẩn bị trạng thái và dữ liệu như điều kiện tiên quyết. → 2. Chạy check_int32_overflow() bằng Z3 trên BieuThucTran của dòng 'active_user_counter' → 3. Thu thập phản hồi/trạng thái cuối và đối chiếu kết quả mong đợi.
- **Điều kiện an toàn mong đợi:** Đánh giá công thức theo đúng miền, signedness và độ rộng bit trong sheet KiemTraSoHoc. Nếu SAT, lưu giá trị chứng minh và phép toán gây vượt miền; nếu UNSAT, lưu giả định và phạm vi đã kiểm tra. Không mặc định SAT và không suy ra tràn số runtime Node.js từ mô hình số nguyên hữu hạn. Chưa chạy solver: chưa xác minh.
- **Mức thực hiện:** chưa được campaign API hiện tại thực thi; giữ trong 75 testcase ngoài campaign. Nội dung ở trên là thiết kế kiểm tra, không phải phát hiện đã xác nhận.

#### TC-USR-16 — Kiểm tra tràn số: role_escalation_attempt_counter

- **Yêu cầu / ưu tiên:** REQ-USR-SMT-role_escalation_attempt_counter; LOW. Nguồn: `Module_Users_Admin_spec.xlsx` → `TestCase`.
- **Nhóm lỗi / mục tiêu:** Số học: kiểm tra overflow trong mô hình hữu hạn, chưa là phát hiện runtime.
- **Vị trí trong luồng:** Mô hình phép toán/bộ đếm trong KiemTraSoHoc. Cần xác định signedness, miền và độ rộng bit; không gắn int32 của mô hình cho mọi số trong JavaScript.
- **Điều kiện ban đầu:** Đã khai báo biến SMT tương ứng cho dòng 'role_escalation_attempt_counter' Phạm vi mô hình minh họa theo template, không phải lỗi API Node.js.
- **Cách kiểm tra:** Giải các ràng buộc đã khai báo, lưu SAT/model hoặc UNSAT/unknown. Sau đó mới đối chiếu phép toán của triển khai nếu có.
- **Bước/input cụ thể:** 1. Chuẩn bị trạng thái và dữ liệu như điều kiện tiên quyết. → 2. Chạy check_int32_overflow() bằng Z3 trên BieuThucTran của dòng 'role_escalation_attempt_counter' → 3. Thu thập phản hồi/trạng thái cuối và đối chiếu kết quả mong đợi.
- **Điều kiện an toàn mong đợi:** Đánh giá công thức theo đúng miền, signedness và độ rộng bit trong sheet KiemTraSoHoc. Nếu SAT, lưu giá trị chứng minh và phép toán gây vượt miền; nếu UNSAT, lưu giả định và phạm vi đã kiểm tra. Không mặc định SAT và không suy ra tràn số runtime Node.js từ mô hình số nguyên hữu hạn. Chưa chạy solver: chưa xác minh.
- **Mức thực hiện:** chưa được campaign API hiện tại thực thi; giữ trong 75 testcase ngoài campaign. Nội dung ở trên là thiết kế kiểm tra, không phải phát hiện đã xác nhận.

