# Sales API fuzz testing

This coursework uses Python to generate unusual inputs for a simulated Express API. The coursework runs independently of VFitAI.

## Scope

The suite covers login, order creation, order status, user updates, and product management. It combines HTTP checks, specification-based oracles, branch analysis, and a bounded Z3 model of `totalAmount`.

Storage and external services are simulated. The environment requires no MongoDB, email service, or external API keys. Fixture accounts are for the isolated test process.

## Layout

| Directory | Contents |
| --- | --- |
| `fuzzers/` | Input generation, response checks, analysis, and campaign runners |
| `target/` | Simulated Express API and data models |
| `tests/` | Tool regression checks |
| `data/seeds/` | Sample JSON inputs |
| `tools/` | Reporting and evidence replay |
| `docs/specifications/` | Original Excel specifications and coursework documents |
| `docs/archive/` | Historical guides and report scripts |
| `evidence/legacy/` | Evidence from earlier revisions |
| `artifacts/` | Git-ignored output from new runs |

## Setup

Use Python 3.12, Node.js 24, and npm. From the coursework root:

```sh
cd fuzz-testing
python -m venv .venv
```

Activate the environment in Windows PowerShell:

```powershell
.venv\Scripts\Activate.ps1
```

On Linux or macOS:

```sh
source .venv/bin/activate
```

Install dependencies:

```sh
python -m pip install -r requirements.txt
npm ci --prefix target
```

## Regression checks

From `fuzz-testing/`:

```sh
python -m unittest discover -s tests -p "test_*.py"
```

These checks assess the tooling and simulated environment. Defect counts and business requirements coverage are reported separately.

## Sample campaign

```sh
python fuzzers/run_fuzzing.py --iterations 6 --iterations-per-case 2 --max-cases 1 --boundary-budget 2 --seed 7 --output artifacts/demo --concolic
```

Read `artifacts/demo/report.json`, `report.md`, and the linked evidence. Use a fresh output directory for each run. Z3 evaluates the modeled branches only.

## Specification audit

```sh
python fuzzers/run_ch4.py --audit-only --output artifacts/spec-audit
```

This command checks classification and generates a report. API cases remain `NOT_RUN` during an audit-only run.

See the [testing method](./docs/testing-guide.md), [verification results](./docs/verification.md), [migration notes](./docs/migration.md), and [test plan](./docs/fuzz-test-plan.md).

## Interpret results

- The specification lists 134 cases. Of these, 29 have API scenarios and 105 are outside this campaign’s scope.
- An HTTP 500 alone provides insufficient evidence of a process crash. Multiple observations can share a root cause.
- A short campaign provides limited evidence of coverage and system security.
- `evidence/legacy/` retains historical paths and results.
- Reports retain `node_harness_stub` as the simulated environment identifier. The code now lives under `target/`.

The archived **API Fuzzing Checks** workflow covers dependency setup, tool regression, specification auditing, and a short campaign. Its results apply to the coursework.

## Input metrics

The [QA overview](../qa/README.md) separates tool regression, acceptance, replay, and frontend checks. From the coursework root, `python fuzz-testing/tools/quality_campaign.py --iterations 28 --seed 7` records each mutated input, schema advisory, response, and oracle result. [Measurement and limits](../qa/fuzzing-quality.md).
