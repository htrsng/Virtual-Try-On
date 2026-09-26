"""
Chuong 4 - Fuzzing Hop den (Black-box Fuzzing) cho VFitAI
==========================================================
Ap dung dung tinh than Lab 8 (blackbox_fuzzer.py): fuzzer KHONG nhin thay
ma nguon hay coverage cua server - no chi gui HTTP request toi server
THAT dang chay (localhost:5050) va quan sat response tu BEN NGOAI.

Ky thuat dot bien (mutate_json) ap dung CHUNG cho ca 7 target, chia
2 lop dot bien:
  1. Dot bien GIA TRI truong (field-level): thay 1 truong bang 1 gia tri
     "dang ngo" tu DICTIONARY (rong, rat dai, am, NaN, sai kieu, chuoi
     injection...).
  2. Dot bien CAU TRUC (structural): xoa 1 truong bat buoc, doi kieu ca
     mot object thanh string/số/array.

7 TARGET duoc fuzz (module -> endpoint):
  - Auth        : POST /api/auth/login
  - Orders      : POST /api/orders
  - OrderStatus : PUT  /api/orders/:id        (module bo sung)
  - UserAdmin   : PUT  /api/users/:id (self)  (module bo sung)
  - UserAdmin   : PUT  /api/users/:id (victim - nguoi khac)  (module bo sung)
  - Product     : POST /api/products          (module bo sung)
  - Product     : PUT  /api/products/:id      (module bo sung)

Oracle (tieu chi phat hien "loi"), theo tung nhom:
  A) CRASH  : HTTP 500 hoac mat ket noi/timeout - ap dung cho CA 7 target.
  B) Orders : request duoc CHAP NHAN (200/201) nhung totalAmount am, hoac
     lech qua nhieu so voi gia * so luong that (BUG-06).
  C) OrderStatus: (i) cap nhat THANH CONG ma KHONG co token (BUG-03);
     (ii) status ngoai tap gia tri hop le van duoc chap nhan; (iii)
     chuyen trang thai VI PHAM mo hinh vong doi da xac dinh (SPEC) -
     doi lech voi ACTUAL da phat hien qua Kripke model checking (vd:
     "Da giao" bi doi nguoc, "Da huy" chuyen sang "Dang giao").
  D) UserAdmin: (i) sua thong tin THANH CONG ma KHONG co token (BUG-02);
     (ii) sua duoc thong tin cua NGUOI KHAC bang token cua chinh minh
     (IDOR/BOLA); (iii) tu dat duoc role=admin qua mass assignment
     (BUG-08).
  E) Product: (i) tao/sua san pham THANH CONG ma KHONG co token (BUG-04);
     (ii) gia san pham AM van duoc chap nhan.
"""
from __future__ import annotations
import json
import os
import random
import time
import requests

BASE_URL = os.environ.get("TARGET_URL", "http://localhost:5050")
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SEED_DIR = os.path.join(BASE_DIR, "seed_corpus")
CRASH_DIR = os.path.join(BASE_DIR, "crashes")
os.makedirs(CRASH_DIR, exist_ok=True)

SEED_EMAIL = "fuzzuser@test.com"
SEED_PASSWORD = "Fuzz123!"
VICTIM_EMAIL = "victim@test.com"

DICTIONARY = [
    None, "", 0, -1, -999999999, 999999999999999999,
    "A" * 5000, "' OR '1'='1", "{\"$ne\": null}", "<script>alert(1)</script>",
    "NaN", "Infinity", -0.5, True, False, [], {}, "🙂" * 50, "\x00\x01",
    "../../../etc/passwd", "0000000000", "%s%s%s%s", "admin",
]

# Trang thai HOP LE va chuyen doi HOP LE theo dac ta vong doi don hang
# (order_state_model_SPEC.json): Dang xu ly -> Dang giao -> Da giao (mot
# chieu); Dang xu ly -> Da huy (mot chieu, khong quay lai duoc).
VALID_STATUSES = {"Đang xử lý", "Đang giao", "Đã giao", "Đã hủy"}
VALID_TRANSITIONS = {
    "Đang xử lý": {"Đang xử lý", "Đang giao", "Đã hủy"},
    "Đang giao": {"Đang giao", "Đã giao"},
    "Đã giao": {"Đã giao"},
    "Đã hủy": {"Đã hủy"},
}


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
        candidate[k] = rng.choice(["not_an_object", 12345, [1, 2, 3], None])
    elif op == "nested_field_value":
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
    """Oracle cho POST /api/orders (BUG-06)."""
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


