"""Kiểm tra ngữ nghĩa CTL và tách điều kiện nghiệp vụ khỏi overflow."""
from pathlib import Path
import sys
import unittest

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'supporting-analysis/verification'))
sys.path.insert(0, str(ROOT / 'supporting-analysis/tools'))
from ctl_checker import CTLChecker, parse_formula
from verify_spec_workbooks import solve
from z3 import And, Int, Or


class FormalTests(unittest.TestCase):
    def setUp(self):
        self.checker = CTLChecker({'start': {'pending'}, 'done': {'finished'}},
                                  {'start': ['start', 'done'], 'done': ['done']}, {'start'})

    def test_ef_does_not_imply_af(self):
        self.assertTrue(self.checker.check('EF(finished)')['holds'])
        result = self.checker.check('AF(finished)')
        self.assertFalse(result['holds'])
        self.assertEqual(result['counterexamples'][0]['cycle'], ['start', 'start'])

    def test_existential_and_universal_next(self):
        self.assertTrue(self.checker.check('EX(finished)')['holds'])
        self.assertFalse(self.checker.check('AX(finished)')['holds'])

    def test_greatest_fixed_points(self):
        self.assertTrue(self.checker.check('EG(pending)')['holds'])
        self.assertFalse(self.checker.check('AG(pending)')['holds'])

    def test_implication_and_precedence(self):
        self.assertTrue(self.checker.check('AG(finished -> AX(finished))')['holds'])
        self.assertFalse(self.checker.check('AG(pending -> AF(finished))')['holds'])
        self.assertEqual(parse_formula('pending | finished & pending'),
                         ('|', ('atom', 'pending'), ('&', ('atom', 'finished'), ('atom', 'pending'))))

    def test_reject_unknown_labels_and_deadlocks(self):
        with self.assertRaises(ValueError):
            self.checker.check('AG(typo)')
        with self.assertRaises(ValueError):
            CTLChecker({'s': {'p'}}, {'s': []}, {'s'})

    def test_multiple_initial_states_all_must_satisfy(self):
        checker = CTLChecker(self.checker.states, self.checker.transitions, {'start', 'done'})
        self.assertFalse(checker.check('EG(pending)')['holds'])

    def test_business_sat_does_not_prove_overflow(self):
        a, b = Int('a'), Int('b')
        variables = {'a': a, 'b': b}
        business = And(a >= 0, a <= 10, b >= 0, b <= 10)
        overflow = Or(a+b > 2147483647, a+b < -2147483648)
        bounds = [And(v >= -2147483648, v <= 2147483647) for v in variables.values()]
        self.assertEqual(solve(business, variables)['verdict'], 'sat')
        self.assertEqual(solve(overflow, variables, bounds)['verdict'], 'sat')
        self.assertEqual(solve(And(business, overflow), variables, bounds)['verdict'], 'unsat')


if __name__ == '__main__':
    unittest.main()
