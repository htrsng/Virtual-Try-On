"""Kiểm tra hồi quy để phát hiện báo lỗi nhầm, bỏ sót lỗi và thống kê sai."""
import unittest
import json
import subprocess
from unittest.mock import patch, Mock
from pathlib import Path
import sys

# Các mô-đun chính và công cụ báo cáo được đặt riêng khỏi bài kiểm tra.
PROJECT_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(PROJECT_ROOT / 'fuzzers'))
sys.path.insert(0, str(PROJECT_ROOT / 'supporting-analysis/tools'))
import tempfile
from blackbox_fuzzer import read_catalog_snapshot, run_campaign
from fuzzer_common import check_order_response
from spec_campaign import evaluate, read_specs, scenarios, build_report, application_cases
from whitebox_fuzzer import fuzz_target
from build_report import render_report
from runtime import ENVIRONMENT, HarnessError, job_file, parse_result, read_json, run_node, write_json
from whitebox_fuzzer import error_type
from controlled_comparison import experiment, runner_failures

class Response:
    status_code = 200

    def __init__(self, total):
        self.total = total

    def json(self):
        return {'order': {'totalAmount': self.total}}

class CampaignTests(unittest.TestCase):

    def test_every_api_testcase_has_an_executable_plan(self):
        included, _ = application_cases(read_specs())
        required = {entry['testcase']['ID'] for entry in included}
        self.assertEqual({plan['testcase'] for plan in scenarios(0, 7)}, required)



    def test_corrupted_catalog_is_not_a_missing_product_or_runner_crash(self):
        for price in (None, 'bad', [], {}, True, float('inf'), -1):
            self.assertIsNone(read_catalog_snapshot([{'id': 1, 'price': price}]))
        self.assertIsNone(read_catalog_snapshot([{'id': 1}]))
        self.assertEqual(read_catalog_snapshot([{'id': 1, 'price': 100}]), {1: 100})
        session = Mock()
        session.request.return_value.status_code = 400
        setup = [{'token': 'test'}, {'order': {'_id': 'order'}},
                 [{'email': 'user@test.com',
                      '_id': 'self'},
                      {'email': 'victim@test.com',
                      '_id': 'victim'}],
                 [{'id': 1, 'price': 100}], [{'id': 1}]]
        from runtime import WORK_DIR
        WORK_DIR.mkdir(parents=True, exist_ok=True)
        with tempfile.TemporaryDirectory(dir=WORK_DIR) as output:
            with patch('blackbox_fuzzer.setup_request',
                 side_effect=setup), patch('blackbox_fuzzer.load_seed',
                 return_value={'email': 'user@test.com',
                 'status': 'initial'}):
                result = run_campaign(session, 'http://127.0.0.1:5050', 2, 42, Path(output))
            self.assertEqual(result['errors'], [])
            self.assertEqual(len(result['catalog_observations']), 1)
            self.assertEqual(session.request.call_count, 2)
            self.assertTrue(Path(result['catalog_observations'][0]['saved_to']).exists())

    def test_catalog_detects_consistent_client_price_tampering(self):
        body = {'products': [{'productId': 1, 'price': 1, 'quantity': 2}]}
        self.assertIsNotNone(check_order_response(body, Response(2), {1: 200000}))
        self.assertIsNone(check_order_response(body, Response(400000), {1: 200000}))

    def test_malformed_product_id_does_not_crash_oracle(self):
        body = {'products': [{'productId': {}, 'quantity': 2}]}
        self.assertIsNotNone(check_order_response(body, Response(2), {1: 200000}))

    def test_exact_iteration_budget(self):
        import random
        with patch('whitebox_fuzzer.run_single',
             return_value={'ok': True,
             'status': 400,
             'covered_lines': []}) as run:
            result = fuzz_target('orders', {}, 'token', random.Random(7), 7, [], [])
        self.assertEqual(result['iterations_used'], 7)
        self.assertEqual(run.call_count, 7)

    def test_failed_setup_cannot_prove_terminal_transition(self):
        case = {'require_intermediate_success': True, 'check': {'kind': 'status', 'allowed': [400]}}
        result = {'observations': [{'status': 500}, {'status': 400}]}
        with self.assertRaises(ValueError):
            evaluate(case, result)

    def test_specs_and_case_references(self):
        specs = read_specs()
        ids = [tc['ID'] for s in specs for tc in s['sheets']['TestCase']]
        self.assertEqual(len(ids), len(set(ids)))
        plans = scenarios(8, 7)
        self.assertTrue(all((p['testcase'] in ids for p in plans)))
        self.assertEqual(plans, scenarios(8, 7))

    def test_audit_never_marks_unexecuted_test_as_pass(self):
        entries = build_report(read_specs(), [], planned_cases=scenarios(0, 7))
        self.assertEqual(len(entries), 29)
        self.assertEqual(sum((e['status'] == 'NOT_RUN' for e in entries)), 29)
        self.assertEqual(sum(e['status'] == 'NOT_IMPLEMENTED' for e in entries), 0)
        self.assertNotIn('PASS', {e['status'] for e in entries})
        self.assertNotIn('SIMULATION_ONLY', {e['status'] for e in entries})

    def test_full_workbooks_are_separate_from_executable_api_scope(self):
        included, excluded = application_cases(read_specs())
        self.assertEqual((len(included), len(excluded)), (29, 75))
        self.assertTrue(all(len(spec['sheets']) == 10 for spec in read_specs()))
        self.assertTrue(all(entry.get('reason') for entry in excluded))
        self.assertTrue(all(e['testcase']['TieuDe'].startswith(('Hàm sinh mã C', 'Hàm Python', 'Kiểm tra tràn số', 'Kiểm tra quy trình fuzzing:')) is False for e in included))
        self.assertFalse({e['testcase']['ID'] for e in included} & {e['testcase']['ID'] for e in excluded})

    def test_report_refuses_to_mix_stub_and_mongodb(self):
        data = dict(environment='sales_server_mongodb',
             created_utc='test',
             random_seed=7,
             executions=[],
             counts={},
             traceability=[],
             finding_groups=[],
             limitations=[])
        with self.assertRaises(ValueError):
            render_report(data, {'environment': 'node_harness_stub'})

    def test_partial_testcase_is_not_marked_pass(self):
        plans = scenarios(0, 7)
        plan = next((p for p in plans if p['testcase'] == 'TC-AUTH-1'))
        entries = build_report(read_specs(),
             [{'case': plan,
             'status': 'PASS'}],
             planned_cases=plans)
        entry = next((e for e in entries if e['testcase']['ID'] == 'TC-AUTH-1'))
        self.assertEqual(entry['status'], 'PARTIAL')

    def test_runner_protocol_rejects_missing_marker_and_wrong_backend(self):
        for stdout in ('unrelated output',
             '===RESULT===[]',
             '===RESULT==={"ok":true,"environment":"mongodb"}'):
            with self.subTest(stdout=stdout), self.assertRaises(HarnessError):
                parse_result(stdout)

    def test_http_500_is_not_a_process_failure(self):
        result = parse_result('===RESULT===' + json.dumps({'ok': True,
             'environment': ENVIRONMENT,
             'status': 500}))
        self.assertEqual(error_type(result), 'HTTP_5XX')

    def test_timeout_cleans_temporary_job(self):
        paths = []

        def timeout(command, **kwargs):
            from pathlib import Path
            paths.append(Path(command[-1]))
            raise subprocess.TimeoutExpired('node', 1)
        with patch('runtime.subprocess.run', side_effect=timeout):
            with self.assertRaises(HarnessError) as failure:
                run_node('scenario_runner.js', {}, timeout=1)
        self.assertEqual(failure.exception.kind, 'TIMEOUT')
        self.assertTrue(paths)
        self.assertTrue(all((not path.exists() for path in paths)))

    def test_failed_write_preserves_previous_evidence(self):
        with job_file({'original': True}) as path:
            with patch('runtime.os.replace', side_effect=PermissionError('locked evidence')):
                with self.assertRaises(PermissionError):
                    write_json(path, {'original': False})
            self.assertEqual(read_json(path), {'original': True})

    def test_feedback_selects_new_parent_after_energy_batch(self):
        with patch('controlled_comparison.TARGETS',
             ['orders']), patch('controlled_comparison.load_seed',
             return_value={'depth': 0}), patch('controlled_comparison.mutate_json',
             side_effect=lambda parent,
             rng: {'depth': parent['depth'] + 1}), patch('controlled_comparison.check_finding',
             return_value=None), patch('controlled_comparison.run_single',
             return_value={'ok': True,
             'status': 400,
             'covered_lines': [1]}):
            baseline = experiment('mutation_baseline', 7, 7, 'token')
            guided = experiment('coverage_feedback', 7, 7, 'token')
        self.assertEqual({a['input']['depth'] for a in baseline['attempts']}, {1})
        self.assertEqual(guided['attempts'][-1]['input']['depth'], 2)
        self.assertEqual(baseline['iterations'], guided['iterations'])

    def test_comparison_counts_timeout_separately_from_http_errors(self):
        self.assertEqual(runner_failures({'outcomes': {'RESPONSE': 4,
             'HTTP_5XX': 3,
             'TIMEOUT': 1}}),
             1)
if __name__ == '__main__':
    unittest.main()
