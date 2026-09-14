"""
Chuong 4 - Fuzzing Hop trang (White-box / Coverage-guided) cho VFitAI Orders
==============================================================================
Ap dung dung kien truc whitebox_fuzzer.py cua Lab8 (hang doi LIFO, giu lai
dau vao tao "coverage moi", loai bo dau vao khong tao coverage moi) nhung
thay doi tuong "chay 1 file C bien dich san + gcov" bang "chay 1 tien
trinh Node moi + Inspector Profiler API + v8-to-istanbul" (xem
node_harness/single_run_harness.js) - vi day la muc tieu Node/Express
that khong phai C.

Moi lan thu = 1 tien trinh Node MOI duoc spawn (co lap hoan toan, dam
bao coverage do duoc CHI thuoc ve lan chay do - tuong duong "xoa .gcda
truoc moi lan chay" cua Lab8).

Oracle giong het blackbox_fuzzer.py: HTTP 500 (hoac process loi) = crash;
totalAmount bat thuong duoc chap nhan (200) = vi pham nghiep vu.
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
    ghi duoc sau tat ca cac lan thu, TU DONG luu sang ten file khac (khong
    bao gio lam mat du lieu da fuzz duoc)."""
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
        print(f"       Hay doi ten file nay thanh '{os.path.basename(path)}' "
              f"thu cong sau khi dong het chuong trinh dang mo file goc.")
        return alt_path
    except Exception:
        print(f"  [X] Khong the ghi ca file thay the. Loi goc: {last_err}")
        raise last_err

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
NODE_HARNESS_DIR = os.path.join(BASE_DIR, "node_harness")
SEED_DIR = os.path.join(BASE_DIR, "seed_corpus")
CRASH_DIR = os.path.join(BASE_DIR, "crashes")
os.makedirs(CRASH_DIR, exist_ok=True)

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))  # cung thu muc voi blackbox_fuzzer.py (ten thu muc bat ky)
from blackbox_fuzzer import DICTIONARY, mutate_json, check_order_response  # noqa: E402


def load_seed(name: str) -> dict:
    with open(os.path.join(SEED_DIR, name), encoding="utf-8") as f:
        return json.load(f)


def run_single(target: str, body: dict, token: str | None = None, timeout: float = 10.0) -> dict:
    """Spawn 1 tien trinh Node moi, chay 1 request, tra ve dict co
    status/body/covered_lines (xem single_run_harness.js)."""
    with tempfile.NamedTemporaryFile("w", suffix=".json", delete=False) as f:
        json.dump({"target": target, "token": token, "body": body}, f)
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
    res = run_single("login", seed_login)
    return res.get("body", {}).get("token")


def fuzz(iterations: int = 250, seed: int = 7) -> dict:
    rng = random.Random(seed)
    token = get_valid_token()
    seed_order = load_seed("seed_order_valid.json")

    queue = deque([seed_order])
    global_covered: set[int] = set()
    crashes = []
    vuln_findings = []
    new_coverage_events = []

    it = 0
    while it < iterations and queue:
        parent = queue.pop()  # LIFO - giong het Lab8
        for _ in range(6):  # 6 con moi cha (energy scheduling)
            it += 1
            if it > iterations:
                break
            child = mutate_json(parent, rng)
            res = run_single("orders", child, token=token)

            if not res.get("ok", True) or res.get("error") == "TIMEOUT":
                crash_id = len(crashes)
                crash_path = os.path.join(CRASH_DIR, f"whitebox_crash_{crash_id}.json")
                with open(crash_path, "w", encoding="utf-8") as f:
                    json.dump({"input": child, "result": res}, f, ensure_ascii=False, indent=2)
                crashes.append({"iteration": it, "input": child, "type": "PROCESS_ERROR",
                                 "detail": res.get("error"), "saved_to": crash_path})
                continue

            if res.get("status") == 500:
                crash_id = len(crashes)
                crash_path = os.path.join(CRASH_DIR, f"whitebox_crash_{crash_id}.json")
                with open(crash_path, "w", encoding="utf-8") as f:
                    json.dump({"input": child, "result": res}, f, ensure_ascii=False, indent=2)
                crashes.append({"iteration": it, "input": child, "type": "HTTP_500", "saved_to": crash_path})

            class _FakeResp:
                def __init__(self, status, body):
                    self.status_code = status
                    self._body = body
                def json(self):
                    return self._body

            finding = check_order_response(child, _FakeResp(res.get("status"), res.get("body", {})))
            if finding:
                vuln_findings.append({"iteration": it, "input": child, "finding": finding})

            lines = set(res.get("covered_lines", []))
            new_lines = lines - global_covered
            if new_lines:
                global_covered |= lines
                queue.append(child)
                new_coverage_events.append({"iteration": it, "new_lines_count": len(new_lines),
                                             "new_lines_sample": sorted(new_lines)[:15]})
        if not queue and it < iterations:
            queue.append(seed_order)

    return {
        "iterations_used": it,
        "total_lines_covered": len(global_covered),
        "new_coverage_events": new_coverage_events,
        "crashes": crashes,
        "vuln_findings": vuln_findings,
    }


if __name__ == "__main__":
    t0 = time.time()
    result = fuzz(iterations=250, seed=7)
    elapsed = time.time() - t0
    print(f"=== Fuzzing Hop trang (coverage-guided): {result['iterations_used']} lan thu trong {elapsed:.1f}s ===")
    print(f"Tong so dong lenh da phu trong index.js: {result['total_lines_covered']}")
    print(f"So su kien 'coverage moi': {len(result['new_coverage_events'])}")
    for e in result["new_coverage_events"][:10]:
        print(f"  Lan thu {e['iteration']}: +{e['new_lines_count']} dong moi, vd: {e['new_lines_sample']}")
    print(f"\nSo crash tim duoc: {len(result['crashes'])}")
    for c in result["crashes"][:10]:
        print(f"  Lan thu {c['iteration']} type={c['type']} -> {c['saved_to']}")
    print(f"\nSo phat hien vi pham nghiep vu: {len(result['vuln_findings'])}")
    for v in result["vuln_findings"][:10]:
        print(f"  Lan thu {v['iteration']}: {v['finding']}")

    out_path = os.path.join(BASE_DIR, "results", "ch4_whitebox_results.json")
    actual_path = safe_write_json(out_path, result)
    print(f"\nDa ghi ket qua day du: {actual_path}")
