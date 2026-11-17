# Giai đoạn 5 — Selenium Automation Framework

Phạm vi Development: thêm launcher kết nối môi trường QA đã có, Java framework,
Maven/TestNG và CI job. Không sửa business logic ứng dụng. Phạm vi QA: smoke UI,
data-driven negative login, kiểm chứng failure evidence và dọn môi trường.

## Kiến trúc

`qa/selenium-java/`: `pom.xml`, `testng.xml`, README, `src/test/java/com/vfitai/qa/`.
`base/` chỉ quản lý lifecycle; `pages/` đóng gói Login, Product, Cart, Checkout;
`utils/` cấu hình WebDriver và điều khiển QA; `tests/` chứa assertions và data provider.
Không tạo component giả hoặc thư mục rỗng. Playwright giữ nguyên vị trí `tests/`.

Mỗi method/data row reset fixture riêng, tạo browser mới và clear dữ liệu sau test.
Không dùng retry suite, implicit wait hoặc `Thread.sleep`. Click sử dụng explicit
wait, cuộn tức thời và tìm lại phần tử khi DOM thay đổi; thao tác vẫn là native
WebDriver click. Login chờ full document reload hiện có của ứng dụng trước khi
chuyển sang bước tiếp theo. Không inject token để thay thế UI login.

## Bài học theo mức

1. Java Core/OOP: đọc `DriverFactory`, constructor và field của Page Objects;
   phân biệt dữ liệu mỗi instance với mutable static state.
2. Maven/Selenium: chạy catalog group, đọc locator và WebDriverWait trong BasePage.
3. TestNG: chạy auth group, đối chiếu hai DataProvider rows với báo cáo; xem
   BeforeMethod/AfterMethod và `alwaysRun` khi assertion thất bại.
4. POM/advanced: đọc checkout flow, mở failure screenshot, thay browser/headless;
   thêm một case dựa trên chức năng thật và giữ assertions trong test.

## Giới hạn

Checkout dừng ở selected-item summary, chưa submit đơn/payment qua UI. Suite không
chứng minh RBAC, visual hoặc render 3D. Hai password rows là hai lượt chạy của
một negative scenario, không đếm thành hai chức năng khác nhau. Target 150 cases
vẫn là backlog, không tự đánh dấu hoàn thành.

Job Selenium mới dùng Ubuntu 24.04, Java 17, Chrome, Node 22 và upload báo cáo/PNG
14 ngày. Trạng thái CI phải xác minh bằng run thật sau PR/main; local Pass không
đồng nghĩa GitHub CI Pass. Các TypeScript/lint failures từ audit giai đoạn 4 vẫn
là backlog riêng.

Xem [README framework](../selenium-java/README.md) để cài từ clone sạch, chạy groups,
browser và intentional diagnostic probe.

## Kết quả ngày 17/11/2026

Windows 11 x64; Node 22.15.0, npm 11.3.0, Java 17.0.12, Maven 3.9.10,
MongoDB 8.2.6. Selenium 4.38.0, TestNG 7.11.0, Surefire 3.5.4.

| Run | Browser | Kết quả |
| --- | --- | --- |
| Edge repeat 1 | Edge / matching driver 157.0.4341.60, headless | 5 Pass, 0 Fail, 0 Skip |
| Edge repeat 2 | Edge / matching driver 157.0.4341.60, headless | 5 Pass, 0 Fail, 0 Skip |
| Chrome configuration | Chromium 148.0.7778.96 qua ChromeDriver, headless | 5 Pass; Maven/launcher exit 0 |
| Clean-source installation | Cùng Chromium; export 758 source files, npm ci cả hai packages | 5 Pass; exit 0 |
| Final-source smoke | Edge 157.0.4341.60 | 5 Pass; exit 0; cleanup verified |
| Diagnostics riêng | Edge, intentional assertion failure | 1 expected Fail; exit 1; screenshot có nội dung |

Mỗi suite dùng run ID và database mới. Kiểm tra cuối xác nhận manifest stopped,
không còn accounts/token, API/UI ports được giải phóng; reset count là 6 cho một
suite 5 invocations (bao gồm seed khởi động). Clean-source dùng Maven cache,
MongoDB binary và browser đã cài trên máy này; đây không phải thử nghiệm trên máy
vật lý/OS mới. Dependency installation được thực hiện lại từ lockfiles.

Hai lần thử đầu có 4 Pass / 1 Fail: click bị chặn khi cuộn trang (đầu tiên ở
catalog link, tiếp theo ở size M). Phân loại **Test Defect**: thiếu đồng bộ thao
tác scroll/click. Sửa helper click dùng scroll instant và explicit wait cho mọi
thao tác, đồng thời chờ document reload sau login. Hai lần Edge Pass liên tiếp
là retest; không ghi các lỗi này thành lỗ hổng ứng dụng.

Selenium phát cảnh báo thiếu CDP binding cho browser 148/157; suite không dùng
CDP và WebDriver assertions đều Pass. npm ci vẫn cảnh báo dependency audit kế
thừa: server 23, client 27 vulnerabilities theo output npm tại thời điểm chạy; chưa kiểm chứng khả
năng khai thác và chưa nâng dependencies trong phạm vi framework này.

Evidence mẫu: [summary JSON](../evidence/stage5-2026-11-17/summary.json),
[failure PNG](../evidence/stage5-2026-11-17/failure-probe.png).
XML/HTML/log đầy đủ nằm trong `.runtime/stage5/` và Maven `target/`, được ignore.
Source hashes đi kèm summary để đối chiếu framework đã bàn giao. CI job mới chưa
có run GitHub được xác minh; không gộp kết quả local vào trạng thái CI.
