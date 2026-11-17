# Validation rules và business contract — Giai đoạn 1

## Contract chung

- JSON object, tối đa 100 KiB. JSON hỏng → 400; payload vượt giới hạn → 413.
- Reject Mongo operators/keys có `$`, `.`, `__proto__`, `constructor`, `prototype`
  trong input. Query scalar strings, key đơn giản; không nhận object/array query.
- Mongo ID không đúng định dạng → 400 trước truy vấn các resource quan trọng.
- Validation bao phủ cả trailing slash và chữ hoa/thường mà Express mặc định nhận.
- Product/user/profile/order writes dùng allowlist; không nhận update operators,
  password hash, counter hoặc thuộc tính nội bộ từ client. Unknown field → 400.
- Driver/stack diagnostics không trả ra client qua lỗi 500. Lỗi cast/validation →
  400, unique conflict/version/state conflict → 409, DB chưa ready → 503.

## Authentication và user

Register: email hợp lệ ≤254 ký tự, trim/lowercase; password ≥8 ký tự, ≤72 UTF-8 bytes
để tránh bcrypt truncation; hash bcrypt cost 12. Profile text ≤500 ký tự.
Login nhận string email/password, không nhận query object; unknown account/wrong
password cùng 401 và message. Existing short-password accounts vẫn có thể login;
không thay đổi dữ liệu tài khoản hiện có hoặc giả định mật khẩu cũ đã được xoay.
Đăng ký trùng email normalized → 409. Register trả token phù hợp AuthContext hiện có.

Role chỉ `user/admin`. Register tự đặt `user`. Profile không cho sửa role/password;
admin user write chỉ cho phép profile/email/role/version. Admin không được tự xóa
hoặc tự demote tài khoản đang dùng (409). User DTO allowlist loại password/counters;
schema password mặc định không select. Login chủ động select password để kiểm tra.
JWT secret phải cấu hình riêng ≥32 ký tự, không chấp nhận placeholder/fallback cũ.

## Product và dữ liệu hiển thị

Name không rỗng ≤200 ký tự; price/originalPrice/stock/sold/version là số nguyên
không âm, numeric ID nguyên dương. Product status: active/inactive/out_of_stock.
Rating 0..5; images tối đa 30; variants tối đa 50, sizes tối đa 30/color; stock nguyên
không âm, color/size không trùng. Tổng stock được server suy ra từ variants.
Edit tên/giá không làm mất stock. Numeric ID giữ nguyên; duplicate ID → 409.
Public GET không thực hiện normalization write; maintenance ID là endpoint admin riêng.

Address bắt buộc các trường tên/phone/province/district/ward/street; type home/office,
isDefault boolean. Banner validate title/content/state. Chat string 1..2000 ký tự.
Review rating nguyên 1..5; public review DTO không trả userId/version.
Try-on session 1..20 item references; saved outfit chỉ có tops/bottoms/outerwear/dresses.
Wishlist và closet import là snapshots phục vụ UI, không phải nguồn giá của checkout.
Recommendations limit nguyên 1..50; owner personalization chỉ từ verified token.

## Checkout — nguồn dữ liệu đáng tin cậy

`server/checkout.js` là nguồn quyết định:

1. 1..100 dòng hàng; quantity nguyên 1..100, không chấp nhận numeric string.
2. Product phải tồn tại, active, price nguyên VND 0..1 tỷ; tổng đơn tối đa 1 nghìn tỷ.
3. Đọc lại tên, giá, image, model3D từ MongoDB. Client price/name/model/total/discount/
   shipping amounts không có quyền quyết định dữ liệu tài chính, kể cả giá trị âm.
4. Với sản phẩm có variants, color/name hoặc hex và size phải tồn tại, đủ stock.
   Cộng dồn stock qua các dòng/tranh chấp không thể oversell đơn vị cuối.
5. Shipping info bắt buộc tên/phone/address; phone có định dạng số hợp lệ;
   method ID canonical standard=30.000, express=50.000, super=100.000 VND.
   Aliases tên shipping cũ được hỗ trợ; frontend mới gửi ID độc lập ngôn ngữ.
6. COD và banking được nhận; banking chưa có xác nhận nhận tiền tự động.
   Online/gateway methods trả 503. Payment create không tạo URL/QR/timer giả;
   status không trả success cho payment chưa tồn tại. UI chỉ còn COD/banking.
7. `subtotal = Σ catalogPrice × quantity`;
   `total = subtotal + serverShipping - serverCoupon - serverVoucher`, làm tròn xuống
   các giảm giá theo phần trăm tới VND; payable không âm.

| Coupon server | Minimum subtotal | Discount |
|---|---:|---:|
| GIAM10 | 0 | 10% |
| GIAM15 | 200.000 | 15% |
| GIAM20 | 500.000 | 20% |
| GIAM30 | 1.000.000 | 30% |
| GIAM50 | 2.000.000 | 50% |
| NEWS10… | Newsletter record đúng authenticated email, chưa dùng | 10% |

Server vouchers: SAVE10/SAVE20/SAVE30 (10/20/30%, caps 50k/100k/150k,
minimum 50k/100k/200k), FREESHIP (minimum 100k, cap bằng phí ship thực tế),
FLASH50K (minimum 100k, 50k), NEWBIE100 (minimum 300k, 100k, chưa có đơn trước).
Voucher catalog này hết hạn từ 01/01/2027 Asia/Saigon. Chưa hỗ trợ chứng minh điều
kiện VIP/student/birthday, nên các mã đó và localStorage-only codes bị reject.
Mỗi coupon/voucher chỉ dùng một lần/user, unique index enforced trong transaction;
hủy đơn không trả lại quyền dùng mã. Chưa có hệ thống quota chiến dịch toàn cục
hay admin voucher persistence; các giá trị usageLimit/edited vouchers trong browser
không phải contract server và không được dùng để ra quyết định tài chính.

Order, inventory decrement, usage claims, newsletter consumption là một MongoDB
transaction. Lỗi ở bất kỳ bước nào rollback cả đơn, stock và coupon.
Deployment phải dùng MongoDB replica set/Atlas, không dùng standalone cho checkout.
Standalone transaction error → 503 REPLICA_SET_REQUIRED. Test dùng ephemeral
MongoMemoryReplSet, tạo unique indexes trước test; không dọn dữ liệu development.

## Order status và concurrency

Đang xử lý → Đang giao → Đã giao; Đang xử lý → Đã hủy.
Unknown status → 400; skip/backwards/terminal transition → 409. Customer cancel
chỉ đơn của mình, processing, hoàn stock đúng một lần trong transaction.
Order không xóa vật lý qua HTTP (admin nhận 405) để giữ audit record.
Coupon usage vẫn được giữ khi hủy. Scalar/variant stock changes tăng version;
client gửi __v được kiểm tra CAS; stale version → 409. Legacy callers chưa gửi
version vẫn được phép và không có stale-write detection của client.

Đơn lịch sử chưa có `inventoryReserved` được xem là không giữ kho, nên hủy đơn đó
không cộng stock. Không tự sửa các đơn cũ; reservation flag nội bộ không trả trong JSON.
Sản phẩm có reservation trong đơn processing/shipping không xóa được (409).

Email, notifications và closet delivery sync là side effects ngoài transaction đặt
đơn; payment/email/Gemini thật và toàn bộ 3D chưa được xác minh trong giai đoạn này.
