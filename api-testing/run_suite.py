"""Deterministic API acceptance tests; reuse the existing target and oracles."""
from __future__ import annotations

import argparse
from collections import Counter
from datetime import datetime, timezone
import hashlib
import json
from pathlib import Path
import platform
import subprocess
import sys
import time
import uuid
import xml.etree.ElementTree as ET

REPO = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(REPO / 'fuzz-testing/fuzzers'))
from spec_campaign import application_cases, build_report, execute, read_specs
from testcases import scenarios
from runtime import ENVIRONMENT, write_json

# Positive controls, selected from the same acceptance catalogue, not alternate assertions.
SMOKE_IDS = {'TC-AUTH-5', 'TC-ORD-19', 'TC-OS-5', 'TC-PRD-4'}


def exit_code(results, planned_count):
    if len(results) != planned_count or any(r['status'] == 'ERROR' for r in results):
        return 2
    return 1 if any(r['status'] != 'PASS' for r in results) else 0


def junit(results, plans):
    by_id = {r['case']['id']: r for r in results}
    suite = ET.Element('testsuite', name='VFitAI API acceptance', tests=str(len(plans)))
    counts = Counter()
    for plan in plans:
        result = by_id.get(plan['id'])
        node = ET.SubElement(suite, 'testcase', name=plan['id'], classname=plan['testcase'],
                             time=str(result['elapsed_seconds'] if result else 0))
        if result is None:
            ET.SubElement(node, 'skipped', message='NOT_RUN: runner stopped before this scenario')
            counts['skipped'] += 1
        elif result['status'] == 'ERROR':
            ET.SubElement(node, 'error', message=result.get('error', 'Runner error'))
            counts['errors'] += 1
        elif result['status'] != 'PASS':
            failure = ET.SubElement(node, 'failure', message='Acceptance oracle violated')
            failure.text = json.dumps({'check': plan['check'],
                'observations': result['evidence'].get('observations', [])}, ensure_ascii=False)
            counts['failures'] += 1
    for key in ('failures', 'errors', 'skipped'):
        suite.set(key, str(counts[key]))
    return ET.tostring(suite, encoding='unicode', xml_declaration=True)


def source_manifest():
    files = [Path(__file__)]
    for folder, pattern in [('fuzz-testing/fuzzers', '*.py'),
                            ('fuzz-testing/target', '*.js'),
                            ('fuzz-testing/target/config', '*.js'),
                            ('fuzz-testing/target/routes', '*.js'),
                            ('fuzz-testing/data/seeds', '*.json'),
                            ('fuzz-testing/docs/specifications', 'Module_*_spec.xlsx')]:
        files.extend((REPO / folder).glob(pattern))
    return {p.relative_to(REPO).as_posix(): hashlib.sha256(p.read_bytes()).hexdigest()
            for p in sorted(set(files)) if 'node_modules' not in p.parts}


def render_markdown(report):
    lines = ['# API acceptance report', '',
        f"Suite: {report['suite']}; environment: `{report['environment']}`.",
        f"Created: {report['created_utc']}; git: `{report['git_commit']}`.",
        f"Scenario counts: {report['scenario_counts']}; unexecuted: {report['not_run']}.",
        f"Testcase counts in selected scope: {report['testcase_counts']}.", '',
        'All inputs are deterministic; no random mutation is performed by this suite.', '',
        '| Scenario | Testcase | Status | Evidence |', '|---|---|---|---|']
    for result in report['executions']:
        lines.append(f"| {result['case']['id']} | {result['case']['testcase']} | "
                     f"{result['status']} | [{result['evidence_file']}]({result['evidence_file']}) |")
    lines += ['', 'FAIL means the target violated the acceptance oracle. ERROR means a runner,',
              'setup or oracle failure. Neither is converted into PASS for CI.',
              'Smoke covers only its named controls; it is not the full acceptance suite.',
              'Findings are not a count of independent root causes. Target uses simulated storage.', '']
    return '\n'.join(lines)


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--suite', choices=['smoke', 'full'], default='full')
    parser.add_argument('--testcase', action='append', help='Filter within selected suite; repeatable')
    parser.add_argument('--output', type=Path)
    args = parser.parse_args(argv)
    plans = scenarios(fuzz_cases=0, rng_seed=7)
    if args.suite == 'smoke':
        plans = [p for p in plans if p['testcase'] in SMOKE_IDS]
    if args.testcase:
        unknown = set(args.testcase) - {p['testcase'] for p in plans}
        if unknown:
            parser.error(f'Unknown testcase in this suite: {sorted(unknown)}')
        plans = [p for p in plans if p['testcase'] in args.testcase]
    if not plans:
        parser.error('No executable scenarios selected')
    specs = read_specs()
    included, excluded = application_cases(specs)
    if not {p['testcase'] for p in plans} <= {e['testcase']['ID'] for e in included}:
        parser.error('Plan references an unknown API testcase')
    output = args.output or REPO / 'reports/runs' / f'api-{uuid.uuid4().hex[:12]}'
    if output.exists() and any(output.iterdir()):
        parser.error('Output must be new or empty; evidence is never overwritten')
    output.mkdir(parents=True, exist_ok=True)
    started = time.monotonic()
    manifest = source_manifest()
    results = []
    for index, plan in enumerate(plans, 1):
        result = execute(plan)
        result['evidence_file'] = f'evidence/{index:03d}.json'
        write_json(output / result['evidence_file'], result)
        results.append(result)
        print(f"[{index}/{len(plans)}] {plan['id']}: {result['status']}", flush=True)
        if result['status'] == 'ERROR':
            break
    selected_ids = {p['testcase'] for p in plans}
    traceability = [e for e in build_report(specs, results, plans)
                    if e['testcase']['ID'] in selected_ids]
    git = subprocess.run(['git', 'rev-parse', 'HEAD'], cwd=REPO, capture_output=True, text=True)
    node = subprocess.run(['node', '--version'], capture_output=True, text=True)
    report = {'created_utc': datetime.now(timezone.utc).isoformat(),
        'suite': args.suite, 'environment': ENVIRONMENT, 'git_commit': git.stdout.strip(),
        'python': platform.python_version(), 'node': node.stdout.strip(), 'platform': platform.platform(),
        'source_sha256': manifest, 'elapsed_seconds': time.monotonic() - started,
        'planned_scenarios': len(plans), 'not_run': len(plans) - len(results),
        'scenario_counts': dict(Counter(r['status'] for r in results)),
        'testcase_counts': dict(Counter(e['status'] for e in traceability)),
        'excluded_spec_testcases': len(excluded), 'traceability': traceability,
        'executions': results}
    write_json(output / 'report.json', report)
    (output / 'report.md').write_text(render_markdown(report), encoding='utf-8')
    (output / 'junit.xml').write_text(junit(results, plans), encoding='utf-8')
    print(output / 'report.md', flush=True)
    return exit_code(results, len(plans))


if __name__ == '__main__':
    if hasattr(sys.stdout, 'reconfigure'):
        sys.stdout.reconfigure(encoding='utf-8')
    raise SystemExit(main())
