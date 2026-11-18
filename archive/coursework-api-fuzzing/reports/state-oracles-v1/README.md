# Stored-state oracles v1 — November 15, 2026

This revision strengthens the harness and oracles while keeping the target routes and models at their previous revision. It preserves the earlier snapshots. Acceptance and replay use `http-and-stored-state-v1`. [Oracle rules](../../qa/state-oracle-contract.md).

## Execution results

| Check | Result | Evidence |
| --- | --- | --- |
| Fuzz tool, oracle, and harness regression | 55/55 passed: 34 existing, 16 oracle, and 5 new integration checks | [Log](fuzz-regression.txt) |
| Reporting and replay regression | 9/9 passed | [Log](reporting-regression.txt) |
| Acceptance scenarios | 51 executed: 19 PASS, 32 FAIL, 0 ERROR or NOT_RUN | [Report](api/report.md) · [JUnit](api/junit.xml) |
| Aggregated test cases | 29 cases: 9 PASS, 20 FAIL | [Traceability](api/report.json) |
| Replay on the same source | 20 failing cases × 2 attempts, 40 failures reproduced | [Report](replay/report.md) |
| Comparison to baseline | All scenarios retained their PASS or FAIL status | [Comparison](comparison.json) |

Acceptance exited 1 because of target violations. Replay exited 0 because the expected failures recurred. Before-and-after snapshots cover 52 mutation observations, including fixture setup steps.

## Check gaps in the old oracle

The [probe](old-oracle-probe.json) loaded `oracles.py` from commit `1d3468b` in a separate Python process and ran 16 new tests. It recorded **27 assertion failures including subtests**, with zero runner errors. The expected failures reveal gaps in the previous oracle. [Detailed log](old-oracle-probe.txt).

Integration tests use a deliberately faulty fixture under `fuzz-testing/tests/fixtures/` to verify detection of writes followed by a 4xx response. Acceptance and campaign runs use the normal coursework target.

## Environment and source

The run used Windows, Python 3.13.2, and Node.js 22.15.0. Full regression ran outside the sandbox to avoid temporary-directory ACL errors. Acceptance and replay used the same workspace source. CI specified Python 3.12 and Node.js 24. Remote execution had yet to be verified.

The API report’s `git_commit` field records base commit `1d3468b`. Source hashes identify the files used. The [comparison](comparison.json) records differences from the baseline, and the [manifest](snapshot-sha256.json) records artifact hashes. Absolute paths refer to the original machine.

## Rerun from the coursework root

```sh
python -m unittest discover -s fuzz-testing/tests -p "test_*.py"
python api-testing/run_suite.py --suite full --output reports/runs/state-demo-api
python api-testing/replay_failures.py --report reports/runs/state-demo-api/report.json --repeats 2 --output reports/runs/state-demo-replay
```

Run the commands separately because acceptance can exit 1. Use fresh output directories. Replay rejects older reports when source hashes differ. The target fixes and post-fix retests remain pending, and the application defects are still OPEN.
