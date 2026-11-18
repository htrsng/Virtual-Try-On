import { test, expect, openViewer, ready, snapshot, captureRender } from '../viewer-fixtures';
import fs from 'node:fs';

test('export platform-specific candidate PNGs for review, without approving a visual baseline', async ({ page, browser, diagnostics }, testInfo) => {
  await openViewer(page); await ready(page);
  expect((await snapshot(page))!.frozen).toBe(true);
  expect((await snapshot(page))!.renderer.vendor).toMatch(/SwiftShader/i);
  for (const angle of ['front', 'left']) {
    if (angle === 'left') {
      await page.getByTitle('Trái', { exact: true }).click();
      await expect.poll(async () => (await snapshot(page))!.camera.position[0], { timeout: 15000 }).toBeCloseTo(5.2, 2);
    }
    const file = testInfo.outputPath(`shirt-m-${angle}.png`);
    fs.writeFileSync(file, await captureRender(page));
    await testInfo.attach(`candidate-${angle}`, { path: file, contentType: 'image/png' });
  }
  await testInfo.attach('candidate-environment', { body: JSON.stringify({ approved: false, purpose: 'Review candidate only; no pixel regression verdict', platform: process.platform, browser: browser.version(), scene: await snapshot(page) }), contentType: 'application/json' });
  expect(diagnostics.pageErrors).toEqual([]); expect(diagnostics.renderErrors).toEqual([]);
});
