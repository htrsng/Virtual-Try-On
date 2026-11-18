# Curated quality-completion evidence

execution-summary.json records local results, actual timestamps, the b0fc753 base
plus dirty state and canonical source hashes. It is not a clean-checkout/remote
CI claim. Baseline lint213+14/build109 are preserved as the before state.

Strict ESLint/TypeScript configurations are unchanged. Native XML was parsed;
approved Windows PNG hashes remain unchanged and the intentional wrong-GLB
detector still requires a real pixel diff and trace.

mobile-cart-after.png is one synthetic screenshot for review, not a complete
generated report folder. Raw native reports/axe findings/candidates/traces remain
ignored under .runtime/ci/ and .runtime/improvement/. No QA manifests are committed.

Rebuild the instance catalog after running all relevant suites with
`node scripts/export-test-catalog.cjs`. Data-provider rows are explicit instances;
cross-browser repeats are de-duplicated by file/title. Manual designs and human
procedures remain separate. No150-business-case or human approval claim is made.

Clean remote CI SHA/results belong in PR checks and run artifacts. Retention14 days
applies to generated artifacts; curated source/count summaries remain in Git.
