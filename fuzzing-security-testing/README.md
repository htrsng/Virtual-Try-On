# Sales API fuzzing

Python fuzzers send mutated JSON inputs to a local Express harness. Checks cover login, order creation, order status, user updates and product management. The harness processes real HTTP requests in an isolated test environment; results do not establish the security of the full application or a production database.

## Current verification status

Local verification on 2026-11-03 ran 34 Python tests: 32 passed, one failed and one errored. The campaign test expects 75 excluded cases, while the current workbooks return 105. The concolic integration test cannot import the missing `server/concurrency` module from the Node harness. These are existing blockers; the commands below describe the intended setup, not a confirmed working campaign.

## Setup from the repository root

```sh
python -m pip install -r fuzzing-security-testing/requirements.txt
npm ci --prefix fuzzing-security-testing/node_harness
python fuzzing-security-testing/fuzzers/run_fuzzing.py --iterations 42 --iterations-per-case 8 --max-cases 2 --seed 7
```

Add `--concolic` to run the bounded Z3 analysis of `totalAmount`. This is a manually modeled input domain, not symbolic execution of the entire JavaScript application.

## Files

- `fuzzers/`: mutation, response oracles, replay, coverage exploration and CLI runners.
- `node_harness/`: Express test server and simulated data/services.
- `seed_corpus/`: valid baseline request bodies.
- `tests/`: regression tests for the testing tools.
- `results/`: committed historical evidence, separated by campaign.
- `BaoCaoATPM/`: original academic specifications and reports. Existing evidence paths are retained because manifests reference them.

## Verify the tool

```sh
python -m unittest discover -s fuzzing-security-testing/tests -p "test_*.py"
```

For new campaigns, choose a separate output directory using the runner options. Read the report's environment, setup errors and limitations before interpreting findings. HTTP 500 is not proof of a process crash; repeated findings are not independent vulnerabilities; a passing sample does not prove full coverage.

See the [testing guide](docs/testing-guide.md) for campaign commands, historical result counts and evidence limitations. Historical counts are not a fresh test run.
