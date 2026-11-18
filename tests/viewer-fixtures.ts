import { test as base, expect } from './fixtures';
import type { Page } from '@playwright/test';

export type SceneSnapshot = {
  frames: number; sampledAt: number; frozen: boolean; loading: boolean; loadingErrors: string[];
  camera: { position: number[]; quaternion: number[]; distance: number };
  assets: { role: string; url: string; meshes: number; vertices: number; bounds: number[] }[];
  bones: number[];
  renderer: { calls: number; triangles: number; geometries: number; textures: number; contextLost: boolean; width: number; height: number; vendor: string };
};
export const snapshot = (page: Page) => page.evaluate(() => (window as Window & { __VFIT_3D__?: SceneSnapshot }).__VFIT_3D__);
export async function ready(page: Page, size = 'M') {
  await expect.poll(async () => {
    const state = await snapshot(page);
    return !!state && !state.loading && state.assets.some(a => a.role === 'avatar' && a.meshes > 0)
      && state.assets.some(a => a.role === 'garment' && a.url.endsWith(`Ao_Thun_size${size}.glb`) && a.vertices > 0);
  }, { timeout: 60000, message: `Real avatar and shirt ${size} mounted and rendered` }).toBe(true);
  await expect.poll(async () => (await snapshot(page))?.renderer.triangles || 0).toBeGreaterThan(100);
}
export async function openViewer(page: Page, mode = 'static') {
  await page.goto(`/try-on?product_id=50101&size=M&qa3d=${mode}`, { waitUntil: 'domcontentloaded' });
  const skip = page.getByRole('button', { name: 'Bỏ qua', exact: true });
  await expect(skip).toBeVisible({ timeout: 30000 });
  const create = page.getByRole('button', { name: 'Tạo Avatar', exact: true });
  await expect(create).toBeFocused();
  await page.keyboard.press('Shift+Tab'); await expect(skip).toBeFocused();
  await page.keyboard.press('Tab'); await expect(create).toBeFocused();
  await skip.click();
}
export async function captureRender(page: Page): Promise<Buffer> {
  const canvas = page.getByTestId('viewer-render').locator('canvas');
  let previous = ''; let lastFrame = -1;
  // Native WebGL buffer capture excludes DOM overlays/fonts without changing the scene.
  // Require identical pixels across distinct rendered frames, not a fixed sleep.
  await expect.poll(async () => {
    const frame = (await snapshot(page))!.frames;
    if (frame <= lastFrame) return false;
    const current = await canvas.evaluate(node => (node as HTMLCanvasElement).toDataURL('image/png'));
    const stable = previous === current; previous = current; lastFrame = frame; return stable;
  }, { timeout: 20000, message: 'Frozen WebGL pixels settle across rendered frames' }).toBe(true);
  return Buffer.from(previous.split(',')[1], 'base64');
}
export async function compareRender(page: Page, name: string) {
  expect(await captureRender(page)).toMatchSnapshot(name, { maxDiffPixelRatio: 0.002 });
}
type Diagnostics = { pageErrors: string[]; renderErrors: string[]; warnings: string[]; assets: { path: string; status: number }[] };
export const test = base.extend<{ diagnostics: Diagnostics }>({
  diagnostics: [async ({ page, browser }, use, testInfo) => {
    const data: Diagnostics = { pageErrors: [], renderErrors: [], warnings: [], assets: [] };
    page.on('pageerror', error => data.pageErrors.push(error.message.slice(0, 1500)));
    page.on('console', message => {
      const value = message.text().slice(0, 1500);
      if (message.type() === 'error' && /THREE|WebGL|GLTF|shader|Could not load|RGBELoader/i.test(value)) data.renderErrors.push(value);
      if (message.type() === 'warning' && /THREE|WebGL|GLTF|shader/i.test(value)) data.warnings.push(value);
    });
    page.on('response', response => {
      if (/\.(glb|hdr)(\?|$)/i.test(response.url())) data.assets.push({ path: new URL(response.url()).pathname, status: response.status() });
    });
    try { await use(data); }
    finally {
      const scene = page.isClosed() ? undefined : await snapshot(page).catch(() => undefined);
      await testInfo.attach('3d-diagnostics', { body: JSON.stringify({ ...data, scene, browser: browser.version(), platform: process.platform }, null, 2), contentType: 'application/json' });
      if (!page.isClosed()) await testInfo.attach('3d-resource-timings', { body: JSON.stringify(await page.evaluate(() => performance.getEntriesByType('resource').filter(e => /\.(glb|hdr)(\?|$)/.test(e.name)).map(e => ({ path: new URL(e.name).pathname, duration: e.duration })))), contentType: 'application/json' });
    }
  }, { auto: true }],
});
export { expect };
