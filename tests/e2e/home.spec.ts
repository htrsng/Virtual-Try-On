import { test, expect } from '@playwright/test';

test('has title and loads home page', async ({ page }) => {
  await page.goto('/');

  // Mở trang chủ và kiểm tra title
  await expect(page).toHaveTitle(/VFitAI/i);

  // Chờ cho app container xuất hiện
  const appContainer = page.locator('#root');
  await expect(appContainer).toBeVisible();
});

test('can navigate to product listing', async ({ page }) => {
  await page.goto('/');

  // Chờ 1 chút để UI load xong nếu cần
  await page.waitForLoadState('networkidle');

  // Tìm link "Sản phẩm"
  const productsLink = page.getByRole('link', { name: /Sản phẩm/i });
  if (await productsLink.count() > 0) {
    await productsLink.first().click();
    await expect(page).toHaveURL(/.*products/);
  }
});
