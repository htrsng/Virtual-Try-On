"""Kiểm tra luồng điều phối và việc không tạo kết quả whitebox giả."""
from pathlib import Path
import sys
import unittest
from unittest.mock import patch

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / 'fuzzers'))
from run_fuzzing import main


class MainFlowTests(unittest.TestCase):
    def run_flow(self, candidates):
        blackbox = {'environment': 'node_harness_stub', 'iterations': 10,
                    'errors': [], 'vuln_findings': candidates, 'evidence_summary': {}}
        whitebox = {'iterations_used': 12, 'errors': [], 'evidence_summary': {}}
        with patch('sys.argv', ['run_fuzzing.py', '--iterations', '10', '--output', 'unused']), \
             patch('run_fuzzing.run_blackbox', return_value=blackbox), \
             patch('run_fuzzing.investigate_boundaries', return_value=[]), \
             patch('run_fuzzing.focus_blackbox', return_value=whitebox) as focus, \
             patch('run_fuzzing.write_json', side_effect=lambda path, value: path) as write, \
             patch('pathlib.Path.write_text'), \
             patch('builtins.print'):
            code = main()
        return code, focus, write.call_args.args[1]

    def test_no_candidate_skips_instead_of_claiming_successful_whitebox(self):
        code, focus, summary = self.run_flow([])
        self.assertEqual(code, 0)
        focus.assert_not_called()
        self.assertEqual(summary['whitebox_status'], 'SKIPPED_NO_CANDIDATE')
        self.assertIsNone(summary['whitebox_evidence'])

    def test_candidate_triggers_whitebox_with_blackbox_artifact(self):
        code, focus, summary = self.run_flow([
            {'target': 'orders', 'input': {'totalAmount': -1}, 'had_auth': True}])
        self.assertEqual(code, 0)
        self.assertEqual(focus.call_args.args[0], Path('unused/blackbox/report.json'))
        self.assertEqual(summary['whitebox_status'], 'EXECUTED')
        self.assertEqual(summary['whitebox_inputs'], 12)


if __name__ == '__main__':
    unittest.main()
