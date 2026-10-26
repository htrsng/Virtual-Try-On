"""Kiểm tra phủ định tiền tố, UNSAT và sự khớp giữa mô hình với target Node."""
from pathlib import Path
import sys
import unittest

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / 'fuzzers'))
from concolic import make_body, solve_flip, validate_trace, KINDS
from runtime import run_node
from whitebox_fuzzer import get_valid_token


class ConcolicTests(unittest.TestCase):
    def test_required_and_cast_empty_cannot_both_be_reached_true(self):
        trace = [{'id': 'order.total.required', 'taken': False},
                 {'id': 'cast.empty', 'taken': False}]
        result = solve_flip(trace, 1)
        self.assertEqual(result['solver_status'], 'unsat')

    def test_flip_discards_old_suffix(self):
        trace = [{'id': 'order.total.required', 'taken': False},
                 {'id': 'cast.empty', 'taken': False},
                 {'id': 'cast.number', 'taken': True}]
        result = solve_flip(trace, 0)
        self.assertEqual(result['solver_status'], 'sat')
        self.assertIn(result['model_kind'], (4, 5))
        self.assertEqual(len(result['required_prefix']), 1)

    def test_missing_and_null_remain_distinct_inputs(self):
        self.assertNotIn('totalAmount', make_body(5))
        self.assertIsNone(make_body(4)['totalAmount'])

    def test_model_mismatch_is_not_a_confirmed_branch(self):
        with self.assertRaises(ValueError):
            validate_trace(0, [{'id': 'cast.number', 'taken': False}])
        with self.assertRaises(ValueError):
            validate_trace(0, [])

    def test_all_representatives_match_actual_api_branches(self):
        token = get_valid_token()
        for kind in range(len(KINDS)):
            with self.subTest(kind=KINDS[kind]):
                result = run_node('single_run_harness.js', {
                    'target': 'orders', 'body': make_body(kind), 'token': token,
                    'use_auth': True, 'trace_branches': True})
                validate_trace(kind, result['branch_trace'])
                if result['status'] >= 400:
                    self.assertEqual(result['orders_created'], 0)
                if kind == 0:
                    self.assertIn(result['status'], (200, 201))
                    self.assertEqual(result['orders_created'], 1)


if __name__ == '__main__':
    unittest.main()
