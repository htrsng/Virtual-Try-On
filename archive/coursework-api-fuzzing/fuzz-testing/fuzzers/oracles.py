"""Đánh giá hành vi API theo điều kiện kiểm tra.

Lỗi ở bước chuẩn bị không được kết luận là kiểm thử đạt (PASS).
"""


import json
import re


def mutation_scope(observation):
    """Only the explicitly supported mutations have stored-state contracts."""
    method, url = observation.get('method', '').upper(), observation.get('url', '')
    if method not in {'POST', 'PUT', 'PATCH', 'DELETE'}:
        return None
    if method == 'POST' and url == '/api/auth/create-admin':
        return 'users'
    if method == 'POST' and url in {'/api/products', '/api/orders'}:
        return url.rsplit('/', 1)[1]
    match = re.fullmatch(r'/api/(users|products|orders)/[^/]+(?:/cancel)?', url)
    return match.group(1) if match else None


def state_frames(observation):
    scope = mutation_scope(observation)
    if scope is None:
        raise ValueError('No stored-state contract for this request')
    resource = observation.get('resource')
    if not isinstance(resource, dict) or resource.get('collection') != scope:
        raise ValueError('Missing or incorrect resource identity for state evidence')
    before, after = observation.get('state_before'), observation.get('state_after')
    required = {scope} if scope != 'orders' else {'orders', 'products', 'coupons', 'notifications'}
    if (not isinstance(before, dict) or not isinstance(after, dict)
            or not required <= before.keys() or before.keys() != after.keys()):
        raise ValueError('Missing or incomplete before/after state evidence')
    for snapshot in (before, after):
        if any(not isinstance(rows, list) or any(not isinstance(row, dict) for row in rows)
               for rows in snapshot.values()):
            raise ValueError('Malformed collection snapshot')
    return before, after


def same_state(before, after):
    # Store enumeration order is not business state; nested array order still matters.
    def canonical(snapshot):
        return {name: sorted(json.dumps(row, sort_keys=True, ensure_ascii=False) for row in rows)
                for name, rows in snapshot.items()}
    return canonical(before) == canonical(after)


def rejected_without_writes(observation):
    if not 400 <= observation['status'] < 500 or mutation_scope(observation) is None:
        return True
    return same_state(*state_frames(observation))


def targeted_user(observation, snapshot):
    match = re.fullmatch(r'/api/users/([^/]+)', observation.get('url', ''))
    if not match:
        raise ValueError('Role oracle requires a targeted user URL')
    rows = [row for row in snapshot['users'] if str(row.get('_id')) == match.group(1)]
    if len(rows) > 1:
        raise ValueError('Ambiguous targeted user state')
    return rows[0] if rows else None


def check_duplicate_id(last, result):
    before, after = state_frames(last)
    if last["status"] in (400, 409, 422):
        return same_state(before, after)
    if last['status'] not in (200, 201):
        return False
    products = after['products']
    response_id = last['body'].get('id')
    ids = [p.get('id') for p in products]
    return (type(response_id) is int and response_id > 0
            and response_id != last['input']['id']
            and len(products) == len(before['products']) + 1
            and all(p in products for p in before['products'])
            and all(type(value) is int for value in ids) and len(set(ids)) == len(ids)
            and any(p.get('id') == response_id for p in products))


def check_catalog_total(last, result):
    if last["status"] in (400, 422):
        return same_state(*state_frames(last))
    if last["status"] not in (200, 201):
        return False
    # This scenario uses no fees/discounts; never take unit prices from the request.
    before, after = state_frames(last)
    prices = {product['id']: product['price'] for product in before['products']}
    expected = sum(prices[item["productId"]] * item["quantity"] for item in last["input"]["products"])
    response = last['body'].get('order', {})
    saved = [order for order in after['orders'] if order.get('_id') == response.get('_id')]
    return (len(saved) == 1 and len(after['orders']) == len(before['orders']) + 1
            and all(order in after['orders'] for order in before['orders'])
            and response.get('totalAmount') == expected == saved[0].get('totalAmount'))


def evaluate(case, result):
    observations = result["observations"]
    if not observations:
        raise ValueError("No observations")
    if case.get("require_intermediate_success") and any(item["status"] not in (200,
         201) for item in observations[:-1]):
        raise ValueError("Intermediate transition failed; terminal-state oracle not evaluated")
    last = observations[-1]
    # Check every denied mutation, including intermediate steps later "restored".
    for observation in observations:
        if not all(isinstance(observation.get(key), str) and observation[key]
                   for key in ('method', 'url')):
            raise ValueError('Missing request identity for state evaluation')
        if not rejected_without_writes(observation):
            return False
    check = case["check"]
    kind = check["kind"]
    if kind == "status":
        return last["status"] in check["allowed"]
    if kind == "no_5xx":
        return all(item["status"] < 500 for item in observations)
    if kind == 'cancelled_terminal':
        return (last['status'] in (400, 409, 422)
                and result['final_entity']['status'] == 'Đã hủy'
                and observations[-2]['entity_after'] == last['entity_after'])
    if kind == 'valid_order':
        if last['status'] not in (200, 201) or not check_catalog_total(last, result):
            return False
        saved = result.get('final_entity') or {}
        expected_items = last['input']['products']
        return (str(saved.get('userId')) == result['actor_ids']['self']
                and saved.get('totalAmount') == last['body'].get('order', {}).get('totalAmount')
                and [(p['productId'], p['quantity']) for p in saved.get('products', [])]
                == [(p['productId'], p['quantity']) for p in expected_items])
    if kind == "notification":
        return (last["status"] == 200 and last["body"].get("status") == check["status"]
                and bool(result.get("notifications")))
    if kind == "duplicate_id":
        return check_duplicate_id(last, result)
    if kind == "same_response":
        return observations[0]["status"] == last["status"] and observations[0]["body"] == last["body"]
    if kind == "jwt":
        claims = last.get("jwt_claims", {})
        return (last["status"] == 200 and claims.get("role") == "user"
                and 0 < claims.get("exp", 0) - claims.get("iat", 0) <= 604800)
    if kind == "role_unchanged":
        before, after = state_frames(last)
        if last['status'] in (400, 401, 403, 422):
            return same_state(before, after)
        if last['status'] != 200:
            return False
        original = targeted_user(last, before)
        saved = targeted_user(last, after)
        if original is None or 'role' not in original:
            raise ValueError('Initial targeted user role missing')
        return saved is not None and 'role' in saved and last['body'].get('role') == saved['role'] == original['role']
    if kind == "password":
        audit = result["password_audit"]
        return last["status"] == 200 and audit["is_bcrypt"] and audit["verifies"] and not audit["equals_plaintext"]
    if kind == "catalog_total":
        return check_catalog_total(last, result)
    raise ValueError(f"Unknown oracle: {kind}")
