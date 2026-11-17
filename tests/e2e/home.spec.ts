import { test, expect } from '../fixtures';

test('has title and loads home page', async ({ page }) => {
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await expect(page).toHaveTitle(/VFitAI/i);
  await expect(page.locator('#root')).toBeVisible();
  await expect(page.locator('a[href="/product/50101"]').first()).toBeVisible();
});

test('can open seeded product from home catalog', async ({ page }) => {
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  const product = page.locator('a[href="/product/50101"]').first();
  await expect(product).toBeVisible();
  await product.click();
  await expect(page).toHaveURL(/\/product\/50101$/);
  await expect(page.getByRole('heading', { name: 'QA Cotton Shirt', exact: true })).toBeVisible();
});
