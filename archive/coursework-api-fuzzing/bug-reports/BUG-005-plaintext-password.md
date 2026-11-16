# BUG-005 — Password cập nhật được lưu dạng rõ

**Status:** OPEN · **Severity:** High · **Priority:** P0 · **Testcase:** TC-USR-4.
**Nhóm triage:** G16. Target/datastore là mô phỏng; chỉ dùng password test giả.

## Tái hiện

```sh
python api-testing/run_suite.py --suite full --testcase TC-USR-4
```

Runner đăng nhập actor admin, cập nhật password của `victim` bằng `PlaintextProbe!`,
sau đó đọc record trong datastore của harness để kiểm tra cách lưu.

**Expected:** HTTP 200; dữ liệu lưu là bcrypt, xác minh được bằng password mới,
và không bằng chuỗi plaintext.
**Actual:** HTTP 200; `password_audit` trả `is_bcrypt: false`, `verifies: false`,
`equals_plaintext: true`. Oracle `password` FAIL.

[Baseline response và audit](../reports/baseline/api/evidence/039.json) ·
[Replay state-v1 lượt 1](../reports/state-oracles-v1/replay/evidence/TC-USR-4-1.json) ·
[Replay state-v1 lượt 2](../reports/state-oracles-v1/replay/evidence/TC-USR-4-2.json).

**Tác động:** password update trong mô hình không giữ bất biến lưu hash; không
suy ra dữ liệu password của một MongoDB hoặc production backend thực tế.

**Hướng sửa đề xuất:** hash trong đường cập nhật password trước khi lưu; không để
mass assignment bypass bước đó. Retest đăng nhập với password mới/cũ, các trường
hồ sơ không liên quan và xử lý quyền. Chưa sửa target hoặc xác nhận retest đạt.
