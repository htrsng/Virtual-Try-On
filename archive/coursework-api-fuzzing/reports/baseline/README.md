# QA portfolio baseline — November 15, 2026

Run output: `reports/runs/portfolio-verified-20261115/`. The run used base commit `414d49a` plus uncommitted portfolio files. See [API source hashes](api/report.json) and [snapshot hashes](snapshot-sha256.json).

The run used Windows, Python 3.13.2, and Node.js 22.15.0. It ran outside the sandbox so Node could spawn processes and Python could create temporary directories. CI specified Python 3.12 and Node.js 24. The remote workflow was unverified for these changes when the snapshot was recorded.

## Commands and results

```sh
python tools/run_checks.py --suite full --output reports/runs/portfolio-verified-20261115
```

| Group | Result | Evidence |
| --- | --- | --- |
| Application TypeScript unit tests | 14 PASS, 0 FAIL | [JUnit](unit-junit.xml) |
| Reporting regression | 4/4 passed | [Log](reporting-regression.txt) |
| Fuzz-tool regression | 34/34 passed | [Log](fuzz-tool-regression.txt) |
| Full API suite by scenario | 51 executed: 19 PASS, 32 FAIL, 0 ERROR | [Report](api/report.md) · [JUnit](api/junit.xml) |
| Full API suite by case | 29 cases: 9 PASS, 20 FAIL, 0 NOT_RUN | [JSON and source hashes](api/report.json) |
| Short campaign with Z3 | Completed with exit 0 and observed violations | [Summary](fuzz-summary.json) · [Log](fuzz-smoke.txt) |
| Manual UI | 12 cases designed, NOT_RUN | [Catalog](../../manual-testing/test-cases.md) |

The full command exited **1** for acceptance violations, with zero runner errors. [Execution summary](execution-summary.json).

API smoke ran separately against the same source:

```sh
python api-testing/run_suite.py --suite smoke --output reports/runs/portfolio-smoke-20261115
```

TC-AUTH-5, TC-OS-5, TC-PRD-4, and TC-ORD-19 all passed and the command exited 0. The full smoke report was retained locally.

## Read and rerun the snapshot

Select a case from the report and run `api-testing/run_suite.py --suite full --testcase <TC-ID>` with a fresh output directory. Actor IDs and timestamps can vary. Compare the oracle and behavior across runs.

The API files retain request and response evidence and run metadata. Absolute paths refer to the original machine. The snapshot uses `.txt` copies of `.log` files, and the fuzzing log omits trailing blank lines. The execution summary keeps original names in its `log` field. `fuzz-summary` is curated. Detailed branch and coverage evidence remains in the local run directory.

Each metric has its own unit: unit tests, regressions, scenarios, test cases, and fuzz inputs. The three historical bug reports illustrated selected symptoms among the 20 failing cases.

The initial sandbox run hit `spawn EPERM` and `PermissionError` and was excluded from the baseline. The recorded run kept the assertions and case selection intact.
