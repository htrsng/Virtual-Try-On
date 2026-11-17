# Giai đoạn 8 — CI, reporting và quality gates

CI tự động chạy các checks độc lập trên PR vào main. Lint/build không được miễn
trừ baseline lỗi và không chặn việc thu kết quả unit/API/browser ở job khác.
Không có deployment/auto-merge: đây là kiểm chứng PR và regression architecture.

## Workflows

| File | Trigger | Suite |
| --- | --- | --- |
| code-quality.yml | PR main, push main, manual | Lint, full build, frontend25+, helpers14+, Playwright typecheck, CI policy12+ |
| backend-tests.yml | PR main, push main, manual | Backend/API/integration128+ trên owned MongoDB |
| selenium-smoke.yml | PR main, manual | Chỉ group smoke5+, không chạy22 regression thay smoke |
| playwright-3d.yml | PR main, manual | Linux 3D functional6+ và Windows approved visual1+ cùng negative control |
| full-regression.yml | Manual hoặc Sunday19:00UTC = Monday02:00 Asia/Saigon | Selenium22+, Playwright12+, Windows visual1+/detector |

`_qa-job.yml` là reusable job, không phải một suite trùng lặp. Matrix fail-fast=false
giữ các job khác chạy khi lint/build Fail. PR concurrency hủy run cũ khi có head mới;
full regression không hủy run đang chạy. Timeouts25 phút/job.

