"""Keep replay from silently accepting changed sources or losing failed cases."""
from pathlib import Path
import sys
import unittest
from unittest.mock import patch

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import replay_failures as replay


class ReplayContractTests(unittest.TestCase):
    def test_missing_manifest_is_rejected(self):
        with self.assertRaisesRegex(ValueError, 'Missing source manifest'):
            replay.verify_sources({'environment': replay.ENVIRONMENT})

    def test_manifest_cannot_escape_repository(self):
        with self.assertRaisesRegex(ValueError, 'Unsafe manifest path'):
            replay.verify_sources({'environment': replay.ENVIRONMENT,
                'source_sha256': {'../outside': 'ignored'}})

    def test_changed_source_is_rejected_before_execution(self):
        with patch.object(Path, 'is_file', return_value=True), \
             patch.object(Path, 'read_bytes', return_value=b'new code'):
            with self.assertRaisesRegex(ValueError, 'Source mismatch'):
                replay.verify_sources({'environment': replay.ENVIRONMENT,
                    'source_sha256': {'api-testing/run_suite.py': 'old hash'}})

    def test_multiple_failed_inputs_choose_one_case_without_losing_modules(self):
        source = {'executions': [
            {'status': 'PASS', 'case': {'testcase': 'TC-A', 'id': 'passing'}},
            {'status': 'FAIL', 'case': {'testcase': 'TC-A', 'id': 'first'}},
            {'status': 'FAIL', 'case': {'testcase': 'TC-A', 'id': 'second'}},
            {'status': 'FAIL', 'case': {'testcase': 'TC-B', 'id': 'other'}}]}
        cases = replay.select_failures(source)
        self.assertEqual(set(cases), {'TC-A', 'TC-B'})
        self.assertEqual(cases['TC-A']['id'], 'first')
        with self.assertRaises(ValueError):
            replay.select_failures(source, ['TC-MISSING'])

    def test_a_passing_replay_is_not_proof_of_reproduction(self):
        self.assertEqual(replay.conclusion(['FAIL', 'PASS']), 'NOT_REPRODUCED')
        self.assertEqual(replay.conclusion(['FAIL', 'ERROR']), 'INCONCLUSIVE')
        self.assertEqual(replay.conclusion(['FAIL', 'FAIL']), 'REPRODUCED')
