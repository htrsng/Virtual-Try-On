"""
Chuong 4 - Fuzzing Hop den (Black-box Fuzzing) cho VFitAI Auth + Orders
========================================================================
Ap dung dung tinh than Lab 8 (blackbox_fuzzer.py): fuzzer KHONG nhin thay
ma nguon hay coverage cua server - no chi gui HTTP request toi server
THAT dang chay (localhost:5050) va quan sat response tu BEN NGOAI.

Khac voi Lab 8 (dot bien tren 1 chuoi ky tu don), muc tieu o day la REST
API nhan JSON co cau truc, nen ky thuat dot bien duoc mo rong thanh 2 lop:
  1. Dot bien GIA TRI truong (field-level): thay 1 truong bang 1 gia tri
     "dang ngo" tu DICTIONARY (rong, rat dai, am, NaN, sai kieu, chuoi
     injection...) - tuong duong "splice_token" cua Lab8.
  2. Dot bien CAU TRUC (structural): xoa 1 truong bat buoc, doi kieu ca
     mot object thanh string/số/array - tuong duong "insert/delete_char"
     nhung o muc do JSON thay vi ky tu.

Oracle (tieu chi phat hien "loi"):
  - CRASH: HTTP 500 (loi khong duoc xu ly / unhandled exception) hoac
    request bi timeout/mat ket noi (server treo/sap) - tuong duong
    "AddressSanitizer bao loi" trong Lab8 nhung o muc HTTP.
  - VULN_CONFIRMED: request duoc CHAP NHAN (200/201) nhung du lieu tra ve
    vi pham quy tac nghiep vu da biet tu Chuong 1-3 (vd: totalAmount am,
    hoac totalAmount lech qua nhieu so voi tong gia * so luong that) -
    day la dang loi "logic/bao mat" ma cac cong cu tinh (Ch2, Ch3) da
    du doan truoc, nay fuzzer XAC NHAN duoc bang thuc nghiem dong.
"""
from __future__ import annotations
import json
import os
import random
import string
import time
import requests

BASE_URL = os.environ.get("TARGET_URL", "http://localhost:5050")
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SEED_DIR = os.path.join(BASE_DIR, "seed_corpus")
CRASH_DIR = os.path.join(BASE_DIR, "crashes")
os.makedirs(CRASH_DIR, exist_ok=True)

SEED_EMAIL = "fuzzuser@test.com"
SEED_PASSWORD = "Fuzz123!"

DICTIONARY = [
    None, "", 0, -1, -999999999, 999999999999999999,
    "A" * 5000, "' OR '1'='1", "{\"$ne\": null}", "<script>alert(1)</script>",
    "NaN", "Infinity", -0.5, True, False, [], {}, "🙂" * 50, "\x00\x01",
    "../../../etc/passwd", "0000000000", "%s%s%s%s", "admin",
]


def load_seed(name: str) -> dict:
    with open(os.path.join(SEED_DIR, name), encoding="utf-8") as f:
        return json.load(f)


def mutate_json(payload: dict, rng: random.Random) -> dict:
    """Dot bien 1 ban sao cua payload JSON, tra ve payload moi."""
    candidate = json.loads(json.dumps(payload))  # deep copy
    op = rng.choice(["field_value", "delete_field", "type_confuse_root",
                      "nested_field_value", "duplicate_array_item"])

    keys = list(candidate.keys())
    if not keys:
        return candidate

    if op == "field_value":
        k = rng.choice(keys)
        candidate[k] = rng.choice(DICTIONARY)
    elif op == "delete_field":
        k = rng.choice(keys)
        del candidate[k]
    elif op == "type_confuse_root":
        k = rng.choice(keys)
        # Doi ca mot object/array thanh 1 kieu hoan toan khac
        candidate[k] = rng.choice(["not_an_object", 12345, [1, 2, 3], None])
    elif op == "nested_field_value":
        # Tim 1 truong con la dict/list de dot bien sau hon (vd shippingInfo, products[0])
        nested_keys = [k for k in keys if isinstance(candidate[k], (dict, list))]
        if nested_keys:
            k = rng.choice(nested_keys)
            if isinstance(candidate[k], dict) and candidate[k]:
                nk = rng.choice(list(candidate[k].keys()))
                candidate[k][nk] = rng.choice(DICTIONARY)
            elif isinstance(candidate[k], list) and candidate[k]:
                idx = rng.randrange(len(candidate[k]))
                if isinstance(candidate[k][idx], dict) and candidate[k][idx]:
                    nk = rng.choice(list(candidate[k][idx].keys()))
                    candidate[k][idx][nk] = rng.choice(DICTIONARY)
    elif op == "duplicate_array_item":
        list_keys = [k for k in keys if isinstance(candidate[k], list) and candidate[k]]
        if list_keys:
            k = rng.choice(list_keys)
            candidate[k] = candidate[k] * rng.randint(2, 20)

    return candidate


def compute_expected_total(products) -> float | None:
    try:
        return sum(float(p["price"]) * float(p["quantity"]) for p in products)
    except Exception:
        return None


