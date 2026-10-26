"""Synthetic thresholds verify brackets, non-reproduction and bounded handoff."""
from pathlib import Path
import sys
import unittest
sys.path.insert(0, str(Path(__file__).resolve().parents[1] / 'fuzzers'))
from boundaries import discover, materialize, bounded_values


class BoundaryTests(unittest.TestCase):
    def record(self, body):
        return {'target': 'orders', 'input': body, 'had_auth': True, 'type': 'HTTP_5XX'}

    def test_integer_threshold_and_budget(self):
        calls = []
        def probe(body):
            calls.append(body)
            return 'HTTP_5XX' if body['x'] >= 5 else None
        result = discover(self.record({'x': 8}), probe, 16)
        region = result['regions'][0]
        self.assertIn({'left': 4, 'right': 5, 'adjacent': True}, region['transitions'])
        self.assertEqual(len(calls), result['probes_used'])
        self.assertLessEqual(len(calls), 16)
        self.assertFalse(region['complete'])

    def test_not_reproduced_never_creates_region(self):
        result = discover(self.record({'x': 8}), lambda body: None)
        self.assertEqual(result['status'], 'NOT_REPRODUCED')
        self.assertEqual(result['regions'], [])

    def test_string_unicode_and_fixed_other_fields(self):
        original = {'name': '🙂' * 8, 'keep': {'role': 'user'}}
        result = discover(self.record(original), lambda b: 'HTTP_5XX' if len(b['name']) >= 5 else None, 10)
        region = result['regions'][0]
        self.assertEqual(region['axis'], 'unicode_length')
        for value in bounded_values(region, 12):
            candidate = materialize(region, value)
            self.assertEqual(len(candidate['name']), value)
            self.assertEqual(candidate['keep'], original['keep'])
            self.assertLessEqual(region['lower'], value)
            self.assertLessEqual(value, region['upper'])
        self.assertEqual(original['name'], '🙂' * 8)

    def test_two_replays_detect_flaky_failure(self):
        answers = iter(['HTTP_5XX', None])
        result = discover(self.record({'x': 8}), lambda _: next(answers))
        self.assertEqual(result['status'], 'NOT_REPRODUCED')

    def test_discrete_json_domain_has_no_arithmetic_boundary(self):
        result = discover(self.record({'x': None}),
                          lambda b: 'HTTP_5XX' if b['x'] is None else None, 16)
        region = result['regions'][0]
        self.assertEqual(region['axis'], 'json_representatives')
        self.assertEqual(region['transitions'], [])
        self.assertIsNone(materialize(region, 0)['x'])

    def test_bounded_analysis_never_changes_other_fields(self):
        from unittest.mock import patch
        from whitebox_fuzzer import focus_boundaries
        case = discover(self.record({'x': 8, 'fixed': 'unchanged'}),
                        lambda b: 'HTTP_5XX' if b['x'] >= 5 else None, 10)
        case['regions'] = case['regions'][:1]
        with patch('whitebox_fuzzer.get_valid_token', return_value='token'), \
             patch('whitebox_fuzzer.run_node', return_value={'ok': True, 'status': 500, 'body': {}, 'covered_lines': [1], 'branch_trace': []}) as run, \
             patch('whitebox_fuzzer.write_json'):
            result = focus_boundaries([case], 6, 'unused')
        region = case['regions'][0]
        self.assertEqual(result['status'], 'EXECUTED')
        for call in run.call_args_list:
            body = call.args[1]['body']
            self.assertEqual(body['fixed'], 'unchanged')
            self.assertTrue(region['lower'] <= body['x'] <= region['upper'])


if __name__ == '__main__':
    unittest.main()
