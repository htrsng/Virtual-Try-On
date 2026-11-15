# QA test plan

Test plan được duy trì một nơi tại [docs/test-plan.md](../docs/test-plan.md), gồm
phạm vi, risk matrix, kỹ thuật thiết kế, entry/exit criteria và vòng đời bug.
Trang này là điểm truy cập từ QA hub, không sao chép một bản kế hoạch dễ lệch nội dung.

## Hai phạm vi độc lập

1. **API mô phỏng:** acceptance, replay và fuzzing dùng `fuzz-testing/target/`.
   Các dịch vụ ngoài và datastore production không được dùng.
2. **Frontend gốc:** 14 unit cho hai hàm logic; 14 component check trong jsdom với
   context/preview mock có khai báo. Không có liên kết end-to-end tới target API.

## Nhiệm vụ từng thư mục test

| Đường dẫn | Nhiệm vụ | Không được diễn giải thành |
|---|---|---|
| `fuzz-testing/tests/` | 34 regression test công cụ, oracle và điều phối | 34 ca nghiệp vụ PASS |
| `api-testing/tests/` | 9 test reporting/replay contract hiện hành | 9 testcase API PASS |
| `api-testing/run_suite.py` | Chạy 29 API testcase / 51 scenario cố định | Bao phủ hết 134 ca Excel |
| `automation-testing/tests/` | 14 unit logic import TypeScript thật | UI/React/WebGL E2E |
| `archive/vfitai/client/src/components/*.test.jsx` | ProductList và Toast trong suite component riêng | Tất cả frontend test đạt |
| `archive/vfitai/client/src/features/virtual-tryon/VirtualTryOn.test.tsx` | Test integration 3D cũ, chưa thuộc component suite | Test đã chạy đạt hoặc WebGL thực |
| `archive/vfitai/tests/` | Playwright cũ, chưa đủ backend | Browser E2E đã xác minh |

Các đường dẫn cũ `tests/` và `fuzzing-security-testing/tests/` đã được chuyển vào
archive và `fuzz-testing/tests/`. Xem [migration](../fuzz-testing/docs/migration.md).
