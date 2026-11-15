# Fuzzing quality — đo gì và chưa đo gì

## Campaign mới có ghi nhận mọi input

```sh
python fuzz-testing/tools/quality_campaign.py --iterations 28 --seed 7
```

Campaign quality riêng chỉ dùng target local `login` và `orders`; không thay thế
campaign blackbox/greybox/concolic trước đó hoặc gán số liệu mới cho snapshot cũ.
Mỗi request mutation đều có input, schema class, status/response, nhóm triệu chứng
và oracle violation trong [report](../reports/current/fuzz-quality/report.json).
Token response được redact; toàn bộ tài khoản và dữ liệu là fixture giả.

| Phép đo | Kết quả / phạm vi |
|---|---|
| Seed | 7 |
| Mutation request attempted | 28 |
| Mutation response nhận được | 28 |
| Setup request | 2, tách riêng khỏi mutation |
| Input đạt schema advisory | 16/28 = 57.14% |
| Input không đạt schema advisory | 12/28 = 42.86% |
| Response HTTP < 500 | 27 |
| HTTP 5xx | 1; không tự chứng minh process crash |
| Transport error | 0 |
| Oracle violation | 9 lượt, không phải 9 lỗi gốc |
| Thời gian campaign | 1.300338 giây, scope bên dưới |

Thời gian thực và throughput nằm trong JSON, gồm startup/setup, HTTP, schema/oracle
evaluation và shutdown; chưa phải benchmark tốc độ target thuần. Số oracle violation
trong report là lượt quan sát, không phải lỗi gốc độc lập.

Schema advisory công khai trong `structural_validity`: login cần email/password
string không rỗng; order cần cấu trúc products/shippingInfo, trường số hữu hạn,
quantity và ID nguyên dương, total/fee/discount không âm. Không kiểm tra cú pháp
email, trần độ dài, giá catalog hoặc quyền truy cập ở bước phân loại schema.
**VALID chỉ nghĩa đạt các quy tắc advisory đó**, không đồng nghĩa toàn bộ request
hợp lệ về nghiệp vụ hoặc an toàn. Tỷ lệ được tính từ input đã ghi, không từ HTTP status.
Có [4 test contract](../reports/current/quality-schema-regression.txt) bảo vệ quy tắc
boolean/quantity, số không hữu hạn, trường thiếu và phân biệt schema với catalog integrity.

Oracle riêng cho order kiểm tra cấu trúc cart, quantity/price, catalog membership
và total theo catalog bằng hàm `check_order_response`. Login trong campaign này
chỉ quan sát HTTP/status và lỗi ứng dụng, chưa kiểm tra enumeration hoặc rate limit.

## Coverage và Z3

Campaign quality không instrument coverage: line/branch đều `null`, không có phần
trăm coverage. Greybox cũ lưu line đã quan sát của `target/index.js`, có thể gồm
setup; không tự chuyển thành branch coverage hoặc coverage toàn ứng dụng.

Concolic Z3 phân tích mô hình kiểu giới hạn của `totalAmount`, không symbolic mọi
JavaScript hoặc mọi luồng VFitAI. Replay của testcase xác định không chứng minh
mọi finding ngẫu nhiên/stateful đều tự tái hiện được.

## Hướng cải tiến tiếp

Mở rộng oracle và input schema theo contract đã thống nhất; lưu sequence/setup
cho fuzzing stateful; thu nhỏ input với cùng oracle; thêm denominator coverage rõ
ràng và benchmark nhiều seed/ngân sách tương đương. Chưa gán kết quả cho các mục đó.
