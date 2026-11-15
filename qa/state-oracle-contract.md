# Stored-state oracle contract v1

Đợt nâng cấp đầu tiên củng cố **bộ kiểm thử**, chưa sửa các lỗi nghiệp vụ của target.
Routes/model của API giữ nguyên. Harness đọc snapshot trước/sau; oracle dùng dữ liệu
đó để tránh PASS chỉ vì HTTP status đúng.

## Trạng thái được quan sát

| Mutation được hỗ trợ | Snapshot |
|---|---|
| User update/delete và create-admin | Tất cả user, đúng user từ URL cho entity trước/sau |
| Product create/update/delete | Toàn bộ catalog, gồm ID/giá/version của bản ghi |
| Order create/update/cancel/delete | Orders, catalog tại thời điểm request, coupon usages và notifications |

Snapshot được deep-copy ngay khi đọc; thay đổi model sau đó không sửa ngược bằng
chứng trước request. `resource` xác định collection và ID; request vào `victim`
không còn lấy nhầm trạng thái `self`. ID sai vẫn được gửi tới route; snapshot đọc
collection thay vì cast ID sai trước khi request được xử lý.

Password trong snapshot user được thay bằng `password_fingerprint` SHA-256 để phát
hiện thay đổi mà không lưu plaintext/bcrypt hash. Fingerprint này **không chứng minh
password được lưu an toàn**; oracle bcrypt audit vẫn hoạt động riêng.

## Quy tắc đánh giá

1. Mỗi mutation được hỗ trợ trả HTTP 4xx phải giữ nguyên các collection được quan sát
   của **chính bước đó**, kể cả khi bước sau cố khôi phục trạng thái cũ.
2. Duplicate product bị từ chối phải giữ nguyên catalog. Nếu API chấp nhận bằng cách
   cấp ID mới, product mới phải thực sự tồn tại với ID duy nhất và giữ nguyên bản cũ.
3. Role update HTTP 200 phải giữ role của đúng user và response phải khớp dữ liệu
   lưu. Target bị xóa hoặc role bị mất là FAIL, không phải PASS theo response.
4. Order tổng theo catalog phải khớp cả response và order lưu thực tế; success không
   được chỉ trả một order giả mà không tạo record. Giá lấy từ snapshot trước request.
5. Thiếu method/URL/resource hoặc snapshot cần thiết là `ERROR/ORACLE_ERROR`, không
   được xem là PASS. Record thực sự không còn trong snapshot hợp lệ sau request là
   bằng chứng biến đổi dữ liệu; khác với thiếu snapshot.

HTTP 5xx không tự chứng minh crash hoặc atomicity; status oracle hiện vẫn ghi FAIL
theo yêu cầu của từng testcase. Login không nằm trong no-write-on-4xx contract vì
sai password có thể tăng bộ đếm theo thiết kế. Các model stub ngoài phạm vi API
campaign chưa được contract này kiểm chứng.

## Bằng chứng hồi quy

- 16 unit test oracle kiểm tra false-green, missing evidence, ghi dữ liệu bị từ chối,
  intermediate write, response không khớp state và record bị xóa.
- 5 integration test dùng Node harness: đúng victim, snapshot độc lập, fingerprint,
  ID sai và fault injection với app giả cố tình ghi dữ liệu rồi trả 4xx.
- Fault app chỉ nằm trong `fuzz-testing/tests/fixtures/`, không được API/campaign load.
  Không đưa cờ chèn lỗi vào target đang kiểm thử.

[Report của đợt state-v1](../reports/state-oracles-v1/README.md) giữ log kiểm thử,
acceptance mới, replay mới và hash nguồn. Baseline trước nâng cấp được giữ nguyên;
hash khác là lý do replay cũ phải từ chối, không bỏ cơ chế xác minh để chạy tiếp.

## Phần tiếp theo

Chưa thống nhất lại tolerance tiền của fuzzer, actor/role policy của mọi fuzz oracle,
minimization, retest bản sửa target hoặc benchmark nhiều seed. Đây là các đợt tiếp
theo; contract v1 không tuyên bố chúng đã hoàn thành.
