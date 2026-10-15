"""Tạo kịch bản kiểm thử API có thể tái hiện, gắn với ID testcase trong Excel gốc."""
from copy import deepcopy
import random
from runtime import load_seed

# Đọc dữ liệu hợp lệ ban đầu từ seed_corpus.
def seed(name):
    return load_seed(f'seed_{name}_valid.json')

# Mô tả một request; chưa gửi request tại bước này.
def step(url, body=None, actor='self', method='POST', **kw):
    return dict(url=url, body=body, actor=actor, method=method, **kw)

# Tạo kịch bản và điều kiện kiểm tra gắn với ID testcase Excel.
def scenarios(fuzz_cases=8, rng_seed=7):
    """Deterministic controls plus bounded mutations tied to Excel requirement IDs."""
    cases = []
    order = seed('order')
    login = seed('login')
    status = seed('order_status')['status']

    # Thêm một kịch bản vào danh sách cần chạy.
    def add(tc, suffix, steps, check, **extra):
        cases.append(dict(id=f'{tc}:{suffix}', testcase=tc, steps=steps, check=check, **extra))

    def order_setup():
        return step('/api/orders', deepcopy(order), save_order=True)
    for index, body in enumerate([{},
         {'email': login['email']},
         {'email': '   ',
         'password': '   '}]):
        add('TC-AUTH-1',
             str(index),
             [step('/api/auth/login',
             body,
             None)],
             {'kind': 'status',
             'allowed': [400]})
    for index, value in enumerate([{}, [], 123, None, 'A' * 5000]):
        add('TC-AUTH-2',
             str(index),
             [step('/api/auth/login',
             dict(login,
             email=value),
             None)],
             {'kind': 'no_5xx'})
    add('TC-AUTH-3',
         'enumeration',
         [step('/api/auth/login',
         dict(login,
         email='absent@test.com'),
         None),
         step('/api/auth/login',
         dict(login,
         password='wrong'),
         None)],
         {'kind': 'same_response'})
    add('TC-AUTH-4',
         'counter-50',
         [{'parallel': [step('/api/auth/login',
         dict(login,
         password='wrong'),
         None) for _ in range(50)]}],
         {'kind': 'counter',
         'expected': 50},
         inspect_login_counter=True)
    add('TC-AUTH-5',
         'jwt-role',
         [step('/api/auth/login',
         dict(login,
         role='admin'),
         None)],
         {'kind': 'jwt'})
    add('TC-AUTH-7',
         'long-email',
         [step('/api/auth/login',
         dict(login,
         email='A' * 5000),
         None)],
         {'kind': 'status',
         'allowed': [400,
         404]})
    timing = []
    for _ in range(50):
        timing.extend([step('/api/auth/login',
             dict(login,
             email='absent@test.com'),
             None),
             step('/api/auth/login',
             dict(login,
             password='wrong'),
             None)])
    add('TC-AUTH-6', 'timing-100', timing, {'kind': 'timing', 'threshold_ms': 20})
    for index, value in enumerate([{},
         'abc',
         [],
         [{'productId': 1,
         'price': 200000,
         'quantity': -1}]]):
        add('TC-ORD-1',
             str(index),
             [step('/api/orders',
             dict(order,
             products=value))],
             {'kind': 'status',
             'allowed': [400,
             422]})
    for field in ['shippingInfo', 'fullName', 'phone', 'address']:
        body = deepcopy(order)
        if field == 'shippingInfo':
            del body[field]
        else:
            del body['shippingInfo'][field]
        add('TC-ORD-2', field, [step('/api/orders', body)], {'kind': 'status', 'allowed': [400]})
    body = deepcopy(order)
    del body['totalAmount']
    add('TC-ORD-3',
         'missing-total',
         [step('/api/orders',
         body)],
         {'kind': 'status',
         'allowed': [400]})
    for index, value in enumerate([{}, [], 'NaN', 'Infinity']):
        add('TC-ORD-4',
             str(index),
             [step('/api/orders',
             dict(order,
             totalAmount=value))],
             {'kind': 'status',
             'allowed': [400,
             422]})
    body = deepcopy(order)
    body['products'][0]['price'] = 1
    body['totalAmount'] = 2
    add('TC-ORD-5', 'catalog-price', [step('/api/orders', body)], {'kind': 'catalog_total'})
    add('TC-ORD-6',
         'negative-total',
         [step('/api/orders',
         dict(order,
         totalAmount=-1))],
         {'kind': 'status',
         'allowed': [400,
         422]})
    coupon = dict(order, discountCode='FUZZ-RACE-7')
    add('TC-ORD-7',
         'concurrent-coupon',
         [{'parallel': [step('/api/orders',
         coupon),
         step('/api/orders',
         coupon)]}],
         {'kind': 'one_success'})
    for actor in [None, 'victim']:
        add('TC-OS-1',
             str(actor),
             [order_setup(),
             step('/api/orders/{order}',
             {'status': status},
             actor,
             'PUT')],
             {'kind': 'status',
             'allowed': [401,
             403]})
    for value in ['', '0000000000']:
        add('TC-OS-2',
             repr(value),
             [order_setup(),
             step('/api/orders/{order}',
             {'status': value},
             method='PUT')],
             {'kind': 'status',
             'allowed': [400,
             422]})
    from fuzzer_common import VALID_TRANSITIONS
    processing = next(iter(VALID_TRANSITIONS))
    shipping = next((s for s in VALID_TRANSITIONS[processing] if s != processing and len(VALID_TRANSITIONS[s]) == 2))
    delivered = next((s for s in VALID_TRANSITIONS[shipping] if s != shipping))
    add('TC-OS-3',
         'revert-delivered',
         [order_setup(),
         step('/api/orders/{order}',
         {'status': shipping},
         method='PUT'),
         step('/api/orders/{order}',
         {'status': delivered},
         method='PUT'),
         step('/api/orders/{order}',
         {'status': processing},
         method='PUT')],
         {'kind': 'status',
         'allowed': [400,
         409,
         422]},
         require_intermediate_success=True)
    add('TC-OS-5',
         'positive-control',
         [order_setup(),
         step('/api/orders/{order}',
         {'status': shipping},
         method='PUT')],
         {'kind': 'notification',
         'status': shipping},
         inspect_notifications=True)
    cancelled = next((s for s in VALID_TRANSITIONS[processing] if s != processing and len(VALID_TRANSITIONS[s]) == 1))
    add('TC-OS-6',
         'concurrent-version',
         [order_setup(),
         {'parallel': [step('/api/orders/{order}',
         {'status': shipping,
         '__v': 0},
         method='PUT'),
         step('/api/orders/{order}',
         {'status': cancelled,
         '__v': 0},
         method='PUT')]}],
         {'kind': 'version',
         'field': 'status'},
         inspect_entity='order')
    for url, value in [('/api/orders/abc', status), ('/api/orders/{order}', {'a': 1})]:
        add('TC-OS-4',
             url,
             [order_setup(),
             step(url,
             {'status': value},
             method='PUT')],
             {'kind': 'status',
             'allowed': [400,
             404,
             422]})
    for actor in [None, 'self']:
        add('TC-USR-1',
             str(actor),
             [step('/api/users/{victim}',
             {'fullName': 'Fuzz probe'},
             actor,
             'PUT')],
             {'kind': 'status',
             'allowed': [401,
             403]})
    add('TC-USR-2',
         'role',
         [step('/api/users/{self}',
         {'role': 'admin'},
         method='PUT')],
         {'kind': 'role_unchanged'})
    add('TC-USR-3',
         'invalid-id',
         [step('/api/users/abc',
         {'fullName': 'probe'},
         method='PUT')],
         {'kind': 'status',
         'allowed': [400,
         404]})
    add('TC-USR-4',
         'password-storage',
         [step('/api/users/{victim}',
         {'password': 'PlaintextProbe!'},
         'admin',
         'PUT')],
         {'kind': 'password'},
         password_audit='PlaintextProbe!')
    add('TC-USR-5',
         'wrong-secret',
         [step('/api/auth/create-admin',
         {'email': 'probe@test.com',
         'password': 'Test123!',
         'secretKey': 'wrong'},
         None)],
         {'kind': 'status',
         'allowed': [403]})
    add('TC-USR-6',
         'concurrent-version',
         [{'parallel': [step('/api/users/{self}',
         {'fullName': 'first',
         '__v': 0},
         method='PUT'),
         step('/api/users/{self}',
         {'fullName': 'second',
         '__v': 0},
         method='PUT')]}],
         {'kind': 'version',
         'field': 'fullName'},
         inspect_entity='user')
    for method, url in [('POST', '/api/products'), ('PUT', '/api/products/1')]:
        for actor in [None, 'self']:
            add('TC-PRD-1',
                 f'{method}-{actor}',
                 [step(url,
                 seed('product'),
                 actor,
                 method)],
                 {'kind': 'status',
                 'allowed': [401,
                 403]})
    add('TC-PRD-2',
         'negative-price',
         [step('/api/products/1',
         {'price': -500},
         'admin',
         'PUT')],
         {'kind': 'status',
         'allowed': [400,
         422]})
    add('TC-PRD-3',
         'price-object',
         [step('/api/products/1',
         {'price': {'a': 1}},
         'admin',
         'PUT')],
         {'kind': 'status',
         'allowed': [400,
         422]})
    add('TC-PRD-4',
         'missing-product',
         [step('/api/products/999999',
         {'price': 500},
         'admin',
         'PUT')],
         {'kind': 'status',
         'allowed': [404]})
    add('TC-PRD-5',
         'duplicate-id',
         [step('/api/products',
         dict(seed('product'),
         id=1),
         'admin')],
         {'kind': 'duplicate_id'})
    add('TC-PRD-6',
         'concurrent-version',
         [{'parallel': [step('/api/products/1',
         {'stock': 11,
         '__v': 0},
         'admin',
         'PUT'),
         step('/api/products/1',
         {'stock': 12,
         '__v': 0},
         'admin',
         'PUT')]}],
         {'kind': 'version',
         'field': 'stock'},
         inspect_entity='product')
    rng = random.Random(rng_seed)
    for i in range(fuzz_cases):
        value = rng.choice([None, {}, [], True, 'not-a-number', -1, -999999999])
        add('TC-ORD-4',
             f'fuzz-{i}',
             [step('/api/orders',
             dict(order,
             totalAmount=value))],
             {'kind': 'status',
             'allowed': [400,
             422]})
    cases.extend(additional_scenarios())
    return cases


