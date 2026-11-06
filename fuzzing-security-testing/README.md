# Kiểm thử API bán hàng bằng fuzzing

Dự án học tập sử dụng Python để sinh dữ liệu bất thường và kiểm tra một API Express mô phỏng. Mã nguồn được giữ trong VFitAI để bảo toàn lịch sử phát triển.

## Phạm vi

Kiểm tra đăng nhập, tạo đơn, trạng thái đơn hàng, cập nhật người dùng và quản lý sản phẩm. Bộ chạy kết hợp kiểm thử qua HTTP, kiểm tra kết quả theo yêu cầu, khảo sát nhánh và mô hình Z3 giới hạn của `totalAmount`.

Dữ liệu lưu trữ và dịch vụ ngoài là mô phỏng. Không cần MongoDB, email hay khóa API bên ngoài để chạy môi trường này. Tài khoản trong dữ liệu mẫu chỉ phục vụ tiến trình kiểm thử cô lập; không dùng để triển khai thực tế.

## Cấu trúc

| Thư mục | Nội dung |
| --- | --- |
| `fuzzers/` | Sinh dữ liệu, kiểm tra phản hồi, phân tích và chạy chiến dịch |
| `target/` | API Express mô phỏng và mô hình dữ liệu |
| `tests/` | Kiểm tra hồi quy của công cụ |
| `data/seeds/` | Dữ liệu JSON đầu vào mẫu |
| `tools/` | Tạo báo cáo và chạy lại bằng chứng |
| `docs/specifications/` | Đặc tả Excel và tài liệu học tập gốc |
| `docs/archive/` | Hướng dẫn và script báo cáo lịch sử, không phải lệnh chạy hiện tại |
| `evidence/legacy/` | Bằng chứng các phiên bản trước |
| `artifacts/` | Kết quả mới, được Git bỏ qua |

## Cài đặt

Yêu cầu Python 3.12, Node.js 24 và npm. Từ thư mục gốc của repo:

```sh
cd fuzzing-security-testing
python -m venv .venv
```

Kích hoạt môi trường trên Windows PowerShell:

```powershell
.venv\Scripts\Activate.ps1
```

Hoặc trên Linux/macOS:

```sh
source .venv/bin/activate
```

Sau đó cài thư viện:

```sh
python -m pip install -r requirements.txt
npm ci --prefix target
```

## Kiểm tra hồi quy

Chạy tại `fuzzing-security-testing/`:

```sh
python -m unittest discover -s tests -p "test_*.py"
```

Các kiểm tra này đánh giá công cụ và môi trường mô phỏng, không phải số lỗi phát hiện hay số yêu cầu nghiệp vụ được bao phủ.

## Chạy thử một chiến dịch

```sh
python fuzzers/run_fuzzing.py --iterations 6 --iterations-per-case 2 --max-cases 1 --boundary-budget 2 --seed 7 --output artifacts/demo --concolic
```

Đọc `artifacts/demo/report.json`, `report.md` và các bằng chứng được dẫn trong báo cáo. Dùng thư mục đầu ra mới cho mỗi lần chạy. Z3 chỉ phân tích mô hình nhánh đã xây dựng, không thực thi ký hiệu toàn bộ JavaScript.

## Đối chiếu đặc tả

```sh
python fuzzers/run_ch4.py --audit-only --output artifacts/spec-audit
```

Lệnh này kiểm tra phân loại và tạo báo cáo; **không thực thi các ca kiểm thử API**. Các ca chưa chạy phải ghi `NOT_RUN`, không được ghi `PASS`.

Xem [hướng dẫn phương pháp](./docs/testing-guide.md), [kết quả xác minh](./docs/verification.md) và [ghi chú đổi cấu trúc](./docs/migration.md).

## Diễn giải kết quả

- Đặc tả hiện có 134 ca: 29 ca có kịch bản API, 105 ca ngoài phạm vi chiến dịch API này. Ngoài phạm vi không có nghĩa là đạt.
- HTTP 500 không tự chứng minh tiến trình bị sập. Nhiều quan sát có thể cùng một nguyên nhân.
- Một chiến dịch ngắn không chứng minh bao phủ đầy đủ hoặc hệ thống an toàn.
- Bằng chứng trong `evidence/legacy/` giữ đường dẫn và số liệu lịch sử; không diễn giải như kết quả mới.
- Chỉ số `node_harness_stub` trong báo cáo được giữ làm định danh môi trường mô phỏng, dù thư mục mã nguồn đã đổi thành `target/`.

Workflow **API Fuzzing Checks** cài thư viện, chạy hồi quy, đối chiếu đặc tả và chạy thử chiến dịch ngắn. Xanh ở workflow này không có nghĩa toàn bộ VFitAI đã đạt kiểm thử.