def check_order_status_response(from_status: str, request_body: dict, resp: requests.Response, had_auth: bool) -> str | None:
    """Oracle cho PUT /api/orders/:id (BUG-03 + vi pham mo hinh trang thai)."""
    if resp.status_code not in (200, 201):
        return None
    if not had_auth:
        return "Cap nhat trang thai don hang THANH CONG ma KHONG can token xac thuc"
    new_status = request_body.get("status")
    if not isinstance(new_status, str):
        return None
    if new_status not in VALID_STATUSES:
        return f"status '{new_status}' ngoai tap gia tri hop le nhung van duoc chap nhan"
    allowed = VALID_TRANSITIONS.get(from_status, set())
    if new_status not in allowed:
        return f"Chuyen trang thai bat hop le duoc chap nhan: '{from_status}' -> '{new_status}'"
    return None


def check_user_update_response(request_body: dict, resp: requests.Response, had_auth: bool, target_is_self: bool) -> str | None:
    """Oracle cho PUT /api/users/:id (BUG-02 thieu authorization, BUG-08 mass assignment)."""
    if resp.status_code not in (200, 201):
        return None
    if not had_auth:
        return "Sua thong tin user THANH CONG ma KHONG can token xac thuc"
    if not target_is_self:
        return "Sua thong tin user KHAC (khong phai chinh minh) THANH CONG du dung token user thuong"
    if isinstance(request_body.get("role"), str) and request_body["role"] == "admin":
        try:
            body = resp.json()
            if body.get("role") == "admin":
                return "Tu dat role=admin qua PUT /api/users/:id (mass assignment) THANH CONG"
        except Exception:
            pass
    return None


def check_product_response(request_body: dict, resp: requests.Response, had_auth: bool) -> str | None:
    """Oracle cho POST/PUT /api/products (BUG-04 thieu authorization + gia tri vo ly)."""
    if resp.status_code not in (200, 201):
        return None
    if not had_auth:
        return "Tao/sua san pham THANH CONG ma KHONG can token xac thuc"
    price = request_body.get("price")
    if isinstance(price, (int, float)) and price < 0:
        return f"Gia san pham am duoc chap nhan: {price}"
    return None


def _safe_json(resp: requests.Response):
    try:
        return resp.json()
    except Exception:
        return resp.text[:500]


def _save_crash(name: str, record: dict, crashes: list):
    crash_id = len(crashes)
    crash_path = os.path.join(CRASH_DIR, f"blackbox_crash_{crash_id}.json")
    with open(crash_path, "w", encoding="utf-8") as f:
        json.dump(record, f, ensure_ascii=False, indent=2)
    record["saved_to"] = crash_path
    crashes.append(record)


