"""Kiểm tra phân loại bằng chứng và khảo sát lân cận không sửa seed."""
from pathlib import Path
import sys
import unittest
from unittest.mock import patch
sys.path.insert(0, str(Path(__file__).resolve().parents[1] / 'fuzzers'))
from finding_types import evidence_category, local_neighbors, summarize_evidence
from whitebox_fuzzer import focus_blackbox


class EvidenceTests(unittest.TestCase):
    def test_http_error_is_not_memory_error(self):
        summary = summarize_evidence([{'type': 'HTTP_5XX'}], [])
        self.assertEqual(evidence_category('HTTP_5XX'), 'APPLICATION_HTTP_ERROR')
        self.assertIsNone(summary['confirmed_memory_errors'])
        self.assertIsNone(summary['confirmed_process_crashes'])

    def test_timeout_is_suspected_not_confirmed_hang(self):
        self.assertEqual(evidence_category('TIMEOUT'), 'SUSPECTED_HANG')
        self.assertEqual(evidence_category('PROTOCOL_ERROR'), 'HARNESS_OR_TRANSPORT_ERROR')

    def test_neighbors_preserve_original_and_budget(self):
        original = {'products': [{'quantity': 5}], 'name': 'abc'}
        probes = local_neighbors(original, 4)
        self.assertEqual(original, {'products': [{'quantity': 5}], 'name': 'abc'})
        self.assertEqual(probes[0], original)
        self.assertEqual(len(probes), 4)
        self.assertEqual(probes[1]['products'][0]['quantity'], 4)
        self.assertEqual(len(local_neighbors(original, 1)), 1)

    def test_focused_replay_preserves_auth_and_then_mutates(self):
        report = {'environment': 'node_harness_stub', 'errors': [
            {'target': 'product_update', 'input': {'price': 1}, 'had_auth': False, 'type': 'HTTP_5XX'}]}
        result = {'ok': True, 'status': 500, 'covered_lines': [1], 'body': {}}
        with patch('whitebox_fuzzer.read_json', return_value=report), \
             patch('whitebox_fuzzer.get_valid_token', return_value='token'), \
             patch('whitebox_fuzzer.run_single', return_value=result) as run, \
             patch('whitebox_fuzzer.check_finding', return_value=None), \
             patch('whitebox_fuzzer.write_json') as write:
            summary = focus_blackbox('unused.json', iterations=8, output='unused', max_cases=1)
        self.assertEqual(summary['iterations_used'], 8)
        self.assertEqual(run.call_args_list[0].args[1], {'price': 1})
        self.assertTrue(all(call.args[3] is False for call in run.call_args_list))
        attempts = write.call_args.args[1]
        self.assertEqual(attempts[0]['phase'], 'exact_replay')
        self.assertIn('coverage_mutation', {item['phase'] for item in attempts})


if __name__ == '__main__':
    unittest.main()
