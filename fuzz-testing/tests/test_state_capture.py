"""Exercise the Node capture path with real data and isolated faulty test doubles."""
import hashlib
from pathlib import Path
import sys
import unittest

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / 'fuzzers'))
from runtime import load_seed, run_node
from oracles import evaluate

SELF = '000000000000000000000001'
VICTIM = '000000000000000000000002'


class StateCaptureTests(unittest.TestCase):
    def test_real_target_freezes_correct_victim_and_fingerprints_password(self):
        result = run_node('scenario-runner.js', {'steps': [
            {'method': 'PUT', 'url': '/api/users/{victim}', 'actor': 'self',
             'body': {'fullName': 'New name', 'password': 'FixtureOnly!'}}],
            'check': {'kind': 'status', 'allowed': [200]}})
        last = result['observations'][-1]
        self.assertEqual(last['resource'], {'collection': 'users', 'id': VICTIM})
        self.assertEqual(last['entity_before']['_id'], VICTIM)
        self.assertEqual(last['entity_before']['fullName'], 'Victim User')
        self.assertEqual(last['entity_after']['fullName'], 'New name')
        self.assertNotEqual(last['entity_before']['password_fingerprint'], last['entity_after']['password_fingerprint'])
        expected = hashlib.sha256(b'"FixtureOnly!"').hexdigest()
        self.assertEqual(last['entity_after']['password_fingerprint'], expected)
        for rows in (last['state_before']['users'], last['state_after']['users']):
            self.assertTrue(all('password' not in user for user in rows))
        self.assertEqual(result['actor_ids']['self'], SELF)
        self.assertEqual(result['state_schema_version'], 1)

    def test_invalid_id_reaches_target_without_snapshot_cast_failure(self):
        result = run_node('scenario-runner.js', {'steps': [
            {'method': 'PUT', 'url': '/api/users/abc', 'actor': 'self', 'body': {'role': 'admin'}}],
            'check': {'kind': 'status', 'allowed': [400, 404]}})
        last = result['observations'][-1]
        self.assertEqual(last['status'], 500)  # Existing target defect, not a snapshot failure.
        self.assertIsNone(last['entity_before'])
        self.assertEqual(last['state_before'], last['state_after'])

    def test_denied_profile_write_detects_target_and_other_user_changes(self):
        for fault in (False, True, 'other-user'):
            case = {'fault': fault, 'steps': [{'method': 'PUT', 'url': '/api/users/{victim}',
                'actor': 'self', 'body': {'role': 'admin'}}],
                'check': {'kind': 'status', 'allowed': [403]}}
            with self.subTest(fault=fault):
                result = run_node('../tests/fixtures/rejected-write-harness.js', case)
                self.assertEqual(evaluate(case, result), fault is False)

    def test_denied_create_detects_phantom_product_and_order(self):
        for collection, name, check in [('products', 'product', 'duplicate_id'),
                                         ('orders', 'order', 'catalog_total')]:
            for fault in (False, True):
                body = load_seed(f'seed_{name}_valid.json')
                if collection == 'products':
                    body['id'] = 1
                case = {'fault': fault, 'steps': [{'method': 'POST', 'url': '/api/' + collection,
                    'actor': 'self', 'body': body}], 'check': {'kind': check}}
                with self.subTest(collection=collection, fault=fault):
                    result = run_node('../tests/fixtures/rejected-write-harness.js', case)
                    self.assertEqual(evaluate(case, result), not fault)

    def test_denied_order_notification_is_detected_without_order_change(self):
        case = {'fault': True, 'steps': [
            {'method': 'POST', 'url': '/api/orders', 'actor': 'self',
             'body': load_seed('seed_order_valid.json'), 'save_order': True},
            {'method': 'PUT', 'url': '/api/orders/{order}', 'actor': 'self', 'body': {'status': 'Đang giao'}}],
            'check': {'kind': 'notification-side-effect'}}
        result = run_node('../tests/fixtures/rejected-write-harness.js', case)
        last = result['observations'][-1]
        self.assertEqual(last['state_before']['orders'], last['state_after']['orders'])
        self.assertNotEqual(last['state_before']['notifications'], last['state_after']['notifications'])
        # The ordinary status oracle must reject the write, despite HTTP 403 being allowed.
        self.assertFalse(evaluate({'check': {'kind': 'status', 'allowed': [403]}}, result))


if __name__ == '__main__':
    unittest.main()
