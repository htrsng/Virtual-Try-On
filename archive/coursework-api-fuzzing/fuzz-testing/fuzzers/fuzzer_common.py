"""Các phép đột biến JSON và quy tắc kiểm tra nghiệp vụ bán hàng dùng chung.

Việc nhập mô-đun không tự khởi chạy kiểm thử.
"""
from __future__ import annotations
import json
import math
import random
import requests
DICTIONARY = [None,
     '',
     0,
     -1,
     -999999999,
     999999999999999999,
     'A' * 5000,
     "' OR '1'='1",
     '{"$ne": null}',
     '<script>alert(1)</script>',
     'NaN',
     'Infinity',
     -0.5,
     True,
     False,
     [],
     {},
     '🙂' * 50,
     '\x00\x01',
     '../../../etc/passwd',
     '0000000000',
     '%s%s%s%s',
     'admin']
VALID_STATUSES = {'Đang xử lý', 'Đang giao', 'Đã giao', 'Đã hủy'}
VALID_TRANSITIONS = {'Đang xử lý': {'Đang xử lý',
     'Đang giao',
     'Đã hủy'},
     'Đang giao': {'Đang giao',
     'Đã giao'},
     'Đã giao': {'Đã giao'},
     'Đã hủy': {'Đã hủy'}}

def mutate_json(payload: dict, rng: random.Random) -> dict:
    """Tạo input mới từ bản sao của seed; không sửa trực tiếp seed ban đầu."""
    candidate = json.loads(json.dumps(payload))
    # Mỗi input chỉ chọn một cách đột biến để dễ theo dõi nguyên nhân lỗi.
    op = rng.choice(['field_value',
         'delete_field',
         'type_confuse_root',
         'nested_field_value',
         'duplicate_array_item'])
    keys = list(candidate.keys())
    if not keys:
        return candidate
    if op == 'field_value':
        field_name = rng.choice(keys)
        candidate[field_name] = rng.choice(DICTIONARY)
    elif op == 'delete_field':
        field_name = rng.choice(keys)
        del candidate[field_name]
    elif op == 'type_confuse_root':
        field_name = rng.choice(keys)
        candidate[field_name] = rng.choice(['not_an_object', 12345, [1, 2, 3], None])
    elif op == 'nested_field_value':
        nested_keys = [k for k in keys if isinstance(candidate[k], (dict, list))]
        if nested_keys:
            field_name = rng.choice(nested_keys)
            nested_value = candidate[field_name]
            if isinstance(nested_value, dict) and nested_value:
                nested_field = rng.choice(list(nested_value.keys()))
                nested_value[nested_field] = rng.choice(DICTIONARY)
            elif isinstance(nested_value, list) and nested_value:
                item_index = rng.randrange(len(nested_value))
                item = nested_value[item_index]
                if isinstance(item, dict) and item:
                    nested_field = rng.choice(list(item.keys()))
                    item[nested_field] = rng.choice(DICTIONARY)
    elif op == 'duplicate_array_item':
        list_keys = [k for k in keys if isinstance(candidate[k], list) and candidate[k]]
        if list_keys:
            field_name = rng.choice(list_keys)
            candidate[field_name] = candidate[field_name] * rng.randint(2, 20)
    return candidate

def compute_expected_total(products) -> float | None:
    try:
        return sum((float(p['price']) * float(p['quantity']) for p in products))
    except Exception:
        return None

