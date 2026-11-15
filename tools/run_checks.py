"""Run portfolio suites and keep their exit codes and logs visible."""
import argparse
from datetime import datetime, timezone
import json
from pathlib import Path
import subprocess
import sys
import uuid

REPO = Path(__file__).resolve().parents[1]


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--suite', choices=['smoke', 'full'], default='smoke',
                        help='full also executes all acceptance cases and a bounded fuzz campaign')
    parser.add_argument('--output', type=Path)
    args = parser.parse_args()
    output = (args.output or REPO / 'reports/runs' / f'{args.suite}-{uuid.uuid4().hex[:12]}').resolve()
    if output.exists() and any(output.iterdir()):
        parser.error('Output must be new or empty')
    output.mkdir(parents=True, exist_ok=True)
    unit_files = sorted(str(p) for p in (REPO / 'automation-testing/tests').glob('*.test.mjs'))
    if not unit_files:
        parser.error('No application unit tests found')
    commands = [
        ('application-unit', ['node', '--experimental-strip-types', '--test',
            '--test-reporter=junit', f'--test-reporter-destination={output / "unit-junit.xml"}', *unit_files]),
        ('reporting-regression', [sys.executable, '-m', 'unittest', 'discover',
            '-s', 'api-testing/tests', '-p', 'test_*.py']),
        ('fuzz-tool-regression', [sys.executable, '-m', 'unittest', 'discover',
            '-s', 'fuzz-testing/tests', '-p', 'test_*.py']),
        ('api-acceptance', [sys.executable, 'api-testing/run_suite.py', '--suite', args.suite,
            '--output', str(output / 'api')]),
    ]
    if args.suite == 'full':
        commands.append(('fuzz-smoke', [sys.executable, 'fuzz-testing/fuzzers/run_fuzzing.py',
            '--iterations', '6', '--iterations-per-case', '2', '--max-cases', '1',
            '--boundary-budget', '2', '--seed', '7', '--concolic',
            '--output', str(output / 'fuzz')]))
    results = []
    for name, command in commands:
        print(f'Running {name} ...', flush=True)
        try:
            process = subprocess.run(command, cwd=REPO, capture_output=True, text=True,
                                     encoding='utf-8', errors='replace', timeout=240)
            code = process.returncode
            log = process.stdout + '\n' + process.stderr
        except subprocess.TimeoutExpired as error:
            code, log = 2, f'Suite exceeded 240 seconds: {error}'
        except OSError as error:
            code, log = 2, str(error)
        (output / f'{name}.log').write_text(log, encoding='utf-8')
        results.append({'suite': name, 'exit_code': code, 'command': command,
                        'log': f'{name}.log'})
        print(f'{name}: exit {code}', flush=True)
    summary = {'created_utc': datetime.now(timezone.utc).isoformat(), 'suite': args.suite,
               'steps': results, 'note': 'Full acceptance is expected to expose existing target defects; inspect API report.'}
    (output / 'summary.json').write_text(json.dumps(summary, ensure_ascii=False, indent=2), encoding='utf-8')
    lines = ['# Portfolio run', '', f"Suite: {args.suite}; UTC: {summary['created_utc']}.", '',
             '| Step | Exit code | Log |', '|---|---|---|']
    lines += [f"| {r['suite']} | {r['exit_code']} | [{r['log']}]({r['log']}) |" for r in results]
    lines += ['', '[API acceptance report](api/report.md)',
              'Exit 0 means that step completed according to its own contract.',
              'A successful fuzz runner can still report target violations.', '']
    (output / 'summary.md').write_text('\n'.join(lines), encoding='utf-8')
    print(output / 'summary.md', flush=True)
    failures = [r for r in results if r['exit_code']]
    return 2 if any(r['suite'] != 'api-acceptance' or r['exit_code'] != 1 for r in failures) else (1 if failures else 0)


if __name__ == '__main__':
    if hasattr(sys.stdout, 'reconfigure'):
        sys.stdout.reconfigure(encoding='utf-8')
    raise SystemExit(main())
