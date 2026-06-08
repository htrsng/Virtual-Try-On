import { test, expect } from '@playwright/test';

test('Checkout Journey: Home -> Products -> Cart -> Checkout', async ({ page }) => {
  // 1. Visit Home
  await page.goto('/');
  await expect(page).toHaveTitle(/VFitAI/i);

  // 2. Go to products (Wait for network idle to ensure everything is loaded)
  await page.waitForLoadState('networkidle');

  // Try to find the "Sản phẩm" or "Shop" link
  const productsLink = page.getByRole('link', { name: /Sản phẩm|Shop/i }).first();
  
  if (await productsLink.isVisible()) {
    await productsLink.click();
    await page.waitForLoadState('networkidle');

    // 3. Add to cart
    const addToCartBtn = page.locator('button', { hasText: /Thêm vào giỏ|Mua ngay/i }).first();
    if (await addToCartBtn.isVisible()) {
      await addToCartBtn.click();
      
      // 4. Go to cart
      const cartIcon = page.locator('.cart-icon, [aria-label="Giỏ hàng"]').first();
      if (await cartIcon.isVisible()) {
        await cartIcon.click();
        await page.waitForLoadState('networkidle');
        
        // 5. Checkout
        const checkoutBtn = page.locator('button', { hasText: /Thanh toán/i }).first();
        if (await checkoutBtn.isVisible()) {
          await checkoutBtn.click();
          // Verify URL change
          await expect(page.url()).toMatch(/checkout|payment/i);
        }
      }
    }
  }
});
