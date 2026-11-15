# Báo cáo kiểm thử

- `runs/<id>/`: kết quả chạy mới, Git bỏ qua. Mỗi lần chạy có output riêng.
- `baseline/`: snapshot chọn lọc được commit để reviewer kiểm chứng portfolio.
- `current/`: replay, component/build/lint và fuzz-quality snapshot bổ sung;
  [evidence index](../qa/evidence-index.md) chỉ rõ ngày, nguồn và phạm vi từng loại.
- `../fuzz-testing/evidence/`: bằng chứng fuzzing có trước lần chuyển thành QA portfolio.

Chạy từ repo root:

```sh
python tools/run_checks.py --suite smoke
python tools/run_checks.py --suite full
```

Full suite có thể trả exit 1 do các acceptance testcase thất bại trên target còn lỗi.
Đọc `api/report.md` để phân biệt FAIL với ERROR; `summary.md` giữ mã thoát từng bước.
Unit test, test hạ tầng, scenario API và input fuzzing là các đại lượng khác nhau.
Không cộng chúng thành số testcase độc lập hoặc một tỷ lệ pass chung.
