
import argparse
from contextlib import nullcontext
import os
import math
from collections import Counter
from pathlib import Path
import random
import time
import uuid

import requests
from finding_types import summarize_evidence

from fuzzer_common import (
    check_order_response, check_order_status_response, check_product_response,
    check_user_update_response, mutate_json,
)
from runtime import ENVIRONMENT, ROOT, HarnessError, load_seed, simulated_http_server, write_json


# Kiểm tra bước chuẩn bị thành công trước khi dùng response.
def setup_request(session, method, url, **kwargs):
    response = session.request(method, url, timeout=5, **kwargs)
    if response.status_code not in (200, 201):
        raise HarnessError(f"Setup {method} failed: HTTP {response.status_code}", "SETUP_ERROR")
    return response.json()


# Kiểm tra danh mục; trả None nếu không đủ dữ liệu đối chiếu.
def read_catalog_snapshot(products):
    """Use only a complete numeric catalog; never treat corrupt rows as absent IDs."""
    if not isinstance(products, list):
        return None
    catalog = {}
    for product in products:
        if not isinstance(product, dict):
            return None
        product_id, price = product.get("id"), product.get("price")
        if (isinstance(product_id, bool) or not isinstance(product_id, (str, int))
                or isinstance(price, bool) or not isinstance(price, (int, float))
                or not math.isfinite(price) or price <= 0 or product_id in catalog):
            return None
        catalog[product_id] = price
    return catalog


