# Kết quả xác minh ngày 06/11/2026

Môi trường: Linux, Python 3.12, Node.js 24.22.1. Dùng API Express và datastore mô phỏng, không dùng dịch vụ triển khai thực tế.

## Các kiểm tra đã chạy

| Kiểm tra | Kết quả |
| --- | --- |
| `python -m unittest discover -s tests -p "test_*.py"` | 34/34 đạt |
| Chiến dịch ngắn blackbox, whitebox và Z3 | Hoàn tất, mã thoát 0 |
| `python fuzzers/run_ch4.py --audit-only --output artifacts/spec-audit` | 29 ca NOT_RUN; không gán PASS cho ca chưa chạy |
| Thực thi đối chiếu đặc tả (`--fuzz-cases 1`) | 52 kịch bản, tổng hợp 29 ca: 9 PASS, 20 FAIL, không có ERROR |
| Chạy lại bằng chứng (`--repeats 1`) | Tái hiện 20/20 ca FAIL với một kịch bản đại diện mỗi ca |
| Cú pháp `target/index.js`, `target/concurrency.js` | Đạt kiểm tra Node |
| Tính toàn vẹn tài liệu và bằng chứng lịch sử | 60 file giữ nguyên nội dung so với commit trước khi di chuyển |

Lệnh chiến dịch, chạy từ `fuzzing-security-testing/`:

```sh
python fuzzers/run_fuzzing.py --iterations 6 --iterations-per-case 2 --max-cases 1 --boundary-budget 2 --seed 7 --output artifacts/verification-final --concolic
```

Kết quả đầy đủ được lưu cục bộ trong `artifacts/verification-final/`; bản chọn lọc ở `evidence/current/`. Đường dẫn trong báo cáo giữ vị trí khi chạy; tái hiện bằng đúng lệnh trên.

Mã thoát 0 xác nhận bộ chạy hoàn tất, không có nghĩa API đáp ứng mọi yêu cầu. Chiến dịch vẫn ghi các quan sát nghiệp vụ và phản hồi lỗi ứng dụng. Không cộng quan sát trùng thành số lỗ hổng độc lập.

Đã khôi phục module concurrency từ lịch sử Git và cập nhật kiểm tra phân loại đặc tả: 29 ca API, 105 ca ngoài phạm vi, đồng thời kiểm tra không mất ID ca nào.

Kết quả này không xác nhận giao diện, backend thiếu của VFitAI hoặc toàn bộ workflow ứng dụng. Trạng thái workflow fuzzing trên GitHub được đánh giá riêng sau khi đẩy commit.

Kết quả 9 PASS / 20 FAIL là kết quả nghiệp vụ của API mô phỏng, khác với 34/34 kiểm tra hồi quy của công cụ. Các ca FAIL được giữ làm phát hiện, không đổi kỳ vọng để làm xanh.
