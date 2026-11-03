# VFitAI

Academic fashion web application with a React/TypeScript client, a 3D fitting interface and a separate sales API fuzzing project.

## Start here

- [Sales API fuzzing](fuzzing-security-testing/README.md): Python mutation testing, HTTP checks, replay evidence and bounded Z3 analysis.
- `client/`: React, TypeScript, Vite and Three.js frontend.
- `tests/`: browser test project.
- `doc/`: existing screenshots and project documents.

## Frontend

With Node.js 22.12 or later, run these commands in `client/`:

```sh
npm install
npm run dev
```

Other commands: `npm run build`, `npm run lint`, `npm test -- --run`.

## Current limitations

This checkout does not include the `server/` directory referenced by the existing CI workflow and older project documentation. The frontend and browser tests must not be presented as a fully reproducible full-stack deployment until the backend is restored or the intended service is documented. The fuzzing harness is separate but also imports `server/concurrency`; its execution is currently blocked by that missing module. See its README for setup and the recorded verification status.

The repository includes historical reports and simulated integrations. Test evidence applies to the recorded environment and version, not automatically to the full VFitAI product.

See [contribution conventions](CONTRIBUTING.md) before adding or moving files.
