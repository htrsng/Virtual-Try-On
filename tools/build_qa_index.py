"""Build QA tables from measured artifacts; never invent execution statuses."""
from collections import Counter
import csv
import json
from pathlib import Path
import sys

REPO = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(REPO / 'fuzz-testing/fuzzers'))
from spec_campaign import application_cases, read_specs

# Symptom clusters for triage, NOT a verified count of independent root causes.
TRIAGE = {
    'TC-AUTH-3': ('G01', 'Medium', 'Thông báo/status tiết lộ tài khoản', 'So sánh hai nhánh login; chưa đánh giá khai thác thực tế', None),
    'TC-ORD-1': ('G02', 'High', 'Chấp nhận cấu trúc giỏ không hợp lệ', 'Thiếu validation cấu trúc/quantity ở tạo đơn', None),
    'TC-ORD-3': ('G03', 'Medium', 'Xử lý lỗi đầu vào số tiền', 'Nhóm sơ bộ với ORD-4 theo đường xử lý totalAmount; chưa xác minh cùng lỗi gốc', None),
    'TC-ORD-4': ('G03', 'Medium', 'Xử lý lỗi đầu vào số tiền', 'Có cả 5xx và ép kiểu được chấp nhận; cần tách tiếp theo nhánh', None),
    'TC-ORD-5': ('G04', 'High', 'Tin giá/tổng tiền client', 'Cùng route POST orders và oracle catalog với ORD-18; không đếm thành hai bug độc lập', 'BUG-002'),
    'TC-ORD-18': ('G04', 'High', 'Tin giá/tổng tiền client', 'Biến thể giả mạo đồng thời giá và tổng; cùng nhóm ORD-5', 'BUG-002'),
    'TC-ORD-6': ('G05', 'High', 'Chấp nhận tổng tiền âm', 'Thiếu ràng buộc miền totalAmount', None),
    'TC-OS-1': ('G06', 'High', 'Quyền cập nhật đơn', 'Kiểm tra auth/owner trên route cập nhật trạng thái', None),
    'TC-OS-2': ('G07', 'Medium', 'Enum trạng thái không hợp lệ', 'Thiếu allowlist status', None),
    'TC-OS-3': ('G08', 'High', 'Phá trạng thái kết thúc', 'Cùng route trạng thái với OS-21; kiểm tra terminal transition', 'BUG-004'),
    'TC-OS-21': ('G08', 'High', 'Phá trạng thái kết thúc', 'Đơn hủy là biến thể khác của terminal-state invariant', 'BUG-004'),
    'TC-OS-4': ('G09', 'Medium', 'Ngoại lệ ID/status đơn', 'Hai dạng input trong cùng testcase; có thể cần tách lỗi gốc', None),
    'TC-PRD-1': ('G10', 'High', 'Quyền tạo/sửa sản phẩm', 'Tạo và sửa là hai endpoint; gom theo họ triệu chứng, chưa xác nhận một lỗi gốc', None),
    'TC-PRD-2': ('G11', 'High', 'Chấp nhận giá âm', 'Thiếu ràng buộc giá khi cập nhật', None),
    'TC-PRD-3': ('G12', 'Medium', 'Ngoại lệ giá sai kiểu', 'Cast price phát sinh HTTP 500', None),
    'TC-PRD-5': ('G13', 'High', 'ID sản phẩm trùng', 'Kiểm tra uniqueness và bảo toàn bản gốc', None),
    'TC-USR-1': ('G14', 'High', 'Quyền cập nhật hồ sơ', 'Kiểm tra auth/owner trước update', 'BUG-003'),
    'TC-USR-2': ('G15', 'High', 'Mass assignment role', 'Không giới hạn trường cập nhật từ self', 'BUG-001'),
    'TC-USR-4': ('G16', 'High', 'Password lưu dạng rõ', 'Đường cập nhật không hash password; audit dữ liệu thực trong harness', 'BUG-005'),
    'TC-USR-3': ('G17', 'Medium', 'Ngoại lệ ID user', 'Xử lý lỗi identifier trả HTTP 500', None),
}
BUG_FILES = {'BUG-001':'role-escalation', 'BUG-002':'order-total', 'BUG-003':'user-authorization',
             'BUG-004':'terminal-order-state', 'BUG-005':'plaintext-password'}


def cell(value):
    return str(value).replace('|', '\\|').replace('\n', ' ')


