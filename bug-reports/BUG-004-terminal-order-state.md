# BUG-004 — Đơn đã hủy vẫn chuyển sang đang giao

**Status:** OPEN · **Severity:** High · **Priority:** P1 · **Testcase:** TC-OS-21.
**Nhóm triage:** G08, cùng họ triệu chứng terminal-state với TC-OS-3; chưa chứng minh
hai trường hợp chỉ cần một bản sửa. Target là API/datastore mô phỏng.

## Tái hiện

```sh
python api-testing/run_suite.py --suite full --testcase TC-OS-21
```

Runner đăng nhập user giả, tạo đơn, cập nhật đơn sang `Đã hủy` với version 0 rồi
gửi tiếp `Đang giao` với version 1. Hai bước chuẩn bị phải thành công trước khi
đánh giá terminal-state oracle.

**Expected:** từ chối bước cuối với 400/409/422; state vẫn `Đã hủy`, entity không đổi.
**Actual:** bước cuối HTTP 200; `final_entity.status` thành `Đang giao`.
Oracle `cancelled_terminal` FAIL. Đây là bằng chứng trạng thái sau request trong harness,
khác với chỉ kiểm tra status HTTP.

[Baseline request và state](../reports/baseline/api/evidence/051.json) ·
[Replay state-v1 lượt 1](../reports/state-oracles-v1/replay/evidence/TC-OS-21-1.json) ·
[Replay state-v1 lượt 2](../reports/state-oracles-v1/replay/evidence/TC-OS-21-2.json).

**Hướng sửa đề xuất:** enforce bảng chuyển trạng thái trên server, kết hợp version
để tránh race; retest delivered/canceled terminal, đường hợp lệ và request xung đột.
Chưa sửa target; scenario cố định đang FAIL, chưa có retest sau sửa đạt.
