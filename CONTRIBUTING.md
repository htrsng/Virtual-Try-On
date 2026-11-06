# Quy ước đóng góp

## Ngôn ngữ và tên file

- Tài liệu hướng dẫn đang duy trì dùng tiếng Việt; giữ các thuật ngữ kỹ thuật khi cần chính xác.
- Tên thư mục, file, hàm và biến dùng tiếng Anh. Thư mục và tài liệu mới dùng kebab-case, trừ tên chuẩn như README.md.
- File JavaScript hỗ trợ dùng kebab-case; thành phần React dùng PascalCase; mô-đun Python dùng snake_case.
- Không đổi tên trường API hoặc chuỗi nghiệp vụ chỉ để đồng bộ ngôn ngữ vì có thể thay đổi giao tiếp và kỳ vọng kiểm thử.
- Tài liệu, báo cáo học tập và bằng chứng lịch sử giữ nguyên tên để đối chiếu. Ngoại lệ này được ghi trong tài liệu đổi cấu trúc.

## Thay đổi mã nguồn

- Khi di chuyển file, cập nhật import, lệnh chạy, workflow và liên kết tài liệu.
- Chạy các kiểm tra liên quan trước khi đẩy mã. Không coi test rỗng hoặc chỉ mở trang là kiểm chứng chức năng.
- Người đóng góp cần giải thích được mã và giới hạn của thay đổi, kể cả khi có AI hỗ trợ.

## Bằng chứng

- Ghi lệnh chạy, môi trường, phiên bản và phạm vi khi đưa kết quả vào repo.
- Không tự gán trạng thái đạt, không cộng các quan sát trùng thành số lỗi độc lập.
- Giữ nguyên dữ liệu lịch sử; tạo lần chạy mới để phản ánh mã mới.
- Không đưa node_modules, môi trường Python, thông tin đăng nhập dịch vụ hay file tạm vào Git.
