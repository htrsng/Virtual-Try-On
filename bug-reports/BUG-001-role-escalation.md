# BUG-001 — User tự nâng role qua cập nhật hồ sơ

**Status:** OPEN · **Severity:** High · **Priority:** P0 · **Testcase:** TC-USR-2.
**Target:** node_harness_stub, datastore mô phỏng.

## Tái hiện

Từ repo root đã cài dependency:

```sh
python api-testing/run_suite.py --suite full --testcase TC-USR-2
```

Runner tạo state mới, đăng nhập actor `self`, rồi gửi
`PUT /api/users/{self}` với body `{"role":"admin"}` và token user thường.

**Expected:** HTTP 400/401/403/422 hoặc HTTP 200 với role vẫn là `user`.
**Actual:** HTTP 200, response trả `role: "admin"`; oracle `role_unchanged` FAIL.

**Tác động:** có thể thay đổi đặc quyền qua endpoint cập nhật user trong target.
Baseline trước nâng cấp xác nhận phản hồi cập nhật. Snapshot state-v1 mới xác nhận
đúng user có role trước là `user`, sau là `admin` trong datastore mô phỏng;
chưa có testcase sử dụng đặc quyền vừa đổi trên endpoint tiếp theo hoặc database production.

[State trước/sau mới](../reports/state-oracles-v1/api/evidence/037.json) ·
[Replay mới](../reports/state-oracles-v1/replay/report.md).

[Input, response và oracle đã đo](../reports/baseline/api/evidence/037.json).
Kết quả đúng với snapshot/hash trong [baseline](../reports/baseline/README.md).

**Hướng sửa đề xuất:** whitelist trường cho self-update; chỉ admin có route riêng
để quản trị role. Retest user thường, admin hợp lệ và cập nhật hồ sơ không liên quan.
