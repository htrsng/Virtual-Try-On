# Ghi chú đổi cấu trúc

Lịch sử Git cũ được giữ nguyên. Đây là việc bảo trì cấu trúc và sửa khả năng chạy, không phải tạo một dự án mới hoặc đổi ngày thực hiện.

| Đường dẫn trước | Đường dẫn hiện tại |
| --- | --- |
| `node_harness/` | `target/` |
| `seed_corpus/` | `data/seeds/` |
| `BaoCaoATPM/` | `docs/specifications/` |
| `supporting-analysis/tools/` | `tools/` |
| `results/` | `evidence/legacy/` |

File JavaScript hỗ trợ dùng kebab-case; mô-đun Python dùng snake_case. Import, tham số bộ chạy và phép tính mã băm nguồn đã được cập nhật. `target/concurrency.js` được khôi phục từ `server/concurrency.js` trong commit lịch sử `e67a7dd`, không thay bằng mô hình giả khác.

Tên, nội dung và mã băm của đặc tả Excel và bằng chứng cũ được giữ nguyên. Những đường dẫn bên trong báo cáo cũ thuộc bố cục trước; xem bảng trên khi đối chiếu. Công cụ chạy lại bằng chứng kiểm tra mã băm và có thể từ chối bằng chứng từ phiên bản trước: đó là hành vi dự kiến, không ép chạy với mã đã đổi.

`docs/archive/` giữ nguyên hướng dẫn và script phục vụ báo cáo lịch sử. Những file này có đường dẫn hoặc thư viện cũ và không được coi là hướng dẫn chạy hiện tại. Lệnh hiện tại nằm trong README và `docs/testing-guide.md`.

File nén `fuzzing-security-testing.rar` bị bỏ khỏi danh sách Git theo dõi vì trùng bản nguồn; có thể tìm lại trong lịch sử Git. Thư viện và kết quả mới không được đưa vào kho mã.
