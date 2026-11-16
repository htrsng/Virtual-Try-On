# VFitAI — Full-Stack QA Automation

Ứng dụng kiểm thử: React/TypeScript/Three.js → Express/Mongoose → MongoDB.
Selenium + Java + TestNG + Maven là framework chính dự kiến. Giữ Playwright tại
`tests/` để kiểm toán và phát triển kiểm thử 3D, network và browser diagnostics.
Bài fuzzing môn học giữ riêng tại `archive/coursework-api-fuzzing/`.

## Tài liệu và bằng chứng

- [System inventory](docs/system-inventory.md): chức năng và API đọc từ source.
- [Environment setup](docs/environment-setup.md): chạy web, môi trường và test.
- [Baseline report](docs/baseline-test-report.md): kết quả thực thi, giới hạn.
- [Test strategy](docs/test-strategy.md): phân công công cụ, dữ liệu, tiêu chí.
- [Scenarios](docs/test-scenarios.md), [test cases](docs/test-cases.csv) và
  [traceability](docs/requirements-traceability.md): coverage ban đầu, chưa phải
  kết quả automation mới.
- [Implementation roadmap](docs/implementation-roadmap.md): thứ tự triển khai.
- [Findings](bug-reports/BASELINE-001.md): vấn đề đã quan sát và cách xử lý.
- [Evidence](evidence/baseline-2026-11-16): số liệu, source hashes và API catalog.

Chưa tạo Selenium framework hoặc workflow mới. Các kết quả baseline đo trên
working tree đã khôi phục tại thời điểm chưa commit; không phải kết quả GitHub
Actions hoặc bản clone sạch. Source ứng dụng sau đó được lưu trong commit
`c83799e`; baseline cũ vẫn được giữ nguyên. Xem báo cáo trước khi dùng số liệu cho CV.
