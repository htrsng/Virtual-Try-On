# Giai đoạn 1 — Backend P0

Ngày thực hiện: 16/11/2026 (Asia/Saigon). Nhánh `qa/stage-1-backend-p0`.
Commit đầu vào: `e751a46`. Baseline application source đối chiếu: `3d61097`.
Không thay business source, raw results hoặc bug history của Giai đoạn 0.

## Development Fix

- Bảo vệ admin/users/coupons bằng prefix auth/RBAC; product/banner/order management
  bằng guards tương ứng. JWT Bearer HS256, current DB role; deleted/demoted identity
  không giữ quyền cũ. User DTO allowlist và password `select:false`.
- Xóa hẳn HTTP create-admin/reset/clear handlers và tài khoản default; các path cũ
  trả 404 trên mọi environment/role. Bootstrap dùng `npm run admin:create`, lấy
  credentials từ environment do operator cấp; không ghi đè/promote account đã tồn tại.
  Bỏ reset/clear controls khỏi admin UI. Không chạy script bootstrap trên DB của bạn.
- JWT thiếu/yếu/placeholder làm startup fail; test không load development `.env`.
  Không thay secrets hoặc dữ liệu tài khoản development đang có.
- Validation JSON/operator/IDs/allowlists; stable HTTP errors, không trả driver stack.
  Bổ sung registration và product detail bị thiếu so với frontend/tests hiện có.
  Giữ catalog array contract; product create trả 201; duplicate identity trả 409.
- Checkout đọc catalog và tính giá, shipping, promotion ở server. Transaction gồm
  stock reservation, order, coupon usage và newsletter claim; race tests chứng minh
  không oversell/redeem cùng mã hai lần. Product version tăng khi stock thay đổi.
- Status transitions có giới hạn; owner cancellation hoàn stock đúng một lần.
  Legacy order chưa reserve stock không được cộng kho khi hủy; reservation flag nội bộ
  không trả trong order JSON. Không xóa audit order qua HTTP; không xóa product đang
  giữ reserved orders. Product numeric identity không bị tự đổi khi startup/GET/edit.
- Bỏ fake payment URL/QR, delayed success và client success timer. Online payment
  chưa có provider trả 503; UI chỉ COD/banking. Không coi banking là đã nhận tiền.
- Chat/view-history/recommendations không tin userId client; thêm owner used-coupons
  endpoint để checkout/profile không phải gọi API user management sau khi khóa RBAC.
  Shipping UI gửi canonical ID, signup UI dùng minimum 8 ký tự.

## QA và kết quả

| Kiểm tra | Kết quả | Giới hạn |
|---|---|---|
| Before-fix targeted regression | 5 Fail / 12 không chọn | Chạy trên MongoDB tạm, không gọi reset/delete |
| Before-fix pricing probe trên source cũ | Fail đúng kỳ vọng | Client total=1 bị lưu thành 1; expected server total=430.000 |
| Backend Jest | 120 tests / 12 suites Pass | MongoDB 8.2.6 replica set tạm; không forceExit |
| UI payment safety | 2 tests Pass | Không callback success theo timer; chỉ COD/banking |
| Route inventory exporter | 71 live registrations + 3 retired paths | Danh sách source, không tương đương coverage toàn bộ handler |
| Syntax/JSX parse + git diff check | Được kiểm tra riêng | Không thay thế TypeScript build hoặc full UI E2E |
| GitHub Actions / real gateway / email / Gemini | Chưa xác minh | Không tuyên bố production integrations Pass |

New QA suites: `security.test.js`, `permissions.test.js`, `checkout.test.js`,
`validation.test.js`, `environment.test.js`; shared fixtures `helpers.js` tạo actors
trực tiếp trong DB tạm, không bootstrap admin qua endpoint retired.

120 là số Jest test invocations (gồm parameterized cases và tests hiện có), không
phải tuyên bố đã thiết kế 120/150 test cases toàn hệ thống hoặc coverage 80%.

Test Defect fixes được tách khỏi Development Fix: sửa syntax auth suite; mỗi test tự
seed thay vì dùng beforeAll rồi dữ liệu bị afterEach xóa; tokens có users còn tồn tại;
admin concurrency tests phải authenticate; expected catalog là array; login 401,
duplicate registration 409; FAQ kiểm tra nội dung đáp án thực tế, không yêu cầu đáp án
phải lặp lại keyword câu hỏi. Payment test không còn kỳ vọng gateway mô phỏng thành công.
Jest glob tương đối sửa Windows discovery; setup chờ unique indexes trước test và dùng
MongoMemoryReplSet. Bỏ forceExit; suite thoát sau cleanup.

## Bàn giao và tái lập

- [API inventory](api-inventory.md), [permission matrix](permission-matrix.md),
  [validation rules](validation-rules.md).
- [Bug reports trước/sau](../bug-reports/STAGE1-P0.md),
  [evidence summary](../evidence/stage1-2026-11-16/README.md).
- [Environment setup](environment-setup.md): dependency install, test commands,
  replica-set prerequisite và admin bootstrap. `tests/` Playwright giữ nguyên.

DoD được kiểm chứng cho scope P0 nêu trên: admin denial/allow, revoked identity,
server pricing, persisted order/coupon/inventory, owner isolation và invalid states.
Không đồng nghĩa 71 routes đã có exhaustive positive/negative tests hoặc toàn hệ thống
đã production-ready. Full frontend build/lint/3D failures của baseline vẫn thuộc backlog.

Các giới hạn cần làm tiếp: test environment/E2E fixtures, API requirements chi tiết
cho các module P1 (reviews, closet, vouchers), rate limiting/login abuse controls,
phân trang/admin bulk reads, payment provider xác thực, global voucher quotas/eligibility
và transactional delivery side effects. Browser-managed vouchers chưa có backend CRUD;
server chỉ nhận catalog công khai đã được ghi rõ. Không tạo coverage giả cho chức năng đó.
