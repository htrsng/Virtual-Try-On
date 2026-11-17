# Giai đoạn 7 — Playwright 3D

Mở rộng `tests/` hiện có, không tạo framework song song. Selenium tiếp tục sở hữu
E-Commerce E2E; Playwright sở hữu viewer/WebGL, pixels và browser diagnostics.

## Bốn cấp kiểm thử

| ID | Level | Oracle thật |
| --- | --- | --- |
| 3D-01 | L1/L2 | URL size M phải mount GLB M; chọn L/S thay URL và geometry bounds; meshes/vertices/triangles >0 |
| 3D-02 | L1/L2 | Camera preset, wheel zoom, drag rotate và reset thay actual camera position/distance |
| 3D-03 | L4 | Live Idle bone matrices và auto-rotate thay đổi; context không lost |
| 3D-04 | L1/L4 | Gate avatar response có loading UI, release tải model thật; cold-load budget60s |
| 3D-05 | L4 | Inject404 avatar, hiện error boundary, bỏ interception rồi reload phục hồi model thật |
| 3D-06 | L4 | Warm S/L/M rồi chuyển9 lượt tổng; chỉ một garment, geometries/textures không tăng không giới hạn |
| 3D-07 | L3 | Screenshot vùng canvas front/left đối chiếu baseline trong render profile cố định |
| 3D-DIAG | Negative control | HTTP200 trả GLB quần thay áo; WebGL vẫn hoạt động nhưng visual oracle phải tạo pixel diff và trace |

`3d-diagnostics` attachment chứa actual mounted scene assets, bounds, mesh/vertex
counts, camera/quaternion, sampled bone matrices, renderer calls/triangles/resources,
context loss, renderer vendor, console/page errors và HTTP status GLB/HDR.
`3d-resource-timings` chỉ ghi path/duration, không ghi tokens, cookies hoặc manifest.

Read-only snapshot `window.__VFIT_3D__` chỉ tồn tại khi MODE=qa và VITE_QA_3D=true.
Không có setters, không bypass loader, không set sẵn expected camera/model state.
GLB vẫn qua GLTFLoader/useGLTF thật và GPU/WebGL thật. Bounds là world-space bounds,
không phải phép đo chuẩn xác chất lượng fit trên cơ thể; geometry count không phải
GPU byte usage. Budget60s là smoke budget trên software renderer, chưa phải SLA/FPS
hoặc benchmark thiết bị người dùng.

## Render profile và baseline

- Playwright1.60.0 / Chromium148.0.7778.96 (lockfile/browser revision), Windows,
  ANGLE SwiftShader; viewport1440×1000, deviceScaleFactor1, R3F dpr1.
- Localevi-VN, timezoneUTC, light color scheme, reduced motion; fresh context và
  owned MongoDB seed; shirt50101 M White; default avatar/body profile.
- Camera front[0,0.8,5.2], left[5.2,0.8,0], target[0,0.3,0]. Studio lighting và
  local pinned city HDR; existing GLBs/HDR hashes được ghi trong evidence.
- `qa3d=static` dừng Avatar/Garment actions tại time0 trong QA; production và
  `qa3d=live` vẫn chạy animation. Không dùng CSS animation:disable để giả định đã
  đóng băng Three.js animation. Lerp camera snap tại target khi kết thúc.
- PNG lấy trực tiếp WebGL buffer bằng canvas.toDataURL; UI font/toast không vào
  baseline. Chờ pixel giống nhau qua các rendered frames thật rồi toMatchSnapshot;
  tolerance0.002 pixel ratio, không tăng để che lỗi model. Cách này tránh scroll/
  actionability của canvas pointer-delegated và loại toàn bộ DOM overlays.

Visual project là opt-in `QA_3D_VISUAL=1`; platform path riêng. Không lấy ảnh
Windows làm baseline Linux, không tự sinh baseline trong CI, không dùng
`--update-snapshots` để chữa một failure chưa phân tích. CI visual pin Windows2022;
local Windows11 và CI vẫn phải đối chiếu bằng run thật, chưa tự coi CI Pass.

