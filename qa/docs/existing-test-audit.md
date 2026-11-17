# Existing test audit — Giai đoạn 4

Ngày 17/11/2026 (Asia/Saigon). Input `1914105`; nhánh `qa/stage-4-existing-test-audit`.
Đây là Giai đoạn 4 theo yêu cầu hiện tại: kiểm toán/sửa tests trước framework mới.
Không suy luận Giai đoạn 3/Selenium đã hoàn thành. Kết quả local đo trên candidate
working tree, nhận diện bằng source hashes trong [evidence](../evidence/stage4-2026-11-17/README.md).

## Kết quả tổng hợp

| Suite / check | Phạm vi thực tế | Kết quả local |
|---|---|---|
| Full frontend Vitest | DOM unit/component composition, 4 files | **21 Pass**; trước sửa 16 Pass + 1 file lỗi collection |
| `test:components` | Historical ProductList/Toast subset | **14 Pass**, đã nằm trong 21; không cộng lại |
| Native Node helper tests | Pure size utility + mocked-fetch utility, 2 files ở legacy location | **14 Pass** sau sửa imports; không phải tests của engine fitting mới |
| Backend Jest | HTTP/Supertest + real temporary MongoDB + process/config/lifecycle checks, 13 files | **128 Pass**; trước đó 130 vì có 2 tests trùng |
| Playwright | 3 browser UI smoke + 3 API/proxy/asset integration checks | **6/6 Pass ×2**, 0 skipped, retries=0 |
| Archive reporting regressions | Python report/replay tooling | **9 Pass** |
| Archive fuzz-tool regressions | Tool/oracle + separate stub-target checks | **55 Pass** |
| Archive quality-schema tool | Python unit tests | **4 Pass** |
| Archive acceptance smoke | Archived `node_harness_stub`, không phải `server/` | **4 Pass** |
| Frontend typecheck/build gate | `tsc -b` | **FAIL: 109 diagnostics**; chưa tới Vite production bundle |
| ESLint | Phạm vi TS/TSX hiện được cấu hình | **FAIL: 208 errors, 14 warnings**; JSX chưa được lint bởi config này |

Pass tests không chứng minh build/lint hoặc toàn bộ nghiệp vụ Pass. Các con số là
test invocations theo runner; không quy đổi thành coverage của kế hoạch 150 design cases.
Không chạy lại full archived acceptance/fuzz campaign; đây là exploratory workload
riêng, bounded smoke/regression đã được đo ở trên. Không sửa reports lịch sử trong archive.

## Lỗi `useGLTF.preload`

Chuỗi import: `VirtualTryOn.test.tsx` → `VirtualTryOn.tsx` → `Avatar.tsx:14` →
`useGLTF.preload('/assets/models/avatar_morph.glb')`, chạy ngay khi module được import.
Mock cũ chỉ cung cấp `useGLTF: () => ({ scene: {}, materials: {} })`; đó là function
không có static method `preload`. Vitest dừng collection trước khi chạy case trong file.
CI và local đều xác nhận TypeError này; không phải bằng chứng file GLB hoặc GPU hỏng.

Source audit còn thấy test thiếu `FittingRoomProvider`, required product/callback props,
mock thiếu exports Drei/Fiber khác, và fake Canvas đưa children `group/mesh/Avatar`
vào DOM. Đây là các sai lệch contract đọc từ source; không gán tất cả thành CI errors
đã chạy khi CI thực tế dừng sớm tại preload.

Sửa tại test boundary:

- `useGLTF` mock là callable có `.preload` spy; import **real Avatar module** vẫn xảy ra,
  có assertion đúng asset path. Load function ném lỗi nếu renderer boundary bị vượt.
- Canvas thay bằng một DOM boundary, không mount R3F subtree vào jsdom. Không mock cả
  `three` thành object rỗng; giữ các class/math CPU thật khi component import chúng.
- Dùng real FittingRoomProvider/MemoryRouter và product fixture hợp lệ. LocalStorage
  reset trước/sau case, DOM cleanup và globals restored; unexpected network bị chặn.
- 5 cases: preload import contract, studio/product shell, guest avatar dismissal,
  quick guide open/close, navigation home. Đây là **DOM composition**, không phải
  WebGL integration/visual/GLB parsing test.
- Dùng `@testing-library/jest-dom/vitest` để runtime và TypeScript cùng mở rộng Vitest
  assertions; bỏ unused React import/unsupported RTL `exact` option. Không còn
  diagnostics thuộc file test được sửa trong typecheck cuối; lỗi application vẫn còn.

