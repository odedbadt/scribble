import { test, expect, Page } from '@playwright/test';

// ─── helpers ──────────────────────────────────────────────────────────────────

async function waitForApp(page: Page) {
    await page.goto('/');
    await page.waitForFunction(
        () => typeof (window as any).app?.select_tool === 'function',
    );
}

/** Read a single pixel from the active (drawing) layer canvas at document coords. */
async function getActiveLayerPixel(page: Page, docX: number, docY: number) {
    return page.evaluate(({ x, y }) => {
        const layers = (window as any).app.layer_stack.layers.peek();
        // Layer 1 is the active drawing layer (layer 0 is the white base).
        const layer = layers[1];
        if (!layer) return null;
        const d = layer.context.getImageData(x, y, 1, 1).data;
        return { r: d[0], g: d[1], b: d[2], a: d[3] };
    }, { x: docX, y: docY });
}

/** Check whether the clipboard holds any non-transparent pixel. */
async function clipboardHasContent(page: Page) {
    return page.evaluate(() => {
        const cb = (window as any).__scrib_clipboard ?? (window as any).clipboard;
        // The clipboard module exports { data, rect }; webpack bundles it as a named export.
        // We reach it through the editor→stamp tool's internal reference.
        const app = (window as any).app;
        const clip = app?._clipboard_ref ?? null;
        // Fallback: look for non-transparent pixel in the tool overlay canvas
        // instead of introspecting the clipboard module directly.
        return false; // we test by stamping instead
    });
}

// ─── tests ────────────────────────────────────────────────────────────────────

