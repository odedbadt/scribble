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

// Draw a cubic bezier in three clicks:
//   1. Drag from (x0,y0) to (x3,y3) — sets endpoints and auto-generates cp1/cp2
//   2. Click at cp1 position — overrides cp1
//   3. Click at cp2 position — overrides cp2 and triggers commit
async function drawSingleBezier(
    page: Page,
    x0: number, y0: number,
    x3: number, y3: number,
    cp1x: number, cp1y: number,
    cp2x: number, cp2y: number,
) {
    // Phase 1: drag endpoints
    await page.mouse.move(x0, y0);
    await page.mouse.down();
    await page.mouse.move(x3, y3);
    await page.mouse.up();

    // Phase 2: set cp1
    await page.mouse.move(cp1x, cp1y);
    await page.mouse.down();
    await page.mouse.up();

    // Phase 3: set cp2 → commits
    await page.mouse.move(cp2x, cp2y);
    await page.mouse.down();
    await page.mouse.up();
}

test.describe('BezierTool commit', () => {
    test('arching bezier in outline-only mode commits outline pixels to document', async ({ page }) => {
        await page.goto('/');
        await page.waitForFunction(() => typeof (window as any).app?.select_tool === 'function');

        await page.evaluate(() => {
            (window as any).app.select_tool('bezier');
            // outline-only mode (fill_outline = 2)
            (window as any).app.settings.set('fill_outline', 2);
            // BezierClosed = false (single-segment mode) — already default, but be explicit
            (window as any).app.settings.set('bezier_closed', false);
        });

        const canvas = page.locator('#view-canvas');
        const box = await canvas.boundingBox();
        const docW = Math.floor(box.width);
        const docH = Math.floor(box.height);

        // Endpoints: horizontal span of 100px at the vertical center
        const x0 = box.x + docW / 2 - 50;
        const y0 = box.y + docH / 2;
        const x3 = box.x + docW / 2 + 50;
        const y3 = box.y + docH / 2;

        // Control points: pushed 30px above the chord → the bezier arches upward.
        // The midpoint between p0 and p3 in document space is (docW/2, docH/2), which
        // lies *below* the arch and is therefore transparent.  That transparency causes
        // flood_fill_transparent([0,0,0,0]) to enter an infinite loop (the bug).
        const cp1x = box.x + docW / 2 - 17;
        const cp1y = box.y + docH / 2 - 30;
        const cp2x = box.x + docW / 2 + 17;
        const cp2y = box.y + docH / 2 - 30;

        await drawSingleBezier(page, x0, y0, x3, y3, cp1x, cp1y, cp2x, cp2y);

        await page.waitForTimeout(300);

        // The apex of the arch is near (docW/2, docH/2 - 22) in document coords.
        // After a correct commit, that pixel must be opaque (the bezier was drawn there).
        const archApex = await getActiveLayerPixel(page, Math.floor(docW / 2), Math.floor(docH / 2) - 22);
        expect(archApex!.a).toBeGreaterThan(0);

        // Background pixels below the arch should remain transparent.
        const background = await getActiveLayerPixel(page, Math.floor(docW / 2), Math.floor(docH / 2) + 20);
        expect(background!.a).toBe(0);
    });
});
