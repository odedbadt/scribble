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

// App starts with:
//   layer 0 — white, locked (permanent base)
//   layer 1 — blank, unlocked, active (drawing layer)

test.describe('Scraper tool', () => {

    test('alt mode peels topmost layer, reveals layer below (not checkers)', async ({ page }) => {
        await waitForApp(page);
        // Layer 1 is already the active drawing layer — no add_layer() needed.
        await page.evaluate(() => (window as any).app.select_tool('scribble'));

        const canvas = page.locator('#view-canvas');
        const box = (await canvas.boundingBox())!;
        const drawOffX = Math.floor(box.width / 2);
        const drawOffY = Math.floor(box.height / 2);
        const pageCx = box.x + drawOffX;
        const pageCy = box.y + drawOffY;

        // Draw a short horizontal red stroke on layer 1.
        await page.mouse.move(pageCx - 30, pageCy);
        await page.mouse.down();
        await page.mouse.move(pageCx + 30, pageCy);
        await page.mouse.up();

        const beforeCenter = await getLayerPixel(page, 1, drawOffX, drawOffY);
        expect(beforeCenter?.r, 'layer 1 should be red at centre before scraping').toBeGreaterThan(150);
        expect(beforeCenter?.a, 'layer 1 should be opaque at centre before scraping').toBe(255);

        // Alt-scrape over the same stroke.
        await page.evaluate(() => (window as any).app.select_tool('scraper'));
        await page.keyboard.down('Alt');
        await page.mouse.move(pageCx - 30, pageCy);
        await page.mouse.down();
        await page.mouse.move(pageCx + 30, pageCy);
        await page.mouse.up();
        await page.keyboard.up('Alt');

        // Layer 1: red stroke must now be transparent.
        const layer1 = await getLayerPixel(page, 1, drawOffX, drawOffY);
        expect(layer1?.a, 'layer 1 pixel must be transparent after alt-scrape').toBe(0);

        // Layer 0: white base must be untouched (it is locked).
        const layer0 = await getLayerPixel(page, 0, drawOffX, drawOffY);
        expect(layer0, 'layer 0 (white bg) must still be white — locked, scraper must not touch it').toEqual(
            { r: 255, g: 255, b: 255, a: 255 },
        );
    });

    test('alt mode with drag-start off stroke: locked base stays white, drawing layer erased at intersection', async ({ page }) => {
        // Red vertical stroke on layer 1. Scraper starts 60px LEFT (blank area).
        // At drag_start: layer 1 is transparent, layer 0 is locked → nothing to erase there.
        // As brush crosses the red stroke: layer 1 is topmost+unlocked → erased.
        // Layer 0 stays white everywhere (locked).
        await waitForApp(page);
        await page.evaluate(() => (window as any).app.select_tool('scribble'));

        const canvas = page.locator('#view-canvas');
        const box = (await canvas.boundingBox())!;
        const cx = box.x + Math.floor(box.width / 2);
        const cy = box.y + Math.floor(box.height / 2);
        const docCx = Math.floor(box.width / 2);
        const docCy = Math.floor(box.height / 2);

        // Draw a vertical red stroke on layer 1.
        await page.mouse.move(cx, cy - 50);
        await page.mouse.down();
        await page.mouse.move(cx, cy + 50);
        await page.mouse.up();

        const before = await getLayerPixel(page, 1, docCx, docCy);
        expect(before?.r, 'layer 1 must be red at stroke centre').toBeGreaterThan(150);
        expect(before?.a, 'layer 1 must be opaque at stroke centre').toBe(255);

        // Alt-scrape with two moves to generate overlapping segments (regression for double-erase).
        await page.evaluate(() => (window as any).app.select_tool('scraper'));
        await page.keyboard.down('Alt');
        await page.mouse.move(cx - 60, cy);
        await page.mouse.down();
        await page.mouse.move(cx - 10, cy);
        await page.mouse.move(cx + 60, cy);
        await page.mouse.up();
        await page.keyboard.up('Alt');

        // Drag_start area (60px left): layer 1 was blank → nothing erased. Layer 0 still white.
        const layer0_at_start = await getLayerPixel(page, 0, docCx - 60, docCy);
        expect(layer0_at_start, 'layer 0 must still be white at drag-start (locked)').toEqual(
            { r: 255, g: 255, b: 255, a: 255 },
        );
        const layer1_at_start = await getLayerPixel(page, 1, docCx - 60, docCy);
        expect(layer1_at_start?.a, 'layer 1 must still be transparent at drag-start (was blank)').toBe(0);

        // Intersection: layer 1 (red) was topmost+unlocked → erased.
        const layer1_at_center = await getLayerPixel(page, 1, docCx, docCy);
        expect(layer1_at_center?.a, 'layer 1 must be transparent at intersection — erased').toBe(0);

        // Layer 0 at intersection: locked, must remain white.
        const layer0_at_center = await getLayerPixel(page, 0, docCx, docCy);
        expect(layer0_at_center, 'layer 0 must still be white at intersection (locked)').toEqual(
            { r: 255, g: 255, b: 255, a: 255 },
        );

        // Double-erase regression: overlap zone (docCx-5). Layer 1 erased first visit;
        // second visit must NOT descend to layer 0 (which is locked anyway, but the visited
        // bitmap provides an extra guarantee).
        const layer0_at_overlap = await getLayerPixel(page, 0, docCx - 5, docCy);
        expect(layer0_at_overlap, 'layer 0 must be white in overlap zone (double-erase regression)').toEqual(
            { r: 255, g: 255, b: 255, a: 255 },
        );

        await page.screenshot({ path: 'dbg/scraper_off_stroke_test.png' });
    });

    test('alt mode on blank drawing layer with locked base does nothing', async ({ page }) => {
        // Layer 0: white, locked. Layer 1: blank, active.
        // Alt-scraping over a blank area should not modify anything — no unlocked layer has paint.
        await waitForApp(page);
        await page.evaluate(() => (window as any).app.select_tool('scraper'));

        const canvas = page.locator('#view-canvas');
        const box = (await canvas.boundingBox())!;
        const cx = box.x + Math.floor(box.width / 2);
        const cy = box.y + Math.floor(box.height / 2);
        const docCx = Math.floor(box.width / 2);
        const docCy = Math.floor(box.height / 2);

        // Verify state before.
        const before0 = await getLayerPixel(page, 0, docCx, docCy);
        expect(before0, 'layer 0 must be white before').toEqual({ r: 255, g: 255, b: 255, a: 255 });
        const before1 = await getLayerPixel(page, 1, docCx, docCy);
        expect(before1?.a, 'layer 1 must be transparent before').toBe(0);

        // Alt-scrape.
        await page.keyboard.down('Alt');
        await page.mouse.move(cx - 30, cy);
        await page.mouse.down();
        await page.mouse.move(cx + 30, cy);
        await page.mouse.up();
        await page.keyboard.up('Alt');

        // Nothing should have changed.
        const after0 = await getLayerPixel(page, 0, docCx, docCy);
        expect(after0, 'layer 0 must still be white — locked').toEqual({ r: 255, g: 255, b: 255, a: 255 });
        const after1 = await getLayerPixel(page, 1, docCx, docCy);
        expect(after1?.a, 'layer 1 must still be transparent — was blank').toBe(0);
    });

    test('simple mode (no alt) erases only the active layer', async ({ page }) => {
        await waitForApp(page);
        // Layer 1 is already the active drawing layer.
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

        // Scrape without Alt — erases active layer (1).
        await page.evaluate(() => (window as any).app.select_tool('scraper'));
        await page.mouse.move(pageCx - 30, pageCy);
        await page.mouse.down();
        await page.mouse.move(pageCx + 30, pageCy);
        await page.mouse.up();

        const layer1 = await getLayerPixel(page, 1, drawOffX, drawOffY);
        expect(layer1?.a, 'layer 1 must be transparent after simple scrape').toBe(0);

        const layer0 = await getLayerPixel(page, 0, drawOffX, drawOffY);
        expect(layer0, 'layer 0 must still be white — not touched by simple scrape').toEqual(
            { r: 255, g: 255, b: 255, a: 255 },
        );
    });
});