def expected(case):
    check = case['check']
    return {'status': f"HTTP thuộc {check.get('allowed')}",
        'no_5xx': 'Mọi response HTTP < 500', 'same_response': 'Hai response login cùng status/body',
        'catalog_total': 'Từ chối 400/422 hoặc tổng theo catalog',
        'role_unchanged': 'Từ chối hoặc giữ role user',
        'password': 'Password là bcrypt, xác minh được và không bằng plaintext',
        'duplicate_id': 'Từ chối trùng hoặc cấp ID mới và giữ nguyên product gốc',
        'cancelled_terminal': 'Chặn chuyển tiếp, đơn vẫn hủy và dữ liệu không đổi'
    }.get(check['kind'], check['kind'])


def actual(executions):
    example = executions[0]['evidence']
    last = example['observations'][-1]
    statuses = sorted({e['evidence']['observations'][-1]['status'] for e in executions})
    kind = executions[0]['case']['check']['kind']
    detail = ''
    if kind == 'same_response':
        detail = '; hai nhánh HTTP ' + '/'.join(str(o['status']) for o in example['observations'])
    elif kind == 'role_unchanged':
        detail = '; response role=' + str(last['body'].get('role'))
    elif kind == 'catalog_total':
        detail = '; response total=' + str(last['body'].get('order', {}).get('totalAmount'))
    elif kind == 'password':
        detail = '; audit=' + json.dumps(example['password_audit'], ensure_ascii=False)
    elif kind == 'cancelled_terminal':
        detail = '; state cuối=' + str(example['final_entity']['status'])
    return f'HTTP {statuses}' + detail


