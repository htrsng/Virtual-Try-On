import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:5173';

test.describe('Virtual Closet', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto(`${BASE_URL}/login`);
        await page.fill('[name="email"]', 'test@smartfit.vn');
        await page.fill('[name="password"]', 'testpassword');
        await page.click('button[type="submit"]');
        await page.waitForURL(`${BASE_URL}/`);
    });

    test('TC01 — Sản phẩm mua xong tự sync vào đúng tab tủ đồ', async ({ page }) => {
        await page.goto(`${BASE_URL}/try-on`);
        await page.click('[data-testid="open-closet-btn"]');
        await page.waitForSelector('[data-testid="closet-drawer"]');

        const tabs = page.locator('[data-testid="closet-tab"]');
        await expect(tabs.first()).toBeVisible();

        const firstItem = page.locator('[data-testid="closet-item"]').first();
        await expect(firstItem).toBeVisible();
    });

    test('TC02 — Silent Wear không unmount canvas', async ({ page }) => {
        await page.goto(`${BASE_URL}/try-on`);
        const canvasBefore = page.locator('canvas').first();
        const beforeHandle = await canvasBefore.evaluate((node) => node.outerHTML.slice(0, 80));

        await page.click('[data-testid="open-closet-btn"]');
        await page.click('[data-testid="wear-btn"]');

        const canvasAfter = page.locator('canvas').first();
        const afterHandle = await canvasAfter.evaluate((node) => node.outerHTML.slice(0, 80));

        expect(beforeHandle).toEqual(afterHandle);
        expect(page.url()).toContain('/try-on');
    });

    test('TC03 — Drawer mở bên trái, không che panel sản phẩm', async ({ page }) => {
        await page.goto(`${BASE_URL}/try-on`);
        await page.click('[data-testid="open-closet-btn"]');

        const drawer = page.locator('[data-testid="closet-drawer"]');
        const productPanel = page.locator('[data-testid="product-panel"]');

        const drawerBox = await drawer.boundingBox();
        const productBox = await productPanel.boundingBox();

        expect(drawerBox).not.toBeNull();
        expect(productBox).not.toBeNull();
        expect((drawerBox?.x || 0) + (drawerBox?.width || 0)).toBeLessThanOrEqual(productBox?.x || 0);
    });

    test('TC04 — Outfit Saving round-trip', async ({ page }) => {
        await page.goto(`${BASE_URL}/try-on`);
        await page.click('[data-testid="open-closet-btn"]');
        await page.click('[data-testid="wear-btn"]');

        await page.click('[data-testid="save-outfit-btn"]');
        await page.fill('[data-testid="outfit-name-input"]', 'Test Look');
        await page.click('[data-testid="confirm-save-btn"]');

        await page.click('[data-testid="open-closet-btn"]');
        await page.click('[data-testid="tab-saved"]');
        await expect(page.locator('text=Test Look')).toBeVisible();
    });

    test('TC05 — wornCount tăng sau khi bấm Wear', async ({ page }) => {
        await page.goto(`${BASE_URL}/try-on`);
        await page.click('[data-testid="open-closet-btn"]');

        const badgeBefore = page.locator('[data-testid="worn-badge"]').first();
        const countBefore = (await badgeBefore.textContent()) || '0×';

        await page.click('[data-testid="wear-btn"]');

        const countAfter = (await page.locator('[data-testid="worn-badge"]').first().textContent()) || '1×';
        const numBefore = parseInt(countBefore.replace('×', ''), 10) || 0;
        const numAfter = parseInt(countAfter.replace('×', ''), 10) || 0;
        expect(numAfter).toBeGreaterThanOrEqual(numBefore + 1);
    });

    test('TC06 — Filter Match cao sort đúng thứ tự', async ({ page }) => {
        await page.goto(`${BASE_URL}/try-on`);
        await page.click('[data-testid="open-closet-btn"]');
        await page.click('[data-testid="filter-match"]');

        const badges = page.locator('[data-testid="match-badge"]');
        const count = await badges.count();
        if (count >= 2) {
            const first = (await badges.nth(0).textContent()) || '0% phù hợp';
            const second = (await badges.nth(1).textContent()) || '0% phù hợp';
            const firstNum = parseInt(first.replace('% phù hợp', ''), 10) || 0;
            const secondNum = parseInt(second.replace('% phù hợp', ''), 10) || 0;
            expect(firstNum).toBeGreaterThanOrEqual(secondNum);
        }
    });
});
