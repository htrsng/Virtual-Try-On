# Coursework / Archive — API Fuzzing

Bài tập học phần kiểm thử API Express mô phỏng bằng Python, mutation/greybox và mô hình Z3 giới hạn, được lưu riêng khỏi hướng Selenium/Java của VFitAI.

Các thư mục giữ cấu trúc tương đối cũ: `fuzz-testing/`, `api-testing/`, `automation-testing/`, `tools/`, `qa/`, `docs/`, `manual-testing/`, `bug-reports/` và `reports/`. Target của bộ bài tập nằm trong `fuzz-testing/target/`. Chỉ chạy với target và dữ liệu mô phỏng của bài tập. Giữ database Atlas và dữ liệu VFitAI ngoài môi trường này. [Danh sách lỗi lịch sử](bug-reports/README.md).

[Hướng dẫn fuzzing](fuzz-testing/README.md) · [Snapshot portfolio cũ](PORTFOLIO-SNAPSHOT.md)

## Chạy lại

Từ repo root:

```sh
cd archive/coursework-api-fuzzing
python -m pip install -r requirements.txt
npm ci --prefix fuzz-testing/target
python tools/run_checks.py --suite smoke
```

Yêu cầu bộ cũ: Python 3.12, Node.js 24 và npm. Full acceptance có lỗi target đã biết nên có thể trả exit 1. Kết quả mới ở `reports/runs/`, được Git bỏ qua.

Component tests dùng mã ứng dụng đã khôi phục tại `../../client/`. Từ thư mục
`archive/coursework-api-fuzzing/`, chạy component suite:

```sh
npm ci --prefix ../../client
python tools/run_frontend_checks.py
```

## Ghi chú lưu trữ

Giữ nguyên số liệu, source hash và nội dung bằng chứng lịch sử. Đường dẫn repo root và lệnh trong snapshot, báo cáo và workflow lưu trữ mô tả cấu trúc cũ; thư mục coursework là working directory mới. Replay vẫn kiểm tra hash và có thể từ chối nếu mã liên quan đã thay đổi.

`.github/workflows/` chỉ chứa bản lưu workflow cũ, không được GitHub Actions kích hoạt; cần chỉnh working directory và đường dẫn artifact trước khi dùng lại. `docs/cv.md` là mô tả CV cũ. Chưa có kết quả Selenium, TestNG hoặc browser E2E được xác minh.
