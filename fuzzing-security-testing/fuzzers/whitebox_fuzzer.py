"""
Chuong 4 - Fuzzing Hop trang (White-box / Coverage-guided) cho VFitAI
=======================================================================
Ap dung dung kien truc whitebox_fuzzer.py cua Lab8 (hang doi LIFO, giu lai
dau vao tao "coverage moi", loai bo dau vao khong tao coverage moi) nhung
thay doi tuong "chay 1 file C bien dich san + gcov" bang "chay 1 tien
trinh Node moi + Inspector Profiler API + v8-to-istanbul" (xem
node_harness/single_run_harness.js).

Moi lan thu = 1 tien trinh Node MOI duoc spawn (co lap hoan toan, dam
bao coverage do duoc CHI thuoc ve lan chay do).

FUZZ 6 TARGET (khong gom "login" - giu dung quyet dinh thiet ke ban dau:
login khong co nhanh nghiep vu sau de coverage khai thac them):
  - orders            (POST /api/orders)                  - module goc
  - order_status       (PUT  /api/orders/:id)              - module bo sung
  - user_update_self   (PUT  /api/users/:id, chinh minh)   - module bo sung
  - user_update_victim (PUT  /api/users/:id, nguoi khac)   - module bo sung
  - product_create      (POST /api/products)                - module bo sung
  - product_update      (PUT  /api/products/:id)             - module bo sung

Moi target co HANG DOI RIENG (seed rieng), vi moi target la 1 route/luong
nghiep vu khac nhau - tron chung 1 hang doi se lam "energy" bi lech ve
target de sinh coverage moi nhat.

Oracle CRASH: HTTP 500 (hoac process loi) = crash - GIONG cho ca 6
target. Oracle VULN: dung lai CHINH XAC cac ham oracle trong
blackbox_fuzzer.py (check_order_response, check_order_status_response,
check_user_update_response, check_product_response) de 2 bao cao
(black-box, white-box) dung CHUNG 1 dinh nghia "vi pham".
"""
from __future__ import annotations
import json
import os
import random
import subprocess
import sys
import tempfile
import time
from collections import deque


