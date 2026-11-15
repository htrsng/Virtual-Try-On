# BUG-003 — Cập nhật user khác khi không xác thực

**Status:** OPEN · **Severity:** High · **Priority:** P0 · **Testcase:** TC-USR-1.
**Target:** node_harness_stub, datastore mô phỏng.

## Tái hiện

```sh
python api-testing/run_suite.py --suite full --testcase TC-USR-1
```

Runner chuẩn bị user `victim`, rồi gửi
`PUT /api/users/{victim}` với body `{"fullName":"Fuzz probe"}` và không có token.
Một scenario khác của cùng testcase dùng token user thường để kiểm tra actor khác.

**Expected:** HTTP 401 hoặc 403, không cho cập nhật trái phép.
**Actual:** scenario anonymous trả HTTP 200 và response chứa tên `Fuzz probe`.
Oracle quyền truy cập FAIL; request đo được có `actor: null`.

**Tác động:** endpoint cho phép thao tác user không có kiểm tra xác thực phù hợp.
Bằng chứng này xác nhận request/response, chưa phải xác nhận toàn bộ hệ thống phân quyền.

[Request không token và response](../reports/baseline/api/evidence/035.json).
[Baseline và source hash](../reports/baseline/README.md).

**Hướng sửa đề xuất:** bắt buộc authentication; kiểm tra owner hoặc admin trước
khi cập nhật. Retest anonymous, self, user khác và admin với xác minh dữ liệu sau request.
