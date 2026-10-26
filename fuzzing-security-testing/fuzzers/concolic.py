"""Whitebox có giới hạn: trace nhánh thật → phủ định → Z3 → xác nhận API.

Mô hình kiểu viết thủ công cho 8 đại diện JSON, không symbolic toàn bộ JavaScript.
Các trường khác dùng seed hợp lệ để cô lập nguyên nhân; không cấy thêm nhánh lỗi.
"""
from copy import deepcopy
from datetime import datetime, timezone
import hashlib
from pathlib import Path
import time
import z3
from runtime import ENVIRONMENT, ROOT, load_seed, run_node, write_json

KINDS = ['number', 'numeric_string', 'invalid_string', 'object',
         'null', 'missing', 'boolean', 'array']
VALUES = [400000, '400000', 'not-a-number', {}, None, None, True, []]


def predicates(kind):
    """Ánh xạ ID trace sang điều kiện trong miền đại diện đã công bố."""
    empty = z3.Or(kind == 4, kind == 5)
    return {'order.total.required': empty, 'cast.empty': empty,
            'cast.number': kind == 0, 'cast.boolean': kind == 6,
            'cast.invalid': z3.Or(kind == 2, kind == 3, kind == 7)}


def solve_flip(trace, index):
    """Giữ tiền tố, phủ định nhánh đang xét; bỏ hậu tố đường đi cũ."""
    kind = z3.Int('total_kind')
    conditions = predicates(kind)
    solver = z3.Solver()
    solver.set(timeout=2000)
    solver.add(kind >= 0, kind < len(KINDS))
    wanted = [dict(event) for event in trace[:index + 1]]
    wanted[-1]['taken'] = not wanted[-1]['taken']
    for event in wanted:
        condition = conditions[event['id']]
        solver.add(condition if event['taken'] else z3.Not(condition))
    outcome = solver.check()
    record = {'original_path': trace, 'negated_index': index,
              'negated_branch': trace[index]['id'], 'required_prefix': wanted,
              'formula': str(solver.assertions()), 'solver_status': str(outcome)}
    if outcome == z3.sat:
        record['model_kind'] = solver.model().eval(kind).as_long()
        record['model'] = str(solver.model())
    elif outcome == z3.unknown:
        record['reason_unknown'] = solver.reason_unknown()
    return record


def make_body(kind):
    body = deepcopy(load_seed('seed_order_valid.json'))
    if kind == 5:
        body.pop('totalAmount', None)
    else:
        body['totalAmount'] = deepcopy(VALUES[kind])
    return body


def validate_trace(kind, trace):
    """Không tin mô hình nếu lệch điều kiện Node thực đo."""
    if not trace:
        raise ValueError('Missing totalAmount trace: target/setup may not have been reached')
    conditions = predicates(z3.IntVal(kind))
    for event in trace:
        expected = z3.is_true(z3.simplify(conditions[event['id']]))
        if expected != event['taken']:
            raise ValueError(f'Model/Node mismatch at {event["id"]}')


