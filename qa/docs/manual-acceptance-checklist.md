# Checklist nghiệm thu thủ công

Trạng thái ban đầu: **Not Run — chờ người dùng thực hiện**. Automation, ảnh đã review
và CSS zoom không thay thế nghiệm thu screen reader, zoom gốc hoặc điện thoại thật.

## Chuẩn bị

Trên máy Windows có Node22, dependencies đã cài theo README, mở terminal tại root:

```powershell
$env:QA_RUN_ID='manual_review'
$env:NODE_ENV='test'
node scripts/qa-environment.cjs start
```

Giữ terminal này chạy, mở `http://127.0.0.1:55173`. Launcher tạo MongoDB, API và
fixtures riêng; không dùng tài khoản thật hoặc database development.

Mở terminal thứ hai tại root để lấy **chỉ tài khoản synthetic**:

```powershell
$qaReview = Get-Content .runtime/qa/manual_review/environment.json -Raw | ConvertFrom-Json
$qaReview.accounts.customer | Format-List
```

Không gửi toàn bộ manifest, password/token hoặc terminal chứa credentials vào report.
Ghi commit bằng `git rev-parse HEAD`, OS, phiên bản browser và NVDA/VoiceOver trước khi chạy.
Mỗi mục ghi **Pass / Fail / Blocked / Not Run**, actual result và tên ảnh/video.

## Sáu mục kiểm tra

| ID | Thao tác | Expected result |
| --- | --- | --- |
| HAND-01 | NVDA + Firefox: mở `/login`, dùng Tab/Shift+Tab qua Email, Mật khẩu, nút hiện/ẩn và submit; thử mật khẩu sai rồi đúng | Đọc đúng tên/role/trạng thái controls; focus nhìn thấy; lỗi được thông báo; sai không tạo session, đúng vào được tài khoản |
| HAND-02 | Bật zoom **200% bằng menu trình duyệt**; kiểm tra login, product50101, cart và checkout; thử Tab/Enter rồi trả về100% | Nội dung và controls vẫn đọc/dùng được, không mất nút chính hoặc phải cuộn ngang cả trang; ảnh chụp gồm mức zoom |
| HAND-03 | NVDA/VoiceOver: thêm QA Cotton Shirt sizeM, mở cart; chọn/bỏ item, thay số lượng, chọn shipping ở checkout | Đọc được tên sản phẩm/size, trạng thái checkbox/radio và giá; cart ghi tạm tính/phí tính khi checkout; checkout phản ánh lựa chọn đúng |
| HAND-04 | Điện thoại thật: portrait và landscape, vào cart/checkout, mở/đóng chat và thử nút thanh toán | Chat không che action checkout; vùng cuộn và controls chạm được; không bị kẹt focus hoặc mất dữ liệu khi đổi hướng |
| HAND-05 | Điện thoại thật: `/try-on?product_id=50101&size=M`, bỏ qua tạo avatar; chọn size, xoay, zoom và reset | Model thực tải được; thao tác cảm ứng phản hồi; size/camera thay đổi đúng; không crash/context loss trong phiên quan sát |
| HAND-06 | VoiceOver + Safari/iOS: đọc heading, product, controls và thông báo quan trọng; kiểm tra dialog avatar bằng bàn phím nếu có | Tên/role rõ ràng, thứ tự hợp lý; focus vào dialog và không thoát ra nền khi dialog đang mở; đóng dialog trả về vị trí hợp lý |

**Điện thoại cần URL test truy cập được từ thiết bị.** `127.0.0.1` trên điện thoại
không phải máy chạy launcher. Nếu chưa có môi trường test LAN/deploy được cấu hình
và cho phép truy cập, ghi HAND-04/05/06 **Blocked**; không mở QA server ra mạng công
khai hoặc dùng production để thay thế. Phần desktop/NVDA có thể chạy ngay trên localhost.

## Ghi kết quả và dọn dữ liệu

Điền [execution template](manual-acceptance-results.csv). Khi Fail, ghi URL, steps,
expected/actual, browser/device, source SHA và bằng chứng không chứa credentials.
Không đánh dấu Pass chỉ vì automation đã Pass. Gemini/email/payment provider không
nằm trong phiên nghiệm thu này; social login/recovery hiện chưa triển khai.

Khi xong, ở terminal thứ hai:

```powershell
$env:QA_RUN_ID='manual_review'
node scripts/qa-environment.cjs stop
```

Launcher dừng các dịch vụ do nó sở hữu và scrub manifest. Không xóa/reset database khác.
