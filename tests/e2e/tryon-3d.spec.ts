import { test, expect, snapshot, ready, openViewer, compareRender } from '../viewer-fixtures';
import fs from 'node:fs';
import path from 'node:path';

test('L1/L2 real GLBs render and size selection replaces geometry', async ({ page, diagnostics }) => {
  await openViewer(page); await ready(page);
  await expect(page.getByTitle('White', { exact: true })).toHaveClass(/active/);
  const initial = (await snapshot(page))!;
  expect(initial.renderer.contextLost).toBe(false); expect(initial.renderer.vendor).toMatch(/SwiftShader/i);
  expect(initial.assets.filter(a => a.role === 'garment')).toHaveLength(1);
  await page.getByTestId('viewer-size-L').click(); await ready(page, 'L');
  const large = (await snapshot(page))!.assets.find(a => a.role === 'garment')!;
  expect(large.bounds).not.toEqual(initial.assets.find(a => a.role === 'garment')!.bounds);
  await page.getByTestId('viewer-size-S').click(); await ready(page, 'S');
  expect(diagnostics.assets.some(a => a.path.endsWith('Ao_Thun_sizeL.glb') && a.status === 200)).toBe(true);
  expect(diagnostics.pageErrors).toEqual([]); expect(diagnostics.renderErrors).toEqual([]);
});

test('L1/L2 camera preset, wheel zoom, drag rotate and reset affect actual camera', async ({ page, diagnostics }) => {
  await openViewer(page); await ready(page);
  const initial = (await snapshot(page))!.camera;
  await page.getByTitle('Trái', { exact: true }).click();
  await expect.poll(async () => (await snapshot(page))!.camera.position[0], { timeout: 15000 }).toBeCloseTo(5.2, 2);
  const canvas = page.getByTestId('viewer-render').locator('canvas');
  // R3F delegates pointer events to the containing eventSource; canvas has pointer-events:none.
  await page.getByTestId('viewer-render').hover(); await page.mouse.wheel(0, -450);
  await expect.poll(async () => (await snapshot(page))!.camera.distance).toBeLessThan(initial.distance - 0.2);
  const box = (await canvas.boundingBox())!;
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2); await page.mouse.down();
  await page.mouse.move(box.x + box.width / 2 + 130, box.y + box.height / 2 + 30, { steps: 12 }); await page.mouse.up();
  await expect.poll(async () => Math.abs((await snapshot(page))!.camera.position[2])).toBeGreaterThan(0.3);
  await page.getByTitle('Đặt lại góc nhìn', { exact: true }).click();
  await expect.poll(async () => Math.abs((await snapshot(page))!.camera.position[0]), { timeout: 15000 }).toBeLessThan(0.02);
  await expect.poll(async () => (await snapshot(page))!.camera.position[2]).toBeCloseTo(5.2, 1);
  expect(diagnostics.pageErrors).toEqual([]); expect(diagnostics.renderErrors).toEqual([]);
});

test('L4 live animation and auto-rotate advance without context loss', async ({ page, diagnostics }) => {
  await openViewer(page, 'live'); await ready(page);
  const initial = (await snapshot(page))!; expect(initial.frozen).toBe(false);
  await expect.poll(async () => JSON.stringify((await snapshot(page))!.bones), { timeout: 15000 }).not.toBe(JSON.stringify(initial.bones));
  await page.getByTitle('Tự động xoay', { exact: true }).click();
  await expect.poll(async () => Math.abs((await snapshot(page))!.camera.position[0])).toBeGreaterThan(0.2);
  await page.getByTitle('Dừng xoay', { exact: true }).click();
  expect((await snapshot(page))!.renderer.contextLost).toBe(false);
  expect(diagnostics.pageErrors).toEqual([]); expect(diagnostics.renderErrors).toEqual([]);
});

test('L4 delayed avatar exposes loading and completes within a cold-load budget', async ({ page, diagnostics }, testInfo) => {
  let release!: () => void;
  const gate = new Promise<void>(resolve => { release = resolve; });
  await page.route('**/avatar_morph.glb', async route => { await gate; await route.continue(); });
  const start = Date.now();
  try {
    await openViewer(page);
    await expect(page.locator('.vto-loader')).toBeVisible();
    expect((await snapshot(page))?.assets.some(a => a.role === 'avatar') || false).toBe(false);
  } finally { release(); }
  await ready(page); await expect(page.locator('.vto-loader')).toBeHidden();
  const loadMs = Date.now() - start; expect(loadMs).toBeLessThan(60000);
  await testInfo.attach('cold-load-budget', { body: JSON.stringify({ loadMs, budgetMs: 60000, includesControlledDelay: true }), contentType: 'application/json' });
  expect(diagnostics.pageErrors).toEqual([]); expect(diagnostics.renderErrors).toEqual([]);
});

