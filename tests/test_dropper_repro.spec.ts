import { test, expect, Page } from '@playwright/test';

async function getForeColor(page: Page) {
    return page.evaluate(() => (window as any).app.state.fore_color.peek());
}

async function setForeColor(page: Page, rgba: string) {
    await page.evaluate((c) => {
        (window as any).app.state.fore_color.value = c;
    }, rgba);
}

async function selectTool(page: Page, name: string) {
    await page.evaluate((n) => (window as any).app.select_tool(n), name);
}

test('dropper picks correctly across two reselects', async ({ page }) => {
    await page.goto('/');
    await page.waitForFunction(() => typeof (window as any).app?.select_tool === 'function');

    const canvas = page.locator('#view-canvas');
    const box = (await canvas.boundingBox())!;
    const cx = box.x + box.width / 2;
    const cy = box.y + box.height / 2;

    // 1. Scribble in red at (-50, 0) relative to centre
    await selectTool(page, 'scribble');
    await setForeColor(page, 'rgba(255,0,0,255)');
    await page.mouse.move(cx - 60, cy);
    await page.mouse.down();
    await page.mouse.move(cx - 40, cy);
    await page.mouse.up();
    await page.waitForTimeout(50);

    // 2. Scribble in purple at (+50, 0)
    await setForeColor(page, 'rgba(128,0,128,255)');
    await page.mouse.move(cx + 40, cy);
    await page.mouse.down();
    await page.mouse.move(cx + 60, cy);
    await page.mouse.up();
    await page.waitForTimeout(50);

    // 3. First dropper pick on red stroke
    await selectTool(page, 'dropper');
    await page.mouse.move(cx - 50, cy);
    await page.mouse.down();
    await page.mouse.up();
    await page.waitForTimeout(50);
    const after_red = await getForeColor(page);

    // 4. Re-select dropper, pick purple
    await selectTool(page, 'dropper');
    await page.mouse.move(cx + 50, cy);
    await page.mouse.down();
    await page.mouse.up();
    await page.waitForTimeout(50);
    const after_purple = await getForeColor(page);

    console.log('after_red:', after_red);
    console.log('after_purple:', after_purple);

    expect(after_red).toBe('rgba(255,0,0,255)');
    expect(after_purple).toBe('rgba(128,0,128,255)');
});
