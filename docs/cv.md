# Trình bày dự án trong CV và phỏng vấn

**Tên:** VFitAI QA Portfolio — API, Unit & Fuzz Testing.
**Phạm vi đóng góp:** phát triển bộ kiểm thử trên ứng dụng VFitAI có sẵn; không nhận
toàn bộ mã ứng dụng gốc hoặc công cụ có sẵn là phần tự viết mới.

Mẫu tiếng Anh, cần điều chỉnh theo phần việc bạn thực sự thực hiện và giải thích được:

> Developed a QA portfolio for a simulated e-commerce API using Python and Node.js,
> with risk-based test planning, requirements traceability, and reproducible defect reports.
>
> Automated 51 deterministic API scenarios mapped to 29 test cases and added 14 unit
> tests against existing TypeScript business logic, exporting JSON and JUnit reports.
>
> Combined API acceptance testing with seeded mutation fuzzing and a bounded Z3
> concolic model; configured GitHub Actions smoke checks and documented open defects.

Chỉ ghi kết quả chạy đúng [baseline](../reports/baseline/README.md). Không nhận 12
testcase manual là đã thực thi; không ghi Playwright E2E, production security audit,
coverage toàn hệ thống hoặc số lỗi gốc nếu chưa có bằng chứng tương ứng.

Khi phỏng vấn, chuẩn bị demo: đọc test plan → mở testcase → chạy smoke → chạy một
testcase FAIL → chỉ input/response và oracle → giải thích hướng sửa và retest.
Phân biệt 29 testcase với 51 scenario, regression test của công cụ với acceptance
của target, và finding fuzzing với bug gốc đã phân tích.

Công cụ có thể hỗ trợ viết code và tài liệu. Chỉ đưa kỹ năng vào CV khi bạn có thể
tự chạy, giải thích thiết kế và sửa một testcase khi yêu cầu thay đổi.