def safe_write_json(path: str, data, retries: int = 15, delay: float = 2.0):
    """Ghi JSON voi tu dong thu lai neu gap PermissionError. Neu van khong
    ghi duoc sau tat ca cac lan thu, TU DONG luu sang ten file khac."""
    last_err = None
    try:
        if os.path.exists(path):
            os.remove(path)
    except Exception:
        pass

    for attempt in range(retries):
        try:
            with open(path, "w", encoding="utf-8") as f:
                json.dump(data, f, ensure_ascii=False, indent=2)
            return path
        except PermissionError as e:
            last_err = e
            if attempt == 0:
                print(f"  [!] Khong ghi duoc {path} (file dang bi khoa). "
                      f"Dang thu lai toi {retries} lan, moi lan cach {delay}s...")
            time.sleep(delay)

    alt_path = path.replace(".json", f"_backup_{int(time.time())}.json")
    try:
        with open(alt_path, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        print(f"  [!] Van khong ghi duoc {path} sau {retries} lan thu.")
        print(f"  [OK] Da luu du lieu vao file thay the: {alt_path}")
        return alt_path
    except Exception:
        print(f"  [X] Khong the ghi ca file thay the. Loi goc: {last_err}")
        raise last_err

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
NODE_HARNESS_DIR = os.path.join(BASE_DIR, "node_harness")
SEED_DIR = os.path.join(BASE_DIR, "seed_corpus")
CRASH_DIR = os.path.join(BASE_DIR, "crashes")
os.makedirs(CRASH_DIR, exist_ok=True)

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from blackbox_fuzzer import (  # noqa: E402
    DICTIONARY, mutate_json,
    check_order_response, check_order_status_response,
    check_user_update_response, check_product_response,
)

TARGETS = ["orders", "order_status", "user_update_self", "user_update_victim",
           "product_create", "product_update"]
# Ten seed file rieng cho tung target.
SEED_FILES = {
    "orders": "seed_order_valid.json",
    "order_status": "seed_order_status_valid.json",
    "user_update_self": "seed_user_update_valid.json",
    "user_update_victim": "seed_user_update_valid.json",
    "product_create": "seed_product_valid.json",
    "product_update": "seed_product_valid.json",
}
ORDER_STATUS_FROM = "Đang xử lý"  # trang thai khoi tao cua don hang setup trong harness


def load_seed(name: str) -> dict:
    with open(os.path.join(SEED_DIR, name), encoding="utf-8") as f:
        return json.load(f)


def run_single(target: str, body: dict, token: str | None = None, use_auth: bool = True,
                timeout: float = 10.0) -> dict:
    """Spawn 1 tien trinh Node moi, chay 1 request, tra ve dict co
    status/body/covered_lines (xem single_run_harness.js)."""
    with tempfile.NamedTemporaryFile("w", suffix=".json", delete=False) as f:
        json.dump({"target": target, "token": token, "use_auth": use_auth, "body": body}, f)
        input_path = f.name
    try:
        proc = subprocess.run(
            ["node", "single_run_harness.js", input_path],
            cwd=NODE_HARNESS_DIR, capture_output=True, text=True, timeout=timeout,
            encoding="utf-8", errors="replace",
        )
    except subprocess.TimeoutExpired:
        return {"ok": False, "error": "TIMEOUT", "covered_lines": []}
    finally:
        os.unlink(input_path)

    if "===RESULT===" not in proc.stdout:
        return {"ok": False, "error": f"NO_RESULT_MARKER stderr={proc.stderr[-500:]}", "covered_lines": []}
    result_line = proc.stdout.split("===RESULT===")[-1].strip().splitlines()[0]
    try:
        return json.loads(result_line)
    except json.JSONDecodeError:
        return {"ok": False, "error": "BAD_JSON", "covered_lines": []}


def get_valid_token() -> str:
    seed_login = load_seed("seed_login_valid.json")
    res = run_single("login", seed_login, token=None, use_auth=True)
    return res.get("body", {}).get("token")


class _FakeResp:
    def __init__(self, status, body):
        self.status_code = status
        self._body = body

    def json(self):
        return self._body


def check_finding(target: str, body: dict, res: dict, use_auth: bool) -> str | None:
    resp = _FakeResp(res.get("status"), res.get("body", {}))
    if target == "orders":
        return check_order_response(body, resp)
    if target == "order_status":
        return check_order_status_response(ORDER_STATUS_FROM, body, resp, had_auth=use_auth)
    if target == "user_update_self":
        return check_user_update_response(body, resp, had_auth=use_auth, target_is_self=True)
    if target == "user_update_victim":
        return check_user_update_response(body, resp, had_auth=use_auth, target_is_self=False)
    if target in ("product_create", "product_update"):
        return check_product_response(body, resp, had_auth=use_auth)
    return None


def fuzz_target(target: str, seed_body: dict, token: str, rng: random.Random,
                 iterations: int, crashes: list, vuln_findings: list) -> dict:
    """Coverage-guided fuzzing cho 1 target, dung LIFO + energy=6 giong
    het Lab8. Cho "orders" khong xen ke auth (giu nguyen hanh vi cu -
    luon dung token). Cho 5 target con lai, xen ke auth bat/tat de
    coverage-guided cung kiem duoc duong thieu-authorization."""
    toggle_auth = target != "orders"
    queue = deque([seed_body])
    covered: set[int] = set()
    new_coverage_events = []
    it = 0

    while it < iterations and queue:
        parent = queue.pop()
        for _ in range(6):
            it += 1
            if it > iterations:
                break
            child = mutate_json(parent, rng)
            use_auth = (it % 2 == 0) if toggle_auth else True
            res = run_single(target, child, token=token, use_auth=use_auth)

            if not res.get("ok", True) or res.get("error") == "TIMEOUT":
                crash_id = len(crashes)
                crash_path = os.path.join(CRASH_DIR, f"whitebox_crash_{crash_id}.json")
                with open(crash_path, "w", encoding="utf-8") as f:
                    json.dump({"target": target, "input": child, "result": res}, f, ensure_ascii=False, indent=2)
                crashes.append({"iteration": it, "target": target, "input": child, "type": "PROCESS_ERROR",
                                 "detail": res.get("error"), "saved_to": crash_path})
                continue

            if res.get("status") == 500:
                crash_id = len(crashes)
                crash_path = os.path.join(CRASH_DIR, f"whitebox_crash_{crash_id}.json")
                with open(crash_path, "w", encoding="utf-8") as f:
                    json.dump({"target": target, "input": child, "result": res}, f, ensure_ascii=False, indent=2)
                crashes.append({"iteration": it, "target": target, "input": child, "type": "HTTP_500",
                                 "saved_to": crash_path})

            finding = check_finding(target, child, res, use_auth)
            if finding:
                vuln_findings.append({"iteration": it, "target": target, "input": child,
                                       "finding": finding, "had_auth": use_auth,
                                       "response_status": res.get("status")})

            lines = set(res.get("covered_lines", []))
            new_lines = lines - covered
            if new_lines:
                covered |= lines
                queue.append(child)
                new_coverage_events.append({"iteration": it, "target": target,
                                             "new_lines_count": len(new_lines),
                                             "new_lines_sample": sorted(new_lines)[:15]})
        if not queue and it < iterations:
            queue.append(seed_body)

    return {"iterations_used": it, "lines_covered": len(covered), "new_coverage_events": new_coverage_events}


def fuzz(iterations_per_target: int = 45, seed: int = 7) -> dict:
    rng = random.Random(seed)
    token = get_valid_token()

    crashes: list[dict] = []
    vuln_findings: list[dict] = []
    per_target_summary = {}

    for target in TARGETS:
        seed_body = load_seed(SEED_FILES[target])
        summary = fuzz_target(target, seed_body, token, rng, iterations_per_target, crashes, vuln_findings)
        per_target_summary[target] = summary

    iterations_used = sum(s["iterations_used"] for s in per_target_summary.values())
    total_lines_covered = sum(s["lines_covered"] for s in per_target_summary.values())
    new_coverage_events = sum(len(s["new_coverage_events"]) for s in per_target_summary.values())

    return {
        "iterations_used": iterations_used,
        "per_target": per_target_summary,
        # Giu ten khoa "total_lines_covered" de tuong thich voi
        # run_ch4_comparison.py cu (tong theo tung target, KHONG phai
        # hop cua tap dong - vi moi target do coverage tren pham vi
        # khac nhau cua index.js).
        "total_lines_covered": total_lines_covered,
        "new_coverage_events": new_coverage_events,
        "crashes": crashes,
        "vuln_findings": vuln_findings,
    }


if __name__ == "__main__":
    t0 = time.time()
    result = fuzz(iterations_per_target=45, seed=7)
    elapsed = time.time() - t0
    print(f"=== Fuzzing Hop trang (coverage-guided): {result['iterations_used']} lan thu trong {elapsed:.1f}s ===")
    for target, s in result["per_target"].items():
        print(f"  [{target}] lan thu={s['iterations_used']} dong-phu={s['lines_covered']} "
              f"su-kien-coverage-moi={len(s['new_coverage_events'])}")
    print(f"\nSo crash tim duoc: {len(result['crashes'])}")
    for c in result["crashes"][:10]:
        print(f"  Lan thu {c['iteration']} [{c['target']}] type={c['type']} -> {c['saved_to']}")
    print(f"\nSo phat hien vi pham nghiep vu: {len(result['vuln_findings'])}")
    for v in result["vuln_findings"][:15]:
        print(f"  Lan thu {v['iteration']} [{v['target']}] auth={v['had_auth']}: {v['finding']}")

    out_path = os.path.join(BASE_DIR, "results", "ch4_whitebox_results.json")
    actual_path = safe_write_json(out_path, result)
    print(f"\nDa ghi ket qua day du: {actual_path}")