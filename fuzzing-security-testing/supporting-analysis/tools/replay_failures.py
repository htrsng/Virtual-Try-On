"""Chạy lại kịch bản FAIL từ dữ liệu sạch; nhóm dấu hiệu, không tự suy ra lỗi gốc."""
import argparse
from collections import Counter
from datetime import datetime, timezone
import hashlib
import json
from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / 'fuzzers'))
from spec_campaign import execute
from runtime import ENVIRONMENT, write_json


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--campaign', type=Path, required=True)
    parser.add_argument('--output', type=Path, required=True)
    parser.add_argument('--repeats', type=int, default=2)
    args = parser.parse_args()
    if args.repeats < 1:
        parser.error('repeats must be positive')
    source = json.loads(args.campaign.read_text(encoding='utf-8'))
    if source['environment'] != ENVIRONMENT:
        raise ValueError('Only simulated harness evidence is supported')
    # Kết quả chỉ hợp lệ cho phiên bản code và workbook đã ghi trong campaign.
    for name, digest in source['source_sha256'].items():
        if hashlib.sha256((ROOT.parent / name).read_bytes()).hexdigest() != digest:
            raise ValueError(f'Source changed since campaign: {name}')
    for spec in json.loads((args.campaign.parent / 'spec_snapshot.json').read_text(encoding='utf-8')):
        if hashlib.sha256((ROOT / 'BaoCaoATPM' / spec['file']).read_bytes()).hexdigest() != spec['sha256']:
            raise ValueError(f'Specification changed: {spec["file"]}')
    selected = {}
    for execution in source['executions']:
        if execution['status'] == 'FAIL':
            selected.setdefault(execution['case']['testcase'], execution['case'])
    records = []
    for testcase, case in selected.items():
        runs = []
        for repeat in range(args.repeats):
            # execute() mở Node mới: không kế thừa trạng thái từ campaign cũ.
            run = execute(case)
            write_json(args.output / 'evidence' / f'{testcase}_{repeat + 1}.json', run)
            runs.append(run)
        statuses = [run['status'] for run in runs]
        if all(status == 'FAIL' for status in statuses):
            conclusion = 'REPRODUCED'
        elif 'ERROR' in statuses:
            conclusion = 'INCONCLUSIVE'
        else:
            conclusion = 'NOT_STABLE'
        records.append({'testcase': testcase, 'case_id': case['id'],
                        'oracle': case['check']['kind'], 'statuses': statuses,
                        'conclusion': conclusion})
        print(f'{testcase}: {conclusion} {statuses}', flush=True)
    report = {'created_utc': datetime.now(timezone.utc).isoformat(),
              'environment': ENVIRONMENT, 'campaign': str(args.campaign.resolve()),
              'source_sha256': source['source_sha256'], 'repeats': args.repeats,
              'counts': dict(Counter(record['conclusion'] for record in records)),
              'records': records,
              'limitations': ['One representative failing scenario per testcase, not every input.',
                              'Reproduction is not a count of unique root causes.',
                              'Timing is exploratory and is not proof of deployment exploitability.']}
    write_json(args.output / 'report.json', report)
    lines = ['# Tái hiện testcase FAIL', '',
             'Mỗi lần chạy dùng tiến trình Node mới và dữ liệu sạch. Chọn một kịch bản đại diện mỗi testcase.', '',
             '| Testcase | Kịch bản | Trạng thái chạy lại | Kết luận |', '|---|---|---|---|']
    for record in records:
        lines.append(f"| {record['testcase']} | {record['case_id']} | {', '.join(record['statuses'])} | {record['conclusion']} |")
    lines += ['', 'REPRODUCED: các lần thử lại đều FAIL theo oracle. NOT_STABLE: chưa tái hiện ổn định. INCONCLUSIVE: có lỗi bộ chạy.',
              'Các nhóm này chưa xác định số lỗi gốc. Bằng chứng nằm trong evidence/.', '']
    (args.output / 'report.md').write_text('\n'.join(lines), encoding='utf-8')
    return 2 if any('ERROR' in record['statuses'] for record in records) else 0


if __name__ == '__main__':
    raise SystemExit(main())
