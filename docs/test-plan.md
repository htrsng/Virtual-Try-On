# Test plan — VFitAI QA Portfolio

## Mục tiêu và đối tượng

Kiểm tra chức năng, tính toàn vẹn dữ liệu và quyền truy cập của luồng bán hàng;
chứng minh khả năng thiết kế testcase, tự động hóa, tìm lỗi và báo cáo bằng chứng.
Dự án kiểm thử được phát triển từ VFitAI, không đổi lịch sử tác giả của ứng dụng gốc.

Hai đối tượng đang được kiểm thử:

- `fuzz-testing/target/`: Express API với datastore và dịch vụ mô phỏng, reset bằng
  tiến trình Node mới cho từng kịch bản API; không có MongoDB production.
- Hai hàm ứng dụng gốc trong `archive/vfitai/client/src/utils/`: gợi ý size và fetch
  có timeout. Unit test import trực tiếp mã TypeScript, không chép lại implementation.

UI và E2E được thiết kế trong manual suite nhưng chưa thực thi: ứng dụng gốc thiếu
backend đầy đủ. Không gán kết quả unit/API cho UI. Không kiểm chứng hiển thị WebGL,
thanh toán thật, AI bên ngoài, hiệu năng tải hoặc toàn bộ 134 testcase Excel.

Đã bổ sung scope component riêng: ProductList/Toast trong jsdom, 14 assertion case
với context hooks và preview boundary được mock. Không thay đổi phạm vi UI/E2E
chưa thực thi nêu trên. [Frontend quality](../qa/frontend-quality.md) ghi rõ build,
lint và test integration cũ còn lỗi; [QA hub](../qa/README.md) là chỉ mục reviewer.

[Stored-state oracle v1](../qa/state-oracle-contract.md) bổ sung snapshot đúng tài
nguyên cho các mutation được hỗ trợ và invariant no-write-on-4xx. Đây là contract
của bộ kiểm thử, chưa phải bản sửa các lỗi nghiệp vụ target.

## Chiến lược và ưu tiên

| Rủi ro | Mức ưu tiên | Kiểm tra |
|---|---|---|
| User sửa hồ sơ người khác, tự đổi role | P0 | API phân quyền, kiểm tra role |
| Giả mạo giá/tổng tiền | P0 | API đối chiếu catalog và dữ liệu đơn đã lưu |
| Mật khẩu lưu dạng rõ | P0 | API audit hash sau cập nhật bằng tài khoản admin giả |
| Chuyển trạng thái sau giao/hủy | P1 | API state transition, kiểm tra trạng thái cuối |
| Input thiếu, sai kiểu, âm, enum ngoài miền | P1 | API equivalence partitioning, boundary và fuzzing |
| Gợi ý size sai | P1 | Unit test biên, chọn size, không thay đổi input |
| Request treo hoặc lỗi bị đổi nghĩa | P1 | Unit test timeout, network error, HTTP 4xx |
| UI giỏ hàng/checkout và thử đồ | P1 | Manual testcase; NOT_RUN đến khi có môi trường |

P0/P1 là độ ưu tiên kiểm thử; severity trong bug report phản ánh tác động của lỗi.
Các kỳ vọng bảo mật là yêu cầu chấp nhận của dự án kiểm thử, không suy diễn từ việc
API hiện tại có chấp nhận input hay không.

## Thiết kế testcase

- Phân vùng tương đương: hợp lệ, thiếu, sai kiểu, sai quyền.
- Giá trị biên: cận dưới/trên số đo, số âm, trường rỗng.
- Bảng quyết định: actor self/victim/admin/anonymous đối với tài nguyên.
- Chuyển trạng thái: processing → shipping → delivered; canceled là trạng thái cuối.
- Oracle nghiệp vụ: tổng theo catalog, role không tự nâng, dữ liệu lưu đúng owner.
- Đối chứng hợp lệ trước khi diễn giải các ca âm; replay từng scenario trên state sạch.

## Điều kiện chạy và kết thúc

Python 3.12 và Node.js 24 được dùng trong CI. Máy local cần Node >=22.15 với hỗ trợ
strip TypeScript; cài `requirements.txt` và dependency của target theo README.
Chỉ dùng test account, fake catalog và loopback. Khóa ngoài bị vô hiệu hóa bởi harness.

Entry: target đăng nhập được các actor giả, đọc được seed/spec, unit test import được
mã nguồn. Nếu setup lỗi, API runner dừng và ghi phần còn lại NOT_RUN; exit code 2.

Exit cho một lần kiểm thử: có log, scenario result, JUnit, source hash và traceability;
mọi FAIL được phân loại, không đổi expected result để làm xanh CI. Đây là điều kiện
hoàn thành đợt kiểm thử, không phải chấp nhận release ứng dụng còn lỗi nghiêm trọng.

## Quy tắc kết quả và CI

API acceptance: exit 0 khi mọi ca được chọn PASS; 1 khi có vi phạm oracle; 2 khi
runner lỗi hoặc có ca chưa chạy. Smoke chỉ chọn bốn đối chứng được liệt kê trong
API README. Full suite vẫn báo FAIL khi target còn lỗi. Workflow full có thể đỏ;
không dùng `continue-on-error` để đổi nghĩa kết quả.

Fuzz runner exit 0 chỉ xác nhận campaign hoàn tất; finding không bằng số lỗi gốc.
Unit test của ứng dụng, regression test công cụ và testcase nghiệp vụ được thống kê
riêng, không cộng thành một tỷ lệ bao phủ chung.

## Bằng chứng và vòng đời lỗi

`reports/runs/<id>/` lưu log đầy đủ và bị Git bỏ qua. `reports/baseline/` là snapshot
chọn lọc cho portfolio; ngày, môi trường và source hash xác định phạm vi có thể dùng
trong CV. Bug report có testcase, expected/actual, bước tái hiện, severity, trạng thái
và link bằng chứng. Trạng thái OPEN đến khi sửa target và retest cùng oracle thành công.

[Traceability](traceability.md) · [API catalogue](../api-testing/test-cases.csv) ·
[Manual cases](../manual-testing/test-cases.md) · [Bug reports](../bug-reports/README.md)
