"""Run scoped components and optional legacy diagnostics without hiding failures."""
import argparse
from datetime import datetime, timezone
import hashlib
import json
import os
from pathlib import Path
import re
import subprocess
import sys
import uuid

REPO = Path(__file__).resolve().parents[1]
SOURCE_REPO = REPO.parents[1]
CLIENT = SOURCE_REPO / 'client'


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--checks', choices=['components', 'legacy', 'all'], default='components')
    parser.add_argument('--output', type=Path)
    args = parser.parse_args()
    output = (args.output or REPO / 'reports/runs' / f'frontend-{uuid.uuid4().hex[:12]}').resolve()
    if output.exists() and any(output.iterdir()):
        parser.error('Output must be new or empty')
    output.mkdir(parents=True, exist_ok=True)
    env = dict(os.environ, QA_FRONTEND_JUNIT=str(output / 'components-junit.xml'), NO_COLOR='1')
    records = []

    def run(name, command):
        try:
            p = subprocess.run(['node', *command], cwd=CLIENT, env=env, capture_output=True,
                               text=True, encoding='utf-8', errors='replace', timeout=180)
            code, log = p.returncode, p.stdout + '\n' + p.stderr
        except (OSError, subprocess.TimeoutExpired) as error:
            code, log = 2, str(error)
        (output / f'{name}.txt').write_text(log.rstrip() + '\n', encoding='utf-8')
        records.append({'check': name, 'exit_code': code,
                        'status': 'PASS' if code == 0 else 'FAIL', 'log': f'{name}.txt'})
        print(f'{name}: exit {code}', flush=True)
        return code, log

    if args.checks in ('components', 'all'):
        run('components', ['node_modules/vitest/vitest.mjs', 'run', '--config', 'vitest.components.config.ts'])
    if args.checks in ('legacy', 'all'):
        code, log = run('typecheck', ['node_modules/typescript/bin/tsc', '-b'])
        records[-1]['diagnostic_count'] = len(re.findall(r'error TS\d+:', log))
        if code == 0:
            run('bundle', ['node_modules/vite/bin/vite.js', 'build'])
        else:
            records.append({'check': 'bundle', 'status': 'NOT_RUN', 'reason': 'Typecheck failed; build script stops here.'})
        code, _ = run('lint', ['node_modules/eslint/bin/eslint.js', '.', '--format', 'json',
                              '--output-file', str(output / 'lint.json')])
        if (output / 'lint.json').exists():
            data = json.loads((output / 'lint.json').read_text(encoding='utf-8'))
            records[-1].update(errors=sum(x['errorCount'] for x in data),
                               warnings=sum(x['warningCount'] for x in data))
    # Restored app files may not be committed yet; hash the files actually checked.
    source_paths = list((CLIENT / 'src').rglob('*')) + list((CLIENT / 'tests').rglob('*'))
    source_paths += [p for p in CLIENT.iterdir() if p.is_file()] + [Path(__file__)]
    source_paths = [p for p in source_paths if p.name != '.env' and not p.name.startswith('.env.')]
    report = {'created_utc': datetime.now(timezone.utc).isoformat(), 'checks': args.checks,
        'results': records, 'source_sha256': {p.relative_to(SOURCE_REPO).as_posix(): hashlib.sha256(p.read_bytes()).hexdigest()
            for p in sorted(set(source_paths)) if p.is_file()},
        'scope': 'ProductList/Toast in jsdom; context hooks and preview boundary mocked. No backend, WebGL or browser E2E.',
        'legacy_test_not_in_component_scope': 'src/features/virtual-tryon/VirtualTryOn.test.tsx'}
    (output / 'report.json').write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding='utf-8')
    lines = ['# Frontend verification', '', report['scope'], '',
             '| Check | Status | Exit | Log |', '|---|---|---|---|']
    for r in records:
        lines.append(f"| {r['check']} | {r['status']} | {r.get('exit_code', '—')} | {r.get('log', r.get('reason'))} |")
    lines += ['', 'NOT_RUN is not PASS. Legacy typecheck/lint defects are preserved, not suppressed.',
              'This scoped suite does not execute the legacy VirtualTryOn integration test.', '']
    (output / 'report.md').write_text('\n'.join(lines), encoding='utf-8')
    print(output / 'report.md')
    return 1 if any(r['status'] != 'PASS' for r in records) else 0


if __name__ == '__main__':
    raise SystemExit(main())
