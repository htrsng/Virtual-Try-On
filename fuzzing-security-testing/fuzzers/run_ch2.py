"""
Chuong 2 - Chay Semgrep (rule tuy chinh) + Risk Assessment (CVSS-lite),
tong hop thanh 1 file JSON. Cau truc du an: rules/vfitai_security_rules.yml,
analysis/{risk_assessor.py, vulnerabilities.json}, ma nguon muc tieu
trong node_harness/ (index.js, middleware.js, config/env.js, models.js
that - LUU Y: neu chua co node_harness/, tao truoc hoac tro duong dan
toi noi ban dat code server that can quet).
"""
import sys, os, json, subprocess

HERE = os.path.dirname(os.path.abspath(__file__))            # .../fuzzers
PROJECT_ROOT = os.path.dirname(HERE)
ANALYSIS_DIR = os.path.join(PROJECT_ROOT, "analysis")
RULES_PATH = os.path.join(PROJECT_ROOT, "rules", "vfitai_security_rules.yml")
RESULTS_DIR = os.path.join(PROJECT_ROOT, "results")
os.makedirs(RESULTS_DIR, exist_ok=True)

# Ma nguon that can quet - sua duong dan nay neu ban dat code that o cho
# khac. Mac dinh tro toi node_harness/ (Chuong 4) vi do la noi giu ban
# sao code that (index.js, middleware.js, config/env.js).
TARGET_CODE_DIR = os.path.join(PROJECT_ROOT, "node_harness")

# ---------- Buoc 1: Semgrep voi rule tuy chinh (local, khong can mang) ----------
semgrep_out = os.path.join(RESULTS_DIR, "ch2_semgrep_raw.json")
print(f"Dang quet Semgrep tren: {TARGET_CODE_DIR}")
proc = subprocess.run(
    ["semgrep", "--config", RULES_PATH, "--json", TARGET_CODE_DIR],
    capture_output=True, text=True,
)
with open(semgrep_out, "w", encoding="utf-8") as f:
    f.write(proc.stdout)

semgrep_raw = json.loads(proc.stdout) if proc.stdout.strip() else {"results": []}
semgrep_findings = [{
    "rule_id": r["check_id"].split(".")[-1],
    "file": r["path"], "line_start": r["start"]["line"], "line_end": r["end"]["line"],
    "cwe": r["extra"]["metadata"].get("cwe", ""), "message": r["extra"]["message"].strip(),
} for r in semgrep_raw.get("results", [])]
print(f"Semgrep tim duoc {len(semgrep_findings)} finding.")

# ---------- Buoc 2: Risk Assessment (goi truc tiep ham Python, khong qua subprocess) ----------
sys.path.insert(0, ANALYSIS_DIR)
from risk_assessor import assess_all, print_report

vulnerabilities_path = os.path.join(ANALYSIS_DIR, "vulnerabilities.json")
risk_results = assess_all(vulnerabilities_path)
print_report(risk_results)

# ---------- Buoc 3: Gop ket qua ----------
combined = {
    "static_analysis_tool": "semgrep (custom local ruleset)",
    "semgrep_findings_count": len(semgrep_findings),
    "semgrep_findings": semgrep_findings,
    "risk_assessment": risk_results,
}
out_path = os.path.join(RESULTS_DIR, "ch2_combined_results.json")
with open(out_path, "w", encoding="utf-8") as f:
    json.dump(combined, f, ensure_ascii=False, indent=2)
print(f"\nDa ghi ket qua tong hop: {out_path}")
