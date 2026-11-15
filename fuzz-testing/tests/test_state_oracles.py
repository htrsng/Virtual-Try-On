"""Fault-based checks: HTTP rejection must not conceal writes to stored data."""
from copy import deepcopy
from pathlib import Path
import sys
import unittest

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / 'fuzzers'))
from oracles import evaluate


USER = {'_id': 'victim', 'role': 'user', 'fullName': 'Original', 'password_fingerprint': 'old'}
PRODUCT = {'_id': 'p1', 'id': 1, 'price': 200000}
ORDER = {'_id': 'o1', 'userId': 'self', 'status': 'Đã hủy', 'totalAmount': 400000}


def frame(collection, status, before, after=None, method='PUT', url=None, body=None):
    paths = {'users': '/api/users/victim', 'products': '/api/products/1', 'orders': '/api/orders/o1'}
    before = {collection: deepcopy(before)}
    if collection == 'orders':
        before.update(products=[deepcopy(PRODUCT)], coupons=[], notifications=[])
    after_state = deepcopy(before)
    if after is not None:
        after_state[collection] = deepcopy(after)
    return {'method': method, 'url': url or paths[collection], 'status': status,
            'input': {}, 'body': body or {},
            'resource': {'collection': collection, 'id': 'victim' if collection == 'users' else 1 if collection == 'products' else 'o1'},
            'state_before': before, 'state_after': after_state}


def measured(observation):
    return {'observations': [observation], 'catalog': [deepcopy(PRODUCT)],
            'final_products': observation['state_after'].get('products', [])}


class StoredStateOracleTests(unittest.TestCase):
    def test_rejected_duplicate_requires_unchanged_catalog(self):
        case = {'check': {'kind': 'duplicate_id'}}
        for status in (400, 409, 422):
            for changed in ([dict(PRODUCT, price=1)], [PRODUCT, dict(PRODUCT, _id='p2')], []):
                with self.subTest(status=status, changed=changed):
                    last = frame('products', status, [PRODUCT], changed, method='POST', url='/api/products')
                    last['input'] = {'id': 1}
                    self.assertFalse(evaluate(case, measured(last)))

    def test_rejected_duplicate_with_preserved_catalog_passes(self):
        last = frame('products', 409, [PRODUCT], method='POST', url='/api/products')
        last['input'] = {'id': 1}
        self.assertTrue(evaluate({'check': {'kind': 'duplicate_id'}}, measured(last)))

    def test_rejected_role_change_must_preserve_stored_user(self):
        case = {'check': {'kind': 'role_unchanged'}}
        for status in (400, 401, 403, 422):
            last = frame('users', status, [USER], [dict(USER, role='admin')])
            with self.subTest(status=status):
                self.assertFalse(evaluate(case, measured(last)))

    def test_rejected_profile_write_cannot_change_password_or_another_user(self):
        case = {'check': {'kind': 'status', 'allowed': [403]}}
        other = dict(USER, _id='other')
        for changed in ([dict(USER, password_fingerprint='new'), other], [USER, dict(other, role='admin')]):
            last = frame('users', 403, [USER, other], changed)
            self.assertFalse(evaluate(case, measured(last)))

    def test_role_success_response_cannot_conceal_stored_admin_role(self):
        last = frame('users', 200, [USER], [dict(USER, role='admin')], body={'role': 'user'})
        self.assertFalse(evaluate({'check': {'kind': 'role_unchanged'}}, measured(last)))

    def test_role_check_uses_targeted_victim_not_self(self):
        actor = dict(USER, _id='self')
        last = frame('users', 200, [actor, USER], [actor, dict(USER, role='admin')], body={'role': 'user'})
        result = measured(last)
        result['initial_entity'] = actor
        result['final_entity'] = actor
        self.assertFalse(evaluate({'check': {'kind': 'role_unchanged'}}, result))

    def test_role_success_can_increment_version_without_changing_role(self):
        last = frame('users', 200, [USER], [dict(USER, __v=1)], body={'role': 'user'})
        self.assertTrue(evaluate({'check': {'kind': 'role_unchanged'}}, measured(last)))

    def test_successful_role_response_cannot_hide_a_deleted_target(self):
        last = frame('users', 200, [USER], [], body={'role': 'user'})
        self.assertFalse(evaluate({'check': {'kind': 'role_unchanged'}}, measured(last)))

    def test_rejected_order_creation_cannot_store_an_order(self):
        for status in (400, 422):
            last = frame('orders', status, [], [ORDER], method='POST', url='/api/orders')
            self.assertFalse(evaluate({'check': {'kind': 'catalog_total'}}, measured(last)))

    def test_rejected_order_with_no_writes_passes(self):
        last = frame('orders', 422, [], method='POST', url='/api/orders')
        self.assertTrue(evaluate({'check': {'kind': 'catalog_total'}}, measured(last)))

    def test_rejected_status_update_cannot_change_entity_or_notifications(self):
        case = {'check': {'kind': 'status', 'allowed': [409]}}
        last = frame('orders', 409, [ORDER], [dict(ORDER, status='Đang giao')])
        self.assertFalse(evaluate(case, measured(last)))
        last = frame('orders', 409, [ORDER])
        last['state_after']['notifications'].append({'_id': 'n1', 'userId': 'self'})
        self.assertFalse(evaluate(case, measured(last)))

    def test_missing_snapshot_is_inconclusive_not_pass(self):
        for missing in ('state_before', 'state_after', 'resource'):
            last = frame('users', 403, [USER])
            del last[missing]
            with self.subTest(missing=missing), self.assertRaises(ValueError):
                evaluate({'check': {'kind': 'status', 'allowed': [403]}}, measured(last) if missing != 'state_after' else {'observations': [last]})

    def test_missing_request_identity_cannot_bypass_snapshot_requirements(self):
        for missing in ('method', 'url'):
            last = frame('users', 403, [USER])
            del last[missing]
            with self.subTest(missing=missing), self.assertRaises(ValueError):
                evaluate({'check': {'kind': 'status', 'allowed': [403]}}, measured(last))

    def test_rejected_intermediate_write_is_not_hidden_by_later_restoration(self):
        first = frame('users', 403, [USER], [dict(USER, role='admin')])
        last = frame('users', 200, [dict(USER, role='admin')], [USER])
        self.assertFalse(evaluate({'check': {'kind': 'status', 'allowed': [200]}}, {'observations': [first, last]}))

    def test_duplicate_acceptance_requires_actual_unique_new_product(self):
        created = dict(PRODUCT, _id='p2', id=2)
        last = frame('products', 200, [PRODUCT], [PRODUCT, created], method='POST', url='/api/products', body=created)
        last['input'] = {'id': 1}
        self.assertTrue(evaluate({'check': {'kind': 'duplicate_id'}}, measured(last)))
        last['state_after']['products'] = [deepcopy(PRODUCT)]
        self.assertFalse(evaluate({'check': {'kind': 'duplicate_id'}}, measured(last)))

    def test_accepted_catalog_total_must_match_stored_order(self):
        body = {'order': dict(ORDER, totalAmount=400000)}
        last = frame('orders', 200, [], [dict(ORDER, totalAmount=2)], method='POST', url='/api/orders', body=body)
        last['input'] = {'products': [{'productId': 1, 'quantity': 2}]}
        self.assertFalse(evaluate({'check': {'kind': 'catalog_total'}}, measured(last)))


if __name__ == '__main__':
    unittest.main()
