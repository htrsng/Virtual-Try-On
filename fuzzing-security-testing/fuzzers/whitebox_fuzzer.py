
"""Coverage-guided và whitebox concolic có giới hạn (--concolic).

Chế độ cũ chọn input theo coverage; --concolic dùng trace nhánh và Z3.
"""
import argparse
import sys
from collections import deque
from pathlib import Path
import random
import time
import uuid
from finding_types import local_neighbors, summarize_evidence
from runtime import read_json

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
        "errors": errors, "vuln_findings": findings,
        "evidence_summary": summarize_evidence(errors, findings)}


def focus_blackbox(report_path, iterations=12, seed=7, output=None, max_cases=6):
    """Chạy lại input blackbox, khảo sát lân cận rồi dùng coverage chọn cha."""
    source = read_json(report_path)
    if source.get('environment') != ENVIRONMENT:
        raise ValueError('Expected a simulated blackbox report')
    output = Path(output) if output else ROOT / 'results/whitebox' / uuid.uuid4().hex[:12]
    selected, skipped, seen = [], [], set()
    for record in source.get('errors', []) + source.get('vuln_findings', []):
        if record.get('target') not in TARGETS or not isinstance(record.get('input'), dict):
            skipped.append({'target': record.get('target'), 'reason': 'Unsupported target/input'})
            continue
        if type(record.get('had_auth')) is not bool:
            skipped.append({'target': record.get('target'), 'reason': 'Missing auth context in old report'})
            continue
        signature = (record['target'], repr(record['input']), record['had_auth'])
        if signature not in seen:
            seen.add(signature)
            if len(selected) < max_cases:
                selected.append(record)
    if not selected:
        raise ValueError('No supported inputs with auth context; run blackbox again with current code')
    rng = random.Random(seed)
    token = get_valid_token()
    errors, findings, investigations = [], [], []
    for index, record in enumerate(selected):
        probes = local_neighbors(record['input'], max(1, min(6, iterations // 2)))
        queue, covered, attempts = [], set(), []
        for iteration in range(iterations):
            if iteration < len(probes):
                candidate = probes[iteration]
            else:
                parent = queue.pop() if queue else record['input']
                candidate = mutate_json(parent, rng)
            result = run_single(record['target'], candidate, token, record['had_auth'])
            kind = error_type(result)
            finding = check_finding(record['target'], candidate, result, record['had_auth']) if result.get('ok') else None
            lines = set(result.get('covered_lines', []))
            if lines - covered:
                queue.append(candidate)
            covered.update(lines)
            attempt = {'target': record['target'], 'input': candidate, 'had_auth': record['had_auth'],
                       'phase': 'exact_replay' if iteration == 0 else 'neighbor_probe' if iteration < len(probes) else 'coverage_mutation',
                       'type': kind, 'finding': finding, 'result': result}
            attempts.append(attempt)
            if kind:
                errors.append({**attempt, 'type': kind})
            if finding:
                findings.append(attempt)
        write_json(output / 'evidence' / f'case_{index:03d}.json', attempts)
        investigations.append({'target': record['target'], 'original_input': record['input'],
                               'iterations': len(attempts), 'covered_lines': sorted(covered),
                               'replay_type': attempts[0]['type'], 'replay_finding': attempts[0]['finding']})
    return {'environment': ENVIRONMENT, 'artifact_dir': str(output), 'mode': 'blackbox_to_whitebox',
            'blackbox_report': str(Path(report_path).resolve()), 'seed': seed,
            'iterations_used': sum(item['iterations'] for item in investigations),
            'investigations': investigations, 'skipped': skipped,
            'errors': errors, 'vuln_findings': findings,
            'evidence_summary': summarize_evidence(errors, findings),
            'limitations': ['Neighbor probes sample local values; they do not prove a complete failure boundary.',
                            'Fresh harness data differs from stateful blackbox; failed reproduction is not proof that the finding is false.',
                            'Targets are capped; not all blackbox findings are investigated.',
                            'No sanitizer instrumentation: no confirmed memory corruption claim.']}


# Đọc tham số dòng lệnh và bắt đầu chạy chương trình.
def focus_boundaries(investigations, budget, output):
    """Đo coverage/trace bên trong miền blackbox; giữ nguyên các trường khác."""
    from boundaries import bounded_values, materialize, signature
    cases = [case for case in investigations if case.get('status') == 'SAMPLED']
    if not cases:
        return {'status': 'NO_REPRODUCIBLE_REGION', 'regions': []}
    token = get_valid_token()
    reports = []
    for case in cases:
        for region in case['regions']:
            attempts = []
            for value in bounded_values(region, budget):
                body = materialize(region, value)
                try:
                    measured = run_node('single_run_harness.js', {
                        'target': case['target'], 'body': body, 'token': token,
                        'use_auth': case['had_auth'], 'trace_branches': True})
                except HarnessError as error:
                    attempts.append({'value': value, 'status': 'INCONCLUSIVE_INFRASTRUCTURE',
                                     'detail': str(error)})
                    continue
                found = check_finding(case['target'], body, measured, case['had_auth'])
                actual = signature(error_type(measured), found)
                attempts.append({'value': value, 'input': body,
                                 'same_failure': actual == case['expected_signature'],
                                 'signature': actual, 'result': measured})
            reports.append({'target': case['target'], 'path': region['path'],
                            'axis': region['axis'], 'lower': region['lower'], 'upper': region['upper'],
                            'blackbox_transitions': region['transitions'], 'attempts': attempts,
                            'complete': False})
    result = {'status': 'EXECUTED', 'regions': reports,
              'limitations': ['Integer values, Unicode character lengths and finite JSON representatives are explored.',
                              'Each field is varied alone; field combinations and prior state sequences are not reconstructed.',
                              'HTTP_5XX identifies a symptom class, not a unique root cause.',
                              'Branch traces currently cover totalAmount guards only; other targets use line coverage.',
                              'Concolic Z3 remains a separate representative-type analysis; this stage measures bounded concrete inputs.',
                              'Unmeasured values remain unknown; failure need not be monotonic.']}
    write_json(Path(output) / 'bounded_analysis.json', result)
    return result


def main():
    if hasattr(sys.stdout, 'reconfigure'):
        sys.stdout.reconfigure(encoding='utf-8')
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--iterations-per-target", type=int, default=45)
    parser.add_argument("--seed", type=int, default=7)
    parser.add_argument("--output", type=Path)
    parser.add_argument('--blackbox-report', type=Path)
    parser.add_argument('--max-cases', type=int, default=6)
    parser.add_argument('--concolic', action='store_true', help='Trace totalAmount → Z3 → xác nhận API')
    args = parser.parse_args()
    if args.concolic:
        if args.iterations_per_target < 1:
            parser.error('Concolic budget must be positive')
        if args.blackbox_report:
            parser.error('--concolic uses the valid order seed; run --blackbox-report separately')
        from concolic import run_concolic
        output = args.output or ROOT / 'results/concolic' / uuid.uuid4().hex[:12]
        report = run_concolic(output, args.iterations_per_target)
        print(f"Concolic: {report['counts']}")
        print(output / 'report.md')
        return 0
    if args.iterations_per_target < 0:
        parser.error("Iteration budget must be nonnegative")
    if args.blackbox_report and (args.iterations_per_target < 1 or args.max_cases < 1):
        parser.error('Focused replay requires positive budgets')
    start = time.monotonic()
    result = (focus_blackbox(args.blackbox_report, args.iterations_per_target, args.seed, args.output, args.max_cases)
              if args.blackbox_report else fuzz(args.iterations_per_target, args.seed, args.output))
    if args.blackbox_report:
        source = read_json(args.blackbox_report)
        result['bounded_analysis'] = focus_boundaries(source.get('boundaries', []),
                                                      args.iterations_per_target, result['artifact_dir'])
    result["elapsed_seconds"] = time.monotonic() - start
    path = write_json(Path(result["artifact_dir"]) / "report.json", result)
    print(f"Inputs: {result['iterations_used']}; errors: {len(result['errors'])}; findings: {len(result['vuln_findings'])}")
    print(path)
    return 2 if any(e["type"] != "HTTP_5XX" for e in result["errors"]) else 0


if __name__ == "__main__":
    raise SystemExit(main())
