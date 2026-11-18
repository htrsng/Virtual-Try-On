# Coursework QA overview

Use this index to review scope, results, cases, defects, and evidence. The coursework uses a simulated Express API and selected VFitAI application helpers and components. The frontend and simulated API were assessed separately.

| What to review | Document |
| --- | --- |
| Goals, risks, and environment | [Test plan](test-plan.md) |
| 29 API cases and 105 out-of-scope cases | [Coverage Matrix](test-coverage.md) |
| Tool, acceptance, and frontend execution | [Test execution](test-execution.md) |
| 20 failing cases, provisional grouping, replay, and regression | [Defect register](defect-register.md) |
| Current and historical reports | [Evidence index](evidence-index.md) |
| Component scope, build/lint issues, and CI | [Frontend quality](frontend-quality.md) |
| Fuzzing metrics and limits | [Fuzzing quality](fuzzing-quality.md) |
| Before-and-after state checks | [Stored-state oracle v1](state-oracle-contract.md) |

## Results by scope

- **55/55** tool, oracle, and snapshot regression checks passed, including 34 existing and 21 new checks.
- **29 API cases across 51 scenarios:** 9 cases passed and 20 failed. At scenario level, 19 passed and 32 failed. The baseline recorded zero ERROR or NOT_RUN.
- **20/20 failing cases recurred** across two attempts per representative scenario, for 40 reproduced failures. This measures selected scenarios and may include shared root causes.
- **14 unit tests and 14 component checks** cover distinct scopes.
- **12 manual UI cases** were designed and remain NOT_RUN. The 105 other spreadsheet cases are outside the API campaign.

## Run the coursework demo

Install dependencies from the [coursework README](../README.md), then run these commands separately:

```sh
python tools/run_checks.py --suite smoke
python api-testing/run_suite.py --suite full --testcase TC-USR-2 --output reports/runs/demo-acceptance
python api-testing/replay_failures.py --report reports/runs/demo-acceptance/report.json --repeats 2 --output reports/runs/demo-replay
```

The API step is expected to exit 1 for the known business-oracle failure. The replay step exits 0 when it confirms the expected failure. Use fresh output directories. Run commands separately so the shell reaches replay after the expected exit 1. Replay rejects source hash mismatches, including baseline mismatches from source changes or line endings. Generate a new acceptance report on the current checkout before replay.

[Five detailed bug reports](../bug-reports/README.md) · [Historical CV draft](../docs/cv.md) · [Current acceptance and replay report](../reports/state-oracles-v1/README.md).
