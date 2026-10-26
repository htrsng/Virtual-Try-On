# Kết quả khoanh biên

Blackbox: 100 input khám phá.

| Target | Tái hiện / trạng thái | Trường | Miền khảo sát | Cặp chuyển hành vi |
|---|---|---|---|---|
| orders | SAMPLED | ['products', 0, 'productId'] | integer: [0, 16] | Chưa quan sát |
| orders | SAMPLED | ['products', 0, 'name'] | unicode_length: [0, 16] | Chưa quan sát |
| orders | SAMPLED | ['products', 0, 'price'] | integer: [0, 400002] | Chưa quan sát |
| orders | SAMPLED | ['products', 0, 'quantity'] | integer: [0, 16] | Chưa quan sát |
| product_update | SAMPLED | ['name'] | unicode_length: [0, 18] | Chưa quan sát |
| product_update | SAMPLED | ['price'] | unicode_length: [0, 26] | 0 → 1 |
| product_update | SAMPLED | ['stock'] | integer: [0, 16] | Chưa quan sát |
| orders | SAMPLED | ['products', 0, 'productId'] | integer: [0, 16] | Chưa quan sát |
| orders | SAMPLED | ['products', 0, 'name'] | unicode_length: [0, 16] | Chưa quan sát |
| orders | SAMPLED | ['products', 0, 'price'] | integer: [0, 400002] | Chưa quan sát |
| orders | SAMPLED | ['products', 0, 'quantity'] | integer: [0, 16] | Chưa quan sát |

Miền khảo sát không phải toàn bộ vùng lỗi. Các điểm chưa đo vẫn là chưa biết.
Xem blackbox/report.json và boundary_evidence/ để đọc các phép đo HTTP.
Xem whitebox/bounded_analysis.json để đọc input trong miền, coverage và trace chọn lọc.
Concolic Z3 là bước riêng; chưa symbolic toàn bộ miền tìm được.
