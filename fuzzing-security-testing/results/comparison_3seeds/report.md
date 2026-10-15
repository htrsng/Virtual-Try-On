# Controlled comparison

| Mode | Seed | Inputs | Seconds | Unique index.js lines | Finding occurrences | Runner errors |
|---|---|---|---|---|---|---|
| mutation_baseline | 7 | 72 | 45.87 | 626 | 43 | 0 |
| coverage_feedback | 7 | 72 | 42.72 | 626 | 37 | 0 |
| coverage_feedback | 11 | 72 | 43.21 | 601 | 34 | 0 |
| mutation_baseline | 11 | 72 | 42.68 | 609 | 40 | 0 |
| mutation_baseline | 42 | 72 | 43.15 | 625 | 37 | 0 |
| coverage_feedback | 42 | 72 | 42.72 | 625 | 33 | 0 |

## Limitations

- Small exploratory experiment; no statistical superiority claim.
- Both modes measure coverage; baseline ignores it when selecting inputs.
- Separate from the stateful HTTP blackbox; no deployment/network comparison is claimed.
- Coverage includes initialization/setup and only measures node_harness/index.js.
- Datastore and integrations are simulated; conclusions apply to the harness only.
- Finding occurrences and HTTP errors are not unique vulnerabilities.

## Diễn giải

Xem [PhanTich_SoSanh.md](PhanTich_SoSanh.md). Tác vụ tái hiện chạy đồng thời ở đầu thí nghiệm; không dùng thời gian để kết luận ưu thế tốc độ.
