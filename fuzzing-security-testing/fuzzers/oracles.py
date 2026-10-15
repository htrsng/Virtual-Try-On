"""Đánh giá hành vi API theo điều kiện kiểm tra.

Lỗi ở bước chuẩn bị không được kết luận là kiểm thử đạt (PASS).
"""
import statistics


# Kiểm tra số lần sai mật khẩu và bộ đếm lưu trong hệ thống.
def check_counter(check, observations, result):
    expected = check["expected"]
    return (len(observations) == expected
            and all(item["status"] == 401 for item in observations)
            and result["login_counter"] == check.get("initial", 0) + expected)


def check_version_sequence(check, observations, result):
    """Kiểm tra phản hồi và bảo đảm request bị từ chối không sửa dữ liệu."""
    setup_count = check['setup_count']
    if any(item['status'] not in (200, 201) for item in observations[:setup_count]):
        raise ValueError('Version scenario setup failed')
    attempts = observations[setup_count:]
    if [item['status'] for item in attempts] != check['statuses']:
        return False
    previous = observations[setup_count - 1]['entity_after'] if setup_count else result['initial_entity']
    for item in attempts:
        if item['status'] >= 400 and item['entity_after'] != previous:
            return False
        previous = item['entity_after']
    final = result['final_entity']
    if final['__v'] != check['version']:
        return False
    if check['value'] is None:
        return final == result['initial_entity'] if not setup_count else final == observations[setup_count - 1]['entity_after']
    return final[check['field']] == check['value']


# Hai cập nhật cùng version phải có một thành công, một HTTP 409.
def check_version(check, observations, result):
    attempts = observations[-2:]
    if sorted(item["status"] for item in attempts) != [200, 409]:
        return False
    winner = next(item for item in attempts if item["status"] == 200)
    final = result["final_entity"]
    return final["__v"] == 1 and final[check["field"]] == winner["input"][check["field"]]


def check_timing(check, observations, result):
    if len(observations) != 100 or any(item["status"] not in (401, 404) for item in observations):
        raise ValueError("Timing samples must exercise rejected-credential branches")
    delta = abs(statistics.mean(item["elapsed_ms"] for item in observations[::2])
                - statistics.mean(item["elapsed_ms"] for item in observations[1::2]))
    result["timing_analysis"] = {
        "sample_count": 100, "absolute_mean_difference_ms": delta,
        "threshold_ms": check["threshold_ms"],
        "limitation": "Local simulated timing; does not establish deployment exploitability.",
    }
    return delta < check["threshold_ms"]


def check_duplicate_id(last, result):
    if last["status"] in (400, 409, 422):
        return True
    original = next(product for product in result["catalog"] if product["id"] == 1)
    matches = [product for product in result["final_products"] if product["id"] == 1]
    return (last["status"] in (200, 201) and len(matches) == 1
            and matches[0] == original and last["body"].get("id") != 1)


# Tính tổng theo giá danh mục cho kịch bản không có phí/giảm giá.
def check_catalog_total(last, result):
    if last["status"] in (400, 422):
        return True
    if last["status"] not in (200, 201):
        return False
    # This scenario uses no fees/discounts; never take unit prices from the request.
    prices = {product["id"]: product["price"] for product in result["catalog"]}
    expected = sum(prices[item["productId"]] * item["quantity"] for item in last["input"]["products"])
    return last["body"].get("order", {}).get("totalAmount") == expected


# True là đạt, False là vi phạm; thiếu bằng chứng thì báo lỗi.
def evaluate(case, result):
    observations = result["observations"]
    if not observations:
        raise ValueError("No observations")
    if case.get("require_intermediate_success") and any(item["status"] not in (200,
         201) for item in observations[:-1]):
        raise ValueError("Intermediate transition failed; terminal-state oracle not evaluated")
    last = observations[-1]
    check = case["check"]
    kind = check["kind"]
    if kind == "status":
        return last["status"] in check["allowed"]
    if kind == "no_5xx":
        return all(item["status"] < 500 for item in observations)
    if kind == "counter":
        return check_counter(check, observations, result)
    if kind == "version":
        return check_version(check, observations, result)
    if kind == 'version_sequence':
        return check_version_sequence(check, observations, result)
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
    if kind == "timing":
        return check_timing(check, observations, result)
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
    if kind == "one_success":
        return (sum(item["status"] in (200, 201) for item in observations) == 1
                and all(item["status"] in (200, 201, 400, 409, 422) for item in observations))
    if kind == "role_unchanged":
        return last["status"] in (400,
             401,
             403,
             422) or (last["status"] == 200 and last["body"].get("role") == "user")
    if kind == "password":
        audit = result["password_audit"]
        return last["status"] == 200 and audit["is_bcrypt"] and audit["verifies"] and not audit["equals_plaintext"]
    if kind == "catalog_total":
        return check_catalog_total(last, result)
    raise ValueError(f"Unknown oracle: {kind}")
