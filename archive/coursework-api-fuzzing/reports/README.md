# Test reports

- `runs/<id>/` contains new run output. Git ignores these per-run directories.
- `baseline/` contains the curated historical portfolio snapshot.
- `state-oracles-v1/` contains acceptance and replay results after strengthening oracles and adding before-and-after snapshots. It records separate source hashes.
- `current/` contains supplemental replay, component, build, lint, and fuzz-quality evidence. The [evidence index](../qa/evidence-index.md) records dates, sources, and scope.
- `../fuzz-testing/evidence/` contains earlier fuzzing evidence.

From the coursework root:

```sh
python tools/run_checks.py --suite smoke
python tools/run_checks.py --suite full
```

The full suite may exit 1 when a known acceptance case fails. Read `api/report.md` to distinguish FAIL from ERROR. `summary.md` records each step’s exit code. Unit tests, infrastructure tests, API scenarios, and fuzz inputs are reported separately.
