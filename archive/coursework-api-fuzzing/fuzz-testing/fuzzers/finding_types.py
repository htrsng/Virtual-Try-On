"""Phân loại bằng chứng; không suy từ HTTP 500 sang crash hoặc lỗi bộ nhớ."""
from collections import Counter
from copy import deepcopy
import math


def evidence_category(error_type):
    if error_type == 'HTTP_5XX':
        return 'APPLICATION_HTTP_ERROR'
    if error_type == 'TIMEOUT':
        return 'SUSPECTED_HANG'
    return 'HARNESS_OR_TRANSPORT_ERROR'


def summarize_evidence(errors, findings):
    counts = Counter(evidence_category(item['type']) for item in errors)
    return {'error_categories': dict(counts), 'business_or_security_observations': len(findings),
            'confirmed_memory_errors': None, 'confirmed_process_crashes': None,
            'note': 'Memory errors/process crashes are not measured by these HTTP oracles; timeout is not a confirmed hang.'}


def local_neighbors(body, limit=12):
    """Thử giá trị lân cận từng trường; đây là mẫu khảo sát, không chứng minh biên."""
    values = [deepcopy(body)]
    if limit <= 1:
        return values

    def walk(value, path):
        if isinstance(value, dict):
            for key, child in value.items():
                yield from walk(child, path + [key])
        elif isinstance(value, list):
            for index, child in enumerate(value[:10]):
                yield from walk(child, path + [index])
        else:
            yield path, value

    seen = {repr(body)}
    for path, value in walk(body, []):
        if not path:
            continue
        replacements = []
        if type(value) in (int, float) and math.isfinite(value):
            replacements = [value - 1, value + 1, 0]
        elif isinstance(value, str):
            replacements = [value[:-1], value + 'A'] if len(value) < 8192 else [value[:-1]]
        for replacement in replacements:
            candidate = deepcopy(body)
            parent = candidate
            for key in path[:-1]:
                parent = parent[key]
            parent[path[-1]] = replacement
            signature = repr(candidate)
            if signature not in seen:
                seen.add(signature)
                values.append(candidate)
                if len(values) >= limit:
                    return values
    return values
