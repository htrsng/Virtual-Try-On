"""Xác minh Excel theo quy tắc mẫu: CTL, mutex, SMT và mã minh họa.

Đây là bộ xác minh của dự án, không phải core.spec_pipeline của tài liệu PDF.
"""
import argparse
import hashlib
import json
from pathlib import Path
import subprocess
import sys

from z3 import And, Int, Or, Solver, sat

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / 'fuzzers'))
sys.path.insert(0, str(ROOT / 'supporting-analysis/verification'))
from ctl_checker import CTLChecker
from runtime import HIDDEN_PROCESS, write_json
from spec_campaign import read_specs
from simulation_campaign import c_function, expression


def solve(condition, variables, extra=()):
    solver = Solver()
    solver.set(timeout=5000)
    solver.add(condition, *extra)
    verdict = solver.check()
    witness = None
    if verdict == sat:
        witness = {name: solver.model().eval(value, model_completion=True).as_long()
                   for name, value in variables.items()}
    return {'verdict': str(verdict), 'witness': witness,
            'reason_unknown': solver.reason_unknown() if str(verdict) == 'unknown' else None}


def verify_module(spec, output):
    sheets = spec['sheets']
    required = {'ThongTin', 'YeuCauChucNang', 'YeuCauPhiChucNang', 'RangBuoc',
                'MoHinhTrangThai', 'ThuocTinhAnToan', 'LoaiTruLanNhau',
                'HamSinhMa', 'KiemTraSoHoc', 'TestCase'}
    if set(sheets) != required:
        raise ValueError('Workbook must have exactly the ten template sheets')
    columns = {
        'ThongTin': {'Truong', 'GiaTri'},
        'YeuCauChucNang': {'ID', 'MoTa', 'DanhMuc', 'MucUuTien'},
        'YeuCauPhiChucNang': {'ID', 'MoTa', 'MucUuTien'},
        'RangBuoc': {'ID', 'MoTa', 'MucUuTien'},
        'MoHinhTrangThai': {'TrangThai', 'KhoiTao', 'Nhan', 'ChuyenDenCacTrangThai'},
        'ThuocTinhAnToan': {'CongThucCTL'}, 'LoaiTruLanNhau': {'MenhDe1', 'MenhDe2'},
        'HamSinhMa': {'Ten', 'NgonNgu', 'Loai', 'ThamSo', 'KichThuocBuffer', 'Loi', 'GiaTriBiMat1', 'GiaTriBiMat2'},
        'KiemTraSoHoc': {'Ten', 'BienSoNguyen', 'DieuKien', 'BieuThucTran'},
        'TestCase': {'ID', 'YeuCauLienQuan', 'TieuDe', 'DieuKienTienQuyet', 'CacBuoc', 'KetQuaMongDoi', 'MucUuTien'},
    }
    for name, expected in columns.items():
        if not sheets[name] or not expected <= set(sheets[name][0]):
            raise ValueError(f'Missing columns: {name}')
    info = {row['Truong']: row['GiaTri'] for row in sheets['ThongTin']}
    if not info.get('name') or not info.get('description'):
        raise ValueError('Missing name/description')
    if {row['DanhMuc'] for row in sheets['YeuCauChucNang']} != {'functional', 'memory', 'liveness', 'safety'}:
        raise ValueError('Invalid or missing requirement categories')
    for sheet in ('YeuCauChucNang', 'YeuCauPhiChucNang', 'RangBuoc', 'TestCase'):
        ids = [row['ID'] for row in sheets[sheet]]
        if len(ids) < 5 or len(ids) != len(set(ids)):
            raise ValueError(f'Invalid row count or duplicate IDs: {sheet}')
        if any(row['MucUuTien'] not in ('HIGH', 'MEDIUM', 'LOW') for row in sheets[sheet]):
            raise ValueError(f'Invalid priority: {sheet}')
    requirement_ids = {row['ID'] for name in ('YeuCauChucNang', 'YeuCauPhiChucNang', 'RangBuoc') for row in sheets[name]}
    for case in sheets['TestCase']:
        if not {part.strip() for part in case['YeuCauLienQuan'].split(',')} <= requirement_ids:
            raise ValueError(f'Unknown requirement: {case["ID"]}')
        if not all(case.get(key) for key in ('TieuDe', 'DieuKienTienQuyet', 'CacBuoc', 'KetQuaMongDoi')):
            raise ValueError(f'Missing testcase fields: {case["ID"]}')
    if len(sheets['LoaiTruLanNhau']) < 5 or len(sheets['KiemTraSoHoc']) < 5:
        raise ValueError('Expected at least five mutex and arithmetic rows')
    rows = sheets['MoHinhTrangThai']
    states = {row['TrangThai']: {label.strip() for label in row['Nhan'].split(',')} for row in rows}
    if len(states) != len(rows):
        raise ValueError('Duplicate states')
    transitions = {row['TrangThai']: [state.strip() for state in row['ChuyenDenCacTrangThai'].split(',')] for row in rows}
    initial = {row['TrangThai'] for row in rows if str(row['KhoiTao']).lower() == 'x'}
    checker = CTLChecker(states, transitions, initial)
    reachable = {state for state in states if checker.path(initial, {state})}
    ctl = [checker.check(row['CongThucCTL']) for row in sheets['ThuocTinhAnToan']]
    mutex = []
    for index, row in enumerate(sheets['LoaiTruLanNhau']):
        first, second = row['MenhDe1'], row['MenhDe2']
        if first == second or not {first, second} <= checker.labels:
            raise ValueError('Invalid mutex labels')
        conflicts = {state for state in reachable if {first, second} <= states[state]}
        mutex.append({'labels': [first, second], 'official_template_pair': index == 0,
                      'holds': not conflicts, 'conflicting_states': sorted(conflicts),
                      'counterexample': checker.path(initial, conflicts)})

    smt = []
    for row in sheets['KiemTraSoHoc']:
        variables = {name.strip(): Int(name.strip()) for name in row['BienSoNguyen'].split(',')}
        condition = expression(row['DieuKien'], variables)
        value = expression(row['BieuThucTran'], variables)
        bounds = [And(v >= -2147483648, v <= 2147483647) for v in variables.values()]
        overflow = Or(value < -2147483648, value > 2147483647)
        smt.append({'name': row['Ten'], 'condition': row['DieuKien'], 'expression': row['BieuThucTran'],
                    'business_sat': solve(condition, variables),
                    'int32_overflow_independent': solve(overflow, variables, bounds),
                    'int32_overflow_with_business_condition': solve(And(condition, overflow), variables, bounds)})
    fixture_dir = output / 'fixtures' / Path(spec['file']).stem
    fixture_dir.mkdir(parents=True, exist_ok=True)
    source = '#include <stdio.h>\n#include <stdlib.h>\n#include <string.h>\n'
    source += '\n'.join(c_function(row) for row in sheets['HamSinhMa'] if row['NgonNgu'] == 'c')
    source_path = fixture_dir / 'generated.c'
    source_path.write_text(source, encoding='utf-8')
    compiler = subprocess.run(['gcc', '-O0', '-Wall', '-Wextra', '-fanalyzer',
                               '-fdiagnostics-format=json', '-c', str(source_path),
                               '-o', str(fixture_dir / 'generated.o')],
                              capture_output=True, text=True, timeout=45, **HIDDEN_PROCESS)
    (fixture_dir / 'gcc_stderr.json').write_text(compiler.stderr or '[]', encoding='utf-8')
    if compiler.returncode:
        raise ValueError(f'Compiler failed: {compiler.stderr[:1000]}')
    diagnostics = json.loads(compiler.stderr or '[]')
    static_checks = []
    options = {'memory-leak': '-Wanalyzer-malloc-leak', 'double-free': '-Wanalyzer-double-free',
               'use-after-free': '-Wanalyzer-use-after-free'}
    for row in sheets['HamSinhMa']:
        if row['NgonNgu'] != 'c' or not row.get('Loi'):
            continue
        line_number = next(i for i, line in enumerate(source.splitlines(), 1) if f" {row['Ten']}(" in line)
        matching = [diagnostic for diagnostic in diagnostics
                    if diagnostic.get('option') == options.get(row['Loi'])
                    and any(location.get('caret', {}).get('line') == line_number for location in diagnostic.get('locations', []))]
        # strcpy pattern là cảnh báo tiềm năng, không giả làm ASan xác nhận.
        detected = bool(matching) if row['Loi'] != 'buffer-overflow' else 'strcpy(' in source.splitlines()[line_number - 1]
        static_checks.append({'function': row['Ten'], 'injected_bug': row['Loi'], 'detected': detected,
                              'method': 'strcpy pattern only' if row['Loi'] == 'buffer-overflow' else 'GCC -fanalyzer',
                              'line': line_number})

    python_checks = []
    for row in sheets['HamSinhMa']:
        if row['NgonNgu'] != 'python':
            continue
        name = row['Ten']
        if not name.isidentifier():
            raise ValueError('Invalid Python function name')
        if row['Loai'] == 'divide':
            body = f'def {name}(a, b):\n    return a / b\n'
            inputs = [[a, b] for a in (0, 1, -1, 2147483647) for b in (0, 1, -1)]
        elif row['Loai'] == 'magic_value':
            a, b = row['GiaTriBiMat1'], row['GiaTriBiMat2']
            if type(a) is not int or type(b) is not int:
                raise ValueError('Magic values must be integers')
            body = f'def {name}(a, b):\n    if a == {a} and b == {b}:\n        raise ValueError("injected magic branch")\n    return 0\n'
            # Giải đúng nhánh mẫu đã sinh; không tuyên bố là concolic tổng quát.
            variables = {'a': Int('a'), 'b': Int('b')}
            witness = solve(And(variables['a'] == a, variables['b'] == b), variables)['witness']
            inputs = [[0, 0], [witness['a'], witness['b']]]
        else:
            raise ValueError(f'Unsupported Python fixture: {row["Loai"]}')
        script = fixture_dir / (name + '.py')
        harness = '\nimport json\nobservations=[]\nfor args in ' + repr(inputs) + ':\n    try:\n        value=' + name + '(*args)\n        observations.append({"input":args,"status":"OK","value":value})\n    except Exception as error:\n        observations.append({"input":args,"status":type(error).__name__})\nprint(json.dumps(observations))\n'
        script.write_text(body + harness, encoding='utf-8')
        process = subprocess.run([sys.executable, str(script)], capture_output=True, text=True,
                                 timeout=10, check=True, **HIDDEN_PROCESS)
        python_checks.append({'function': name, 'kind': row['Loai'],
                              'method': 'boundary inputs' if row['Loai'] == 'divide' else 'Z3-guided input for fixed generated branch',
                              'observations': json.loads(process.stdout)})
    return {'spec': spec['file'], 'spec_sha256': spec['sha256'], 'structure': 'VALID',
            'states': len(states), 'reachable': sorted(reachable), 'deadlocks': [],
            'ctl': ctl, 'mutex_pairs': mutex, 'smt': smt,
            'static_checks': static_checks, 'gcc_diagnostics': diagnostics, 'python_fixtures': python_checks}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--output', type=Path, default=ROOT / 'results/formal_verification')
    args = parser.parse_args()
    specs = read_specs()
    write_json(args.output / 'spec_snapshot.json', specs)
    modules, errors = [], []
    for spec in specs:
        try:
            module = verify_module(spec, args.output)
            modules.append(module)
            print(spec['file'], 'VERIFIED', flush=True)
        except (ValueError, KeyError, TypeError, OSError, subprocess.SubprocessError) as error:
            errors.append({'spec': spec['file'], 'error': str(error)})
            print(spec['file'], 'ERROR', error, flush=True)
    import z3
    result = {'implementation': 'project verifier; not the original core.spec_pipeline',
              'scope': 'FORMAL_MODELS_AND_GENERATED_FIXTURES_ONLY', 'z3_version': z3.get_version_string(),
              'gcc_version': subprocess.run(['gcc', '--version'], capture_output=True, text=True, **HIDDEN_PROCESS).stdout.splitlines()[0],
              'modules': modules, 'errors': errors,
              'source_sha256': {str(p.relative_to(ROOT)): hashlib.sha256(p.read_bytes()).hexdigest()
                                for p in [Path(__file__), ROOT / 'supporting-analysis/verification/ctl_checker.py',
                                          ROOT / 'supporting-analysis/tools/simulation_campaign.py', ROOT / 'fuzzers/spec_campaign.py']}}
    write_json(args.output / 'report.json', result)
    lines = ['# Xác minh đặc tả Excel', '',
             'Bộ xác minh của dự án theo quy tắc PDF; không phải pipeline gốc core.spec_pipeline.',
             'Kết quả thuộc mô hình và mã cấy lỗi minh họa, không cộng vào lỗi API Node.js.', '',
             '| Workbook | Trạng thái | CTL đúng/sai | Cặp mutex vi phạm | SMT SAT | Overflow int32 SAT |',
             '|---|---|---|---|---|---|']
    for module in modules:
        valid = sum(item['holds'] for item in module['ctl'])
        lines.append(f"| {module['spec']} | VALID | {valid}/{len(module['ctl'])-valid} | {sum(not x['holds'] for x in module['mutex_pairs'])} | {sum(x['business_sat']['verdict']=='sat' for x in module['smt'])} | {sum(x['int32_overflow_independent']['verdict']=='sat' for x in module['smt'])} |")
    lines += ['', '## Thuộc tính sai và phản ví dụ', '']
    for module in modules:
        for item in module['ctl']:
            if not item['holds']:
                lines += [f"### {module['spec']} — `{item['formula']}`", '',
                          '```json', json.dumps(item['counterexamples'], ensure_ascii=False, indent=2), '```', '']
    lines += ['## Cách hiểu', '',
              '- VALID nghĩa là mô hình được đọc và kiểm tra cấu trúc; không có nghĩa mọi thuộc tính đều đúng.',
              '- Conflict được cấy theo template nên AG(!violation) và cặp mutex đầu tiên phải có phản ví dụ.',
              '- CTL được đánh giá tại TẤT CẢ trạng thái khởi tạo. Các cụm khóa và nghiệp vụ rời nhau khiến EF(main_locked) sai ở nhánh nghiệp vụ; không có nghĩa main_locked không thể đạt từ mọi nhánh khác. Xem failing_initial_states.',
              '- Không tự đổi mô hình/công thức để ép PASS. Nếu muốn EF kiểm tra riêng cụm khóa thì cần chốt lại tập trạng thái khởi tạo hoặc mô hình thành phần, rồi tạo phiên bản đặc tả mới.',
              '- SAT của điều kiện nghiệp vụ và SAT tràn int32 là hai solver riêng; báo cáo thêm phép kiểm tra kết hợp, không trộn hai kết luận.',
              '- Mẫu buffer-overflow mới được cảnh báo bằng pattern strcpy; chưa có xác nhận ASan.',
              '- Python divide được thực thi ở giá trị biên; magic_value dùng Z3 cho nhánh mẫu cụ thể, không phải concolic tổng quát.',
              '- Nếu công cụ báo ERROR thì chưa được kết luận đặc tả hợp lệ; xem errors trong JSON.', '']
    (args.output / 'report.md').write_text('\n'.join(lines), encoding='utf-8')
    return 2 if errors else 0


if __name__ == '__main__':
    raise SystemExit(main())
