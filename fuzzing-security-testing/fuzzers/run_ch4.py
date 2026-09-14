"""
Chuong 4 - Script dieu phoi: chay Black-box fuzzer, White-box fuzzer,
roi tong hop bang so sanh dinh luong. Khop phong cach run_ch1.py /
run_ch2.py (script "runner" tong hop cho tung chuong).

Luu y: black-box fuzzer can server dang chay (vd: `node index.js`
trong thu muc node_harness/, hoac server that cua ban tren
localhost:5050 - xem TARGET_URL trong blackbox_fuzzer.py).
"""
import subprocess
import sys
import os

HERE = os.path.dirname(os.path.abspath(__file__))


def run(script_name):
    print(f"\n{'=' * 60}\n>>> Chay {script_name}\n{'=' * 60}")
    result = subprocess.run([sys.executable, os.path.join(HERE, script_name)], cwd=HERE)
    if result.returncode != 0:
        print(f"!!! {script_name} ket thuc voi loi (code={result.returncode})")


if __name__ == "__main__":
    run("blackbox_fuzzer.py")
    run("whitebox_fuzzer.py")
    run("run_ch4_comparison.py")
    print("\nHoan tat Chuong 4. Xem ket qua trong results/ch4_*.json")
