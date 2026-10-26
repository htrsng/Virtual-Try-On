"""Khoanh biên thực nghiệm: giữ nguyên input, chỉ đổi một tọa độ nguyên.

Không giả định lỗi đơn điệu. Chỉ báo cặp điểm khác hành vi đã đo;
khoảng giữa các mẫu chưa thử luôn là chưa biết.
"""
from copy import deepcopy
import re


def signature(kind=None, finding=None):
    if kind == 'HTTP_5XX':
        return 'HTTP_5XX'
    if finding:
        # Thông báo oracle có thể chứa giá trị số của input.
        return re.sub(r'-?\d+(?:\.\d+)?', '#', finding)
    return None


def coordinates(value, path=()):
    if isinstance(value, dict):
        for key, child in value.items():
            yield from coordinates(child, path + (key,))
    elif isinstance(value, list):
        for index, child in enumerate(value[:10]):
            yield from coordinates(child, path + (index,))
    else:
        yield list(path), value


def replace(body, path, value):
    result = deepcopy(body)
    parent = result
    for key in path[:-1]:
        parent = parent[key]
    parent[path[-1]] = value
    return result


def materialize(region, value):
    if region['axis'] == 'json_representatives':
        return replace(region['input'], region['path'], region['representatives'][value])
    original = region['original_value']
    # Chuỗi: số ký tự Unicode, không phải byte; phần mở rộng có mẫu cố định.
    replacement = (original[:value] if value <= len(original)
                   else original + 'A' * (value - len(original))) if isinstance(original, str) else value
    return replace(region['input'], region['path'], replacement)


def discover(record, probe, budget=16):
    """probe(body) trả signature hoặc None; lỗi hạ tầng phải raise.

    Replay hai lần trước khi khảo sát. Budget tính tất cả request đo.
    """
    expected = signature(record.get('type'), record.get('finding'))
    result = {'target': record['target'], 'input': record['input'],
              'had_auth': record['had_auth'], 'expected_signature': expected,
              'status': 'UNSUPPORTED', 'regions': [], 'probes_used': 0,
              'state_scope': 'fresh seeded HTTP harness for every probe'}
    if not expected or budget < 2:
        return result
    for _ in range(2):
        measured = probe(record['input'])
        result['probes_used'] += 1
        if measured != expected:
            result['status'] = 'NOT_REPRODUCED'
            return result
    result['status'] = 'SAMPLED'
    for path, original in coordinates(record['input']):
        if result['probes_used'] >= budget:
            break
        discrete = type(original) is not int and not isinstance(original, str)
        representatives = [original, None, False, True, 0, -1, 1, '', 'A', {}, []]
        representatives = list({repr(value): value for value in representatives}.values())
        center = 0 if discrete else len(original) if isinstance(original, str) else original
        lower, upper = (0, max(16, min(8192, center * 2))) if isinstance(original, str) else (min(0, center * 2 - 2), max(16, center * 2 + 2))
        if discrete:
            lower, upper = 0, len(representatives) - 1
        if not lower <= center <= upper:
            continue
        region = {'input': record['input'], 'path': path, 'original_value': original,
                  'axis': 'json_representatives' if discrete else 'unicode_length' if isinstance(original, str) else 'integer',
                  'representatives': representatives if discrete else None,
                  'lower': lower, 'upper': upper, 'samples': [], 'transitions': [],
                  'complete': False}
        samples = {center: expected}
        pending = [lower, upper, max(lower, center - 1), min(upper, center + 1)]
        if discrete:
            pending = list(range(upper + 1))
        # Giới hạn mỗi trường để ngân sách còn dành cho trường tiếp theo.
        allowance = min(8, budget - result['probes_used'])
        while allowance:
            if pending:
                value = pending.pop(0)
            else:
                pairs = [(a, b) for a, b in zip(sorted(samples), sorted(samples)[1:])
                         if b - a > 1 and (samples[a] == expected) != (samples[b] == expected)]
                if not pairs:
                    break
                a, b = max(pairs, key=lambda pair: pair[1] - pair[0])
                value = (a + b) // 2
            if value in samples:
                continue
            samples[value] = probe(materialize(region, value))
            result['probes_used'] += 1
            allowance -= 1
        region['samples'] = [{'value': v, 'signature': s, 'same_failure': s == expected}
                             for v, s in sorted(samples.items())]
        region['transitions'] = [{'left': a, 'right': b, 'adjacent': b - a == 1}
                                 for a, b in zip(sorted(samples), sorted(samples)[1:])
                                 if (samples[a] == expected) != (samples[b] == expected)]
        if discrete:
            region['transitions'] = []  # Tập kiểu JSON không có thứ tự biên số học.
        region['complete'] = len(samples) == upper - lower + 1
        result['regions'].append(region)
    return result


def bounded_values(region, budget):
    """Chạy lại và lấy điểm trong miền; không đổi các trường khác."""
    center = (0 if region['axis'] == 'json_representatives' else
              len(region['original_value']) if region['axis'] == 'unicode_length' else region['original_value'])
    values = [center]
    for edge in region['transitions']:
        values.extend([edge['left'], edge['right']])
    width = region['upper'] - region['lower']
    values.extend(region['lower'] + width * i // max(1, budget - 1) for i in range(budget))
    return list(dict.fromkeys(values))[:budget]
