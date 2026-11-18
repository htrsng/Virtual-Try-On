# Chạy Selenium cho VFitAI

Bộ test dùng Selenium 4.38.0, TestNG 7.11.0, Java 17, Maven 3.9+, Node.js 22 và Chrome hoặc Edge. Selenium Manager tìm driver phù hợp với trình duyệt. Lần chạy đầu có thể cần mạng để tải driver, các gói Maven hoặc MongoDB.

Chạy từ thư mục gốc:

```sh
npm ci --prefix server
npm ci --prefix client
node scripts/qa-selenium.cjs -Dbrowser=chrome -Dgroups=smoke
```

Đổi thành `-Dbrowser=edge` để chạy Edge, hoặc thêm `-Dheadless=false` để xem browser thao tác. Nếu browser cài ngoài vị trí mặc định, đặt `SELENIUM_BROWSER_BINARY` trỏ đến tệp thực thi.

## Chọn nhóm test

| Nhóm | Nội dung |
| --- | --- |
| `smoke` | 5 lượt chạy. Kiểm tra đăng nhập đúng/sai, mở sản phẩm và đưa mặt hàng đã chọn tới checkout. |
| `e2e` | Kiểm tra đặt COD, tổng tiền, tồn kho, coupon, trạng thái đơn, quyền truy cập và thao tác giỏ hàng. |
| `regression` | Chạy cả smoke và các ca nghiệp vụ, tổng cộng 22 lượt theo cấu hình hiện tại. |

Ví dụ chạy đầy đủ: `node scripts/qa-selenium.cjs -Dbrowser=chrome -Dgroups=regression`. CI chạy smoke trên PR. Workflow hồi quy đầy đủ chạy theo lịch hoặc khi kích hoạt thủ công. [Danh sách ca nghiệp vụ](../docs/e2e-test-cases.csv).

## Môi trường và báo cáo

Launcher tự mở MongoDB replica set, API và giao diện, đợi dịch vụ sẵn sàng rồi chạy TestNG. Mỗi ca có WebDriver mới và dữ liệu mẫu được đặt lại. Launcher dừng các dịch vụ sau khi Maven kết thúc. Nếu chạy đồng thời với Playwright, đặt `QA_API_PORT` và `QA_UI_PORT` thành hai cổng trống khác với cặp mặc định `3300` và `55173`. Có thể đặt `MONGOMS_SYSTEM_BINARY` để dùng bản `mongod` tương thích đã cài. [Hướng dẫn cấu hình môi trường](../docs/environment-setup.md).

Tìm báo cáo Maven/TestNG trong `qa/selenium-java/target/surefire-reports/`, ảnh lỗi trong `qa/selenium-java/target/screenshots/` và log reset trong `qa/selenium-java/target/qa-control.log`. Sao chép bằng chứng cần giữ trước lượt chạy mới. Giữ manifest chứa tài khoản mẫu trong `.runtime/qa/` ở máy local.

Nhóm `diagnostics` cố tình làm một ca thất bại để kiểm tra việc chụp ảnh và dọn môi trường. Kết quả dự kiến là mã thoát khác 0 và có ảnh lỗi.

## Khi thêm ca mới

Đặt thao tác UI dùng lại trong Page Object và để assertion nghiệp vụ trong test. Chờ theo điều kiện như nút khả dụng, nội dung xuất hiện hoặc chuyển trang. Giữ các phương thức TestNG và DataProvider chạy tuần tự khi chúng cùng dùng thao tác reset trên một database.

## Tìm bài test và kết quả

Trong `src/test/java/com/vfitai/qa/`, thư mục `tests/` chứa kịch bản, `pages/` chứa Page Objects, còn `base/` và `utils/` quản lý browser và môi trường. Đợt chạy local ngày 18/11/2026 ghi 22/22 lượt hồi quy đạt. [Báo cáo QA](../docs/test-summary.md).
