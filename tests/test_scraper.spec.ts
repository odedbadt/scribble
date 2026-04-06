import { test, expect, Page } from '@playwright/test';

// Access the live layer pixel data directly from the layer canvas.
// doc_x / doc_y are document-space coordinates (= canvas offsetX/Y at default 1:1 zoom).
async function getLayerPixel(page: Page, layerIdx: number, docX: number, docY: number) {
    return page.evaluate(
        ({ li, x, y }) => {
            const layers = (window as any).app.layer_stack.layers.peek();
            if (!layers[li]) return null;
            const d = layers[li].context.getImageData(x, y, 1, 1).data;
            return { r: d[0], g: d[1], b: d[2], a: d[3] };
        },
        { li: layerIdx, x: docX, y: docY },
    );
}

async function waitForApp(page: Page) {
    await page.goto('/');
    // Wait until window.app is initialised and the editor is ready
    await page.waitForFunction(
        () => typeof (window as any).app?.select_tool === 'function',
    );
}

test.describe('Scraper tool', () => {
    // The app starts with one white layer (index 0).
    // Each test adds a second layer (index 1) and draws a red stroke on it,
    // then uses the scraper to erase it and verifies the pixel state.

    test('alt mode peels topmost layer, reveals layer below (not checkers)', async ({ page }) => {
        await waitForApp(page);

        // Add second layer (becomes active)
        await page.evaluate(() => (window as any).app.layer_stack.add_layer());
        await page.evaluate(() => (window as any).app.select_tool('scribble'));

        const canvas = page.locator('#view-canvas');
        const box = (await canvas.boundingBox())!;

        // Draw-point at the centre of the canvas
        const drawOffX = Math.floor(box.width / 2);
        const drawOffY = Math.floor(box.height / 2);
        const pageCx = box.x + drawOffX;
        const pageCy = box.y + drawOffY;

        // Draw a short horizontal stroke with the default red fore-colour
        await page.mouse.move(pageCx - 30, pageCy);
        await page.mouse.down();
        await page.mouse.move(pageCx + 30, pageCy);
        await page.mouse.up();

        // Confirm red was painted on layer 1 — check both the centre AND the scraper's
        // drag-start point (drawOffX - 30) so we know topmost_layer_in_radius has red to find.
        const beforeScrapeCenter = await getLayerPixel(page, 1, drawOffX, drawOffY);
        expect(beforeScrapeCenter?.r, 'layer 1 should be red at centre before scraping').toBeGreaterThan(150);
        expect(beforeScrapeCenter?.a, 'layer 1 should be opaque at centre before scraping').toBe(255);
        const beforeScrapeStart = await getLayerPixel(page, 1, drawOffX - 30, drawOffY);
        expect(beforeScrapeStart?.r, 'layer 1 should be red at drag-start before scraping').toBeGreaterThan(150);
        expect(beforeScrapeStart?.a, 'layer 1 should be opaque at drag-start before scraping').toBe(255);

        // Switch to scraper and alt-drag over the same stroke
        await page.evaluate(() => (window as any).app.select_tool('scraper'));
        await page.keyboard.down('Alt');
        await page.mouse.move(pageCx - 30, pageCy);
        await page.mouse.down();
        await page.mouse.move(pageCx + 30, pageCy);
        await page.mouse.up();
        await page.keyboard.up('Alt');

        // Layer 1: the red stroke must now be transparent
        const layer1 = await getLayerPixel(page, 1, drawOffX, drawOffY);
        expect(layer1?.a, 'layer 1 pixel must be transparent after alt-scrape').toBe(0);

        // Layer 0: the white background must be untouched — NOT scraped to checkers
        const layer0 = await getLayerPixel(page, 0, drawOffX, drawOffY);
        expect(layer0, 'layer 0 (white bg) must still be white — scraper must not punch through').toEqual(
            { r: 255, g: 255, b: 255, a: 255 },
        );
    });

    test('alt mode with drag-start off stroke: both layer 0 and layer 1 erased per-pixel topmost', async ({ page }) => {
        // Scenario: red stroke is vertical on layer 1; scraper starts 60px LEFT of the stroke.
        // At drag_start: only white (layer 0) is present → layer 0 is erased to transparent there.
        // As brush crosses the red stroke (layer 1 is topmost): layer 1 is erased at the intersection.
        // Per-pixel topmost: each pixel is independently targeted by its topmost layer.
        await waitForApp(page);

        await page.evaluate(() => (window as any).app.layer_stack.add_layer());
        await page.evaluate(() => (window as any).app.select_tool('scribble'));

        const canvas = page.locator('#view-canvas');
        const box = (await canvas.boundingBox())!;
        const cx = box.x + Math.floor(box.width / 2);
        const cy = box.y + Math.floor(box.height / 2);
        const docCx = Math.floor(box.width / 2);
        const docCy = Math.floor(box.height / 2);

        // Draw a vertical red stroke at x=cx (doc x = docCx).
        await page.mouse.move(cx, cy - 50);
        await page.mouse.down();
        await page.mouse.move(cx, cy + 50);
        await page.mouse.up();

        // Confirm centre of stroke is red on layer 1.
        const before = await getLayerPixel(page, 1, docCx, docCy);
        expect(before?.r, 'layer 1 must be red at stroke centre').toBeGreaterThan(150);
        expect(before?.a, 'layer 1 must be opaque at stroke centre').toBe(255);

        // Alt-scrape horizontally starting 60px left of the stroke.
        // Use two intermediate moves to simulate real browser mouse movement —
        // this generates multiple editing_drag calls with overlapping thick-line segments,
        // which is what causes the double-erase bug without the visited bitmap.
        await page.evaluate(() => (window as any).app.select_tool('scraper'));
        await page.keyboard.down('Alt');
        await page.mouse.move(cx - 60, cy);
        await page.mouse.down();
        await page.mouse.move(cx - 10, cy); // first drag: crosses into stroke
        await page.mouse.move(cx + 60, cy); // second drag: continues through
        await page.mouse.up();
        await page.keyboard.up('Alt');

        // At drag_start (60px left of stroke): layer 0 was topmost → erased to transparent.
        const layer0_at_start = await getLayerPixel(page, 0, docCx - 60, docCy);
        expect(layer0_at_start?.a, 'layer 0 must be transparent at drag-start — it was topmost there').toBe(0);

        // At the intersection (red stroke): layer 1 was topmost → layer 1 erased.
        const layer1_at_center = await getLayerPixel(page, 1, docCx, docCy);
        expect(layer1_at_center?.a, 'layer 1 must be transparent at intersection — it was topmost there').toBe(0);

        // Layer 0 at intersection center: still white — layer 1 was topmost there, not layer 0.
        const layer0_at_center = await getLayerPixel(page, 0, docCx, docCy);
        expect(layer0_at_center, 'layer 0 must still be white at intersection center').toEqual(
            { r: 255, g: 255, b: 255, a: 255 },
        );

        // KEY regression check: docCx-5 is on the red stroke AND in the overlap zone between
        // segment 1 (ending at cx-10, radius 5 → reaches docCx-5) and segment 2 (starting at
        // cx-10, radius 5 → also reaches docCx-5). Without the visited bitmap this pixel gets
        // processed twice: first erases layer 1 (red topmost), then layer 0 (now topmost) → checkers.
        const layer0_at_overlap = await getLayerPixel(page, 0, docCx - 5, docCy);
        expect(layer0_at_overlap, 'layer 0 must be white in overlap zone (double-erase regression)').toEqual(
            { r: 255, g: 255, b: 255, a: 255 },
        );

        await page.screenshot({ path: 'dbg/scraper_off_stroke_test.png' });
    });

    test('alt mode scrapes base layer (layer 0) to transparent when it is the only layer', async ({ page }) => {
        // Scenario: no extra layers — only the default white layer 0.
        // Alt-scraping directly on white should punch transparent holes (checkers).
        await waitForApp(page);

        // Do NOT add any extra layer — only layer 0 exists.
        await page.evaluate(() => (window as any).app.select_tool('scraper'));

        const canvas = page.locator('#view-canvas');
        const box = (await canvas.boundingBox())!;
        const cx = box.x + Math.floor(box.width / 2);
        const cy = box.y + Math.floor(box.height / 2);
        const docCx = Math.floor(box.width / 2);
        const docCy = Math.floor(box.height / 2);

        // Verify layer 0 is white before scraping.
        const before = await getLayerPixel(page, 0, docCx, docCy);
        expect(before, 'layer 0 must be white before scraping').toEqual({ r: 255, g: 255, b: 255, a: 255 });

        // Alt-scrape across the centre.
        await page.keyboard.down('Alt');
        await page.mouse.move(cx - 30, cy);
        await page.mouse.down();
        await page.mouse.move(cx + 30, cy);
        await page.mouse.up();
        await page.keyboard.up('Alt');

        // Layer 0 at centre: must now be transparent (checkers).
        const after = await getLayerPixel(page, 0, docCx, docCy);
        expect(after?.a, 'layer 0 must be transparent after alt-scrape (checkers)').toBe(0);
    });

    test('simple mode (no alt) erases only the active layer', async ({ page }) => {
        await waitForApp(page);

        await page.evaluate(() => (window as any).app.layer_stack.add_layer());
        await page.evaluate(() => (window as any).app.select_tool('scribble'));

        const canvas = page.locator('#view-canvas');
        const box = (await canvas.boundingBox())!;
        const drawOffX = Math.floor(box.width / 2);
        const drawOffY = Math.floor(box.height / 2);
        const pageCx = box.x + drawOffX;
        const pageCy = box.y + drawOffY;

        await page.mouse.move(pageCx - 30, pageCy);
        await page.mouse.down();
        await page.mouse.move(pageCx + 30, pageCy);
        await page.mouse.up();

        // Scrape without Alt — should erase the active layer (index 1)
        await page.evaluate(() => (window as any).app.select_tool('scraper'));
        await page.mouse.move(pageCx - 30, pageCy);
        await page.mouse.down();
        await page.mouse.move(pageCx + 30, pageCy);
        await page.mouse.up();

        // Layer 1: transparent
        const layer1 = await getLayerPixel(page, 1, drawOffX, drawOffY);
        expect(layer1?.a, 'layer 1 must be transparent after simple scrape').toBe(0);

        // Layer 0: white — simple mode must not touch other layers
        const layer0 = await getLayerPixel(page, 0, drawOffX, drawOffY);
        expect(layer0, 'layer 0 must still be white').toEqual({ r: 255, g: 255, b: 255, a: 255 });
    });
});