## Chạy và evidence

Từ root: cài `npm ci --prefix server`, `--prefix client`, `--prefix tests`, sau đó
`node tests/node_modules/@playwright/test/cli.js install chromium`. Dùng Node22 và MongoDB binary
download/local theo [environment setup](environment-setup.md).

Trong `tests/`:

```sh
npm test
npm run test:3d
npm run typecheck
```

`npm test` chạy6 cases cũ và6 3D functional/reliability. PowerShell visual:

```powershell
$env:QA_3D_VISUAL='1'
node node_modules/@playwright/test/cli.js test --project=3d-visual
```

Từ root, `node scripts/qa-3d-diagnostic.cjs` cố ý chạy một test Fail. Wrapper chỉ
trả0 nếu đúng1 pixel mismatch có diff PNG và trace; timeout/missing baseline/asset
crash không được nhận làm bằng chứng detector Pass. Nó không cập nhật baseline.

HTML report ở `tests/playwright-report/`; trace/screenshots ở ignored
`tests/test-results/`; fault artifacts ở `.runtime/qa3d-diagnostic/`. Xem trace với
`npx --prefix tests playwright show-trace <path>`. CI upload artifacts14 ngày.
Repository chỉ giữ baseline cần so sánh, curated summary và ảnh evidence mẫu.

## Baseline approval

Người dùng đã duyệt hai PNG front/left ngày17/11/2026 với phản hồi “Duyệt hai
baseline hiện tại”. [Approval record và cách cập nhật](../../tests/visual-baselines/README.md)
và render-profile.json lưu hash đúng ảnh đã duyệt; không đổi ảnh sau approval.
Mốc này xác nhận hình ảnh tham chiếu hiện tại, không chứng nhận physical fit.

## Execution — 17/11/2026

| Check | Kết quả local |
| --- | --- |
| Full regression, final source | 13/13 Pass:6 cases cũ +6 3D functional/reliability +1 visual case(2 views) |
| Visual repeat, no snapshot updates | 2/2 Pass trước final camera coordination; final source full suite và một visual repeat riêng đều Pass |
| Camera preset/zoom/drag/reset repeat | 3/3 Pass sau điều phối camera/damping; full regression tiếp theo Pass |
| GPU plateau sau cleanup fix | Warm/final geometries19→19, textures17→17 trong recorded run; threshold warm+2 không đổi |
| Frontend unit regression, final source | 25/25 Pass,5 files; DOM unit tests vẫn không phải WebGL tests |
| Playwright strict typecheck | Pass; compiler/Node types được pin riêng trong tests/ |
| Frontend TypeScript prerequisite | Fail109 diagnostics, cùng count baseline; không tuyên bố toàn build xanh |
| GitHub CI | YAML Linux functional +Windows visual/negative-control đã chuẩn bị; chưa xác minh run |

Negative control ghi một Playwright Fail có chủ đích, pixel diff và trace dù HTTP200
và contextLost=false; wrapper exit0 chỉ khi xác minh đúng loại failure. Nó không
được cộng thành case Pass của regression. Hai PNG baseline đã duyệt giữ nguyên hash.

[Curated execution summary](../evidence/stage7-2026-11-17/summary.json) lưu cả các
failure/retest, raw report hashes và actual scene metrics. [Diff mẫu](../evidence/stage7-2026-11-17/wrong-glb-diff.png)
và [wrong-model render](../evidence/stage7-2026-11-17/wrong-glb-actual.png) là fault
injection evidence. Trace gốc wrong-size ở `.runtime/stage7/probe-record/trace.zip`;
trace negative control ở đường dẫn trong `.runtime/qa3d-diagnostic/summary.json`.
Raw reports/traces lớn không commit; CI giữ14 ngày và CLI có thể tái tạo trên cùng source.
