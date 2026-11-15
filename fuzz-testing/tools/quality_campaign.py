"""Bounded HTTP mutations with complete input accounting and explicit schema metrics."""
import argparse
from collections import Counter
from datetime import datetime, timezone
import hashlib
import math
from pathlib import Path
import random
import sys
import time
import uuid

import requests

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'fuzzers'))
from blackbox_fuzzer import setup_request, read_catalog_snapshot
from fuzzer_common import mutate_json, check_order_response
from runtime import ENVIRONMENT, load_seed, simulated_http_server, write_json


def structural_validity(target, body):
    """Advisory shape/type rules, not the full business or authorization contract."""
    if not isinstance(body, dict):
        return False
    nonempty = lambda value: isinstance(value, str) and bool(value.strip())
    finite = lambda value: type(value) in (int, float) and math.isfinite(value)
    if target == 'login':
        return nonempty(body.get('email')) and nonempty(body.get('password'))
    if target != 'orders':
        raise ValueError('Unsupported schema')
    items = body.get('products')
    shipping = body.get('shippingInfo')
    return (isinstance(items, list) and bool(items)
        and all(isinstance(item, dict) and type(item.get('productId')) is int and item['productId'] > 0
                and type(item.get('quantity')) is int and item['quantity'] > 0
                and finite(item.get('price')) and item['price'] > 0 for item in items)
        and finite(body.get('totalAmount')) and body['totalAmount'] >= 0
        and isinstance(shipping, dict)
        and all(nonempty(shipping.get(k)) for k in ('fullName', 'phone', 'address'))
        and nonempty(body.get('paymentMethod'))
        and all(finite(body[k]) and body[k] >= 0 for k in ('shippingFee', 'discountAmount', 'voucherDiscount') if k in body))


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--iterations', type=int, default=28)
    parser.add_argument('--seed', type=int, default=7)
    parser.add_argument('--output', type=Path)
    args = parser.parse_args()
    if not 1 <= args.iterations <= 200:
        parser.error('iterations must be 1..200 for this demonstration campaign')
    output = args.output or ROOT / 'artifacts' / f'quality-{uuid.uuid4().hex[:12]}'
    if output.exists() and any(output.iterdir()):
        parser.error('Output must be new or empty')
    output.mkdir(parents=True, exist_ok=True)
    start = time.monotonic()
    seeds = {'login': load_seed('seed_login_valid.json'),
             'orders': load_seed('seed_order_valid.json')}
    rng = random.Random(args.seed)
    records = []
    with simulated_http_server(output / 'server.log') as base_url, requests.Session() as session:
        login = setup_request(session, 'POST', base_url + '/api/auth/login', json=seeds['login'])
        if not login.get('token'):
            raise RuntimeError('Login setup missing token')
        catalog = read_catalog_snapshot(setup_request(session, 'GET', base_url + '/api/products'))
        if catalog is None:
            raise RuntimeError('Invalid setup catalog')
        for index in range(args.iterations):
            target = ('login', 'orders')[index % 2]
            candidate = mutate_json(seeds[target], rng)
            record = {'index': index, 'target': target, 'input': candidate,
                      'schema_class': 'VALID' if structural_validity(target, candidate) else 'INVALID',
                      'had_auth': target == 'orders'}
            headers = {'Authorization': 'Bearer ' + login['token']} if target == 'orders' else {}
            try:
                response = session.post(base_url + ('/api/auth/login' if target == 'login' else '/api/orders'),
                                        json=candidate, headers=headers, timeout=5)
                record['status'] = response.status_code
                try:
                    body = response.json()
                except ValueError:
                    body = {'text': response.text[:1000]}
                if isinstance(body, dict) and 'token' in body:
                    body['token'] = '[REDACTED]'
                record['response'] = body
                record['category'] = 'HTTP_5XX' if response.status_code >= 500 else 'RESPONSE'
                record['oracle_violation'] = (check_order_response(candidate, response, catalog)
                                               if target == 'orders' else None)
            except requests.RequestException as error:
                record.update(category='TRANSPORT_ERROR', error=str(error), oracle_violation=None)
            records.append(record)
    elapsed = time.monotonic() - start
    classes = Counter(r['schema_class'] for r in records)
    categories = Counter(r['category'] for r in records)
    source_files = [Path(__file__), *list((ROOT/'fuzzers').glob('*.py')),
        *list((ROOT/'target').glob('*.js')), *list((ROOT/'target/config').glob('*.js')),
        *list((ROOT/'target/routes').glob('*.js')), *list((ROOT/'data/seeds').glob('*.json'))]
    report = {'created_utc': datetime.now(timezone.utc).isoformat(), 'environment': ENVIRONMENT,
        'seed': args.seed, 'iterations': args.iterations, 'setup_requests': 2,
        'mutation_requests_attempted': len(records),
        'mutation_responses_received': sum('status' in r for r in records),
        'schema_counts': dict(classes), 'schema_valid_ratio': classes['VALID'] / len(records),
        'schema_scope': 'Advisory required fields/types/nonnegative amounts; no email syntax, length caps, catalog pricing or auth semantics.',
        'categories': dict(categories), 'oracle_violations': sum(bool(r['oracle_violation']) for r in records),
        'elapsed_seconds': elapsed, 'mutation_inputs_per_second': len(records)/elapsed,
        'throughput_scope': 'Includes startup/setup, HTTP, schema/oracle evaluation and shutdown; not isolated target throughput.',
        'coverage': {'line': None, 'branch': None, 'reason': 'No coverage instrumentation in this campaign.'},
        'source_sha256': {p.relative_to(ROOT.parent).as_posix(): hashlib.sha256(p.read_bytes()).hexdigest() for p in source_files},
        'oracles': ['login: response/HTTP 5xx observation only', 'orders: input validity, catalog membership and catalog total via check_order_response'],
        'records': records}
    write_json(output/'report.json', report)
    print(f"{len(records)} mutations; schema {dict(classes)}; {dict(categories)}; report: {output/'report.json'}")
    return 2 if categories['TRANSPORT_ERROR'] else 0


if __name__ == '__main__':
    if hasattr(sys.stdout, 'reconfigure'):
        sys.stdout.reconfigure(encoding='utf-8')
    raise SystemExit(main())
