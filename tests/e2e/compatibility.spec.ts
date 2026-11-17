import { test, expect } from '../fixtures';

test('login supports named controls and keyboard mode/password toggles', async ({ page }) => {
  await page.goto('/login', { waitUntil: 'domcontentloaded' });
  const email = page.getByRole('textbox', { name: 'Email', exact: true });
  await expect(email).toBeVisible();
  await email.fill('synthetic@example.test');
  await page.getByLabel('Mật khẩu', { exact: true }).fill('Synthetic123!');
  const reveal = page.getByRole('button', { name: 'Hiện mật khẩu', exact: true });
  await reveal.focus(); await page.keyboard.press('Enter');
  await expect(page.getByLabel('Mật khẩu', { exact: true })).toHaveAttribute('type', 'text');
  await expect(page.getByRole('button', { name: 'Ẩn mật khẩu', exact: true })).toHaveAttribute('aria-pressed', 'true');
  const register = page.getByRole('button', { name: 'Đăng ký miễn phí', exact: true });
  await register.focus(); await page.keyboard.press('Enter');
  await expect(page.getByLabel('Họ và tên', { exact: true })).toBeVisible();
  await expect(page.getByLabel('Số điện thoại', { exact: true })).toBeVisible();
  await expect(page.getByLabel('Nhập lại mật khẩu', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Đăng nhập ngay', exact: true }).click();
  await expect(page.getByLabel('Họ và tên', { exact: true })).toHaveCount(0);
});

test('catalog and product fit the viewport with reachable purchase controls', async ({ page }, testInfo) => {
  const pageErrors: string[] = [];
  page.on('pageerror', error => pageErrors.push(error.message));
  for (const url of ['/', '/product/50101']) {
    await page.goto(url, { waitUntil: 'domcontentloaded' });
    if (url === '/') await expect(page.locator('a[href="/product/50101"]').first()).toBeVisible();
    else {
      await expect(page.getByRole('heading', { name: 'QA Cotton Shirt', exact: true })).toBeVisible();
      const buy = page.getByRole('button', { name: /Thêm vào giỏ/i });
      await buy.scrollIntoViewIfNeeded(); await expect(buy).toBeVisible(); await expect(buy).toBeEnabled();
    }
    const dimensions = await page.evaluate(() => ({ viewport: document.documentElement.clientWidth, content: document.documentElement.scrollWidth }));
    await testInfo.attach(`layout-${url === '/' ? 'home' : 'product'}`, { body: JSON.stringify(dimensions), contentType: 'application/json' });
    await page.screenshot({ path: testInfo.outputPath(`${url === '/' ? 'home' : 'product'}.png`), fullPage: true });
    expect(dimensions.content, `${url} should not require horizontal document scrolling`).toBeLessThanOrEqual(dimensions.viewport + 1);
  }
  expect(pageErrors).toEqual([]);
});
