# Manual testing

[12 testcase chức năng](test-cases.md) được thiết kế cho UI của VFitAI gốc, theo
luồng đăng nhập, giỏ hàng, checkout, đơn, user, product và size recommendation.

Hiện tất cả là **NOT_RUN**. Để thực thi cần frontend trong `archive/vfitai/client/`
và backend hoặc mock API có contract được ghi rõ. Không dùng API harness để tuyên bố
đã kiểm thử E2E UI. Mã Playwright cũ trong archive chưa được tính là automation đạt.

Khi chạy, tạo execution record mới với ngày, build/commit, môi trường, actual result,
PASS/FAIL/BLOCKED và ảnh hoặc trace; không sửa expected result để khớp lỗi hiện có.
NOT_RUN là chưa thử; BLOCKED chỉ dùng khi đã thử nhưng không đủ điều kiện thực hiện.
