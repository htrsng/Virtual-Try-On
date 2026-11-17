import { test, expect } from '../fixtures';

test('seeded customer: Home -> Product -> Cart -> Checkout', async ({ page, request, qaData }) => {
  // Authentication is fixture setup through the real API, not a claim of UI-login coverage.
  const login = await request.post('/api/auth/login', { data: qaData.accounts.customer });
  expect(login.status()).toBe(200);
  const { token } = await login.json();
  await page.addInitScript(value => localStorage.setItem('token', value), token);
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  const product = page.locator('a[href="/product/50101"]').first();
  await expect(product).toBeVisible(); await product.click();
  await expect(page.getByRole('heading', { name: 'QA Cotton Shirt', exact: true })).toBeVisible();
  await page.locator('button.size-btn').filter({ hasText: /^M$/ }).click();
  await page.getByRole('button', { name: /Thêm vào giỏ/i }).click();
  await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem('cartItems') || '[]').length)).toBe(1);
  await page.goto('/cart', { waitUntil: 'domcontentloaded' });
  await page.locator('label.cp-checkbox-label').filter({ hasText: 'Chọn tất cả' }).click();
  await expect(page.getByLabel(/Chọn tất cả/)).toBeChecked();
  // Both responsive layouts expose a checkout action; role locators exclude CSS-hidden controls.
  const checkout = page.getByRole('button', { name: /^(Tiến hành thanh toán|Thanh toán \(1\))$/ });
  await expect(checkout).toHaveCount(1);
  await expect(checkout).toBeVisible(); await expect(checkout).toBeEnabled();
  await checkout.click();
  await expect(page).toHaveURL(/\/checkout\/cart$/);
  const summary = page.locator('.co-summary');
  await summary.getByRole('button', { name: 'Xem sản phẩm đã chọn (1)', exact: true }).click();
  const selected = summary.locator('.co-mini-product');
  await expect(selected).toHaveCount(1);
  await expect(selected.getByText('QA Cotton Shirt', { exact: true })).toBeVisible();
  await expect(selected.locator('.co-mini-product__meta')).toContainText('Size M');
  await expect(selected.locator('.co-mini-product__meta')).toContainText('x1');
});
