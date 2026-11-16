"""Replay representative acceptance failures after strict source verification."""
import argparse
from collections import Counter
from datetime import datetime, timezone
import hashlib
import json
from pathlib import Path
import sys

from run_suite import REPO
from runtime import ENVIRONMENT, write_json
from spec_campaign import execute


def verify_sources(source, root=REPO):
    if source.get('environment') != ENVIRONMENT:
        raise ValueError('Replay supports the simulated API environment only')
    hashes = source.get('source_sha256')
    if not isinstance(hashes, dict) or not hashes:
        raise ValueError('Missing source manifest; refusing unverified replay')
    for name, digest in hashes.items():
        path = (root / name).resolve()
        if not path.is_relative_to(root.resolve()):
            raise ValueError(f'Unsafe manifest path: {name}')
        if not path.is_file() or hashlib.sha256(path.read_bytes()).hexdigest() != digest:
            raise ValueError(f'Source mismatch: {name}. Create a new acceptance run; do not bypass hashes.')


def select_failures(source, testcase_ids=None):
    selected = {}
    for result in source['executions']:
        if result['status'] == 'FAIL':
            selected.setdefault(result['case']['testcase'], result['case'])
    if not selected:
        raise ValueError('No failing acceptance scenario to replay')
    if testcase_ids:
        unknown = set(testcase_ids) - selected.keys()
        if unknown:
            raise ValueError(f'No failing scenario for: {sorted(unknown)}')
        selected = {tc: case for tc, case in selected.items() if tc in testcase_ids}
    return selected


def conclusion(statuses):
    if not statuses or 'ERROR' in statuses:
        return 'INCONCLUSIVE'
    return 'REPRODUCED' if all(s == 'FAIL' for s in statuses) else 'NOT_REPRODUCED'


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--report', type=Path, default=REPO / 'reports/baseline/api/report.json')
    parser.add_argument('--output', type=Path, required=True)
    parser.add_argument('--repeats', type=int, default=2)
    parser.add_argument('--testcase', action='append')
    args = parser.parse_args()
    if args.repeats < 1:
        parser.error('--repeats must be positive')
    try:
        source = json.loads(args.report.read_text(encoding='utf-8'))
        verify_sources(source)
        cases = select_failures(source, args.testcase)
    except (OSError, ValueError, KeyError) as error:
        parser.error(str(error))
    if args.output.exists() and any(args.output.iterdir()):
        parser.error('Output must be new or empty')
    args.output.mkdir(parents=True, exist_ok=True)
    records = []
    for testcase, case in cases.items():
        runs = []
        for attempt in range(1, args.repeats + 1):
            result = execute(case)
            name = f'evidence/{testcase}-{attempt}.json'
            write_json(args.output / name, result)
            runs.append({'status': result['status'], 'evidence': name})
        state = conclusion([r['status'] for r in runs])
        records.append({'testcase': testcase, 'scenario': case['id'], 'runs': runs,
                        'conclusion': state, 'fixed': False,
                        'regression_scenario': case['id']})
        print(f'{testcase}: {state}', flush=True)
    report = {'created_utc': datetime.now(timezone.utc).isoformat(), 'environment': ENVIRONMENT,
        'input_report': str(args.report), 'input_report_sha256': hashlib.sha256(args.report.read_bytes()).hexdigest(),
        'source_sha256': source['source_sha256'],
        'replay_runner_sha256': hashlib.sha256(Path(__file__).read_bytes()).hexdigest(),
        'repeats': args.repeats, 'representatives': len(records),
        'counts': dict(Counter(r['conclusion'] for r in records)), 'records': records,
        'scope': 'One failing representative per testcase, fresh Node per attempt. Not every original input; no fixes verified.'}
    write_json(args.output / 'report.json', report)
    lines = ['# Acceptance failure replay', '', report['scope'], '',
             '| Testcase | Fixed scenario | Replay | Result |', '|---|---|---|---|']
    for record in records:
        links = ', '.join(f"[{i+1}: {r['status']}]({r['evidence']})" for i,r in enumerate(record['runs']))
        lines.append(f"| {record['testcase']} | {record['scenario']} | {links} | {record['conclusion']} |")
    lines += ['', 'Exit 0 means all selected failures reproduced; target acceptance still FAIL.',
              'NOT_REPRODUCED needs investigation; it does not prove a fix.', '']
    (args.output / 'report.md').write_text('\n'.join(lines), encoding='utf-8')
    if any(r['conclusion'] == 'INCONCLUSIVE' for r in records):
        return 2
    return 0 if all(r['conclusion'] == 'REPRODUCED' for r in records) else 1


if __name__ == '__main__':
    raise SystemExit(main())
