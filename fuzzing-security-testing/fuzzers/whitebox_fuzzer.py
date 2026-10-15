"""Kiểm thử fuzzing JSON theo phản hồi độ bao phủ trên ứng dụng bán hàng mô phỏng.

Mỗi input chạy trong một tiến trình Node mới. HTTP 5xx, quá thời gian chờ
và lỗi bộ chạy được ghi riêng; các hiện tượng này chưa đủ xác nhận tiến trình bị crash.
"""
import argparse
from collections import deque
from pathlib import Path
import random
import time
import uuid

from fuzzer_common import (
    check_order_response, check_order_status_response, check_product_response,
    check_user_update_response, mutate_json,
)
from runtime import ENVIRONMENT, ROOT, HarnessError, load_seed, run_node, write_json

BASE_DIR = str(ROOT)
TARGETS = ["orders",
     "order_status",
     "user_update_self",
     "user_update_victim",
     "product_create",
     "product_update"]
SEED_FILES = {
    "orders": "seed_order_valid.json",
    "order_status": "seed_order_status_valid.json",
    "user_update_self": "seed_user_update_valid.json",
    "user_update_victim": "seed_user_update_valid.json",
    "product_create": "seed_product_valid.json",
    "product_update": "seed_product_valid.json",
}
ENERGY = 6


# Chạy một input trong tiến trình Node mới để cô lập dữ liệu.
def run_single(target, body, token=None, use_auth=True, timeout=35):
    try:
        return run_node("single_run_harness.js", {
            "target": target, "body": body, "token": token, "use_auth": use_auth,
        }, timeout)
    except HarnessError as error:
        return {"ok": False, "error": str(error), "error_kind": error.kind, "covered_lines": []}


def get_valid_token():
    result = run_single("login", load_seed("seed_login_valid.json"))
    token = result.get("body", {}).get("token")
    if not result.get("ok") or result.get("status") != 200 or not token:
        raise HarnessError(f"Login setup failed: {result.get('error',
             result.get('status'))}",
             "SETUP_ERROR")
    return token


class JsonResponse:
    """Adapt a measured harness response to the HTTP oracles' small interface."""

    def __init__(self, result):
        self.status_code = result.get("status")
        self.body = result.get("body", {})

    def json(self):
        return self.body


# Đánh giá response bằng các quy tắc dùng chung với blackbox.
def check_finding(target, body, result, use_auth):
    response = JsonResponse(result)
    if target == "orders":
        catalog = result.get("catalog")
        if catalog is not None:
            catalog = {int(key): value for key, value in catalog.items()}
        return check_order_response(body, response, catalog=catalog)
    if target == "order_status":
        initial = result.get("initial_status") or load_seed("seed_order_status_valid.json")["status"]
        return check_order_status_response(initial, body, response, had_auth=use_auth)
    if target in ("user_update_self", "user_update_victim"):
        return check_user_update_response(body,
             response,
             had_auth=use_auth,
             target_is_self=target == "user_update_self")
    if target in ("product_create", "product_update"):
        return check_product_response(body, response, had_auth=use_auth)
    return None


def error_type(result):
    if not result.get("ok", True):
        return result.get("error_kind", "PROCESS_ERROR")
    if result.get("status", 0) >= 500:
        return "HTTP_5XX"
    return None


# Lấy input cha từ cuối hàng đợi và đột biến tối đa ENERGY lần.
def fuzz_target(target, seed_body, token, rng, iterations, errors, vuln_findings, error_dir=None):
    queue = deque([seed_body])
    covered = set()
    coverage_events = []
    used = 0
    while used < iterations:
        parent = queue.pop() if queue else seed_body
        for _ in range(min(ENERGY, iterations - used)):
            used += 1
            child = mutate_json(parent, rng)
            use_auth = True if target == "orders" else used % 2 == 0
            result = run_single(target, child, token, use_auth)
            kind = error_type(result)
            if kind:
                record = {"iteration": used,
                     "target": target,
                     "input": child,
                     "type": kind,
                     "result": result}
                if error_dir is not None:
                    path = Path(error_dir) / f"error_{len(errors):04d}.json"
                    write_json(path, record)
                    record["saved_to"] = str(path)
                errors.append(record)
            if not result.get("ok", True):
                continue
            finding = check_finding(target, child, result, use_auth)
            if finding:
                vuln_findings.append({"iteration": used, "target": target, "input": child,
                    "finding": finding, "had_auth": use_auth, "response_status": result["status"]})
            lines = set(result.get("covered_lines", []))
            new = lines - covered
            covered.update(lines)
            if new:
                queue.append(child)
                coverage_events.append({"iteration": used,
                     "new_lines_count": len(new),
                     "new_lines_sample": sorted(new)[:15]})
    return {"iterations_used": used,
         "lines_covered": len(covered),
         "covered_lines": sorted(covered),
        "new_coverage_events": coverage_events}


# Điều phối một lần chạy fuzzing và trả kết quả tổng hợp.
def fuzz(iterations_per_target=45, seed=7, output=None):
    if iterations_per_target < 0:
        raise ValueError("Iteration budget must be nonnegative")
    output = Path(output) if output else ROOT / "results/whitebox" / uuid.uuid4().hex[:12]
    rng = random.Random(seed)
    token = get_valid_token()
    errors, findings = [], []
    per_target = {
        target: fuzz_target(target, load_seed(SEED_FILES[target]), token, rng,
            iterations_per_target, errors, findings, output / "errors")
        for target in TARGETS
    }
    return {"environment": ENVIRONMENT, "seed": seed, "artifact_dir": str(output),
        "iterations_used": sum(summary["iterations_used"] for summary in per_target.values()),
        "per_target": per_target,
             "line_target_pairs": sum(s["lines_covered"] for s in per_target.values()),
        "unique_index_lines_covered": len(set().union(*(set(s["covered_lines"]) for s in per_target.values()))),
        "coverage_scope": "node_harness/index.js including initialization/setup; line feedback only",
        "errors": errors, "vuln_findings": findings}


# Đọc tham số dòng lệnh và bắt đầu chạy chương trình.
def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--iterations-per-target", type=int, default=45)
    parser.add_argument("--seed", type=int, default=7)
    parser.add_argument("--output", type=Path)
    args = parser.parse_args()
    if args.iterations_per_target < 0:
        parser.error("Iteration budget must be nonnegative")
    start = time.monotonic()
    result = fuzz(args.iterations_per_target, args.seed, args.output)
    result["elapsed_seconds"] = time.monotonic() - start
    path = write_json(Path(result["artifact_dir"]) / "report.json", result)
    print(f"Inputs: {result['iterations_used']}; errors: {len(result['errors'])}; findings: {len(result['vuln_findings'])}")
    print(path)
    return 2 if any(e["type"] != "HTTP_5XX" for e in result["errors"]) else 0


if __name__ == "__main__":
    raise SystemExit(main())