## Inventory frontend và backend theo file

| File | Cases | Layer, data và assertions chính | Quyết định / status |
|---|---:|---|---|
| `client/src/components/ProductList.test.jsx` | 8 | DOM component; mock wishlist/language/preview boundary; real MemoryRouter; product/price/link, wishlist callbacks, empty/loading/preview/navigation | Giữ; Pass |
| `client/src/components/Toast.test.jsx` | 6 | DOM unit; fake timers; deadline, announcement, unmount/replacement cleanup | Giữ; Pass |
| `client/src/components/PaymentSafety.test.jsx` | 2 | DOM unit; timer không thể báo payment success; canonical COD/banking selection | Giữ; Pass |
| `client/src/features/virtual-tryon/VirtualTryOn.test.tsx` | 5 | DOM composition như mô tả; renderer/loader facade, real context/router | Sửa; Pass |
| `server/tests/auth.test.js` | 8 | HTTP/DB; real register/hash/token, normalized email, duplicate, invalid inputs, generic401 | Giữ; Pass |
| `server/tests/product.test.js` | 4 | HTTP/DB; admin create, public list/detail, partial update, unique identity | Giữ; Pass |
| `server/tests/order.test.js` | 2 | HTTP/DB; create→GET my-orders read-back, other-owner empty list | Giữ: read-back HTTP khác direct DB assertions; Pass |
| `server/tests/admin.test.js` | 2 | HTTP/DB; sync counts và safe aggregate payload, không chỉ status | Giữ; Pass |
| `server/tests/ai_recommendation.test.js` | 2 | HTTP/DB; local FAQ chat/history + recommendation list | Giữ; Pass; **không kiểm chứng Gemini/AI provider** |
| `server/tests/models.test.js` | 3 | Model/real DB; save normalization, validation, defaults | Giữ; Pass; không ghi nhầm là pure in-memory unit |
| `server/tests/concurrency.test.js` | 4 | Real DB concurrency; 50 failed logins là 1 case; CAS product/user/order | Giữ; Pass |
| `server/tests/checkout.test.js` | 28 | Real DB transactions; price/shipping/promo, rollback, race, stock, cancel, state, legacy order | Giữ; Pass |
| `server/tests/security.test.js` | 15 | HTTP/DB + JWT; retired endpoints, invalid/revoked identities, role/profile/owner safety, payment unavailable | Bỏ 2 exact duplicates đã có trong matrix; còn lại Pass |
| `server/tests/permissions.test.js` | 29 | 27 method/path negative cases + admin positive operations; owner fixtures riêng | Giữ; Pass |
| `server/tests/validation.test.js` | 16 | HTTP/DB; invalid body/query/IDs, payload bounds, owner data, review DTO | Giữ; Pass |
| `server/tests/environment.test.js` | 5 | Process/config + DB outage, không phải UI | Giữ; Pass |
| `server/tests/test-data.test.js` | 10 | Owned DB lifecycle, exact reset, indexes, production/marker/handle/config refusal, health | Giữ; Pass |

Backend isolation được đọc từ source và chạy thật: global setup đặt NODE_ENV=test,
MONGODB_URI rỗng, test-only signing secret/provider keys rỗng; `.env` development
không được đọc. Mỗi suite tạo owned MongoMemoryReplSet, chờ indexes; afterEach clear
trên đúng connection/client/marker và afterAll disconnect/stop. Không stub Mongoose,
không gọi reset HTTP hoặc development MongoDB. Startup/teardown hooks có timeout riêng;
local coverage run serial, default workers bounded=2. Không dùng forceExit để che leak.
Đã chạy lại 10 lifecycle cases với inherited NODE_ENV=production, URI sentinel ở
localhost:1 và signing secret không hợp lệ: **10 Pass** vì runner override trước
app import và tạo DB riêng. Đây là subset của128, không cộng thêm vào tổng cases.

## Kiểm toán toàn bộ Playwright files

Shared contract: `tests/fixtures.ts` auto reset/clear mỗi case, context mới, language=vi,
chỉ cho browser HTTP(S) tới test origins; `global-setup.ts` sở hữu API/UI/Mongo và teardown.
Config: Chromium, 1 worker, timeout case 30s / assertion 5s mặc định, retries=0.
Không có networkidle, waitForTimeout hoặc conditional assertion skips trong specs.
Trace đổi từ `on-first-retry` (vô hiệu khi retries=0) sang retain-on-failure, screenshot
only-on-failure. Raw artifacts nằm ignored paths, HTML CI artifact giữ 14 ngày.

