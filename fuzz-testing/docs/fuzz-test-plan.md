# Kế hoạch nâng cấp portfolio fuzz testing

Repo hiện đã mở rộng thành QA portfolio. Kế hoạch tổng thể và trạng thái hiện tại
nằm ở [test plan](../../docs/test-plan.md) và [traceability](../../docs/traceability.md).
Các bước dưới đây giữ làm roadmap riêng cho module fuzzing.

Module dùng tên `fuzz-testing/` sau khi gộp hai nhánh. Giữ các bản sửa harness,
test và CI từ remote, kết hợp cách đặt module độc lập ở gốc repo từ local.

```text
fuzz-testing/
├── fuzzers/                # Điều phối, mutation, oracle, coverage, Z3
├── target/                 # API Express mô phỏng, gồm concurrency.js
├── data/seeds/             # JSON khởi đầu
├── tests/                  # Regression test cho công cụ
├── tools/                  # Báo cáo và replay
├── docs/specifications/    # Đặc tả và tài liệu học phần
├── docs/archive/           # Hướng dẫn và kế hoạch cũ
├── evidence/legacy/        # Snapshot lịch sử
├── evidence/current/       # Bằng chứng chọn lọc từ remote
└── artifacts/              # Kết quả mới, Git bỏ qua
```

Xem [ghi chú di chuyển](migration.md) và [hướng dẫn chạy](../README.md).
Kế hoạch trước merge nằm trong `archive/portfolio-plan-before-merge.md`;
các đường dẫn và lỗi baseline trong tài liệu đó thuộc phiên bản cũ.

## Các bước tiếp theo

1. **Foundation:** kiểm tra hồi quy, campaign ngắn, audit đặc tả và workflow
   sau khi merge. Module concurrency và phân loại 29/105 testcase đã được remote sửa.
2. **Tách trách nhiệm:** chuyển mutation sang `generators/`, oracle response sang
   `oracles/`, kịch bản nghiệp vụ sang `suites/` theo auth, order, user và product.
   Tách từng nhóm, giữ CLI ổn định; chưa tạo thêm runner fast-check song song.
3. **Business fuzzing:** kiểm tra dữ liệu sau request, quyền, tổng tiền theo catalog
   và chuyển trạng thái; lưu chuỗi thao tác để replay từ trạng thái sạch.
4. **Regression:** thu nhỏ input với cùng vi phạm oracle, gom triệu chứng, xác minh
   lỗi gốc, gắn Bug ID và đối chiếu target trước/sau sửa bằng regression test.
5. **Portfolio:** benchmark nhiều seed với cùng ngân sách, ghi phạm vi coverage,
   throughput và tỷ lệ replay; cung cấp lệnh demo và bằng chứng có thể kiểm chứng.

Chỉ chạy trên dữ liệu giả trong môi trường local/test. Số finding không phải số lỗi
gốc; HTTP 5xx không tự chứng minh crash. Concolic Z3 hiện chỉ mô hình hóa một phần
`totalAmount`; kết quả harness chưa đại diện cho backend production.
