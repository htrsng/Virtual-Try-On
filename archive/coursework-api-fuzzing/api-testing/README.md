# Deterministic API acceptance testing

The suite runs **29 test cases across 51 fixed scenarios** from the specification. It reuses `testcases.py`, the oracles, and the simulated Express harness in `fuzz-testing/`. Each scenario starts a new Node.js process with a fresh data store and synthetic actors.

From the coursework root, after installing the dependencies described in the [coursework README](../README.md):

```sh
python api-testing/run_suite.py --suite smoke
python api-testing/run_suite.py --suite full
python api-testing/run_suite.py --suite full --testcase TC-USR-2
```

Smoke selects four controls covering token roles, a valid order, an order status notification, and a missing product: TC-AUTH-5, TC-ORD-19, TC-OS-5, and TC-PRD-4. The full suite includes cases with known failures.

Reports default to `reports/runs/api-<id>/`. Use `--output <new_directory>` for a fresh destination. The runner refuses to overwrite evidence. Reports include JSON, Markdown, JUnit XML, observed responses and state, source hashes, environment details, traceability, and counts of scenarios left unrun. The harness redacts login tokens before writing reports.

Exit code **0** means all selected cases passed. **1** means an oracle reported a violation. **2** means a setup or runner error occurred or cases remained unrun. Keep assertions tied to the specification so known failures remain visible.

The [test case catalog](test-cases.csv) is exported from Excel with `python tools/export_api_catalog.py`. The `ExecutableOracles` column lists the checks the runner actually performs. Tests under `api-testing/tests/` verify exit codes and JUnit classification.

## Stored-state oracle contract v1

Supported user, product, and order mutations capture before-and-after snapshots of the affected resource and related collections. HTTP 4xx responses must leave that state unchanged. Role, duplicate ID, and order total checks also inspect persisted data. Missing evidence is classified as `ERROR` or `ORACLE_ERROR`. [Rules and limits](../qa/state-oracle-contract.md) · [55 regression checks and updated acceptance/replay results](../reports/state-oracles-v1/README.md).

## Replay and regression

```sh
python api-testing/replay_failures.py --repeats 2 --output reports/runs/replay-demo
```

Replay selects one failing scenario per test case, checks source and workbook hashes, and starts a fresh Node.js process for each attempt. Use `--testcase TC-USR-2` to select one case or `--report <new_api_report>` to use a newer report. The default input is the portfolio baseline. Use an empty output directory and generate a new acceptance report when source changes.

Replay exit code 0 means every selected violation recurred. Code 1 flags `NOT_REPRODUCED` for investigation, and code 2 indicates a setup, manifest, or runner error. The full suite still contains the failing cases. Fixes to the coursework target remain unverified. [20 tracked failures](../qa/defect-register.md) · [Replay report](../reports/current/replay/report.md).
