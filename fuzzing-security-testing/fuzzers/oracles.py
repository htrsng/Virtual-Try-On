"""Đánh giá hành vi API theo điều kiện kiểm tra.

Lỗi ở bước chuẩn bị không được kết luận là kiểm thử đạt (PASS).
"""


# Kiểm tra số lần sai mật khẩu và bộ đếm lưu trong hệ thống.




# Hai cập nhật cùng version phải có một thành công, một HTTP 409.




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
