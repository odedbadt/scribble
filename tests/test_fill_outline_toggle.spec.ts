import { test, expect, Page } from '@playwright/test';

// Helper to set fill/outline mode
async function setFillOutlineMode(page: Page, mode: 0 | 1 | 2) {
    await page.evaluate((mode) => {
        (window as any).app.settings.set('fill_outline', mode);
    }, mode);
}

// Helper to select a tool
async function selectTool(page: Page, tool: string) {
    await page.evaluate((tool) => {
        (window as any).app.select_tool(tool);
    }, tool);
}

// Helper to get pixel RGBA from active drawing layer
async function getActiveLayerPixel(page: Page, docX: number, docY: number) {
    return page.evaluate(({ x, y }) => {
        const layers = (window as any).app.layer_stack.layers.peek();
        const layer = layers[1];
        if (!layer) return null;
        const d = layer.context.getImageData(x, y, 1, 1).data;
        return { r: d[0], g: d[1], b: d[2], a: d[3] };
    }, { x: docX, y: docY });
}

test.describe('Fill/Outline Toggle', () => {
    const tools = [
        { name: 'rect', center: true },
        { name: 'circle', center: true },
        { name: 'heart', center: true },
        { name: 'polygon', center: false },
        { name: 'bezier', center: false },
    ];
    const modes = [
        { mode: 0, desc: 'Both' },
        { mode: 1, desc: 'FillOnly' },
        { mode: 2, desc: 'OutlineOnly' },
    ];

    for (const tool of tools) {
        for (const { mode, desc } of modes) {
            test(`${tool.name} tool - ${desc}`, async ({ page }) => {
                await page.goto('/');
                await page.waitForFunction(() => typeof (window as any).app?.select_tool === 'function');
                await setFillOutlineMode(page, mode);
                await selectTool(page, tool.name);
                const canvas = page.locator('#view-canvas');
                const box = await canvas.boundingBox();
                const docW = Math.floor(box.width);
                const docH = Math.floor(box.height);
                const pageCx = box.x + docW / 2;
                const pageCy = box.y + docH / 2;
                // Draw shape
                if (tool.center) {
                    await page.mouse.move(pageCx - 30, pageCy - 30);
                    await page.mouse.down();
                    await page.mouse.move(pageCx + 30, pageCy + 30);
                    await page.mouse.up();
                } else {
                    // For polygon and bezier, click several points
                    await page.mouse.move(pageCx - 20, pageCy);
                    await page.mouse.down(); await page.mouse.up();
                    await page.mouse.move(pageCx, pageCy - 20);
                    await page.mouse.down(); await page.mouse.up();
                    await page.mouse.move(pageCx + 20, pageCy);
                    await page.mouse.down(); await page.mouse.up();
                    // Double-click to close
                    await page.mouse.move(pageCx - 20, pageCy);
                    await page.mouse.down(); await page.mouse.up();
                }
                // Wait for rendering
                await page.waitForTimeout(200);
                // Sample center pixel
                const px = await getActiveLayerPixel(page, Math.floor(docW / 2), Math.floor(docH / 2));
                // Sample edge pixel
                const edgePx = await getActiveLayerPixel(page, Math.floor(docW / 2) - 28, Math.floor(docH / 2) - 28);
                // Check rendering according to mode
                if (mode === 0) {
                    // Both: center and edge should be non-transparent
                    expect(px.a).toBeGreaterThan(0);
                    expect(edgePx.a).toBeGreaterThan(0);
                } else if (mode === 1) {
                    // FillOnly: center non-transparent, edge transparent
                    expect(px.a).toBeGreaterThan(0);
                    expect(edgePx.a).toBeLessThan(10);
                } else if (mode === 2) {
                    // OutlineOnly: center transparent, edge non-transparent
                    expect(px.a).toBeLessThan(10);
                    expect(edgePx.a).toBeGreaterThan(0);
                }
            });
        }
    }
});