def additional_scenarios():
    """16 testcase bổ sung: mỗi input sai version là một kịch bản độc lập."""
    cases = []
    modules = [
        ('OS', '/api/orders/{order}', 'status', 'Đang giao', 'Đã giao', 'order', 'self'),
        ('USR', '/api/users/{self}', 'fullName', 'Tên lần một', 'Tên lần hai', 'user', 'self'),
        ('PRD', '/api/products/1', 'stock', 11, 12, 'product', 'admin'),
    ]
    for module, url, field, first, second, entity, actor in modules:
        setup = []
        if module == 'OS':
            setup = [step('/api/orders', seed('order'), save_order=True)]

        def update(value, version, include_version=True):
            body = {field: value}
            if include_version:
                body['__v'] = version
            return step(url, body, actor, 'PUT')

        def add(number, suffix, operations, expected_statuses, final_version, final_value):
            cases.append({
                'id': f'TC-{module}-{number}:{suffix}',
                'testcase': f'TC-{module}-{number}',
                'steps': deepcopy(setup + operations),
                'inspect_entity': entity,
                'check': {
                    'kind': 'version_sequence', 'field': field,
                    'statuses': expected_statuses, 'version': final_version,
                    'value': final_value, 'setup_count': len(setup),
                },
            })

        add(17, 'stale-version', [update(first, 0), update(second, 0)], [200, 409], 1, first)
        for index, invalid_version in enumerate([-1, 0.5, '0', None, True, {}, []]):
            add(18, f'invalid-version-{index}', [update(first, invalid_version)], [400], 0, None)
        add(19, 'fresh-versions', [update(first, 0), update(second, 1)], [200, 200], 2, second)
        add(20, 'without-version', [update(first, None, include_version=False)], [200], 1, first)

    cases.append({
        'id': 'TC-AUTH-18:counter-from-seven', 'testcase': 'TC-AUTH-18',
        'initial_login_counter': 7, 'inspect_login_counter': True,
        'steps': [{'parallel': [
            step('/api/auth/login', dict(seed('login'), password='wrong'), None)
            for _ in range(50)
        ]}],
        'check': {'kind': 'counter', 'expected': 50, 'initial': 7},
    })
    for number, price, total, kind in [(18, 1, 2, 'catalog_total'), (19, 200000, 400000, 'valid_order')]:
        order = seed('order')
        order['products'] = [{'productId': 1, 'price': price, 'quantity': 2}]
        order.update(totalAmount=total, shippingFee=0, discountAmount=0, voucherDiscount=0)
        order.pop('discountCode', None)
        cases.append({
            'id': f'TC-ORD-{number}:catalog', 'testcase': f'TC-ORD-{number}',
            'steps': [step('/api/orders', order)],
            'check': {'kind': kind},
        })
    cases.append({
        'id': 'TC-OS-21:cancelled-terminal', 'testcase': 'TC-OS-21',
        'steps': [step('/api/orders', seed('order'), save_order=True),
                  step('/api/orders/{order}', {'status': 'Đã hủy', '__v': 0}, method='PUT'),
                  step('/api/orders/{order}', {'status': 'Đang giao', '__v': 1}, method='PUT')],
        'inspect_entity': 'order', 'require_intermediate_success': True,
        'check': {'kind': 'cancelled_terminal'},
    })
    return cases
