# Archived coursework — API fuzzing

This coursework tests a simulated Express API using Python, mutation-based and greybox testing, and a bounded Z3 model. It is separate from VFitAI’s Selenium suite.

The archive contains `fuzz-testing/`, `api-testing/`, `automation-testing/`, `tools/`, `qa/`, `docs/`, `manual-testing/`, `bug-reports/`, and `reports/`. Run the coursework only against the simulated target and fixtures under `fuzz-testing/target/`. Keep Atlas and VFitAI data outside this environment. [Historical bug reports](bug-reports/README.md).

[Fuzzing guide](fuzz-testing/README.md) · [Original portfolio snapshot](PORTFOLIO-SNAPSHOT.md)

## Run the coursework checks

From the repository root:

```sh
cd archive/coursework-api-fuzzing
python -m pip install -r requirements.txt
npm ci --prefix fuzz-testing/target
python tools/run_checks.py --suite smoke
```

The archived suite requires Python 3.12, Node.js 24, and npm. Full acceptance can return exit code 1 because the target has known defects. New reports are written to the ignored `reports/runs/` directory.

Component tests use the restored application code at `../../client/`. From `archive/coursework-api-fuzzing/`:

```sh
npm ci --prefix ../../client
python tools/run_frontend_checks.py
```

## Archive notes

Historical results, source hashes, and raw evidence retain their original values. The snapshot, reports, and archived workflows refer to the former layout. Use the coursework directory as the working directory. Replay checks source hashes and can reject runs if relevant source has changed.

The nested `.github/workflows/` directory stores old workflows. To reuse them, update their working directory and artifact paths in an active workflow. `docs/cv.md` is an old CV draft. Selenium, TestNG, and browser E2E results were unverified for this coursework.
