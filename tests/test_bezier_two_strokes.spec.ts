import { test, expect, Page } from '@playwright/test';

async function getActiveLayerPixel(page: Page, docX: number, docY: number) {
    return page.evaluate(({ x, y }) => {
        const layers = (window as any).app.layer_stack.layers.peek();
        const layer = layers[1];
        if (!layer) return null;
        const d = layer.context.getImageData(x, y, 1, 1).data;
        return { r: d[0], g: d[1], b: d[2], a: d[3] };
    }, { x: docX, y: docY });
}

async function drawSingleBezier(
    page: Page,
    x0: number, y0: number,
    x3: number, y3: number,
    cp1x: number, cp1y: number,
    cp2x: number, cp2y: number,
) {
    await page.mouse.move(x0, y0);
    await page.mouse.down();
    await page.mouse.move(x3, y3);
    await page.mouse.up();

    await page.mouse.move(cp1x, cp1y);
    await page.mouse.down();
    await page.mouse.up();

    await page.mouse.move(cp2x, cp2y);
    await page.mouse.down();
    await page.mouse.up();
}

test.describe('BezierTool two strokes', () => {
    test('second bezier does not flood-fill the entire canvas', async ({ page }) => {
        await page.goto('/');
        await page.waitForFunction(() => typeof (window as any).app?.select_tool === 'function');

        await page.evaluate(() => {
            (window as any).app.select_tool('bezier');
            // mode 0 = both fill + outline (triggers the flood-fill-before-outline bug)
            (window as any).app.settings.set('fill_outline', 0);
            (window as any).app.settings.set('bezier_closed', false);
        });

        const canvas = page.locator('#view-canvas');
        const box = await canvas.boundingBox();
        const docW = Math.floor(box!.width);
        const docH = Math.floor(box!.height);

        // Both beziers are small arches near the vertical center of the canvas.
        // The top-left corner (10,10) is far from both and must stay transparent.
        const cornerX = 10;
        const cornerY = 10;

        const cornerBefore = await getActiveLayerPixel(page, cornerX, cornerY);
        expect(cornerBefore!.a, 'corner should start transparent').toBe(0);

        const mid = box!.y + docH / 2;

        // First bezier: left quarter
        const l1 = box!.x + docW / 4 - 30;
        const r1 = box!.x + docW / 4 + 30;
        await drawSingleBezier(page, l1, mid, r1, mid, l1 + 20, mid - 20, r1 - 20, mid - 20);
        await page.waitForTimeout(100);

        // Second bezier: right quarter — far from the corner
        const l2 = box!.x + (docW * 3) / 4 - 30;
        const r2 = box!.x + (docW * 3) / 4 + 30;
        await drawSingleBezier(page, l2, mid, r2, mid, l2 + 20, mid - 20, r2 - 20, mid - 20);
        await page.waitForTimeout(100);

        // The bug: flood_fill_transparent runs on a blank imageData (no outline yet),
        // so it fills the entire canvas with fill_color (white).
        // tool_to_document then overwrites ALL document pixels, nuking the corner
        // transparency and the first bezier.
        const cornerAfter = await getActiveLayerPixel(page, cornerX, cornerY);
        expect(cornerAfter!.a, 'top-left corner must remain transparent after second bezier commit').toBe(0);
    });
});