test.describe('Layer lock', () => {
    test('locked active layer cannot be drawn on (scribble tool)', async ({ page }) => {
        await waitForApp(page);
        // Lock layer 1 (the active drawing layer).
        await page.evaluate(() => (window as any).app.layer_stack.set_locked(1, true));
        await page.evaluate(() => (window as any).app.select_tool('scribble'));

        const canvas = page.locator('#view-canvas');
        const box = (await canvas.boundingBox())!;
        const docCx = Math.floor(box.width / 2);
        const docCy = Math.floor(box.height / 2);
        const pageCx = box.x + docCx;
        const pageCy = box.y + docCy;

        // Try to draw — must be blocked.
        await page.mouse.move(pageCx - 30, pageCy);
        await page.mouse.down();
        await page.mouse.move(pageCx + 30, pageCy);
        await page.mouse.up();

        const pixel = await getLayerPixel(page, 1, docCx, docCy);
        expect(pixel?.a, 'locked layer 1 must remain transparent — draw must be blocked').toBe(0);
    });

    test('scraper alt mode skips locked layers', async ({ page }) => {
        // Layer 0: white, locked. Layer 1: red stroke, then locked. → alt-scrape finds nothing to erase.
        await waitForApp(page);
        await page.evaluate(() => (window as any).app.select_tool('scribble'));

        const canvas = page.locator('#view-canvas');
        const box = (await canvas.boundingBox())!;
        const docCx = Math.floor(box.width / 2);
        const docCy = Math.floor(box.height / 2);
        const pageCx = box.x + docCx;
        const pageCy = box.y + docCy;

        // Draw red on layer 1.
        await page.mouse.move(pageCx - 30, pageCy);
        await page.mouse.down();
        await page.mouse.move(pageCx + 30, pageCy);
        await page.mouse.up();

        // Now lock layer 1 too — all layers locked.
        await page.evaluate(() => (window as any).app.layer_stack.set_locked(1, true));

        // Alt-scrape over layer 1's red stroke — must skip it (locked).
        await page.evaluate(() => (window as any).app.select_tool('scraper'));
        await page.keyboard.down('Alt');
        await page.mouse.move(pageCx - 30, pageCy);
        await page.mouse.down();
        await page.mouse.move(pageCx + 30, pageCy);
        await page.mouse.up();
        await page.keyboard.up('Alt');

        // Layer 1: still red — locked, skipped.
        const layer1 = await getLayerPixel(page, 1, docCx, docCy);
        expect(layer1?.r, 'layer 1 must still be red — locked, scraper must skip it').toBeGreaterThan(150);
        expect(layer1?.a, 'layer 1 must still be opaque').toBe(255);

        // Layer 0: still white — also locked.
        const layer0 = await getLayerPixel(page, 0, docCx, docCy);
        expect(layer0, 'layer 0 must still be white — also locked').toEqual(
            { r: 255, g: 255, b: 255, a: 255 },
        );
    });

    test('scraper simple mode does not erase a locked active layer', async ({ page }) => {
        await waitForApp(page);
        await page.evaluate(() => (window as any).app.select_tool('scribble'));

        const canvas = page.locator('#view-canvas');
        const box = (await canvas.boundingBox())!;
        const docCx = Math.floor(box.width / 2);
        const docCy = Math.floor(box.height / 2);
        const pageCx = box.x + docCx;
        const pageCy = box.y + docCy;

        // Draw red on layer 1.
        await page.mouse.move(pageCx - 30, pageCy);
        await page.mouse.down();
        await page.mouse.move(pageCx + 30, pageCy);
        await page.mouse.up();

        const before = await getLayerPixel(page, 1, docCx, docCy);
        expect(before?.r, 'layer 1 must be red before scrape').toBeGreaterThan(150);

        // Lock layer 1, then try to scrape (simple mode).
        await page.evaluate(() => (window as any).app.layer_stack.set_locked(1, true));
        await page.evaluate(() => (window as any).app.select_tool('scraper'));
        await page.mouse.move(pageCx - 30, pageCy);
        await page.mouse.down();
        await page.mouse.move(pageCx + 30, pageCy);
        await page.mouse.up();

        const after = await getLayerPixel(page, 1, docCx, docCy);
        expect(after?.r, 'layer 1 must still be red — locked, simple scrape must be blocked').toBeGreaterThan(150);
        expect(after?.a, 'layer 1 must still be opaque').toBe(255);
    });
});
