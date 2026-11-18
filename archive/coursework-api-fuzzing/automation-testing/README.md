# Application unit automation

**14 unit tests** exercise two TypeScript helpers from the original application:

- `calculateRecommendedSize` covers fallbacks, size selection, boundaries, tops versus bottoms, fit scores, input preservation, and stability when charts are reordered.
- `fetchWithTimeout` covers method and body forwarding, responses, abort on timeout, network errors, and HTTP 4xx. The tests mock fetch at the network boundary.

From this directory, use Node.js 22.15 or later. CI uses Node.js 24.

```sh
npm test
```

The suite uses `node:test` and Node’s TypeScript stripping, so it requires no npm install. It imports the helpers directly from the application source. React rendering, WebGL, and browser E2E are outside this suite.

From the coursework root, run `python tools/run_checks.py --suite smoke` to save JUnit and logs alongside the API, reporting, and fuzz-tool regression checks. Application unit results are counted separately. Archived Playwright work is excluded from the coursework results.

## React component tests

Vitest and Testing Library cover 14 ProductList and Toast cases against the original frontend. After installing frontend dependencies, run `python tools/run_frontend_checks.py` from the coursework root. Component and unit tests have separate scopes. [Scope, mocks, and recorded build/lint issues](../qa/frontend-quality.md).