# Chuẩn bị dữ liệu, đột biến input, gửi request và lưu bằng chứng.
def run_campaign(session, base_url, iterations, seed, output):
    login = load_seed("seed_login_valid.json")
    order = load_seed("seed_order_valid.json")
    status = load_seed("seed_order_status_valid.json")
    user = load_seed("seed_user_update_valid.json")
    product = load_seed("seed_product_valid.json")

    logged_in = setup_request(session, "POST", base_url + "/api/auth/login", json=login)
    if not logged_in.get("token"):
        raise HarnessError("Login setup did not return a token", "SETUP_ERROR")
    headers = {"Authorization": f"Bearer {logged_in['token']}"}
    created = setup_request(session,
         "POST",
         base_url + "/api/orders",
         json=order,
         headers=headers)["order"]
    users = setup_request(session, "GET", base_url + "/api/users")
    products = setup_request(session, "GET", base_url + "/api/products")
    self_user = next((u for u in users if u.get("email") == login["email"]), None)
    victim = next((u for u in users if u.get("email") == "victim@test.com"), None)
    if not self_user or not victim or not products:
        raise HarnessError("Missing seeded users or product", "SETUP_ERROR")
    current_status = created.get("status", status["status"])
    targets = [
        ("login", "POST", "/api/auth/login", login, False),
        ("orders", "POST", "/api/orders", order, False),
        ("order_status", "PUT", f"/api/orders/{created['_id']}", status, True),
        ("user_update_self", "PUT", f"/api/users/{self_user['_id']}", user, True),
        ("user_update_victim", "PUT", f"/api/users/{victim['_id']}", user, True),
        ("product_create", "POST", "/api/products", product, True),
        ("product_update", "PUT", f"/api/products/{products[0]['id']}", product, True),
    ]
    rng = random.Random(seed)
    errors, findings = [], []
    catalog_observations = []
    statuses = Counter()
    for iteration in range(iterations):
        target, method, route, initial, toggle_auth = targets[iteration % len(targets)]
        candidate = mutate_json(initial, rng)
        use_auth = True if not toggle_auth else iteration % 2 == 0
        request_headers = headers if use_auth and target != "login" else {}
        catalog = None
        try:
            if target == "orders":
                snapshot = setup_request(session, "GET", base_url + "/api/products")
                catalog = read_catalog_snapshot(snapshot)
                if catalog is None:
                    record = {"iteration": iteration, "type": "INVALID_CATALOG",
                        "catalog": snapshot,
                        "skipped_check": "Catalog membership and catalog-based order total; other order checks still run."}
                    path = write_json(output / "catalog_observations" / f"catalog_{iteration:04d}.json",
                         record)
                    catalog_observations.append({**record, "saved_to": str(path)})
            response = session.request(method,
                 base_url + route,
                 json=candidate,
                 headers=request_headers,
                 timeout=5)
            statuses[f"{target}:{response.status_code}"] += 1
        except (requests.RequestException, HarnessError) as error:
            kind = error.kind if isinstance(error,
                 HarnessError) else ("TIMEOUT" if isinstance(error,
                 requests.Timeout) else "CONNECTION_ERROR")
            record = {"iteration": iteration,
                 "target": target,
                 "input": candidate,
                 "type": kind,
                 "detail": str(error), "had_auth": use_auth}
            path = write_json(output / "errors" / f"error_{len(errors):04d}.json", record)
            errors.append({**record, "saved_to": str(path)})
            continue

        if response.status_code >= 500:
            try:
                body = response.json()
            except ValueError:
                body = response.text[:1000]
            record = {"iteration": iteration, "target": target, "input": candidate,
                "type": "HTTP_5XX", "status": response.status_code, "body": body, "had_auth": use_auth}
            path = write_json(output / "errors" / f"error_{len(errors):04d}.json", record)
            errors.append({**record, "saved_to": str(path)})

        finding = None
        if target == "orders":
            finding = check_order_response(candidate, response, catalog)
        elif target == "order_status":
            finding = check_order_status_response(current_status, candidate, response, use_auth)
            if response.status_code in (200, 201):
                current_status = response.json().get("status", current_status)
        elif target in ("user_update_self", "user_update_victim"):
            finding = check_user_update_response(candidate,
                 response,
                 use_auth,
                 target == "user_update_self")
        elif target in ("product_create", "product_update"):
            finding = check_product_response(candidate, response, use_auth)
        if finding:
            findings.append({"iteration": iteration, "target": target, "input": candidate,
                "finding": finding, "had_auth": use_auth, "response_status": response.status_code})
    return {"environment": ENVIRONMENT, "seed": seed, "iterations": iterations,
        "status_counter": dict(statuses), "errors": errors, "vuln_findings": findings,
        "catalog_observations": catalog_observations,
        "evidence_summary": summarize_evidence(errors, findings),
        "limitations": ["Simulated HTTP app; state is shared within the campaign.",
            "HTTP errors and finding occurrences are not unique vulnerabilities."]}


# Điều phối một lần chạy fuzzing và trả kết quả tổng hợp.
def fuzz(iterations=3500, seed=42, output=None, base_url=None):
    if iterations < 0:
        raise ValueError("Iteration budget must be nonnegative")
    output = Path(output) if output else ROOT / "results/blackbox" / uuid.uuid4().hex[:12]
    target = nullcontext(base_url.rstrip("/")) if base_url else simulated_http_server(output / "harness.log")
    with target as base_url, requests.Session() as session:
        session.trust_env = False  # Loopback traffic must not use machine proxy settings.
        identity = setup_request(session, "GET", base_url + "/__fuzzing_environment")
        if identity.get("environment") != ENVIRONMENT:
            raise HarnessError("Target is not the simulated sales harness", "SETUP_ERROR")
        result = run_campaign(session, base_url, iterations, seed, output)
    result["base_url"] = base_url
    result["server_lifecycle"] = "external" if base_url and isinstance(target,
         nullcontext) else "automatic"
    result["artifact_dir"] = str(output)
    return result


