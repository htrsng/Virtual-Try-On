# Khoanh biên lỗi và kiểm tra chi tiết

Chạy từ thư mục gốc dự án:

```powershell
python fuzzing-security-testing/fuzzers/run_fuzzing.py --iterations 100 --max-cases 3 --boundary-budget 16 --iterations-per-case 12 --output fuzzing-security-testing/results/bien_demo
```

Dùng thư mục output mới cho mỗi lần chạy để tránh lẫn bằng chứng cũ.

Luồng gồm bốn bước:

1. Blackbox đột biến input và gửi HTTP, lưu input có triệu chứng.
2. Chạy lại input hai lần trên HTTP harness với dữ liệu seed mới. Nếu triệu chứng không lặp lại, ghi `NOT_REPRODUCED`, không suy ra biên từ input đó.
3. Giữ nguyên các trường khác, thay đổi một số nguyên hoặc độ dài chuỗi. Thử các điểm đầu/cuối, lân cận và chia đôi khoảng có hai đầu khác hành vi. Lưu tất cả điểm đã đo và cặp điểm chuyển hành vi.
4. Bước kiểm tra chi tiết đọc đúng miền vừa khảo sát, chỉ sinh giá trị trong miền và giữ nguyên các trường khác. Lưu response, line coverage và trace nhánh đã được instrument. Khảo sát coverage cũ vẫn có kết quả riêng.

Ví dụ giả lập: input `quantity=8` gây lỗi. Đo được `4` không có cùng lỗi, `5` có cùng lỗi. Báo cáo ghi cặp chuyển `4 → 5`, `adjacent=true`. Điều này xác nhận hai điểm nguyên liền nhau khác hành vi. Chưa thể kết luận mọi giá trị từ `5` trở lên đều lỗi.

Đọc kết quả:

| File / trường | Ý nghĩa |
|---|---|
| `blackbox/report.json` → `boundaries` | Các ca khảo sát biên |
| `status=NOT_REPRODUCED` | Không lặp lại triệu chứng trên seed mới; có thể phụ thuộc trạng thái |
| `status=INCONCLUSIVE_INFRASTRUCTURE` | Lỗi môi trường/transport, không dùng làm biên lỗi ứng dụng |
| `regions[].path` | Trường được thay đổi, ví dụ `["products",0,"quantity"]` |
| `lower`, `upper` | Miền khảo sát hữu hạn, không phải toàn bộ vùng lỗi |
| `samples` | Giá trị đã đo và có cùng lớp triệu chứng hay không |
| `transitions` | Cặp điểm khác hành vi; `adjacent=false` nghĩa là còn khoảng chưa thu hẹp hết |
| `complete` | Chỉ true nếu mọi giá trị nguyên trong miền đã được đo |
| `whitebox/bounded_analysis.json` | Các input trong miền, response, coverage và branch trace |

`--boundary-budget` tính cả hai lần replay cho mỗi ca; `--iterations-per-case` giới hạn số phép đo chi tiết cho mỗi miền. `--max-cases` giới hạn số ca được điều tra. Ngân sách nhỏ có thể chưa tới trường gây lỗi. Bước HTTP có khởi động harness mới cho mỗi phép đo nên chậm hơn fuzz ngẫu nhiên.

Phạm vi hiện tại: tọa độ số nguyên và độ dài ký tự Unicode (không phải byte), mảng khảo sát tối đa 10 phần tử đầu. Giữ nội dung tiền tố chuỗi, thêm `A` khi kéo dài. Vì vậy kết quả chuỗi chỉ áp dụng cho mẫu nội dung này. Với lá JSON là null, boolean hoặc float, dùng tập hữu hạn các đại diện JSON (`json_representatives`); giá trị tọa độ là chỉ số trong `representatives`, không phải biên số học. Chưa tự khảo sát khoảng số thực, tổ hợp nhiều trường, hoặc khôi phục chuỗi thao tác đã làm thay đổi state. Những ca phụ thuộc state được giữ nguyên trong bằng chứng blackbox và có thể không tái hiện khi reset. Input thiếu trường hoặc container rỗng có thể không có tọa độ để khảo sát.

HTTP 5xx chỉ nhận diện một lớp triệu chứng; hai lỗi 5xx có thể khác nguyên nhân. Oracle nghiệp vụ được chuẩn hóa phần số trong thông báo để so sánh khi giá trị thay đổi. Kết quả không phải số lượng lỗi gốc duy nhất.

Phân biệt kỹ thuật: phần `bounded_analysis` là kiểm tra cụ thể có coverage và trace chọn lọc; trace hiện chỉ có các guard `totalAmount`. `--concolic` vẫn là bước Z3 riêng trên tám kiểu JSON đại diện, không nhận toàn bộ miền này để symbolic JavaScript. Không gọi khảo sát coverage là symbolic execution. Các giá trị chưa đo luôn là chưa biết; không giả định lỗi đơn điệu.
