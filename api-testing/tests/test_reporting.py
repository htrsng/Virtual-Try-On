"""Guard against false green acceptance runs and misleading JUnit output."""
import importlib.util
from pathlib import Path
import unittest
import xml.etree.ElementTree as ET

spec = importlib.util.spec_from_file_location('acceptance_suite', Path(__file__).parents[1] / 'run_suite.py')
runner = importlib.util.module_from_spec(spec)
spec.loader.exec_module(runner)


class ReportingTests(unittest.TestCase):
    def test_acceptance_failure_is_nonzero_even_if_runner_succeeded(self):
        self.assertEqual(runner.exit_code([{'status': 'FAIL'}], 1), 1)

    def test_unexecuted_cases_cannot_produce_a_success_exit(self):
        self.assertEqual(runner.exit_code([{'status': 'PASS'}], 2), 2)

    def test_runner_error_has_precedence_over_business_failure(self):
        self.assertEqual(runner.exit_code([{'status': 'FAIL'}, {'status': 'ERROR'}], 2), 2)

    def test_junit_distinguishes_missing_results_from_assertion_failures(self):
        plans = [{'id': 'case-1', 'testcase': 'TC-1', 'check': {}},
                 {'id': 'case-2', 'testcase': 'TC-2', 'check': {}}]
        results = [{'case': plans[0], 'status': 'FAIL', 'elapsed_seconds': 0.1,
                    'evidence': {'observations': []}}]
        xml = ET.fromstring(runner.junit(results, plans))
        self.assertEqual(xml.attrib['tests'], '2')
        self.assertEqual(xml.attrib['failures'], '1')
        self.assertEqual(xml.attrib['skipped'], '1')
        self.assertIsNotNone(xml.find("testcase[@name='case-2']/skipped"))


if __name__ == '__main__':
    unittest.main()
