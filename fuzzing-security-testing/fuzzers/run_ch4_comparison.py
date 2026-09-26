"""
Chuong 4 - Tong hop va so sanh dinh luong Black-box vs White-box fuzzing,
dung cho bang so sanh trong bao cao.
"""
import json, os, time

def safe_write_json(path, data, retries=15, delay=2.0):
    last_err = None
    try:
        if os.path.exists(path):
            os.remove(path)
    except Exception:
        pass
    for attempt in range(retries):
        try:
            with open(path, "w", encoding="utf-8") as f:
                json.dump(data, f, ensure_ascii=False, indent=2)
            return path
        except PermissionError as e:
            last_err = e
            if attempt == 0:
                print(f"  [!] Khong ghi duoc {path} (file dang bi khoa). Dang thu lai...")
            time.sleep(delay)
    alt_path = path.replace(".json", f"_backup_{int(time.time())}.json")
    try:
        with open(alt_path, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        print(f"  [!] Van khong ghi duoc {path} sau {retries} lan thu.")
        print(f"  [OK] Da luu du lieu vao file thay the: {alt_path}")
        return alt_path
    except Exception:
        print(f"  [X] Khong the ghi ca file thay the. Loi goc: {last_err}")
        raise last_err

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

with open(os.path.join(BASE, "results", "ch4_blackbox_results.json"), encoding="utf-8") as f:
    bb = json.load(f)
with open(os.path.join(BASE, "results", "ch4_whitebox_results.json"), encoding="utf-8") as f:
    wb = json.load(f)

comparison = {
    "black_box": {
        "iterations": bb["iterations"],
        "crashes_found": len(bb["crashes"]),
        "crash_rate_percent": round(100 * len(bb["crashes"]) / bb["iterations"], 2),
        "vuln_findings": len(bb["vuln_findings"]),
        "uses_coverage_feedback": False,
        "targets": ["login", "orders", "order_status", "user_update_self",
                    "user_update_victim", "product_create", "product_update"],
    },
    "white_box": {
        "iterations": wb["iterations_used"],
        "crashes_found": len(wb["crashes"]),
        "crash_rate_percent": round(100 * len(wb["crashes"]) / wb["iterations_used"], 2),
        "vuln_findings": len(wb["vuln_findings"]),
        "uses_coverage_feedback": True,
        "total_lines_covered_in_index_js": wb["total_lines_covered"],
        "per_target_lines_covered": {t: s["lines_covered"] for t, s in wb["per_target"].items()},
        "new_coverage_events": wb["new_coverage_events"],
        "targets": list(wb["per_target"].keys()),
    },
}
out = os.path.join(BASE, "results", "ch4_comparison.json")
_actual_out = safe_write_json(out, comparison)
print(f"Ket qua da luu tai: {_actual_out}")

print(json.dumps(comparison, ensure_ascii=False, indent=2))