# Đọc tham số dòng lệnh và bắt đầu chạy chương trình.
def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--iterations", type=int, default=3500)
    parser.add_argument("--seed", type=int, default=42)
    parser.add_argument("--output", type=Path)
    parser.add_argument("--base-url", default=os.environ.get("TARGET_URL"),
        help="Existing simulated HTTP harness; defaults to TARGET_URL or automatic startup")
    args = parser.parse_args()
    if args.iterations < 0:
        parser.error("Iteration budget must be nonnegative")
    start = time.monotonic()
    result = fuzz(args.iterations, args.seed, args.output, args.base_url)
    result["elapsed_seconds"] = time.monotonic() - start
    path = write_json(Path(result["artifact_dir"]) / "report.json", result)
    print(f"Inputs: {result['iterations']}; errors: {len(result['errors'])}; findings: {len(result['vuln_findings'])}")
    print(path)
    return 2 if any(e["type"] != "HTTP_5XX" for e in result["errors"]) else 0


def investigate_boundaries(report, output, max_cases=6, budget=16):
    """Blackbox: mỗi phép đo qua HTTP trên dữ liệu seed mới, không đọc coverage."""
    from boundaries import discover, signature
    from whitebox_fuzzer import TARGETS, check_finding, error_type

    investigations, seen = [], set()
    for record in report['errors'] + report['vuln_findings']:
        key = (record.get('target'), repr(record.get('input')), record.get('had_auth'))
        if (key in seen or record.get('target') not in TARGETS
                or type(record.get('had_auth')) is not bool
                or not isinstance(record.get('input'), dict)):
            continue
        seen.add(key)
        if len(investigations) >= max_cases:
            break
        observations = []

        def probe(body):
            # Không dùng lại state đã bị mutation trước đó làm thay đổi.
            with simulated_http_server(Path(output) / 'boundary_harness.log') as url, requests.Session() as session:
                session.trust_env = False
                login = setup_request(session, 'POST', url + '/api/auth/login', json=load_seed('seed_login_valid.json'))
                headers = {'Authorization': 'Bearer ' + login['token']}
                target = record['target']
                initial = None
                if target == 'orders':
                    method, route = 'POST', '/api/orders'
                elif target == 'order_status':
                    order = setup_request(session, 'POST', url + '/api/orders', json=load_seed('seed_order_valid.json'), headers=headers)['order']
                    initial = order['status']
                    method, route = 'PUT', '/api/orders/' + order['_id']
                elif target.startswith('user_update'):
                    users = setup_request(session, 'GET', url + '/api/users')
                    email = 'victim@test.com' if target.endswith('victim') else 'fuzzuser@test.com'
                    user = next(u for u in users if u['email'] == email)
                    method, route = 'PUT', '/api/users/' + user['_id']
                else:
                    products = setup_request(session, 'GET', url + '/api/products')
                    method, route = ('POST', '/api/products') if target == 'product_create' else ('PUT', '/api/products/' + str(products[0]['id']))
                catalog = read_catalog_snapshot(setup_request(session, 'GET', url + '/api/products')) if target == 'orders' else None
                response = session.request(method, url + route, json=body,
                                           headers=headers if record['had_auth'] else {}, timeout=5)
                try:
                    payload = response.json()
                except ValueError:
                    payload = {}
                measured = {'ok': True, 'status': response.status_code, 'body': payload,
                            'catalog': catalog, 'initial_status': initial}
                symptom = signature(error_type(measured), check_finding(target, body, measured, record['had_auth']))
                observations.append({'input': body, 'status': response.status_code,
                                     'body': payload, 'signature': symptom})
                return symptom

        try:
            investigation = discover(record, probe, budget)
        except (HarnessError, requests.RequestException) as error:
            investigation = {'target': record['target'], 'status': 'INCONCLUSIVE_INFRASTRUCTURE',
                             'detail': str(error), 'regions': []}
        evidence = write_json(Path(output) / 'boundary_evidence' / f'case_{len(investigations):03d}.json', observations)
        investigation['evidence_path'] = str(evidence)
        investigations.append(investigation)
    return investigations


if __name__ == "__main__":
    raise SystemExit(main())