| File / case | Mục đích và layer | Data / selectors / assertions | Local |
|---|---|---|---|
| `home.spec.ts`: home | Browser UI smoke | Seed catalog; title, root, visible `/product/50101` link; `first()` chỉ chọn một card khi home có nhiều sections | Pass ×2 |
| `home.spec.ts`: detail navigation | Browser UI integration | Click actual fixture href, exact URL và heading tên product | Pass ×2 |
| `checkout-journey.spec.ts` | Browser UI flow đến checkout | API login là setup; chọn M, cart count, chọn checkbox bằng label, enabled checkout, đúng route, **selected-product summary 1 item, tên/size/quantity** | Pass ×2 |
| `environment.spec.ts`: health/catalog | API/proxy integration bằng Playwright request | Direct API và UI proxy phải cùng ready/runId; exact seeded product IDs | Pass ×2 |
| `environment.spec.ts`: order | API/DB integration qua HTTP server thật | Login, before2, POST201/server total, after3 và đúng order ID/total read-back; kiểm tra status trước body | Pass ×2 |
| `environment.spec.ts`: 3D resources | API/static asset integration | model enabled, owner outfit/closet/session, 7 resources HTTP200/206 + GLB magic | Pass ×2; **không render WebGL/visual** |

Checkout trước audit chỉ tìm product text toàn page, có thể nhầm recommendations;
đã scope vào OrderSummary selected-item dropdown. Không submit order bằng UI ở case
này; API persistence case có giá trị riêng. Ba request-only cases không launch/test
browser rendering chỉ vì project mang tên chromium hoặc runner là Playwright.

## Duplication, coverage và flaky risks

Xóa `anonymous cannot list users` và `ordinary user cannot read admin sync data` khỏi
security file vì permission matrix đã gọi đúng hai routes với cùng actors/status và
còn kiểm tra dữ liệu không bị thay đổi. Không xóa assertions RBAC hoặc giảm route coverage.
128 thay cho130 là consolidation, không phải regression bị skip. Component subset14
là bridge của archived runner; không chạy nó lần hai trong default app CI. Unit và
browser checks có cùng tính năng vẫn được giữ khi boundary/assertions khác nhau.

V8 coverage local (không đặt threshold tùy tiện):

| Scope | Statements | Branches | Functions | Lines |
|---|---:|---:|---:|---:|
| Frontend `src/**/*.{js,jsx,ts,tsx}`, exclude tests/declarations | 8.02% | 4.25% | 5.77% | 8.59% |
| Backend top-level JS/config/routes/test-support; exclude tests và CLI subdirectory | 52.30% | 67.30% | 76.92% | 52.30% |

Reports giữ unexecuted source trong denominator; mock renderer không chứng minh 3D
đúng dù import lines được covered. Backend scope có top-level legacy maintenance
files chưa test; external email/Gemini/real payment chưa kiểm chứng. Native Node
helper run không cộng vào Vitest coverage; subprocess checks cũng không tự cộng vào
parent Jest V8 coverage. Coverage là execution metric, không phải requirement coverage.

Flaky audit: browser hiện 2 lượt/12 invocations không Fail, không retry che lỗi; đây
không phải chứng minh tuyệt đối không flaky. Fixture isolation/explicit waits đã được
giữ. Toast fake timers restore sau test; fetch-timeout helper mock network và assert
abort/error identity, không đặt deadline elapsed-time quá chặt. Coupon tests còn phụ
thuộc catalog expiry 01/01/2027; đó là calendar/fixture maintenance risk, chưa phải
flake đã tái hiện. Visual snapshots, cross-browser và GPU failure recovery chưa có.

## CI: đã đọc raw log từng job

Đã tải/đọc cả 6 job logs bằng GitHub credential sẵn có; không ghi credentials vào
report. Public log endpoint ban đầu403, authenticated read200. Chỉ lưu summary/hashes.

