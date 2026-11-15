# Manual functional test cases

Tất cả testcase dưới đây có trạng thái **NOT_RUN**, chưa có actual result. Bước và
expected là thiết kế, không phải kết luận thực nghiệm. Môi trường khi chạy phải có
UI và API contract phù hợp; reset dữ liệu giả trước mỗi testcase độc lập.

| ID | Yêu cầu / ưu tiên | Tiền điều kiện và dữ liệu | Bước thực hiện | Kết quả mong đợi |
|---|---|---|---|---|
| MAN-01 | QA-AUTH / P1 | User giả hợp lệ; chưa đăng nhập | Mở đăng nhập; nhập email/password hợp lệ; submit | Có trạng thái đăng nhập; truy cập hồ sơ của đúng user; không hiển thị password/token |
| MAN-02 | QA-AUTH / P1 | Chưa đăng nhập | Để trống email/password; submit; lặp lại với chỉ email | Báo trường thiếu; không tạo phiên đăng nhập |
| MAN-03 | QA-AUTH / P1 | User giả tồn tại | Nhập sai password; submit | Báo lỗi đăng nhập; không vào trang bảo vệ; không làm lộ password |
| MAN-04 | QA-ORDER / P1 | Catalog có sản phẩm và size còn hàng | Mở chi tiết; chọn size/màu; thêm giỏ | Giỏ có đúng product/size/màu, giá và số lượng 1 |
| MAN-05 | QA-ORDER / P1 | Giỏ có một item giá 200000, không có phí/giảm giá | Đổi quantity 1 → 2; thử 0 và -1 | Qty 2 cho subtotal 400000; quantity không hợp lệ bị chặn hoặc xử lý theo quy tắc đã công bố, không thành đơn âm |
| MAN-06 | QA-ORDER / P1 | Giỏ có hàng | Checkout; bỏ trống tên/điện thoại/địa chỉ; submit | Báo thiếu trường; không tạo đơn; sửa được từng trường |
| MAN-07 | QA-ORDER / P0 | User đăng nhập, catalog ổn định, địa chỉ giả hợp lệ | Checkout với 2 item giá 200000; xác nhận; mở chi tiết đơn | Đúng owner, product, quantity và tổng theo catalog/phí đã công bố; giỏ và trạng thái xác nhận nhất quán |
| MAN-08 | QA-STATE / P1 | Admin giả; đơn đã giao hoặc đã hủy | Mở quản trị đơn; thử đưa đơn về đang xử lý/đang giao | Chặn chuyển ngược trạng thái cuối; dữ liệu sau refresh giữ trạng thái cuối |
| MAN-09 | QA-USER / P0 | User A đăng nhập; user B tồn tại | Thử mở/sửa hồ sơ B bằng URL hoặc request từ UI; refresh | Không đọc/sửa trái phép; dữ liệu B không đổi. Ghi rõ thao tác UI và API nếu phối hợp DevTools |
| MAN-10 | QA-PRODUCT / P0 | User thường đăng nhập | Truy cập màn tạo/sửa product; thử gửi thay đổi giá | Không có quyền thao tác quản trị; API từ chối, catalog không đổi |
| MAN-11 | QA-SIZE / P1 | Size chart: M chest 86–90, waist 70–74 | Đặt số đo lần lượt ở cận dưới và trên; xem size gợi ý | Cận được chấp nhận; M được gợi ý và fit score nhất quán với unit test trong cùng chart |
| MAN-12 | QA-SIZE / P1 | Có profile đã lưu | Mở thử đồ; chỉnh số đo; hủy rồi mở lại | Hủy không ghi đè profile đã lưu; UI không crash. Cần kiểm tra riêng WebGL thực, chưa suy ra từ unit test |

MAN-11 cần fixture chart đúng như đã nêu; không lấy chart khác để gán kết quả.
Ảnh minh họa cũ trong archive không phải bằng chứng cho các testcase này.
