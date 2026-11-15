"""Export the original Excel API scope without duplicating its expectations by hand."""
import csv
import json
from pathlib import Path
import sys

REPO = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(REPO / 'fuzz-testing/fuzzers'))
from spec_campaign import application_cases, read_specs
from testcases import scenarios


def main():
    included, _ = application_cases(read_specs())
    plans = scenarios(0, 7)
    destination = REPO / 'api-testing/test-cases.csv'
    columns = ['ID', 'Requirement', 'Title', 'Preconditions', 'Steps', 'Expected',
               'Priority', 'ScenarioIDs', 'ExecutableOracles', 'ExecutionStatus']
    with destination.open('w', encoding='utf-8-sig', newline='') as stream:
        writer = csv.DictWriter(stream, fieldnames=columns)
        writer.writeheader()
        for entry in included:
            tc = entry['testcase']
            matching = [p for p in plans if p['testcase'] == tc['ID']]
            writer.writerow(dict(zip(columns, [tc['ID'], tc['YeuCauLienQuan'], tc['TieuDe'],
                tc['DieuKienTienQuyet'], tc['CacBuoc'], tc['KetQuaMongDoi'], tc['MucUuTien'],
                '; '.join(p['id'] for p in matching),
                json.dumps([p['check'] for p in matching], ensure_ascii=False),
                'SEE_RUN_REPORT'])))
    print(f'Exported {len(included)} API testcase definitions to {destination}')


if __name__ == '__main__':
    main()