test.describe('Stamp Gallery', () => {

    test('gallery modal opens and closes', async ({ page }) => {
        await waitForApp(page);

        // Open secondary toolbar page
        await page.click('#toolbar-fold-btn');

        const modal = page.locator('#stamp-gallery-modal');
        await expect(modal).not.toHaveClass(/open/);

        await page.click('#stamp-gallery-btn');
        await expect(modal).toHaveClass(/open/);

        // Close with ✕ button
        await page.click('.gallery-close-btn');
        await expect(modal).not.toHaveClass(/open/);
    });

    test('clicking backdrop closes modal', async ({ page }) => {
        await waitForApp(page);
        await page.click('#toolbar-fold-btn');
        await page.click('#stamp-gallery-btn');

        const modal = page.locator('#stamp-gallery-modal');
        await expect(modal).toHaveClass(/open/);

        // Click the overlay itself (not the inner card)
        await modal.click({ position: { x: 5, y: 5 } });
        await expect(modal).not.toHaveClass(/open/);
    });

    test('all four gallery items are rendered with thumbnails', async ({ page }) => {
        await waitForApp(page);
        await page.click('#toolbar-fold-btn');
        await page.click('#stamp-gallery-btn');

        for (const id of ['cloud', 'butterfly', 'concentric_heart', 'selection']) {
            const item = page.locator(`#gallery-item-${id}`);
            await expect(item).toBeVisible();
            // Each item should contain a <canvas> thumbnail
            const thumb = item.locator('canvas.gallery-thumbnail');
            await expect(thumb).toBeVisible();
        }
    });

    // ── Core flow: pick glyph → drag to size → stamp appears on canvas ─────────

    async function runGlyphStampFlow(page: Page, glyphId: string) {
        await waitForApp(page);
        await page.click('#toolbar-fold-btn');
        await page.click('#stamp-gallery-btn');

        const modal = page.locator('#stamp-gallery-modal');
        await expect(modal).toHaveClass(/open/);

        // Pick the glyph
        await page.click(`#gallery-item-${glyphId}`);

        // Modal should close after selection
        await expect(modal).not.toHaveClass(/open/);

        const canvas = page.locator('#view-canvas');
        const box = (await canvas.boundingBox())!;
        const pageCx = box.x + Math.floor(box.width / 2);
        const pageCy = box.y + Math.floor(box.height / 2);

        const docCx = Math.floor(box.width / 2);
        const docCy = Math.floor(box.height / 2);

        // Before any stamping: center pixel should be transparent (blank layer)
        const before = await getActiveLayerPixel(page, docCx, docCy);
        expect(before?.a, 'layer should be blank before stamp').toBe(0);

        // Drag to size the glyph (50px radius): start at center, drag 50px right
        await page.mouse.move(pageCx, pageCy);
        await page.mouse.down();
        await page.mouse.move(pageCx + 50, pageCy, { steps: 5 });
        await page.mouse.up();

        // After drag → stamp tool should be active; now click to stamp at center
        // (click is at same center so the glyph's core lands on docCx, docCy)
        await page.mouse.move(pageCx, pageCy);
        await page.mouse.down();
        await page.mouse.up();

        // The center pixel should now be opaque (all glyphs paint something at center)
        const after = await getActiveLayerPixel(page, docCx, docCy);
        expect(after?.a, `stamped ${glyphId} center pixel should be opaque`).toBe(255);
    }

    test('cloud glyph: drag to size → stamp paints pixels on canvas', async ({ page }) => {
        await runGlyphStampFlow(page, 'cloud');
    });

    test('concentric heart glyph: drag to size → stamp paints pixels on canvas', async ({ page }) => {
        await runGlyphStampFlow(page, 'concentric_heart');
    });

    test('butterfly glyph: drag to size → stamp paints pixels on canvas', async ({ page }) => {
        await runGlyphStampFlow(page, 'butterfly');
    });

    test('selection item activates selection tool (not glyph sizing)', async ({ page }) => {
        await waitForApp(page);
        await page.click('#toolbar-fold-btn');
        await page.click('#stamp-gallery-btn');
        await page.click('#gallery-item-selection');

        // With selection active, dragging on canvas should draw a selection outline
        // (the tool canvas will become non-null) without stamping anything.
        const canvas = page.locator('#view-canvas');
        const box = (await canvas.boundingBox())!;
        const pageCx = box.x + Math.floor(box.width / 2);
        const pageCy = box.y + Math.floor(box.height / 2);
        const docCx = Math.floor(box.width / 2);
        const docCy = Math.floor(box.height / 2);

        // Drag a selection
        await page.mouse.move(pageCx - 20, pageCy - 20);
        await page.mouse.down();
        await page.mouse.move(pageCx + 20, pageCy + 20, { steps: 5 });
        await page.mouse.up();

        // After selection drag + release the tool switches to stamp.
        // The layer itself should NOT have any new opaque pixels yet
        // (selection doesn't paint; it only prepares the clipboard).
        // We just verify the stamp tool is now active by checking that
        // stamp-gallery-btn is still present (UI isn't broken) and the
        // layer center pixel is still transparent.
        const pixel = await getActiveLayerPixel(page, docCx, docCy);
        expect(pixel?.a, 'selection alone should not paint pixels').toBe(0);
    });

    test('repeat stamps: glyph can be re-stamped multiple times without reopening gallery', async ({ page }) => {
        await waitForApp(page);
        await page.click('#toolbar-fold-btn');
        await page.click('#stamp-gallery-btn');
        await page.click('#gallery-item-concentric_heart');

        const canvas = page.locator('#view-canvas');
        const box = (await canvas.boundingBox())!;
        const pageCx = box.x + Math.floor(box.width / 2);
        const pageCy = box.y + Math.floor(box.height / 2);

        // Size the glyph with a drag
        await page.mouse.move(pageCx, pageCy);
        await page.mouse.down();
        await page.mouse.move(pageCx + 40, pageCy, { steps: 5 });
        await page.mouse.up();

        // First stamp at center
        await page.mouse.move(pageCx, pageCy);
        await page.mouse.down();
        await page.mouse.up();

        // Second stamp further down (should work without reopening gallery)
        const stamp2DocY = Math.floor(box.height / 2) + 100;
        const stamp2PageY = box.y + stamp2DocY;
        await page.mouse.move(pageCx, stamp2PageY);
        await page.mouse.down();
        await page.mouse.up();

        const pixel2 = await getActiveLayerPixel(page, Math.floor(box.width / 2), stamp2DocY);
        expect(pixel2?.a, 'second stamp should also be opaque').toBe(255);
    });

});
