"""Điểm chạy chung cho đợt kiểm thử API bán hàng và báo cáo từ bằng chứng thực thi."""
import argparse
from pathlib import Path
import subprocess
import sys

HERE = Path(__file__).resolve().parent


# Đọc tham số dòng lệnh và bắt đầu chạy chương trình.
def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--seed', type=int, default=7)
    parser.add_argument('--fuzz-cases', type=int, default=8)
    parser.add_argument('--output', type=Path, default=HERE.parent / 'results/sales_campaign')
    parser.add_argument('--audit-only', action='store_true')
    parser.add_argument('--compare',
         action='store_true',
         help='Optional equal-budget coverage experiment')
    parser.add_argument('--iterations-per-target', type=int, default=8)
    args = parser.parse_args()
    if args.compare and args.iterations_per_target < 7:
        parser.error('Comparison needs at least 7 inputs per target')
    command = [sys.executable, str(HERE / 'spec_campaign.py'),
        '--seed',
             str(args.seed),
             '--fuzz-cases',
             str(args.fuzz_cases),
             '--output',
             str(args.output)]
    if args.audit_only:
        command.append('--audit-only')
    result = subprocess.run(command)
    if result.returncode:
        return result.returncode
    report_command = [sys.executable,
         str(HERE.parent / 'supporting-analysis/tools/build_report.py'),
         '--campaign',
         str(args.output / 'report.json')]
    if args.compare and not args.audit_only:
        compare_output = args.output / 'comparison'
        result = subprocess.run([sys.executable, str(HERE / 'controlled_comparison.py'),
            '--iterations-per-target', str(args.iterations_per_target), '--seeds', str(args.seed),
            '--output', str(compare_output)])
        if result.returncode:
            return result.returncode
        report_command += ['--comparison', str(compare_output / 'report.json')]
    return subprocess.run(report_command).returncode


if __name__ == '__main__':
    raise SystemExit(main())
