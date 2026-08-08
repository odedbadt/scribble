import { test, expect, Page } from '@playwright/test';

// Helper to select the LineTool
async function selectLineTool(page: Page) {
    await page.evaluate(() => {
        (window as any).app.select_tool('line');
    });
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

test.describe('LineTool Artifacts', () => {
    test('should not leave leftover pixels after drag', async ({ page }) => {
        await page.goto('/');
        await page.waitForFunction(() => typeof (window as any).app?.select_tool === 'function');
        await selectLineTool(page);
        const canvas = page.locator('#view-canvas');
        const box = await canvas.boundingBox();
        const docW = Math.floor(box.width);
        const docH = Math.floor(box.height);
        const pageCx = box.x + docW / 2;
        const pageCy = box.y + docH / 2;
        // Simulate drag
        await page.mouse.move(pageCx - 40, pageCy);
        await page.mouse.down();
        await page.mouse.move(pageCx + 40, pageCy);
        await page.mouse.up();
        // Wait for rendering
        await page.waitForTimeout(200);
        // Scan the canvas for unexpected leftover pixels (artifacts)
        let foundArtifact = false;
        // Only scan a small region above and below the line to avoid timeouts
        for (let y = pageCy - 10; y < pageCy - 4; y++) {
            for (let x = pageCx - 40; x < pageCx + 40; x++) {
                const px = await getActiveLayerPixel(page, x, y);
                if (px && px.a > 0) {
                    foundArtifact = true;
                    break;
                }
            }
            if (foundArtifact) break;
        }
        for (let y = pageCy + 4; y < pageCy + 10; y++) {
            for (let x = pageCx - 40; x < pageCx + 40; x++) {
                const px = await getActiveLayerPixel(page, x, y);
                if (px && px.a > 0) {
                    foundArtifact = true;
                    break;
                }
            }
            if (foundArtifact) break;
        }
        expect(foundArtifact).toBeFalsy();
    });
});
