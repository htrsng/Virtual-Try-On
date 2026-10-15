"""Kiểm thử API bán hàng: Excel → kịch bản tái hiện được → harness mô phỏng → bằng chứng.

PASS/FAIL đánh giá các kịch bản API đã thực thi. Lỗi hạ tầng được ghi là ERROR.
Các ví dụ minh họa C/Python/SMT được tách khỏi kết quả kiểm thử ứng dụng.
"""
from __future__ import annotations
import argparse
from collections import Counter
from datetime import datetime, timezone
import hashlib
import json
from pathlib import Path
import sys
import time

from openpyxl import load_workbook
from testcases import scenarios
from oracles import evaluate
from runtime import ENVIRONMENT, ROOT, HarnessError, run_node, write_json


# Đọc Excel gốc và lưu mã băm để truy vết đặc tả.
def read_specs():
    specs = []
    for path in sorted((ROOT / "BaoCaoATPM").glob("Module_*_spec.xlsx")):
        workbook = load_workbook(path, read_only=True, data_only=True)
        try:
            sheets = {}
            for sheet in workbook:
                rows = list(sheet.values)
                if not rows:
                    continue
                sheets[sheet.title] = [dict(zip(rows[0],
                     row)) for row in rows[1:] if row[0] is not None]
            specs.append({"file": path.name,
                 "sha256": hashlib.sha256(path.read_bytes()).hexdigest(),
                 "sheets": sheets})
        finally:
            workbook.close()
    if not specs:
        raise ValueError("No original Excel specifications found")
    return specs


# Tách ví dụ C/Python khỏi phạm vi testcase API bán hàng.
def application_cases(specs):
    """Separate explicit generated-fixture tests without discarding source records."""
    included, excluded = [], []
    for spec in specs:
        for tc in spec["sheets"]["TestCase"]:
            entry = {"spec": spec["file"], "testcase": tc}
            if any(label in tc["TieuDe"] for label in ("Hàm sinh mã C",
                 "Hàm Python",
                 "Kiểm tra tràn số")):
                excluded.append({**entry,
                     "reason": "Generated educational fixture, outside sales API scope"})
            else:
                included.append(entry)
    return included, excluded


# Chạy kịch bản và phân biệt vi phạm yêu cầu với lỗi bộ chạy.
def execute(case, timeout=35):
    start = time.monotonic()
    try:
        result = run_node("scenario_runner.js", case, timeout)
        return {"case": case, "status": "PASS" if evaluate(case, result) else "FAIL",
            "evidence": result, "elapsed_seconds": time.monotonic() - start}
    except (HarnessError, ValueError, KeyError, TypeError) as error:
        return {"case": case, "status": "ERROR", "error": str(error),
            "error_kind": getattr(error, "kind", "ORACLE_ERROR"),
            "elapsed_seconds": time.monotonic() - start}


# Gom các kịch bản thành trạng thái của từng testcase Excel.
def build_report(specs, results, planned_cases=None):
    entries = []
    plans = {}
    for plan in planned_cases or []:
        plans.setdefault(plan["testcase"], set()).add(plan["id"])
    grouped = {}
    for result in results:
        grouped.setdefault(result["case"]["testcase"], []).append(result)
    for entry in application_cases(specs)[0]:
        tc = entry["testcase"]
        matches = grouped.get(tc["ID"], [])
        counts = Counter(r["status"] for r in matches)
        if matches:
            missing = plans.get(tc["ID"], set()) - {r["case"]["id"] for r in matches}
            # Ưu tiên lỗi bộ chạy, rồi vi phạm yêu cầu, rồi thiếu kịch bản.
            if counts["ERROR"]:
                state = "ERROR"
            elif counts["FAIL"]:
                state = "FAIL"
            elif missing:
                state = "PARTIAL"
            else:
                state = "PASS"
        else:
            state = "NOT_RUN" if tc["ID"] in plans else "NOT_IMPLEMENTED"
        entries.append({**entry, "status": state, "executions": len(matches),
            "case_ids": [r["case"]["id"] for r in matches],
            "gap_reason": "No executable API plan" if state == "NOT_IMPLEMENTED" else None})
    return entries


