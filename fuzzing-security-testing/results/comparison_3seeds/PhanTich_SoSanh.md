# Phân tích so sánh ba seed

Cùng 6 API, 12 input/API, seed 7/11/42; mỗi chiến lược 216 input, tổng 432. Cả hai đều đo coverage; baseline không dùng coverage để chọn input cha. Mỗi input chạy trong Node mới.

| Seed | Dòng baseline | Dòng feedback | Chênh lệch feedback − baseline | Finding baseline | Finding feedback |
|---|---|---|---|---|---|
| 7 | 626 | 626 | 0 | 43 | 37 |
| 11 | 609 | 601 | -8 | 40 | 34 |
| 42 | 625 | 625 | 0 | 37 | 33 |

Không có lỗi bộ chạy. Coverage bằng nhau ở seed 7 và 42; feedback thấp hơn 8 dòng ở seed 11. Trong cấu hình nhỏ này chưa quan sát lợi thế coverage feedback. Không kết luận chiến lược đó luôn kém hơn hoặc luôn tốt hơn.

Baseline có tổng 120 lượt finding và 20 HTTP 5xx; feedback có 104 lượt finding và 37 HTTP 5xx. Đây là số lượt, không phải số lỗi gốc hoặc số CVE. Không cộng coverage của các seed thành số dòng duy nhất.

Coverage chỉ thuộc index.js và gồm setup; cả hai chiến lược được chạy qua cùng harness cô lập, không so trực tiếp hai fuzzer HTTP độc lập khác chế độ dữ liệu.

Tác vụ tái hiện đã chạy đồng thời trong phần đầu thí nghiệm. Không dùng thời gian đo được để khẳng định ưu thế tốc độ. Ngân sách nhỏ và 3 seed chỉ đủ thăm dò, chưa có chứng minh thống kê.

[Bảng đầy đủ](report.md) · [Bằng chứng JSON](report.json)
