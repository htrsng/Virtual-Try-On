"""
Chuong 4 - Fuzzing Hop den CHI nham vao POST /api/auth/login
================================================================
Ban RUT GON, AN TOAN de chay truc tiep tren server THAT cua ban (co
MongoDB that). KHONG dung toi /api/orders nen KHONG tao don hang that,
KHONG gui email that - chi test 1 endpoint dang nhap.

CACH CHAY:
  pip install requests
  set TARGET_URL=http://localhost:5050   (hoac export TARGET_URL=...)
  python blackbox_fuzzer_login_only.py

Neu ban co san 1 tai khoan test that trong MongoDB, sua SEED_EMAIL /
SEED_PASSWORD ben duoi cho khop (khong bat buoc phai dang nhap thanh
cong - fuzzer van chay binh thuong du login that bai, vi muc tieu la
tim CRASH chu khong phai dang nhap thanh cong).
"""
from __future__ import annotations
import json
import os
import random
import time
import requests

TARGET_URL = os.environ.get("TARGET_URL", "http://localhost:5050")
LOGIN_URL = f"{TARGET_URL}/api/auth/login"

SEED_EMAIL = os.environ.get("SEED_EMAIL", "test@example.com")
SEED_PASSWORD = os.environ.get("SEED_PASSWORD", "Test123!")

CRASH_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "crashes_real_server")
os.makedirs(CRASH_DIR, exist_ok=True)

DICTIONARY = [
    None, "", 0, -1, -999999999, 999999999999999999,
    "A" * 5000, "' OR '1'='1", "{\"$ne\": null}", "<script>alert(1)</script>",
    "NaN", "Infinity", -0.5, True, False, [], {}, "🙂" * 50, "\x00\x01",
    "../../../etc/passwd", "%s%s%s%s", "admin", "0000000000",
]

SEED = {"email": SEED_EMAIL, "password": SEED_PASSWORD}


def mutate(payload: dict, rng: random.Random) -> dict:
    candidate = json.loads(json.dumps(payload))
    keys = list(candidate.keys())
    op = rng.choice(["field_value", "delete_field", "type_confuse"])
    if op == "field_value":
        k = rng.choice(keys)
        candidate[k] = rng.choice(DICTIONARY)
    elif op == "delete_field" and keys:
        k = rng.choice(keys)
        del candidate[k]
    elif op == "type_confuse":
        k = rng.choice(keys)
        candidate[k] = rng.choice([12345, [1, 2, 3], {"nested": True}, None])
    return candidate


def fuzz(iterations: int = 300, seed: int = 42) -> dict:
    rng = random.Random(seed)
    session = requests.Session()
    crashes = []
    status_counter: dict[str, int] = {}
    enum_findings = []  # phat hien user enumeration (404 vs 401 khac biet)

    for i in range(iterations):
        candidate = mutate(SEED, rng)
        try:
            resp = session.post(LOGIN_URL, json=candidate, timeout=5)
        except requests.exceptions.RequestException as e:
            crash_id = len(crashes)
            path = os.path.join(CRASH_DIR, f"login_crash_{crash_id}.json")
            with open(path, "w", encoding="utf-8") as f:
                json.dump({"input": candidate, "error": str(e)}, f, ensure_ascii=False, indent=2)
            crashes.append({"iteration": i, "input": candidate, "type": "CONNECTION_ERROR",
                             "detail": str(e), "saved_to": path})
            continue

        key = str(resp.status_code)
        status_counter[key] = status_counter.get(key, 0) + 1

        if resp.status_code == 500:
            crash_id = len(crashes)
            path = os.path.join(CRASH_DIR, f"login_crash_{crash_id}.json")
            try:
                body = resp.json()
            except Exception:
                body = resp.text[:500]
            with open(path, "w", encoding="utf-8") as f:
                json.dump({"input": candidate, "status": resp.status_code, "body": body},
                           f, ensure_ascii=False, indent=2)
            crashes.append({"iteration": i, "input": candidate, "type": "HTTP_500", "saved_to": path})

        if resp.status_code == 404:
            enum_findings.append({"iteration": i, "input": candidate, "note": "email khong ton tai (404)"})

    return {"iterations": iterations, "status_counter": status_counter,
            "crashes": crashes, "enum_findings_sample": enum_findings[:5]}


if __name__ == "__main__":
    print(f"Nham vao: {LOGIN_URL}")
    t0 = time.time()
    result = fuzz(iterations=300, seed=42)
    elapsed = time.time() - t0
    print(f"\n=== Xong: {result['iterations']} lan thu trong {elapsed:.1f}s ===")
    print("Phan bo status code:", result["status_counter"])
    print(f"So crash (HTTP 500 / mat ket noi): {len(result['crashes'])}")
    for c in result["crashes"][:15]:
        print(f"  Lan thu {c['iteration']} type={c['type']} -> {c['saved_to']}")

    out_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "results", "ch4_real_server_login_results.json")
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(result, f, ensure_ascii=False, indent=2)
    print(f"\nDa ghi ket qua: {out_path}")
