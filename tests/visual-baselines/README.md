# WebGL visual baselines

The front and left views were approved on November 17, 2026. See [render-profile.json](render-profile.json) for the image hashes and render settings.

The test captures the default avatar wearing the white QA Cotton Shirt (`50101`) in size M. It reads pixels directly from the WebGL canvas once frames stabilize. The profile uses Windows, Playwright 1.60.0, Chromium 148.0.7778.96, ANGLE SwiftShader, a 1440 × 1000 viewport, and a device pixel ratio of 1. The pixel difference threshold is 0.2%.

On November 18, 2026, one Windows visual case passed across both camera angles. The result applies to the product and profile above. [Execution report](../../qa/docs/test-summary.md).

## Run the image comparison

From `tests/` in PowerShell:

```powershell
$env:QA_3D_VISUAL = '1'
node node_modules/@playwright/test/cli.js test --project=3d-visual
```

## Investigate an image difference

Open the actual image and the diff to identify the cause. For an intentional change, generate candidates locally with `--update-snapshots`, review each image, and update the hashes in the profile. Linux CI exports images in the `visual-candidates/` artifact with `approved: false`. Use an approved profile and images for each operating system.

From the repository root, run `node scripts/qa-3d-diagnostic.cjs` to verify that the comparator detects the wrong model. The diagnostic intentionally generates a diff and trace. [3D testing details](../../qa/docs/stage-7-playwright-3d.md).
