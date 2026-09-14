"""
Chuong 1 - Script chay model checking cho ca 2 mo hinh SPEC va ACTUAL.
Cau truc du an: models/kripke_model.py + models/order_state_model_*.json
cung thu muc; ket qua ghi vao results/ o goc du an.
"""
import sys, os, json

HERE = os.path.dirname(os.path.abspath(__file__))          # .../fuzzers
PROJECT_ROOT = os.path.dirname(HERE)                         # goc du an
MODELS_DIR = os.path.join(PROJECT_ROOT, "models")

sys.path.insert(0, MODELS_DIR)
from kripke_model import run_verification

spec_result = run_verification(os.path.join(MODELS_DIR, "order_state_model_SPEC.json"), verbose=False)
actual_result = run_verification(os.path.join(MODELS_DIR, "order_state_model_ACTUAL.json"), verbose=False)

combined = {"spec": spec_result, "actual": actual_result}

results_dir = os.path.join(PROJECT_ROOT, "results")
os.makedirs(results_dir, exist_ok=True)
out_path = os.path.join(results_dir, "ch1_kripke_results.json")
with open(out_path, "w", encoding="utf-8") as f:
    json.dump(combined, f, ensure_ascii=False, indent=2)

print(f"Da ghi ket qua vao {out_path}")
for name, res in combined.items():
    print(f"\n=== {name.upper()} : {res['system_name']} ===")
    for p in res["properties"]:
        status = "PASS" if p["holds"] else "FAIL"
        print(f"  [{status}] {p['id']}")
