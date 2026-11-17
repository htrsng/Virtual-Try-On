# Curated Stage 9 evidence

execution-summary.json records local commands, timestamps, counts and hashed source
files for the dirty worktree based on8d6b8b0. It does not label those runs clean-clone
or remote CI. Native JUnit/HTML/logs/traces are generated in ignored .runtime/ci/;
initial failed/over-collected attempts remain in .runtime/stage9/ separately.

mobile-cart-overlap.png is one synthetic screenshot explicitly reviewed by the agent:
390x844, floating chat partially obscures checkout. It contains no real account or
credentials. It is a sample, not an entire generated report directory. PNG baseline
hashes are checked separately; no approved baseline is replaced by Stage9 images.

Remote CI links/results live in the PR and Test Summary. Artifacts expire after14
days. Manual remaining coverage is explicitly Not Run, not manufactured as evidence.
