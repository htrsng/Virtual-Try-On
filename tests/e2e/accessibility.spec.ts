import AxeBuilder from '@axe-core/playwright';
import { test, expect } from '../fixtures';
import type { Page, TestInfo } from '@playwright/test';

async function audit(page: Page, testInfo: TestInfo) {
  // Audit settled UI, not a transient opacity frame during a finite entrance animation.
  await page.evaluate(async () => {
    const animations = document.getAnimations().filter(animation => {
      const timing = animation.effect?.getComputedTiming();
      return animation.playState === 'running' && timing && Number.isFinite(timing.endTime) && Number(timing.endTime) <= 5000;
    });
    await Promise.all(animations.map(animation => animation.finished.catch(() => undefined)));
  });
  const result = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze();
  await testInfo.attach('axe-results', { body: JSON.stringify(result), contentType: 'application/json' });
  expect(result.violations.map(v => ({ id: v.id, impact: v.impact, targets: v.nodes.map(n => n.target) }))).toEqual([]);
}

for (const route of ['/login', '/', '/product/50101']) {
  test(`WCAG automated audit including contrast: ${route}`, async ({ page }, testInfo) => {
    await page.goto(route, { waitUntil: 'domcontentloaded' });
    if (route === '/login') await expect(page.getByLabel('Mật khẩu', { exact: true })).toBeVisible();
    else await expect(page.locator('a[href="/product/50101"], button.size-btn').first()).toBeVisible();
    await audit(page, testInfo);
  });
}

test('authenticated cart and checkout pass the automated WCAG audit', async ({ page, request, qaData }, testInfo) => {
  const login = await request.post('/api/auth/login', { data: qaData.accounts.customer });
  expect(login.status()).toBe(200);
  const { token } = await login.json();
  await page.addInitScript(value => localStorage.setItem('token', value), token);
  await page.goto('/product/50101', { waitUntil: 'domcontentloaded' });
  await page.locator('button.size-btn').filter({ hasText: /^M$/ }).click();
  await page.getByRole('button', { name: /Thêm vào giỏ/i }).click();
  await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem('cartItems') || '[]').length)).toBe(1);
  await page.goto('/cart', { waitUntil: 'domcontentloaded' });
  await page.locator('label.cp-checkbox-label').filter({ hasText: 'Chọn tất cả' }).click();
  await page.screenshot({ path: testInfo.outputPath('cart-a11y.png') });
  await audit(page, testInfo);
  await page.getByRole('button', { name: /^(Tiến hành thanh toán|Thanh toán \(1\))$/ }).click();
  await expect(page).toHaveURL(/\/checkout\/cart$/);
  await expect(page.locator('.co-summary')).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath('checkout-a11y.png') });
  await audit(page, testInfo);
});

test('Tab order reaches login fields and a visible keyboard focus indicator', async ({ page }, testInfo) => {
  await page.goto('/login', { waitUntil: 'domcontentloaded' });
  const email = page.getByLabel('Email', { exact: true });
  await expect(email).toBeVisible();
  let steps = 0;
  for (; steps < 25; steps++) {
    await page.keyboard.press('Tab');
    if (await email.evaluate(element => element === document.activeElement)) break;
  }
  await expect(email).toBeFocused();
  const focus = await email.evaluate(element => ({ style: getComputedStyle(element).outlineStyle, width: getComputedStyle(element).outlineWidth }));
  await testInfo.attach('keyboard-focus', { body: JSON.stringify({ steps, focus }), contentType: 'application/json' });
  expect(focus.style).not.toBe('none'); expect(parseFloat(focus.width)).toBeGreaterThan(0);
  await page.keyboard.press('Tab');
  await expect(page.getByLabel('Mật khẩu', { exact: true })).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(page.getByRole('button', { name: 'Hiện mật khẩu', exact: true })).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.getByLabel('Mật khẩu', { exact: true })).toHaveAttribute('type', 'text');
});

test('support keyboard open, Escape close and focus return', async ({ page }) => {
  await page.goto('/login', { waitUntil: 'domcontentloaded' });
  const launcher = page.getByRole('button', { name: 'Mở hỗ trợ', exact: true });
  await launcher.focus(); await page.keyboard.press('Enter');
  await expect(page.getByRole('region', { name: 'Hỗ trợ VFitAI' })).toBeVisible();
  await expect(page.getByRole('textbox', { name: 'Tin nhắn hỗ trợ' })).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('region', { name: 'Hỗ trợ VFitAI' })).toHaveCount(0);
  await expect(launcher).toBeFocused();
});

test('login reflows at CSS zoom 200 percent with reachable keyboard controls', async ({ page }, testInfo) => {
  await page.goto('/login', { waitUntil: 'domcontentloaded' });
  await expect(page.getByLabel('Email', { exact: true })).toBeVisible();
  await page.evaluate(() => { document.documentElement.style.zoom = '2'; });
  const email = page.getByLabel('Email', { exact: true });
  await email.scrollIntoViewIfNeeded(); await email.fill('synthetic@example.test');
  await expect(email).toHaveValue('synthetic@example.test');
  const reveal = page.getByRole('button', { name: 'Hiện mật khẩu', exact: true });
  await reveal.focus(); await page.keyboard.press('Enter');
  await expect(page.getByLabel('Mật khẩu', { exact: true })).toHaveAttribute('type', 'text');
  const dimensions = await page.evaluate(() => ({ viewport: document.documentElement.clientWidth, content: document.documentElement.scrollWidth }));
  await testInfo.attach('css-zoom-200', { body: JSON.stringify({ ...dimensions, note: 'CSS zoom reflow check, not native-browser zoom or human assistive-technology sign-off' }), contentType: 'application/json' });
  expect(dimensions.content).toBeLessThanOrEqual(dimensions.viewport + 1);
});
