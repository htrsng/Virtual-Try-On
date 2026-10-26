"""Tạo báo cáo fuzzing hệ thống bán hàng từ đợt kiểm thử được chỉ định."""
import argparse
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]


# Chuyển kết quả đã chạy thành nội dung báo cáo Markdown.
def render_report(data, comparison=None):
    lines = ["# Phương pháp kiểm thử theo fuzzing cho hệ thống bán hàng", "",
        "Bản thảo kỹ thuật từ bằng chứng thực thi; cần dàn trang và bổ sung thông tin sinh viên trước khi nộp.",
             "",
        "## 1. Mục tiêu và phạm vi", "",
        "Kiểm tra đăng nhập, tạo đơn, trạng thái đơn, người dùng và sản phẩm. "
        "Chuỗi thực hiện: đặc tả/ràng buộc → seed và mutation → request API → oracle → bằng chứng.",
             "",
        "## 2. Hệ thống và phương pháp", "",
        f"Môi trường lần chạy: `{data['environment']}`. Thời điểm UTC: `{data['created_utc']}`. Seed: `{data['random_seed']}`.",
             "",
        "Mỗi scenario chạy trong tiến trình cô lập và có dữ liệu test riêng. "
        "Các bước trong cùng scenario giữ trạng thái. "
        "Oracle kiểm tra mã HTTP, catalog, dữ liệu lưu, quyền và vòng đời đơn. "
        "FAIL là vi phạm oracle trên mẫu đã thử; ERROR là lỗi chuẩn bị/chạy/đánh giá, không tự coi là lỗi ứng dụng.",
             "",
        "## 3. Kết quả", "",
        f"Scenario đã chạy: {len(data['executions'])}. Theo testcase API: " +
        ", ".join(f"{k}={v}" for k, v in data['counts'].items()) + ".", "",
        f"Có {data.get('excluded_testcase_count',
             0)} testcase ngoài phạm vi API, "
        "được ghi riêng trong excluded_testcases.json; không tính vào số test đạt hoặc lỗi bán hàng.",
             "",
        "| Testcase | Nội dung | Kết quả | Scenario |", "|---|---|---|---|"]
    for entry in data["traceability"]:
        tc = entry["testcase"]
        lines.append(f"| {tc['ID']} | {tc['TieuDe']} | {entry['status']} | {entry['executions']} |")
    lines += ["", "### Bằng chứng vi phạm", ""]
    for group in data["finding_groups"]:
        runs = [r for r in data["executions"] if r["case"]["id"] in group["case_ids"]]
        lines += [f"#### {group['testcase']}", "",
            "Scenario: " + ", ".join(f"`{r['case']['id']}`" for r in runs) + ".", "",
            "Oracle: `" + json.dumps(runs[0]["case"]["check"], ensure_ascii=False) + "`.", "",
            "Chuỗi HTTP ở mẫu đầu: " + " → ".join(str(o["status"]) for o in runs[0]["evidence"]["observations"]) + ". "
            "Input đầy đủ, thứ tự thao tác và dữ liệu sau chạy ở report.json/generated_cases.json. "
            "Nhóm theo testcase chưa phải số nguyên nhân lỗi duy nhất.", ""]
    if comparison is not None:
        if comparison["environment"] != data["environment"]:
            raise ValueError("Comparison and campaign environments differ; do not combine their results")
        lines += ["### So sánh chọn input", "",
            "Cùng target/ngân sách/seed và môi trường. Baseline không dùng coverage để chọn input. "
            "Đây là so sánh chiến lược trên cùng harness, không phải benchmark mạng hoặc bằng chứng ưu thế thống kê.",
                 "",
            "| Chế độ | Seed | Input | Giây | Dòng index.js duy nhất | Lượt vi phạm |",
                 "|---|---|---|---|---|---|"]
        for run in comparison["runs"]:
            lines.append(f"| {run['mode']} | {run['seed']} | {run['iterations']} | {run['elapsed_seconds']:.2f} | "
                f"{run['unique_index_lines']} | {run['finding_occurrences']} |")
        lines += [""]
    lines += ["## 4. Hạn chế", ""] + ["- " + text for text in data["limitations"]]
    lines += ["", "## 5. Kết luận và tái hiện", "",
        "Kết luận giới hạn trong các scenario và môi trường đã ghi. Không suy ra mọi yêu cầu đều đạt, "
        "không suy ra không còn lỗi từ tỷ lệ lỗi bằng 0 trên mẫu hữu hạn. "
        "Các số liệu lịch sử trong thư mục khác không tự động nhập vào báo cáo này.", "",
        "README.md ghi lệnh chạy; spec_snapshot.json và source_sha256 trong report.json xác định nguồn. "
        "Tài liệu nộp cuối cần trích dẫn công cụ/tài liệu đã sử dụng và ghi rõ phần AI hỗ trợ."]
    return "\n".join(lines) + "\n"


# Đọc tham số dòng lệnh và bắt đầu chạy chương trình.
def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--campaign",
         type=Path,
         default=ROOT / "results/sales_campaign/report.json")
    parser.add_argument("--comparison",
         type=Path,
         help="Explicitly include a comparison from the same backend")
    parser.add_argument("--output", type=Path)
    args = parser.parse_args()
    data = json.loads(args.campaign.read_text(encoding="utf-8"))
    comparison = json.loads(args.comparison.read_text(encoding="utf-8")) if args.comparison else None
    output = args.output or args.campaign.parent / "BaoCao_Fuzzing.md"
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(render_report(data, comparison), encoding="utf-8")
    print(output)


if __name__ == "__main__":
    main()