def run_concolic(output, budget=12):
    from whitebox_fuzzer import get_valid_token
    if budget < 1:
        raise ValueError('Concolic budget must be positive')
    start = time.monotonic()
    output = Path(output)
    token = get_valid_token()
    queue = [(0, None)]
    executed, solved_prefixes = {}, set()
    executions, solver_events = [], []
    while queue and len(executions) < budget:
        kind, origin = queue.pop(0)
        if kind in executed:
            if origin is not None:
                origin['covered_by_execution'] = executed[kind]
            continue
        payload = {'target': 'orders', 'body': make_body(kind), 'token': token,
                   'use_auth': True, 'trace_branches': True}
        measured = run_node('single_run_harness.js', payload)
        trace = measured.get('branch_trace', [])
        validate_trace(kind, trace)
        if origin is not None:
            prefix = origin['required_prefix']
            if trace[:len(prefix)] != prefix:
                raise ValueError('Solver input did not reach required branch prefix')
            origin['confirmed_by_execution'] = len(executions)
        violations = []
        if measured['status'] >= 500:
            violations.append('APPLICATION_HTTP_ERROR')
        if measured['status'] >= 400 and measured['orders_created']:
            violations.append('STATE_CHANGED_AFTER_REJECTION')
        if kind != 0 and measured['status'] in (200, 201):
            violations.append('INVALID_NUMERIC_TYPE_ACCEPTED')
        if kind == 0 and (measured['status'] not in (200, 201) or measured['orders_created'] != 1):
            raise ValueError('Valid seed control failed')
        replay = run_node('single_run_harness.js', payload) if violations else None
        if replay:
            validate_trace(kind, replay.get('branch_trace', []))
        record = {'index': len(executions), 'kind': KINDS[kind], 'input': payload['body'],
                  'origin': 'valid_seed' if origin is None else 'solver_generated',
                  'result': measured, 'violations': violations, 'replay': replay,
                  'reproduced_response': (replay['status'] == measured['status']
                      and replay['branch_trace'] == trace
                      and replay['orders_created'] == measured['orders_created']) if replay else None}
        executed[kind] = len(executions)
        executions.append(record)
        write_json(output / 'evidence' / f'input_{record["index"]:02d}.json', record)
        for index in range(len(trace)):
            signature = tuple((item['id'], item['taken']) for item in trace[:index + 1])
            if signature in solved_prefixes:
                continue
            solved_prefixes.add(signature)
            event = solve_flip(trace, index)
            solver_events.append(event)
            if event['solver_status'] == 'sat':
                queue.append((event['model_kind'], event))
    hashes = {}
    for name in ('fuzzers/concolic.py', 'fuzzers/whitebox_fuzzer.py',
                 'node_harness/models.js', 'node_harness/branch_trace.js',
                 'node_harness/single_run_harness.js', 'node_harness/index.js',
                 'seed_corpus/seed_order_valid.json'):
        hashes[name] = hashlib.sha256((ROOT / name).read_bytes()).hexdigest()
    elapsed = time.monotonic() - start
    replay_count = sum(item['replay'] is not None for item in executions)
    covered_lines = sorted(set().union(*(set(item['result'].get('covered_lines', []))
                                        for item in executions)))
    report = {
        'environment': ENVIRONMENT, 'mode': 'bounded_manual_concolic',
        'created_utc': datetime.now(timezone.utc).isoformat(),
        'target': 'POST /api/orders → OrderModel.save → castNumberOrThrow(totalAmount)',
        'testcase_ids': ['TC-ORD-3', 'TC-ORD-4'],
        'symbolic_variable': 'total_kind: Int in [0, 7]',
        'representatives': dict(zip(KINDS, VALUES)),
        'z3_version': z3.get_version_string(), 'source_sha256': hashes,
        'input_budget': budget, 'executions': executions, 'solver_events': solver_events,
        'counts': {'inputs': len(executions),
                   'replay_inputs': sum(item['replay'] is not None for item in executions),
                   'http_5xx_inputs': sum(item['result']['status'] >= 500 for item in executions),
                   'violating_inputs': sum(bool(item['violations']) for item in executions),
                   'unsat_queries': sum(item['solver_status'] == 'unsat' for item in solver_events)},
        'elapsed_seconds': elapsed,
        'campaign_inputs_per_second': (len(executions) + replay_count) / elapsed,
        'throughput_scope': 'Includes token setup, Node startup, coverage conversion, solver, replay and evidence writing; not pure target speed.',
        'coverage': {'file': 'node_harness/index.js', 'covered_lines': covered_lines,
                     'line_count': len(covered_lines), 'includes_setup': True,
                     'percentage': None, 'branch_or_edge_coverage': None},
        'pending_candidates': len(queue),
        'limitations': [
            'Manual symbolic model of selected guards, not automatic symbolic execution of JavaScript.',
            'Eight JSON representatives only; not complete numeric/string coverage.',
            'Other fields fixed to valid seed; simulated datastore, not MongoDB or production.',
            'No added fault branch; findings belong to existing harness behavior.',
            'UNSAT holds only for the encoded prefix and representative domain.',
            'Line coverage includes setup; not branch/edge coverage of the whole app.',
            'Repeated status/path is not stack-trace deduplication or a count of unique bugs.',
            'No sanitizer: HTTP 5xx is not a confirmed memory error or process crash.',
            'Targeted concolic campaign, not an automatic plateau-triggered hybrid engine.',
        ],
    }
    write_json(output / 'report.json', report)
    lines = ['# Whitebox concolic có giới hạn', '', report['target'], '',
             '| Input | Nguồn | HTTP | Vi phạm | Tái hiện response/trace |',
             '|---|---|---|---|---|']
    for item in executions:
        lines.append(f"| {item['kind']} | {item['origin']} | {item['result']['status']} | {', '.join(item['violations']) or 'Không quan sát'} | {item['reproduced_response']} |")
    lines += ['', '## Điều kiện đường đi và solver', '']
    for event in solver_events:
        lines += [f"- Phủ định `{event['negated_branch']}`: **{event['solver_status']}**; model `{event.get('model', '')}`.",
                  '```text', event['formula'], '```']
    lines += ['', '## Giới hạn', ''] + ['- ' + value for value in report['limitations']]
    (output / 'report.md').write_text('\n'.join(lines) + '\n', encoding='utf-8')
    return report
