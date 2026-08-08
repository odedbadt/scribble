import { test, expect } from '@playwright/test';

test('appearance on load', async ({ page }) => {
    await page.goto('/');
    await page.waitForFunction(
        () => typeof (window as any).app?.select_tool === 'function',
    );
    // Disable CSS transitions/animations for stable golden comparison
    await page.addStyleTag({ content: '*, *::before, *::after { transition: none !important; animation: none !important; }' });
    // Give canvas a moment to render
    await page.waitForTimeout(500);
    await expect(page).toHaveScreenshot('appearance-on-load.png', { fullPage: true });
});
