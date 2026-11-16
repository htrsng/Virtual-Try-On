"""Protect the meaning of advisory VALID/INVALID metrics, not HTTP outcomes."""
from copy import deepcopy
from pathlib import Path
import sys
import unittest

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from quality_campaign import structural_validity, load_seed


class QualitySchemaTests(unittest.TestCase):
    def test_known_seeds_pass_the_advisory_schema(self):
        self.assertTrue(structural_validity('login', load_seed('seed_login_valid.json')))
        self.assertTrue(structural_validity('orders', load_seed('seed_order_valid.json')))

    def test_json_boolean_is_not_an_integer_quantity(self):
        order = deepcopy(load_seed('seed_order_valid.json'))
        order['products'][0]['quantity'] = True
        self.assertFalse(structural_validity('orders', order))

    def test_shape_validity_does_not_claim_catalog_integrity(self):
        order = deepcopy(load_seed('seed_order_valid.json'))
        order['products'][0]['price'] = 1
        order['totalAmount'] = 2
        self.assertTrue(structural_validity('orders', order))

    def test_nonfinite_and_missing_fields_are_invalid(self):
        order = deepcopy(load_seed('seed_order_valid.json'))
        order['totalAmount'] = float('inf')
        self.assertFalse(structural_validity('orders', order))
        self.assertFalse(structural_validity('login', {'email': 'test@example.test'}))


if __name__ == '__main__':
    unittest.main()
