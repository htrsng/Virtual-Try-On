"""So sánh đột biến cơ bản và lựa chọn theo độ bao phủ với cùng ngân sách input.

Cả hai chiến lược đều chạy trong tiến trình Node mô phỏng mới và đo độ bao phủ.
Chỉ chiến lược coverage_feedback dùng số đo đó để chọn input cha tiếp theo.
"""
import argparse
from collections import Counter
from pathlib import Path
import random
import time
import uuid

from fuzzer_common import mutate_json
from runtime import ENVIRONMENT, ROOT, load_seed, write_json
from whitebox_fuzzer import (
    ENERGY, SEED_FILES, TARGETS, check_finding, error_type, get_valid_token, run_single,
)


# So sánh hai chiến lược với cùng ngân sách input.
def experiment(mode, seed, budget, token):
    start = time.monotonic()
    attempts = []
    per_target = {}
    for index, target in enumerate(TARGETS):
        rng = random.Random(seed + index * 10000)
        initial = load_seed(SEED_FILES[target])
        queue = [initial]
        covered = set()
        parent = initial
        energy = 0
        for iteration in range(1, budget + 1):
            if mode == "coverage_feedback":
                if energy == 0:
                    parent = queue.pop() if queue else initial
                    energy = ENERGY
                energy -= 1
            else:
                parent = initial
            candidate = mutate_json(parent, rng)
            use_auth = True if target == "orders" else iteration % 2 == 0
            result = run_single(target, candidate, token, use_auth)
            outcome = error_type(result) or "RESPONSE"
            finding = check_finding(target,
                 candidate,
                 result,
                 use_auth) if result.get("ok",
                 True) else None
            lines = set(result.get("covered_lines", []))
            new = lines - covered
            covered.update(lines)
            if mode == "coverage_feedback" and new:
                queue.append(candidate)
            attempts.append({"target": target, "iteration": iteration, "input": candidate,
                "had_auth": use_auth, "outcome": outcome, "finding": finding, "result": result})
        per_target[target] = {"iterations": budget, "covered_lines": sorted(covered)}
    return {
        "mode": mode, "seed": seed, "iterations": len(attempts),
        "elapsed_seconds": time.monotonic() - start,
        "outcomes": dict(Counter(attempt["outcome"] for attempt in attempts)),
        "finding_occurrences": sum(bool(attempt["finding"]) for attempt in attempts),
        "unique_index_lines": len(set().union(*(set(p["covered_lines"]) for p in per_target.values()))),
        "per_target": per_target, "attempts": attempts,
    }


# Đếm lỗi bộ chạy; không gộp HTTP 5xx vào lỗi tiến trình.
def runner_failures(run):
    return sum(count for kind,
         count in run["outcomes"].items() if kind not in ("RESPONSE",
         "HTTP_5XX"))


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--iterations-per-target", type=int, default=10)
    parser.add_argument("--seeds", type=int, nargs="+", default=[7, 11, 42])
    parser.add_argument("--output", type=Path)
    args = parser.parse_args()
    if args.iterations_per_target <= ENERGY:
        parser.error(f"Budget must exceed energy={ENERGY} to exercise parent selection")
    output = args.output or ROOT / "results/comparisons" / uuid.uuid4().hex[:12]
    token = get_valid_token()
    runs = []
    for index, seed in enumerate(args.seeds):
        # Alternate execution order to reduce systematic warmup/order bias.
        modes = ["mutation_baseline", "coverage_feedback"]
        if index % 2:
            modes.reverse()
        for mode in modes:
            result = experiment(mode, seed, args.iterations_per_target, token)
            runs.append(result)
            print(f"{mode} seed={seed}: {result['iterations']} inputs; {result['elapsed_seconds']:.2f}s",
                 flush=True)
    report = {
        "environment": ENVIRONMENT, "targets": TARGETS,
        "iterations_per_target": args.iterations_per_target, "seeds": args.seeds, "runs": runs,
        "limitations": [
            "Small exploratory experiment; no statistical superiority claim.",
            "Both modes measure coverage; baseline ignores it when selecting inputs.",
            "Separate from the stateful HTTP blackbox; no deployment/network comparison is claimed.",
            "Coverage includes initialization/setup and only measures node_harness/index.js.",
            "Datastore and integrations are simulated; conclusions apply to the harness only.",
            "Finding occurrences and HTTP errors are not unique vulnerabilities.",
        ],
    }
    write_json(output / "report.json", report)
    lines = ["# Controlled comparison", "",
        "| Mode | Seed | Inputs | Seconds | Unique index.js lines | Finding occurrences | Runner errors |",
        "|---|---|---|---|---|---|---|"]
    for run in runs:
        lines.append(f"| {run['mode']} | {run['seed']} | {run['iterations']} | {run['elapsed_seconds']:.2f} | "
            f"{run['unique_index_lines']} | {run['finding_occurrences']} | {runner_failures(run)} |")
    lines += ["", "## Limitations", ""] + ["- " + text for text in report["limitations"]]
    (output / "report.md").write_text("\n".join(lines) + "\n", encoding="utf-8")
    print(output / "report.json")
    return 2 if any(runner_failures(run) for run in runs) else 0


if __name__ == "__main__":
    raise SystemExit(main())