def write_report(output, summary):
    output.mkdir(parents=True, exist_ok=True)
    write_json(output / "report.json", summary)
    lines = ["# Sales API fuzzing campaign",
         "",
         f"Environment: `{summary['environment']}`; seed: {summary['random_seed']}.",
        "",
             "PASS/FAIL apply only to executed API scenarios. ERROR is a setup/runner/oracle failure.",
        "Generated memory/SMT fixtures are excluded from these counts; see excluded_testcases.json.",
             "",
        "| Testcase | Title | Status | Executions |", "|---|---|---|---|"]
    for entry in summary["traceability"]:
        tc = entry["testcase"]
        lines.append(f"| {tc['ID']} | {tc['TieuDe']} | {entry['status']} | {entry['executions']} |")
    lines += ["", "## Limitations", ""] + ["- " + text for text in summary["limitations"]]
    (output / "report.md").write_text("\n".join(lines) + "\n", encoding="utf-8")


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--audit-only", action="store_true")
    parser.add_argument("--testcase", action="append", help="Run only this API TC-ID; repeatable")
    parser.add_argument("--seed", type=int, default=7)
    parser.add_argument("--fuzz-cases", type=int, default=8)
    parser.add_argument("--output", type=Path, default=ROOT / "results" / "sales_campaign")
    args = parser.parse_args()
    if args.fuzz_cases < 0:
        parser.error("--fuzz-cases must be nonnegative")
    specs = read_specs()
    all_plans = scenarios(args.fuzz_cases, args.seed)
    included, excluded = application_cases(specs)
    known = {entry["testcase"]["ID"] for entry in included}
    if any(p["testcase"] not in known for p in all_plans):
        parser.error("Generated plan references a missing sales API testcase")
    if args.testcase and not set(args.testcase).issubset({p["testcase"] for p in all_plans}):
        parser.error("Unknown or non-API testcase")
    plans = [p for p in all_plans if not args.testcase or p["testcase"] in args.testcase]
    args.output.mkdir(parents=True, exist_ok=True)
    for name, value in [("spec_snapshot",
         specs),
         ("generated_cases",
         plans),
         ("excluded_testcases",
         excluded)]:
        write_json(args.output / f"{name}.json", value)
    results = []
    if not args.audit_only:
        for i, case in enumerate(plans, 1):
            result = execute(case)
            results.append(result)
            print(f"[{i}/{len(plans)}] {case['id']}: {result['status']}", flush=True)
            # Do not repeat a broken backend once per remaining input.
            if i == 1 and result["status"] == "ERROR":
                print("Setup/runner failed; remaining scenarios are NOT_RUN.", flush=True)
                break
    entries = build_report(specs, results, all_plans)
    summary = {"created_utc": datetime.now(timezone.utc).isoformat(),
        "environment": ENVIRONMENT,
        "random_seed": args.seed, "audit_only": args.audit_only,
        "counts": dict(Counter(e["status"] for e in entries)),
        "execution_counts": dict(Counter(r["status"] for r in results)),
        "excluded_testcase_count": len(excluded), "traceability": entries, "executions": results,
        "limitations": ["PASS concerns listed input samples, not complete requirement coverage.",
            "Simulated datastore and test accounts; not a real-server or production benchmark.",
            "Email/virtual-closet integrations are disabled. Timing uses test hashes and is exploratory.",
            "Rate limiting, throughput and formal verification are outside this campaign."]}
    sources = list((ROOT / "fuzzers").glob("*.py")) + list((ROOT / "seed_corpus").glob("*.json"))
    for folder in ("node_harness", "node_harness/config", "node_harness/routes"):
        sources.extend((ROOT / folder).glob("*.js"))
    sources.append(ROOT.parent / "server/concurrency.js")
    summary["source_sha256"] = {str(p.relative_to(ROOT.parent)): hashlib.sha256(p.read_bytes()).hexdigest() for p in sources}
    summary["python_version"] = sys.version
    summary["finding_groups"] = [{"testcase": tc,
         "case_ids": [r["case"]["id"] for r in results if r["status"] == "FAIL" and r["case"]["testcase"] == tc],
        "note": "Grouped by testcase, not unique root causes."} for tc in sorted({r["case"]["testcase"] for r in results if r["status"] == "FAIL"})]
    write_report(args.output, summary)
    print(json.dumps(summary["counts"]))
    return 2 if any(r["status"] == "ERROR" for r in results) else 0


if __name__ == "__main__":
    raise SystemExit(main())
