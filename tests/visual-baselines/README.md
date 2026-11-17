# Approved WebGL baselines

Owner approved **front and left on 2026-11-17**, response: “Duyệt hai baseline hiện tại”.
Approval applies to the exact PNG hashes in `render-profile.json`, not future updates.
The images capture the current QA shirt M appearance; approval is a regression
reference, not certification of physical fit/anatomy or all products.

Profile: Windows + Playwright1.60.0/Chromium148.0.7778.96, ANGLE SwiftShader,
viewport1440×1000, DPR1, seeded product50101 M/White, fixed default avatar/body,
studio lights + local HDR, front/left cameras, animation time0. Native
`canvas.toDataURL('image/png')` captures real WebGL pixels without DOM UI/fonts.
The helper requires identical pixels over distinct rendered frames before
`toMatchSnapshot`, with maxDiffPixelRatio0.002. No fixed sleep or image edits.

From `tests/`, PowerShell:

```powershell
$env:QA_3D_VISUAL='1'
node node_modules/@playwright/test/cli.js test --project=3d-visual
```

For an intentional product/render change, first inspect actual/diff and document
the reason. Generate candidates with `--update-snapshots` only locally, compare
before/after, request approval of the exact new images and update profile hashes.
CI never approves or regenerates images. Linux/macOS need their own reviewed
profile/baselines; do not copy Windows PNGs into another platform's directory.

Wrong-model detector: from root `node scripts/qa-3d-diagnostic.cjs`. This deliberately
produces a failed Playwright test with diff/trace; the wrapper succeeds only after
verifying that exact negative result. See [stage7 report](../../qa/docs/stage-7-playwright-3d.md).