def fuzz(iterations: int = 3500, seed: int = 42) -> dict:
    rng = random.Random(seed)
    session = requests.Session()

    seed_login = load_seed("seed_login_valid.json")
    seed_order = load_seed("seed_order_valid.json")
    seed_status = load_seed("seed_order_status_valid.json")
    seed_user_update = load_seed("seed_user_update_valid.json")
    seed_product = load_seed("seed_product_valid.json")

    # --- Chuan bi mot lan (khong tinh la fuzz input): dang nhap, tao 1
    # don hang that de co :id, lay _id cua user self/victim, lay id san
    # pham co san. ---
    login_resp = session.post(f"{BASE_URL}/api/auth/login", json=seed_login, timeout=5)
    token = login_resp.json().get("token")
    auth_headers = {"Authorization": f"Bearer {token}"}

    order_resp = session.post(f"{BASE_URL}/api/orders", json=seed_order, headers=auth_headers, timeout=5)
    order_id = order_resp.json().get("order", {}).get("_id")

    users_resp = session.get(f"{BASE_URL}/api/users", timeout=5)
    users = users_resp.json()
    self_user = next((u for u in users if u.get("email") == SEED_EMAIL), None)
    victim_user = next((u for u in users if u.get("email") == VICTIM_EMAIL), None)
    self_id = self_user["_id"] if self_user else None
    victim_id = victim_user["_id"] if victim_user else None

    products_resp = session.get(f"{BASE_URL}/api/products", timeout=5)
    products = products_resp.json()
    product_id = products[0]["id"] if products else 1

    crashes: list[dict] = []
    vuln_findings: list[dict] = []
    status_counter: dict[str, int] = {}

    targets = [
        {"name": "login", "method": "POST", "url": f"{BASE_URL}/api/auth/login",
         "seed": seed_login, "fixed_headers": {}, "toggle_auth": False},
        {"name": "orders", "method": "POST", "url": f"{BASE_URL}/api/orders",
         "seed": seed_order, "fixed_headers": auth_headers, "toggle_auth": False},
        {"name": "order_status", "method": "PUT", "url": f"{BASE_URL}/api/orders/{order_id}",
         "seed": seed_status, "fixed_headers": auth_headers, "toggle_auth": True},
        {"name": "user_update_self", "method": "PUT", "url": f"{BASE_URL}/api/users/{self_id}",
         "seed": seed_user_update, "fixed_headers": auth_headers, "toggle_auth": True},
        {"name": "user_update_victim", "method": "PUT", "url": f"{BASE_URL}/api/users/{victim_id}",
         "seed": seed_user_update, "fixed_headers": auth_headers, "toggle_auth": True},
        {"name": "product_create", "method": "POST", "url": f"{BASE_URL}/api/products",
         "seed": seed_product, "fixed_headers": auth_headers, "toggle_auth": True},
        {"name": "product_update", "method": "PUT", "url": f"{BASE_URL}/api/products/{product_id}",
         "seed": seed_product, "fixed_headers": auth_headers, "toggle_auth": True},
    ]

    for i in range(iterations):
        target = targets[i % len(targets)]
        candidate = mutate_json(target["seed"], rng)
        # Voi target co toggle_auth=True: xen ke co/khong co token, de
        # kiem tra CA logic nghiep vu (co token) LAN thieu-authorization
        # (khong token). login/orders giu nguyen hanh vi cu (khong doi).
        use_auth = True if not target["toggle_auth"] else (i % 2 == 0)
        headers = target["fixed_headers"] if use_auth else {}

        try:
            resp = session.request(target["method"], target["url"], json=candidate, headers=headers, timeout=5)
        except requests.exceptions.RequestException as e:
            _save_crash(target["name"], {"target": target["name"], "input": candidate, "error": str(e)}, crashes)
            crashes[-1].update({"iteration": i, "type": "CONNECTION_ERROR"})
            continue

        key = f"{target['name']}:{resp.status_code}"
        status_counter[key] = status_counter.get(key, 0) + 1

        if resp.status_code == 500:
            _save_crash(target["name"], {"target": target["name"], "input": candidate,
                                          "status": resp.status_code, "body": _safe_json(resp)}, crashes)
            crashes[-1].update({"iteration": i, "type": "HTTP_500"})

        finding = None
        if target["name"] == "orders":
            finding = check_order_response(candidate, resp)
        elif target["name"] == "order_status":
            finding = check_order_status_response(seed_status["status"], candidate, resp, had_auth=use_auth)
        elif target["name"] == "user_update_self":
            finding = check_user_update_response(candidate, resp, had_auth=use_auth, target_is_self=True)
        elif target["name"] == "user_update_victim":
            finding = check_user_update_response(candidate, resp, had_auth=use_auth, target_is_self=False)
        elif target["name"] in ("product_create", "product_update"):
            finding = check_product_response(candidate, resp, had_auth=use_auth)

        if finding:
            vuln_findings.append({"iteration": i, "target": target["name"], "input": candidate,
                                   "finding": finding, "response_status": resp.status_code,
                                   "had_auth": use_auth})

    return {
        "iterations": iterations,
        "status_counter": status_counter,
        "crashes": crashes,
        "vuln_findings": vuln_findings,
        "setup": {"order_id": order_id, "self_id": self_id, "victim_id": victim_id, "product_id": product_id},
    }


if __name__ == "__main__":
    t0 = time.time()
    result = fuzz(iterations=3500, seed=42)
    elapsed = time.time() - t0
    print(f"=== Fuzzing Hop den: {result['iterations']} lan thu trong {elapsed:.1f}s ===")
    print("Phan bo status code:", result["status_counter"])
    print(f"So crash (HTTP 500 / mat ket noi): {len(result['crashes'])}")
    for c in result["crashes"][:10]:
        print(f"  Lan thu {c['iteration']} [{c['target']}] type={c['type']} -> {c['saved_to']}")
    print(f"\nSo phat hien vi pham nghiep vu (VULN_CONFIRMED): {len(result['vuln_findings'])}")
    for v in result["vuln_findings"][:15]:
        print(f"  Lan thu {v['iteration']} [{v['target']}] auth={v['had_auth']}: {v['finding']}")

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