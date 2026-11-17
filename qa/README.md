# VFitAI — Full-Stack QA Automation

Ứng dụng kiểm thử: React/TypeScript/Three.js → Express/Mongoose → MongoDB.
Selenium + Java + TestNG + Maven là framework chính dự kiến. Giữ Playwright tại
`tests/` để kiểm toán và phát triển kiểm thử 3D, network và browser diagnostics.
Bài fuzzing môn học giữ riêng tại `archive/coursework-api-fuzzing/`.

## Tài liệu và bằng chứng

- [Giai đoạn 2 — test environment](docs/stage-2-test-environment.md): isolated launcher,
  [test data](test-data/README.md), health checks và kết quả chạy lặp hai lần.

- [Giai đoạn 1 — backend P0](docs/stage-1-backend-report.md): Development Fix,
  QA regression và các giới hạn triển khai.
- [API inventory](docs/api-inventory.md), [permission matrix](docs/permission-matrix.md),
  [validation rules](docs/validation-rules.md), [bugs trước/sau](bug-reports/STAGE1-P0.md).

- [Giai đoạn 0 — clean-clone baseline](docs/baseline-report.md): lần xác minh mới
  trên commit `3d61097`; báo cáo dưới đây vẫn giữ lịch sử lượt khảo sát trước.

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

Selenium framework chưa triển khai. Báo cáo `baseline-test-report.md` giữ khảo sát
lịch sử trên working tree khôi phục chưa commit; source sau đó lưu tại `c83799e`.
Clean-clone verification và kết quả Giai đoạn 1/2 có báo cáo riêng phía trên;
không thay baseline cũ bằng số liệu mới hoặc coi local results là GitHub Actions.