def main():
    qa = REPO / 'qa'
    qa.mkdir(exist_ok=True)
    source = json.loads((REPO / 'reports/baseline/api/report.json').read_text(encoding='utf-8'))
    replay = json.loads((REPO / 'reports/current/replay/report.json').read_text(encoding='utf-8'))
    failing = {row['testcase']['ID'] for row in source['traceability'] if row['status'] == 'FAIL'}
    if failing != TRIAGE.keys():
        raise ValueError('Baseline FAIL set changed: review triage before regenerating')
    replay_by_id = {r['testcase']:r for r in replay['records']}
    if failing != replay_by_id.keys():
        raise ValueError('Replay does not cover every failing testcase')
    lines = ['# Defect register', '',
        '**20 testcase FAIL / 32 scenario FAIL → 17 nhóm triage sơ bộ.**',
        '17 là số nhóm triệu chứng do reviewer phân loại, không phải số bug gốc đã xác nhận.',
        'Số lỗi gốc độc lập hiện **chưa xác định**. Không suy ra từ số testcase, HTTP status hay nhóm.',
        'Các nhóm có thể tách hoặc gộp tiếp sau code review và kiểm chứng bản sửa.', '',
        '| Finding | Module | Testcase | Nhóm | Severity | Expected | Actual trong các scenario FAIL | Replay | State | Regression cố định | Evidence / bug |',
        '|---|---|---|---|---|---|---|---|---|---|---|']
    for index, row in enumerate((r for r in source['traceability'] if r['status']=='FAIL'), 1):
        tc = row['testcase']['ID']
        examples = [e for e in source['executions'] if e['case']['testcase']==tc and e['status']=='FAIL']
        group,severity,_,_,bug = TRIAGE[tc]
        replayed = replay_by_id[tc]
        ev = f"[API](../reports/baseline/api/{examples[0]['evidence_file']})"
        if bug:
            ev += f" / [{bug}](../bug-reports/{bug}-{BUG_FILES[bug]}.md)"
        module = {'AUTH':'Login', 'ORD':'Order', 'OS':'Order state', 'USR':'User', 'PRD':'Product'}[tc.split('-')[1]]
        values = [f'DF-{index:03}',module,tc,group,severity,expected(examples[0]['case']),actual(examples),
            f"{replayed['conclusion']} ({len(replayed['runs'])} lần)", 'OPEN; chưa sửa',
            replayed['regression_scenario'], ev]
        lines.append('| ' + ' | '.join(cell(v) for v in values) + ' |')
    lines += ['', '## Phân nhóm và giả thuyết nguyên nhân', '',
              '| Nhóm | Testcase | Họ triệu chứng / nguyên nhân sơ bộ |', '|---|---|---|']
    for group in sorted({v[0] for v in TRIAGE.values()}):
        members = [(tc,v) for tc,v in TRIAGE.items() if v[0]==group]
        lines.append(f"| {group} | {', '.join(tc for tc,_ in members)} | " + cell('; '.join(dict.fromkeys(v[2]+': '+v[3] for _,v in members))) + ' |')
    lines += ['', 'Nguồn implementation để tiếp tục kiểm tra giả thuyết: [routes](../fuzz-testing/target/index.js),',
        '[models](../fuzz-testing/target/models.js), [oracle](../fuzz-testing/fuzzers/oracles.py).', '',
        'Regression cố định = scenario xác định đã có và đang FAIL; không có nghĩa bug đã sửa.',
        'Chưa có bug nào được đánh dấu FIXED/CLOSED hoặc retest sau sửa đạt.',
        'Replay kiểm tra hash source trước khi chạy; mỗi lượt reset Node/datastore.',
        '[40 lượt replay đo được](../reports/current/replay/report.md) · [phạm vi bằng chứng](evidence-index.md).', '']
    (qa/'defect-register.md').write_text('\n'.join(lines),encoding='utf-8')

    matrix = ['# Test Coverage Matrix', '',
        'Coverage ở đây là ánh xạ đặc tả → scenario → kết quả, không phải line/branch coverage.',
        '**134 testcase Excel: 29 ca API đã thực thi / 105 ca ngoài campaign API.**',
        '29 ca được triển khai thành 51 scenario xác định: 19 PASS, 32 FAIL, 0 ERROR/NOT_RUN.',
        'Tổng hợp testcase: 9 PASS, 20 FAIL, 0 ERROR/NOT_RUN. Không cộng với regression test của công cụ.', '',
        '| Testcase | Nhóm chức năng | Requirement gốc | Scenario PASS/FAIL | Kết quả | Fuzz target cùng module | Replay đại diện |',
        '|---|---|---|---|---|---|---|']
    fuzz = {'AUTH':'login', 'ORD':'orders', 'OS':'order_status',
            'USR':'user_update_self/victim', 'PRD':'product_create/update'}
    for row in source['traceability']:
        tc=row['testcase']['ID']
        runs=[e for e in source['executions'] if e['case']['testcase']==tc]
        counts=Counter(e['status'] for e in runs)
        module=tc.split('-')[1]
        values=[tc,module,row['testcase']['YeuCauLienQuan'],f"{counts['PASS']} / {counts['FAIL']}",
                row['status'],fuzz[module],replay_by_id[tc]['conclusion'] if tc in replay_by_id else 'Không chọn (baseline PASS)']
        matrix.append('| '+' | '.join(cell(v) for v in values)+' |')
    matrix += ['', 'Cột fuzz target là điểm liên hệ kiến trúc, **không xác nhận từng testcase đã được fuzz oracle bao phủ**.',
        'Login chỉ thuộc blackbox; greybox/concolic hỗ trợ target có giới hạn như mô tả trong module fuzzing.', '',
        '- [105 testcase ngoài campaign](excluded-testcases.csv): giữ ID/module/title/lý do; không ghi PASS.',
        '- [29 API definitions và oracle cụ thể](../api-testing/test-cases.csv).',
        '- [12 manual UI case](../manual-testing/test-cases.md): NOT_RUN, không thuộc 134 ca Excel.',
        '- [14 unit logic](../automation-testing/README.md) và [14 component checks](frontend-quality.md) là phạm vi khác.',
        '- Regression hạ tầng: 34 test fuzz tool; 9 test API reporting/replay hiện hành, không phải acceptance coverage.', '']
    (qa/'test-coverage.md').write_text('\n'.join(matrix),encoding='utf-8')
    _, excluded = application_cases(read_specs())
    if len(excluded) != source['excluded_spec_testcases']:
        raise ValueError('Current specification scope differs from baseline')
    with (qa/'excluded-testcases.csv').open('w',encoding='utf-8-sig',newline='') as stream:
        writer=csv.writer(stream)
        writer.writerow(['ID','Module','Title','CampaignStatus','Reason'])
        for e in excluded:
            tc=e['testcase']
            writer.writerow([tc['ID'],e['spec'],tc['TieuDe'],'OUT_OF_API_CAMPAIGN',e['reason']])
    print('Generated 20 finding rows, 29 coverage rows and 105 exclusions; no execution statuses invented.')


if __name__ == '__main__':
    main()