Workflow mới chưa ở default branch thì lịch/manual chưa phải bằng chứng đã chạy;
GitHub yêu cầu workflow_dispatch có file trên default branch. Việc merge phải được
review riêng, không merge chỉ để làm nút manual xuất hiện. Xem [GitHub event docs](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#workflow_dispatch).

## Environments và dependencies

- Ubuntu24.04 cho functional/API/quality; Windows2022 cho approved visual profile.
- Node22.23.4 exact (official distribution verified); Java17 Temurin và Maven từ
  runner được ghi actual version. npm ci --include=dev dùng cả ba lockfiles.
- MongoDB binary được yêu cầu đúng8.2.6 qua MONGOMS_VERSION; mỗi test vẫn tạo
  owned replica set riêng. Local system binary có thể được cấu hình như setup guide.
- Checkout/setup-node/setup-java/upload-artifact pin immutable commit SHA, không chỉ tag.
- Playwright1.60.0 và browser revision từ lockfile; không cài latest bằng npx fallback.
  Selenium dependencies/plugins pin trong pom.xml; Selenium Manager chọn driver
  matching browser được cài trên runner. Actual browser/Java/Maven có trong logs/reports.
- QA launcher vẫn bind loopback, refuse occupied ports, tạo database replica set riêng,
  seed/reset/clear theo ownership marker và đợi direct/proxied health trước browser.
  Không trỏ CI vào development DB hoặc tái sử dụng server có sẵn.

## Report contract

Mỗi artifact nằm dưới `.runtime/ci/<suite>/` và có:

- index.html: entry point với status, SHA, counts và liên kết raw log/summary.
- summary.json + environment.json: actual checkout SHA, PR source head/base SHA,
  run/attempt, Node/platform/runner image, lockfile hashes, phase exit codes/timestamps.
- gate.xml: một **process quality gate**, không cộng thành business test case.
- Native JUnit XML/JSON; Selenium HTML/Surefire/screenshots hoặc Playwright HTML,
  screenshots/traces khi cần. JUnit suites được stamp SHA/Node/platform properties.

PR checkout mặc định là merge commit: report phân biệt checkedOutSha với sourceHeadSha.
Local dirty worktree được đánh dấu, không giả danh kết quả clean committed source.
Generated output của suite được reset trước run và không lấy Maven reports cũ làm
bằng chứng của lần startup thất bại. Không upload `.runtime/qa/`, `.env` hoặc manifest
chứa generated accounts/capabilities. Không dump toàn bộ process.env.

Negative-control report có một test Fail cố ý; wrapper chỉ exit0 khi có đúng pixel
mismatch +diff +trace. Nó giữ output riêng, không ghi đè positive visual report và
không được cộng vào passed business cases. Primary visual Fail thì không chạy tiếp
negative control dựa trên một baseline chưa chứng minh được hoạt động.

## Status và gate policy

| Status | Ý nghĩa | Gate |
| --- | --- | --- |
| Passed | Command0 và required suite có đủ real cases, không fail/skip | Pass |
| Failed | Assertion/static check/runner failure hoặc unexpected partial skips | Fail |
| Skipped | Tất cả collected cases bị runner skip, counts vẫn được giữ | Không thỏa mandatory gate |
| Blocked | Không đủ collected cases/report hoặc visual platform không có approved baseline | Fail, có reason |
| InfrastructureFailure | Install/browser provisioning/startup/runner interruption đã nhận diện | Fail, giữ phase logs |

Missing reports/zero tests không được coi là Pass. Test minimum là baseline đã kiểm
chứng, không dùng để đếm số testcase mục tiêu150. Không đổi assertions, tùy tiện skip
hoặc bật continue-on-error để che lỗi. Native counts không bị sửa theo gate result.
GitHub cancelled/skipped conclusions giữ nguyên; run bị ngắt không được gọi là Pass.
Nếu checkout/setup lỗi quá sớm để chạy reporter, GitHub job/step logs và run SHA là
bằng chứng infrastructure; không hứa artifact khi runner chưa checkout được source.

## Permissions, artifacts và merge gates

Token chỉ contents:read; checkout persist-credentials=false. Không pull_request_target,
secrets:inherit, deployment secrets hoặc write permissions cho test jobs. Artifact
retention14 ngày, chỉ output được whitelist theo suite. Artifact tải được bởi người
đăng nhập có read access repository; repo public không tạo được một vùng riêng tư
cho dữ liệu production. Vì vậy chỉ dùng QA synthetic/ephemeral data. Xem [GitHub artifact access](https://docs.github.com/en/actions/how-tos/manage-workflow-runs/download-workflow-artifacts).

Branch protection/rulesets chưa được thay đổi. Khi bật required checks, dùng exact
check names của run thật (Code quality matrix, Backend, Selenium Smoke, Playwright3D),
không đánh dấu mọi thứ Pass để merge. Lint/build hiện Fail phải được sửa hoặc có quyết
định scope/review tường minh; giai đoạn này không thêm baseline waiver.

## Local validation và remote proof

Local harness: policy12/12, frontend25/25, backend128/128, helpers14/14,
Selenium smoke5/5 và Playwright typecheck Pass. XML reports đã parse bằng XML parser,
actionlint1.7.12 kiểm tra cả sáu YAML files Pass. Lint thực tế Fail213 errors/14 warnings;
build Fail109 TypeScript diagnostics. Đây là lỗi static đã được phơi bày, không phải
InfrastructureFailure. Lint scope hiện theo config TS/TSX; chưa tuyên bố lint toàn JS/JSX.

[Curated local evidence](../evidence/stage8-2026-11-17/local-validation.json) lưu
metadata/report hashes; full reports/logs không commit. CI run thật, SHA và kết quả
remote nằm trong PR checks/artifacts; PR description ghi link tới từng run sau audit.
Không đồng nhất local Pass với GitHub Pass hoặc cấu hình scheduled workflow với run thật.

Chạy lại từ root sau khi cài dependencies:

```sh
node scripts/ci/run.cjs init backend
node scripts/ci/run.cjs run backend
node scripts/ci/run.cjs finalize backend
```

Với local mongod đặt MONGOMS_SYSTEM_BINARY/MONGOMS_RUNTIME_DOWNLOAD theo environment
setup; máy Windows chỉ có Edge có thể dùng SELENIUM_BROWSER_BINARY với Chromium phù hợp.
Không chạy nhiều browser suites đồng thời trong cùng working copy/ports. CI matrix
dùng các VM riêng. `finalize` luôn chạy để ghi artifact, và vẫn exit nonzero nếu gate Fail.
