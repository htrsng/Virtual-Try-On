# BUG-002 — Chấp nhận giá và tổng tiền từ client trái catalog

**Status:** OPEN · **Severity:** High · **Priority:** P0 · **Testcase:** TC-ORD-18.
**Target:** node_harness_stub, datastore mô phỏng.

## Tái hiện

```sh
python api-testing/run_suite.py --suite full --testcase TC-ORD-18
```

Runner đăng nhập user giả rồi gửi `POST /api/orders` với productId 1, quantity 2,
đơn giá client 1, `totalAmount: 2`; phí và giảm giá bằng 0. Catalog seed có đơn giá
200000 cho product này.

**Expected:** từ chối HTTP 400/422 hoặc trả tổng tính theo catalog là 400000.
**Actual:** HTTP 200, order response có đơn giá 1 và `totalAmount: 2`;
oracle `catalog_total` FAIL.

**Tác động:** tính toàn vẹn số tiền đơn bị phá vỡ ở response API. Chưa có thanh toán
thật hoặc bằng chứng tổn thất tài chính thực tế.

State-v1 xác nhận order thực sự được tạo với total `2`, không chỉ response trả giá
trị đó: [catalog và state trước/sau](../reports/state-oracles-v1/api/evidence/049.json).
[Replay mới](../reports/state-oracles-v1/replay/report.md). Target chưa được sửa.

[Catalog, request và response](../reports/baseline/api/evidence/049.json).
[Baseline và source hash](../reports/baseline/README.md).

**Hướng sửa đề xuất:** tra giá từ catalog, tính tổng ở server, kiểm tra quantity,
phí và điều kiện giảm giá. Retest ca giả mạo và đối chứng hợp lệ TC-ORD-19.
