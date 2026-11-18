import { test, expect } from '../fixtures';

test('production bundle serves compiled assets without the development client', async ({ page }) => {
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('a[href="/product/50101"]').first()).toBeVisible();
  await expect(page.locator('script[src*="/@vite/client"]')).toHaveCount(0);
  await expect(page.locator('script[type="module"][src^="/assets/"]')).toHaveCount(1);
  expect(await page.evaluate(() => '__VFIT_3D__' in window)).toBe(false);
});