test('L4 asset 404 has an explicit error and reload recovers a real model', async ({ page, diagnostics }) => {
  await page.route('**/avatar_morph.glb', route => route.fulfill({ status: 404, body: 'Controlled QA missing avatar' }));
  await openViewer(page);
  await expect(page.getByTestId('viewer-error')).toBeVisible({ timeout: 30000 });
  expect(diagnostics.assets.some(a => a.path.endsWith('avatar_morph.glb') && a.status === 404)).toBe(true);
  await page.unroute('**/avatar_morph.glb');
  await page.getByRole('button', { name: 'Tải lại mô hình', exact: true }).click();
  await page.getByRole('button', { name: 'Bỏ qua', exact: true }).click(); await ready(page);
  await expect(page.getByTestId('viewer-error')).toHaveCount(0); expect((await snapshot(page))!.renderer.contextLost).toBe(false);
});

test('L4 repeated size transitions settle with bounded renderer resources', async ({ page, diagnostics }, testInfo) => {
  await openViewer(page); await ready(page);
  for (const size of ['S', 'L', 'M']) { await page.getByTestId(`viewer-size-${size}`).click(); await ready(page, size); }
  const warm = (await snapshot(page))!.renderer;
  for (const size of ['S', 'L', 'M', 'L', 'S', 'M']) { await page.getByTestId(`viewer-size-${size}`).click(); await ready(page, size); }
  const final = (await snapshot(page))!;
  await testInfo.attach('gpu-resource-plateau', { body: JSON.stringify({ warm, final: final.renderer,
    maximumAllowedGrowth: 2, note: 'Renderer resource counts, not GPU byte usage or a production FPS benchmark' }), contentType: 'application/json' });
  expect(final.assets.filter(a => a.role === 'garment')).toHaveLength(1);
  expect(final.renderer.geometries).toBeLessThanOrEqual(warm.geometries + 2);
  expect(final.renderer.textures).toBeLessThanOrEqual(warm.textures + 2);
  expect(final.renderer.contextLost).toBe(false); expect(diagnostics.pageErrors).toEqual([]); expect(diagnostics.renderErrors).toEqual([]);
});

test('L3 @visual fixed front and side render match reviewed baselines', async ({ page, diagnostics }) => {
  test.setTimeout(120000);
  await openViewer(page); await ready(page); expect((await snapshot(page))!.frozen).toBe(true);
  expect(await page.evaluate(() => matchMedia('(prefers-reduced-motion: reduce)').matches)).toBe(true);
  expect((await snapshot(page))!.renderer.vendor).toMatch(/SwiftShader/i);
  await compareRender(page, 'shirt-m-front.png');
  await page.getByTitle('Trái', { exact: true }).click();
  await expect.poll(async () => (await snapshot(page))!.camera.position[0], { timeout: 15000 }).toBeCloseTo(5.2, 2);
  await compareRender(page, 'shirt-m-left.png');
  expect(diagnostics.pageErrors).toEqual([]); expect(diagnostics.renderErrors).toEqual([]);
});

test('L3 @visual @diagnostic valid but wrong GLB is detected by visual oracle', async ({ page, diagnostics }) => {
  await page.route('**/Ao_Thun_sizeM.glb', route => route.fulfill({ status: 200, contentType: 'model/gltf-binary',
    body: fs.readFileSync(path.resolve(__dirname, '../../client/public/models/QuanM.glb')) }));
  await openViewer(page); await ready(page);
  // Valid WebGL, successful HTTP and a mounted asset are insufficient: the wrong garment must fail pixels.
  expect((await snapshot(page))!.renderer.contextLost).toBe(false);
  expect(diagnostics.pageErrors).toEqual([]); expect(diagnostics.renderErrors).toEqual([]);
  await compareRender(page, 'shirt-m-front.png');
});
