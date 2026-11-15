# VFitAI API Fuzzing

Bộ kiểm thử API bán hàng bằng fuzzing: sinh input bất thường, phát hiện vi phạm
nghiệp vụ và lưu bằng chứng để tái hiện. Target là API Express với datastore mô phỏng,
chạy độc lập với giao diện và các dịch vụ ngoài.

**Công nghệ:** Python · Node.js/Express · requests · unittest · Z3 · GitHub Actions.

## Phương pháp

- **Blackbox:** mutation JSON từ seed, gửi HTTP và kiểm tra bằng oracle nghiệp vụ.
- **Greybox:** dùng line coverage để chọn input khám phá thêm mã.
- **Concolic:** trace nhánh, phủ định điều kiện bằng Z3 và xác nhận input qua API;
  giới hạn ở mô hình kiểu của `totalAmount`.
- **Replay:** lưu input, response và ngữ cảnh để kiểm tra lại finding.

Phạm vi: đăng nhập, tạo đơn, trạng thái đơn, cập nhật người dùng và quản lý sản phẩm.

## Chạy nhanh

Yêu cầu Python 3.12, Node.js 24 và npm. Từ thư mục gốc:

```sh
cd fuzz-testing
python -m pip install -r requirements.txt
npm ci --prefix target
python -m unittest discover -s tests -p "test_*.py"
python fuzzers/run_fuzzing.py --iterations 6 --iterations-per-case 2 --max-cases 1 --boundary-budget 2 --seed 7 --concolic
```

Mỗi campaign mặc định có thư mục riêng trong `fuzz-testing/artifacts/`.
Đọc `report.json`, `report.md` và các file bằng chứng của lần chạy đó.

## Kết quả đã kiểm tra

- **34/34 test hồi quy đạt** ngoài sandbox trên Windows.
- **Campaign ngắn có Z3 hoàn tất** với seed 7.
- **134 testcase đặc tả:** 29 ca có kịch bản API, 105 ca ngoài phạm vi campaign.

Đây là test cho công cụ và target mô phỏng. Finding không phải số lỗi gốc;
HTTP 5xx không tự chứng minh crash. Xem phạm vi và môi trường trong
[kết quả xác minh](fuzz-testing/docs/verification.md).

[Hướng dẫn và cấu trúc](fuzz-testing/README.md) ·
[Phương pháp kiểm thử](fuzz-testing/docs/testing-guide.md) ·
[Kế hoạch nâng cấp](fuzz-testing/docs/fuzz-test-plan.md) ·
[Quy ước đóng góp](CONTRIBUTING.md) · [MIT](LICENSE)

Mã ứng dụng gốc được lưu tại [archive/](archive/README.md).
