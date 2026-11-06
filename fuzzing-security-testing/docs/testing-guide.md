# Hướng dẫn đọc phương pháp kiểm thử

## Luồng thực hiện

1. Đọc dữ liệu mẫu trong `data/seeds/` và yêu cầu trong `docs/specifications/`.
2. Biến đổi đầu vào và gửi yêu cầu HTTP đến `target/` chạy trên máy cục bộ.
3. Kiểm tra mã phản hồi, dữ liệu trả về và các điều kiện nghiệp vụ.
4. Lưu dữ liệu để chạy lại; khảo sát lân cận trong ngân sách đã chọn.
5. Dùng Z3 khi cần phân tích mô hình giới hạn của `totalAmount`.

## Phân biệt kết quả

- **PASS:** mẫu được thực thi và đáp ứng điều kiện kiểm tra.
- **FAIL:** mẫu được thực thi và vi phạm điều kiện kiểm tra.
- **ERROR:** lỗi chuẩn bị, chạy hoặc đánh giá; không tự coi là lỗi ứng dụng.
- **NOT_RUN:** ca có kế hoạch nhưng chưa được thực thi.

Một quan sát không tương đương một lỗ hổng độc lập. Cần đọc dữ liệu đầu vào, phản hồi, trạng thái và phiên bản mã nguồn để đánh giá.

## Các công cụ

- `fuzzers/run_fuzzing.py`: luồng khám phá, khảo sát và Z3 tùy chọn.
- `fuzzers/run_ch4.py`: chiến dịch đối chiếu Excel và tạo báo cáo.
- `tools/build_report.py`: kết xuất báo cáo từ dữ liệu đã có.
- `tools/replay_failures.py`: chạy lại bằng chứng; từ chối dữ liệu khi mã nguồn hoặc đặc tả đã đổi.

Chạy từng file với `--help` để xem tham số. Các lệnh trong README được tính từ thư mục `fuzzing-security-testing/`.

## Giới hạn

Datastore, dữ liệu tài khoản và dịch vụ tích hợp là mô phỏng. Các phép đo không xác nhận hiệu năng, an toàn bộ nhớ hay bảo mật của ứng dụng triển khai thật. Khảo sát nhánh chỉ phản ánh những mẫu và nhánh đã quan sát trong ngân sách đã chạy.

Không sửa bằng chứng cũ để khớp số liệu mới. Lưu một đợt chạy mới vào `artifacts/`; chỉ đưa bằng chứng đã chọn và có ngữ cảnh vào Git.