def check_order_response(request_body: dict, resp: requests.Response) -> str | None:
    """Tra ve mo ta loi 'VULN_CONFIRMED' neu phat hien, nguoc lai None."""
    if resp.status_code not in (200, 201):
        return None
    try:
        body = resp.json()
        saved_total = body.get("order", {}).get("totalAmount")
    except Exception:
        return None
    if saved_total is None or not isinstance(saved_total, (int, float)):
        return None
    if saved_total < 0:
        return f"totalAmount am duoc chap nhan: {saved_total}"
    products = request_body.get("products")
    if isinstance(products, list) and products:
        expected = compute_expected_total(products)
        if expected is not None and abs(saved_total - expected) > max(1.0, 0.01 * expected):
            return f"totalAmount ({saved_total}) lech qua nhieu so voi gia that (~{expected})"
    return None


def fuzz(iterations: int = 2000, seed: int = 42) -> dict:
    rng = random.Random(seed)
    session = requests.Session()

    seed_login = load_seed("seed_login_valid.json")
    seed_order = load_seed("seed_order_valid.json")

    # Dang nhap 1 lan de lay token that (khong phai target fuzz, chi la
    # buoc chuan bi de co the goi POST /api/orders can xac thuc).
    login_resp = session.post(f"{BASE_URL}/api/auth/login", json=seed_login, timeout=5)
    token = login_resp.json().get("token")
    auth_headers = {"Authorization": f"Bearer {token}"}

    crashes = []
    vuln_findings = []
    status_counter: dict[str, int] = {}

    targets = [
        {"name": "login", "url": f"{BASE_URL}/api/auth/login", "seed": seed_login, "headers": {}},
        {"name": "orders", "url": f"{BASE_URL}/api/orders", "seed": seed_order, "headers": auth_headers},
    ]

    for i in range(iterations):
        target = targets[i % len(targets)]
        candidate = mutate_json(target["seed"], rng)

        try:
            resp = session.post(target["url"], json=candidate, headers=target["headers"], timeout=5)
        except requests.exceptions.RequestException as e:
            crash_id = len(crashes)
            crash_path = os.path.join(CRASH_DIR, f"blackbox_crash_{crash_id}.json")
            with open(crash_path, "w", encoding="utf-8") as f:
                json.dump({"target": target["name"], "input": candidate, "error": str(e)}, f, ensure_ascii=False, indent=2)
            crashes.append({"iteration": i, "target": target["name"], "input": candidate,
                             "type": "CONNECTION_ERROR", "detail": str(e), "saved_to": crash_path})
            continue

        key = f"{target['name']}:{resp.status_code}"
        status_counter[key] = status_counter.get(key, 0) + 1

        if resp.status_code == 500:
            crash_id = len(crashes)
            crash_path = os.path.join(CRASH_DIR, f"blackbox_crash_{crash_id}.json")
            with open(crash_path, "w", encoding="utf-8") as f:
                json.dump({"target": target["name"], "input": candidate,
                            "status": resp.status_code, "body": _safe_json(resp)},
                          f, ensure_ascii=False, indent=2)
            crashes.append({"iteration": i, "target": target["name"], "input": candidate,
                             "type": "HTTP_500", "saved_to": crash_path})

        if target["name"] == "orders":
            finding = check_order_response(candidate, resp)
            if finding:
                vuln_findings.append({"iteration": i, "input": candidate, "finding": finding,
                                       "response_status": resp.status_code})

    return {
        "iterations": iterations,
        "status_counter": status_counter,
        "crashes": crashes,
        "vuln_findings": vuln_findings,
    }


def _safe_json(resp: requests.Response):
    try:
        return resp.json()
    except Exception:
        return resp.text[:500]


if __name__ == "__main__":
    t0 = time.time()
    result = fuzz(iterations=2000, seed=42)
    elapsed = time.time() - t0
    print(f"=== Fuzzing Hop den: {result['iterations']} lan thu trong {elapsed:.1f}s ===")
    print("Phan bo status code:", result["status_counter"])
    print(f"So crash (HTTP 500 / mat ket noi): {len(result['crashes'])}")
    for c in result["crashes"][:10]:
        print(f"  Lan thu {c['iteration']} [{c['target']}] type={c['type']} -> {c['saved_to']}")
    print(f"\nSo phat hien vi pham nghiep vu (VULN_CONFIRMED): {len(result['vuln_findings'])}")
    for v in result["vuln_findings"][:10]:
        print(f"  Lan thu {v['iteration']}: {v['finding']}")

    out_path = os.path.join(BASE_DIR, "results", "ch4_blackbox_results.json")
    _last_err = None
    for _attempt in range(6):
        try:
            with open(out_path, "w", encoding="utf-8") as f:
                json.dump(result, f, ensure_ascii=False, indent=2)
            _last_err = None
            break
        except PermissionError as e:
            _last_err = e
            time.sleep(1.0)
    if _last_err:
        raise _last_err
    print(f"\nDa ghi ket qua day du: {out_path}")