def check_order_response(request_body: dict,
     resp: requests.Response,
     catalog: dict | None=None) -> str | None:
    """Oracle cho POST /api/orders (BUG-06)."""
    if resp.status_code not in (200, 201):
        return None
    products = request_body.get('products')
    if not isinstance(products, list) or not products:
        return 'Invalid cart structure accepted (REQ-ORD-1)'
    for product in products:
        if not isinstance(product, dict):
            return 'Invalid cart item accepted (REQ-ORD-8)'
        quantity = product.get('quantity')
        if isinstance(quantity, bool) or not isinstance(quantity, int) or quantity <= 0:
            return 'Invalid quantity accepted (REQ-ORD-8)'
        price = product.get('price')
        if isinstance(price,
             bool) or not isinstance(price,
             (int,
             float)) or (not math.isfinite(price)) or (price <= 0):
            return 'Invalid unit price accepted (REQ-ORD-8)'
        product_id = product.get('productId')
        if catalog is not None and (isinstance(product_id,
             bool) or not isinstance(product_id,
             (str,
             int)) or product_id not in catalog):
            return 'Unknown catalog product accepted (REQ-ORD-8)'
    for key in ('totalAmount', 'shippingFee', 'discountAmount', 'voucherDiscount'):
        if key in request_body:
            value = request_body[key]
            if isinstance(value,
                 bool) or not isinstance(value,
                 (int,
                 float)) or (not math.isfinite(value)):
                return f'Invalid numeric field accepted: {key} (REQ-ORD-4)'
    try:
        body = resp.json()
        saved_total = body.get('order', {}).get('totalAmount')
    except Exception:
        return None
    if isinstance(saved_total,
         bool) or not isinstance(saved_total,
         (int,
         float)) or (not math.isfinite(saved_total)):
        return 'Invalid saved total accepted (REQ-ORD-3/REQ-ORD-4)'
    if saved_total < 0:
        return f'totalAmount am duoc chap nhan: {saved_total}'
    if isinstance(products, list) and products:
        if catalog is not None:
            expected = sum((catalog[p['productId']] * p['quantity'] for p in products))
            expected += request_body.get('shippingFee',
                 0) if isinstance(request_body.get('shippingFee',
                 0),
                 (int,
                 float)) else 0
            for key in ('discountAmount', 'voucherDiscount'):
                value = request_body.get(key, 0)
                if isinstance(value, (int, float)):
                    expected -= value
        else:
            expected = compute_expected_total(products)
        if expected is not None and abs(saved_total - expected) > max(1.0, 0.01 * expected):
            source = 'catalog' if catalog is not None else 'client subtotal (catalog unavailable)'
            return f'totalAmount ({saved_total}) inconsistent with {source} (~{expected})'
    return None

def check_order_status_response(from_status: str,
     request_body: dict,
     resp: requests.Response,
     had_auth: bool) -> str | None:
    """Oracle cho PUT /api/orders/:id (BUG-03 + vi pham mo hinh trang thai)."""
    if resp.status_code not in (200, 201):
        return None
    if not had_auth:
        return 'Cap nhat trang thai don hang THANH CONG ma KHONG can token xac thuc'
    new_status = request_body.get('status')
    if not isinstance(new_status, str):
        return None
    if new_status not in VALID_STATUSES:
        return f"status '{new_status}' ngoai tap gia tri hop le nhung van duoc chap nhan"
    allowed = VALID_TRANSITIONS.get(from_status, set())
    if new_status not in allowed:
        return f"Chuyen trang thai bat hop le duoc chap nhan: '{from_status}' -> '{new_status}'"
    return None

def check_user_update_response(request_body: dict,
     resp: requests.Response,
     had_auth: bool,
     target_is_self: bool) -> str | None:
    """Oracle cho PUT /api/users/:id (BUG-02 thieu authorization, BUG-08 mass assignment)."""
    if resp.status_code not in (200, 201):
        return None
    if not had_auth:
        return 'Sua thong tin user THANH CONG ma KHONG can token xac thuc'
    if not target_is_self:
        return 'Sua thong tin user KHAC (khong phai chinh minh) THANH CONG du dung token user thuong'
    if isinstance(request_body.get('role'), str) and request_body['role'] == 'admin':
        try:
            body = resp.json()
            if body.get('role') == 'admin':
                return 'Tu dat role=admin qua PUT /api/users/:id (mass assignment) THANH CONG'
        except Exception:
            pass
    return None

def check_product_response(request_body: dict,
     resp: requests.Response,
     had_auth: bool) -> str | None:
    """Oracle cho POST/PUT /api/products (BUG-04 thieu authorization + gia tri vo ly)."""
    if resp.status_code not in (200, 201):
        return None
    if not had_auth:
        return 'Tao/sua san pham THANH CONG ma KHONG can token xac thuc'
    price = request_body.get('price')
    if isinstance(price, (int, float)) and price < 0:
        return f'Gia san pham am duoc chap nhan: {price}'
    return None