| Run / nguồn | Backend | Frontend | E2E |
|---|---|---|---|
| [44041049837](https://github.com/htrsng/Virtual-Try-On/actions/runs/44041049837), PR head `1914105`, actual merge checkout `fe571b1` | **130 Pass /13 suites**, Ubuntu26.04/Node22.23.4 | **Fail** import `useGLTF.preload`; 3 files Pass/1 file không collect | **Không chạy tests**: Playwright1.60 không hỗ trợ ubuntu26.04, fail bước Install Playwright Browsers |
| [43889465659](https://github.com/htrsng/Virtual-Try-On/actions/runs/43889465659), main head `3d61097` | **Fail**: auth syntax/contract/fixtures; 10 Pass/6 Fail, 3 suites Pass/4 Fail | **Fail** preload mock | **Không chạy tests**: browser installation/platform issue riêng |

Không gán backend/E2E failure cho lỗi frontend. Candidate đã pin runners ubuntu-24.04
(có support trong installed Playwright registry), chỉ cài Chromium đang dùng, thêm
JSON/JUnit artifacts cho backend/frontend/helper units, giữ HTML Playwright artifact.
**Workflow mới chưa có CI run trên candidate này**; local Pass không thay thế Linux
retest. Build/lint không nằm trong các test jobs hiện tại, nên workflow xanh sau này
cũng không chứng minh production build/lint xanh.

## Chạy lại

Sau `npm ci --prefix server/client/tests` theo từng package và browser install như
[environment setup](environment-setup.md); có thể dùng trusted MONGOMS_SYSTEM_BINARY
như Giai đoạn2. Không cần development DB hoặc credentials thật.

```powershell
# Từ client/: full frontend, optional coverage và historical subset
node node_modules/vitest/vitest.mjs run --config vitest.ci.config.ts
node node_modules/vitest/vitest.mjs run --coverage
node node_modules/vitest/vitest.mjs run --config vitest.components.config.ts

# Từ repo root: backend + browser repeat + application helper units
node server/node_modules/jest/bin/jest.js --config server/jest.config.js --runInBand --coverage
node scripts/qa-repeat.cjs browser
node --experimental-strip-types --test archive/coursework-api-fuzzing/automation-testing/tests/fetch-timeout.test.mjs archive/coursework-api-fuzzing/automation-testing/tests/size-recommendation.test.mjs
```

Static checks từ client/: `node node_modules/typescript/bin/tsc -b` và
`node node_modules/eslint/bin/eslint.js .`; Fail hiện tại đã được ghi nhận, không bị
bỏ qua hoặc giảm strictness. Không chạy Vite bundle khi tsc gate chưa đạt.

Nguyên nhân static Fail được phân loại riêng: 65 diagnostics TS6133 (unused), 13
TS2339 (property/type contracts), các TS2345/TS2322 về null/assignment và thiếu JS
declarations TS7016. Ví dụ `App.tsx` đưa array có null vào ProductRecord state.
Lint chủ yếu no-explicit-any (108), no-unused-vars (71), hooks dependencies/state
effects. Các counts rule gồm cả severity warnings; tổng chuẩn là208 errors/14 warnings.

## Archived suites

Hai native helper files ở `archive/coursework-api-fuzzing/automation-testing/tests/`
đọc **active client utilities**. Sửa import `../../../vfitai/client/...` đã mất thành
`../../../../client/...`; giữ14 cases tốt và thêm chúng vào frontend CI step riêng.
Size helper này không phải ease-based recommendation engine mới của phòng 3D.

Từ `archive/coursework-api-fuzzing/`:

```powershell
python -m unittest discover -s api-testing/tests -p 'test_*.py'       # 9 Pass /2 files
python -m unittest discover -s fuzz-testing/tests -p 'test_*.py'      # 55 Pass /7 files
python -m unittest discover -s fuzz-testing/tools/tests -p 'test_*.py' # 4 Pass /1 file
python api-testing/run_suite.py --suite smoke --output ../../.runtime/stage4/new-acceptance-run
```

Acceptance smoke4 Pass trên `node_harness_stub`; không có real MongoDB, không chứng
minh app RBAC/checkout của `server/`. Dùng output path mới/rỗng mỗi lần. Requirements
riêng xem archive README; máy đo Python3.13.2. Full acceptance/fuzz campaign không chạy
lại vì là workload exploratory riêng; target npm test là placeholder, lệnh Python
orchestrator mới là cách chạy. Reports/source hashes lịch sử được giữ nguyên; replay
có thể từ chối khi manifest source khác. Test cases manual/RTM draft là design records,
không phải automated tests đã Pass. Không có Selenium/TestNG suite để kiểm chứng lúc này.

DoD: mỗi suite có command, layer/data boundary, measured result hoặc lý do chưa chạy;
root cause CI tách từng job, tests tốt được giữ và duplicate removal có mapping rõ.
