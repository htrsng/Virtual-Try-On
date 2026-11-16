# Test strategy

## Mục tiêu và nguồn yêu cầu

Kiểm thử hệ thống VFitAI thật, bao gồm ranh giới UI/API/MongoDB và thử đồ 3D.
REQ trong tài liệu QA là yêu cầu kiểm thử đề xuất từ hành vi/source đã quan sát,
không phải đặc tả nghiệp vụ đã được chủ sản phẩm phê duyệt. Những kỳ vọng chưa rõ
(status code tạo product, đăng ký, role policy, payment) cần chốt trước automation.

## Phân công công cụ

| Công cụ | Phạm vi | Tình trạng |
|---|---|---|
| Selenium/Java/TestNG/Maven/POM | UI smoke, login, catalog/cart, functional regression | Planned |
| Playwright hiện có | Audit trước; bổ sung 3D/network/trace/visual có giá trị riêng | Existing, baseline blocked |
| Jest/Supertest/Mongoose | API contract, authorization, persistence, concurrency | Existing, baseline failing |
| Manual/exploratory | Render 3D, UX, xác định expected result/visual baseline | Planned |
| Python API fuzzing | Coursework độc lập trên API mô phỏng | Archived; không tính vào coverage VFitAI |

## Ưu tiên

P0: khởi chạy lặp lại, login/permission, đọc sản phẩm thật, test isolation và
persistence. P1: negative cases, cart/checkout, model loading/error. P2: responsive,
cross-browser, visual regression sau khi có trạng thái render ổn định.

Khởi đầu 5 smoke tests có expected result rõ: homepage thực sự render, login hợp
lệ, login sai mật khẩu, product fixture, size/add-to-cart. Mỗi test tự chuẩn bị
dữ liệu; chưa tuyên bố đã có 5 tests này. Order write/read + failure path là
vertical slice tích hợp kế tiếp; cart localStorage không thay thế bước đó.

## Thiết kế và độc lập

- EP cho credential/role/input groups; BVA cho số lượng và số đo sau khi chốt miền
  giá trị; decision table cho auth/permission; state transition cho cart/order.
- Test cases nêu preconditions, data, steps, expected result và oracle.
- Explicit waits theo UI/model readiness; không dùng sleep hoặc chỉ networkidle.
- POM tách actions và assertions nghiệp vụ; config baseUrl/browser/headless.
- Dữ liệu synthetic trong MongoDB test, namespace từng run; cleanup theo ID.
- Secret từ môi trường; report không chứa credential/token/PII thật.

## Báo cáo và exit criteria

PASS: assertion thực sự chạy và đúng. FAIL: assertion/runner lỗi có evidence.
BLOCKED: thiếu điều kiện để đánh giá behavior. NOT RUN/PLANNED: chưa thực thi.
Không dùng `if (visible)` để bỏ qua bước bắt buộc rồi tính Pass.

Mỗi run ghi commit + dirty state hoặc source manifest, thời gian, môi trường,
lệnh, counts, failure classification và evidence. Retest không ghi đè baseline cũ.
CI phải upload report khi fail; không dùng continue-on-error để che lỗi.

Milestone A chỉ đạt khi clone sạch chạy được, test data cô lập, 5 Selenium smoke
tests lặp lại độc lập và có báo cáo. WebGL chỉ đạt khi có model/state evidence,
không chỉ có thẻ canvas. Baseline visual cần review, không tự cập nhật mọi ảnh.
