# VFitAI — Virtual Try-On & API Testing

VFitAI is an academic fashion web project combining a React/TypeScript shopping interface with a 3D virtual fitting experience. The repository also contains a Python fuzzing project for a simulated sales API.

The application and the testing project share this repository so their development history remains available. The fuzzing target is a local simulation; it is not the production backend of the full application.

## Project overview

The application explores online fashion shopping, virtual try-on, outfit selection and store management. Its frontend uses React, TypeScript, Vite and Three.js.

The API testing work is maintained in [`fuzzing-security-testing/`](./fuzzing-security-testing/README.md). Start there to review the testing code, setup instructions, evidence and known limitations.

## API fuzzing and security testing

The Python tools generate and mutate JSON request bodies, send HTTP requests to a local Express harness and check the responses against explicit expectations.

### Testing scope

- Login and authentication responses.
- Order creation, input validation and order integrity.
- Order status updates.
- User updates and access-control behavior.
- Product management requests.
- Replay of selected inputs with saved request/response evidence.
- Bounded Z3 analysis of selected `totalAmount` branches.

**Tools:** Python, requests, unittest, Node.js/Express and Z3.

The Z3 component uses a manually defined model of selected input behavior. It does not symbolically execute the entire JavaScript application.

[Read the fuzzing project README](./fuzzing-security-testing/README.md) · [Detailed testing guide](./fuzzing-security-testing/docs/testing-guide.md)

## Repository layout

| Path | Contents |
| --- | --- |
| `client/` | React/TypeScript frontend and 3D interface |
| `tests/` | Browser testing project |
| `doc/` | Application screenshots and project documents |
| `fuzzing-security-testing/fuzzers/` | Mutation, response checks, replay and analysis tools |
| `fuzzing-security-testing/node_harness/` | Simulated Express target and supporting models/services |
| `fuzzing-security-testing/seed_corpus/` | Baseline JSON inputs |
| `fuzzing-security-testing/tests/` | Regression tests for the testing tools |
| `fuzzing-security-testing/results/` | Historical campaign evidence |
| `fuzzing-security-testing/BaoCaoATPM/` | Academic specifications and reports |
| `.github/workflows/` | GitHub Actions configuration |

## Run the frontend

Use Node.js 24 with npm. From the repository root:

```sh
cd client
npm ci
npm run dev
```

Open the local URL printed by Vite. Starting the frontend alone does not provide the missing backend services.

Other commands, run from `client/`:

```sh
npm run build
npm run lint
npm test -- --run
```

These are available project commands, not a claim that every check currently passes.

## Review and run the API tests

Use the [fuzzing README](./fuzzing-security-testing/README.md) for Python and Node dependency setup and campaign commands.

From the repository root, the regression command is:

```sh
python -m unittest discover -s fuzzing-security-testing/tests -p "test_*.py"
```

### Current status of this branch

- The `server/` directory referenced by the full-application workflow is absent.
- The fuzzing harness imports `server/concurrency`, which is also absent from this branch.
- The last recorded regression run on 2026-11-03 had 34 tests: 32 passed, one failed and one errored. The failures involved an outdated workbook case count and the missing concurrency module.
- Full-application CI has separate setup issues. Its status is not an isolated assessment of the fuzzing project.

Fixes verified in a separate standalone copy have not yet been applied and verified in this branch. Historical evidence must not be described as a fresh run of the current code.

## Reading the evidence

Each finding should be assessed with its input, observed response, expected behavior and recorded environment.

- An HTTP 500 response is not proof of a process crash.
- Repeated observations are not necessarily distinct vulnerabilities.
- A passing sample does not prove complete coverage or security.
- Results from the simulated datastore and services do not establish the security of a deployed application.

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for naming, file organization and evidence conventions. Keep dependencies, local credentials and temporary output out of version control.

## License

[MIT](./LICENSE).
