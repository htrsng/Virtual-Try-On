# VFitAI QA Portfolio

Dự án kiểm thử phần mềm phát triển từ ứng dụng bán hàng và thử đồ VFitAI:
thiết kế testcase, kiểm thử API, unit automation, fuzzing và báo cáo lỗi có bằng chứng.
API chạy trên Express với datastore mô phỏng; unit test chạy trực tiếp mã TypeScript
của ứng dụng gốc. Không cần dịch vụ production.

**Công nghệ:** Python · Node.js/Express · node:test · unittest · Z3 · JUnit XML · GitHub Actions.

## Bắt đầu xem dự án

| Phần | Nội dung |
|---|---|
| [Test plan](docs/test-plan.md) | Phạm vi, rủi ro, chiến lược, điều kiện chạy và kết thúc |
| [Manual testing](manual-testing/README.md) | 12 testcase UI được thiết kế; hiện NOT_RUN |
| [API testing](api-testing/README.md) | 29 testcase, 51 scenario cố định; input, oracle và state/response |
| [Unit automation](automation-testing/README.md) | 14 test cho gợi ý size và xử lý request timeout |
| [Fuzz testing](fuzz-testing/README.md) | Mutation HTTP, greybox line coverage và concolic Z3 giới hạn |
| [Bug reports](bug-reports/README.md) | Expected/actual, severity, tái hiện và bằng chứng |
| [Báo cáo](reports/README.md) | JSON, Markdown, JUnit và snapshot chọn lọc |

[Ma trận traceability](docs/traceability.md) · [Mô tả dùng cho CV](docs/cv.md).

## Cài và chạy

CI dùng Python 3.12, Node.js 24 và npm. Từ repo root:

```sh
python -m pip install -r requirements.txt
npm ci --prefix fuzz-testing/target
python tools/run_checks.py --suite smoke
```

Smoke chạy unit ứng dụng, regression của công cụ và bốn đối chứng API. Để kiểm tra
đủ 51 scenario API cùng một campaign fuzzing ngắn có Z3:

```sh
python tools/run_checks.py --suite full
```

Kết quả mới ở `reports/runs/<id>/summary.md`; report API và JUnit nằm cùng lần chạy.
Full suite trả exit 1 khi target vi phạm yêu cầu; exit 2 nếu có lỗi runner hoặc ca
chưa chạy. Không đổi FAIL thành PASS để làm xanh CI. Fuzz runner hoàn tất vẫn có
thể phát hiện lỗi; xem report từng bước.

## Bằng chứng và giới hạn

[Baseline đã chạy](reports/baseline/README.md) ghi riêng số testcase, scenario,
unit test và test hạ tầng. Các bug vẫn OPEN đến khi sửa target và retest đạt.
Workflow **QA Portfolio Checks** chạy smoke trên PR; có thể chọn full bằng
`workflow_dispatch`. Trạng thái GitHub Actions chỉ có sau khi push và workflow chạy.

Target API mô phỏng và hai hàm unit không đại diện cho ứng dụng production hay
browser E2E. 105 testcase Excel ngoài campaign API và 12 testcase UI chưa được gán PASS.
Mã web/E2E cũ ở [archive/](archive/README.md); lịch sử Git và bằng chứng cũ được giữ.

[Quy ước đóng góp](CONTRIBUTING.md) · [MIT](LICENSE)
