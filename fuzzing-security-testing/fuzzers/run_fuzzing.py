"""Luồng chính: blackbox khám phá → whitebox khảo sát → bằng chứng."""
import argparse
import sys
from pathlib import Path
import time
import uuid

from blackbox_fuzzer import fuzz as run_blackbox, investigate_boundaries
from whitebox_fuzzer import TARGETS, focus_blackbox, focus_boundaries
from runtime import ROOT, write_json


def main():
    if hasattr(sys.stdout, 'reconfigure'):
        sys.stdout.reconfigure(encoding='utf-8')
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--iterations', type=int, default=100)
    parser.add_argument('--iterations-per-case', type=int, default=12)
    parser.add_argument('--max-cases', type=int, default=6)
    parser.add_argument('--boundary-budget', type=int, default=16,
                        help='Số phép đo HTTP tối đa mỗi ca khoanh biên, tối thiểu 2')
    parser.add_argument('--seed', type=int, default=7)
    parser.add_argument('--base-url')
    parser.add_argument('--output', type=Path)
    parser.add_argument('--concolic', action='store_true', help='Chạy thêm whitebox Z3 trên totalAmount')
    args = parser.parse_args()
    if min(args.iterations, args.iterations_per_case, args.max_cases) < 1:
        parser.error('Ngân sách phải lớn hơn 0')
    if args.boundary_budget < 2:
        parser.error('--boundary-budget phải ít nhất 2')
    output = args.output or ROOT / 'results/fuzzing' / uuid.uuid4().hex[:12]
    start = time.monotonic()

    print('Bước 1: blackbox khám phá input bất thường', flush=True)
    blackbox = run_blackbox(args.iterations, args.seed, output / 'blackbox', args.base_url)
    blackbox_path = write_json(output / 'blackbox/report.json', blackbox)
    candidates = [item for item in blackbox['errors'] + blackbox['vuln_findings']
                  if item.get('target') in TARGETS and isinstance(item.get('input'), dict)
                  and type(item.get('had_auth')) is bool]
    whitebox = None
    status = 'SKIPPED_NO_CANDIDATE'
    if candidates:
        print('Khoanh biên blackbox: replay trên state mới, đổi từng trường', flush=True)
        blackbox['boundaries'] = investigate_boundaries(blackbox, output / 'blackbox',
                                                      args.max_cases, args.boundary_budget)
        write_json(blackbox_path, blackbox)
        print('Bước 2: whitebox chạy lại và khảo sát input đã tìm', flush=True)
        whitebox = focus_blackbox(blackbox_path, args.iterations_per_case,
                                 args.seed, output / 'whitebox', args.max_cases)
        whitebox['bounded_analysis'] = focus_boundaries(blackbox['boundaries'],
                                                       args.iterations_per_case, output / 'whitebox')
        write_json(output / 'whitebox/report.json', whitebox)
        status = 'EXECUTED'
    else:
        print('Chưa có input phù hợp để chuyển whitebox trong ngân sách này.', flush=True)

    summary = {
        'environment': blackbox['environment'], 'seed': args.seed,
        'elapsed_seconds': time.monotonic() - start,
        'blackbox_inputs': blackbox['iterations'],
        'blackbox_evidence': blackbox['evidence_summary'],
        'whitebox_status': status,
        'boundary_cases': blackbox.get('boundaries', []),
        'whitebox_inputs': whitebox['iterations_used'] if whitebox else 0,
        'whitebox_evidence': whitebox['evidence_summary'] if whitebox else None,
        'limitations': ['Không có ứng viên không chứng minh hệ thống an toàn.',
                        'Khảo sát lân cận không chứng minh vùng biên đầy đủ.',
                        'HTTP 5xx không là crash; timeout chỉ là nghi vấn hang.',
                        'Chưa đo lỗi bộ nhớ bằng sanitizer trong luồng API.'],
    }
    if args.concolic:
        from concolic import run_concolic
        print('Bước 3: trace totalAmount → Z3 → xác nhận input mới', flush=True)
        concolic = run_concolic(output / 'concolic', args.iterations_per_case)
        summary['concolic'] = {'counts': concolic['counts'],
                               'report': str(output / 'concolic/report.json')}
    path = write_json(output / 'report.json', summary)
    lines = ['# Kết quả khoanh biên', '',
             f"Blackbox: {blackbox['iterations']} input khám phá.", '',
             '| Target | Tái hiện / trạng thái | Trường | Miền khảo sát | Cặp chuyển hành vi |',
             '|---|---|---|---|---|']
    for case in blackbox.get('boundaries', []):
        for region in case.get('regions', []) or [None]:
            if region is None:
                lines.append(f"| {case['target']} | {case['status']} | — | — | — |")
            else:
                transitions = ', '.join(f"{edge['left']} → {edge['right']}" for edge in region['transitions']) or 'Chưa quan sát'
                lines.append(f"| {case['target']} | {case['status']} | {region['path']} | {region['axis']}: [{region['lower']}, {region['upper']}] | {transitions} |")
    lines += ['', 'Miền khảo sát không phải toàn bộ vùng lỗi. Các điểm chưa đo vẫn là chưa biết.',
              'Xem blackbox/report.json và boundary_evidence/ để đọc các phép đo HTTP.',
              'Xem whitebox/bounded_analysis.json để đọc input trong miền, coverage và trace chọn lọc.',
              'Concolic Z3 là bước riêng; chưa symbolic toàn bộ miền tìm được.', '']
    (output / 'report.md').write_text('\n'.join(lines), encoding='utf-8')
    print(path, flush=True)
    errors = blackbox['errors'] + (whitebox['errors'] if whitebox else [])
    return 2 if any(error['type'] != 'HTTP_5XX' for error in errors) else 0


if __name__ == '__main__':
    raise SystemExit(main())
