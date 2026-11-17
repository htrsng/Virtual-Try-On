# Giai đoạn 2 — findings và retest

Ngày 17/11/2026, input `4caae89`. Source và execution hashes trong evidence folder.
Không có thao tác reset/xóa trên development DB trong các lượt kiểm tra.

| ID | Phân loại / trước | Sửa | Retest |
|---|---|---|---|
| ENV-02 | Source: Playwright config hardcode 3000/5173 và reuseExistingServer=true; có thể vô tình dùng data/server development. Chưa gọi destructive endpoints để chứng minh | Owned replica set, private run DB, random credentials/JWT, port collision refusal, prefix+client+marker guard | 2 runs dùng DB khác nhau; 130 backend tests/run và 6 Playwright tests/run Pass; CLI collision/forged capability refused |
| DATA-03 | Runtime: reset tái tạo product đúng stock nhưng nested variant/size `_id` khác nhau; lifecycle equality assertion Fail | Preserve IDs trong normalizeProductInventory; fixture khai báo identity rõ ràng | Deep product snapshot equality sau mutation/reset Pass; toàn bộ concurrency/checkout regression Pass |
| TEST-03 | Runtime: networkidle timeout dù UI đã render; conditional branches có thể bỏ qua navigation/cart/checkout, route /products chưa tồn tại | Wait domcontentloaded + concrete assertions, dùng seeded product, chọn size/cart item và route /checkout/cart thật | 6/6 Pass hai lần, không skipped; API checkout read-back riêng Pass |
| ENV-03 | Runtime: PowerShell/npm làm mất flags, Jest chạy nhiều replica sets song song; startup hook 5s timeout | Repeat runner dùng Node CLI trực tiếp, startup/teardown timeout riêng, maxWorkers=2; measured repeat serial | Backend 130/130 ×2, không forceExit/leak warning trong final runs |
| ENV-04 | Source: chưa có health endpoint chứng minh API/DB/fixture sẵn sàng, readiness chỉ dựa cổng | health live/ready, Mongo ping, fixture marker, UI proxy + runId checks | Ready 200→503 sau clear→200 sau reset; liveness vẫn200; không trả URI/secrets |

Initial failed logs chỉ dùng để triage, không thay baseline Giai đoạn 0/1 hoặc final
results. “3D assets Pass” chỉ là model references/resource headers, không phải render
visual. CI/Linux, reset khi transaction đang chạy và hard-kill recovery vẫn nằm ngoài
phạm vi verified. Không xem các số test invocations này là coverage của 150 design cases.
