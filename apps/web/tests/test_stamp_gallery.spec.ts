import { test, expect, Page } from '@playwright/test';

// ─── helpers ──────────────────────────────────────────────────────────────────

async function waitForApp(page: Page) {
    await page.goto('/');
    await page.waitForFunction(
        () => typeof (window as any).app?.select_tool === 'function',
    );
}

async function openGallery(page: Page) {
    await page.click('#toolbar-fold-btn');
    await page.click('#stamp-gallery-btn');
    await expect(page.locator('#stamp-gallery-modal')).toHaveClass(/open/);
}

/** Read a single pixel from the active (drawing) layer canvas at document coords. */
async function getActiveLayerPixel(page: Page, docX: number, docY: number) {
    return page.evaluate(({ x, y }) => {
        const layers = (window as any).app.layer_stack.layers.peek();
        const layer = layers[1];
        if (!layer) return null;
        const d = layer.context.getImageData(x, y, 1, 1).data;
        return { r: d[0], g: d[1], b: d[2], a: d[3] };
    }, { x: docX, y: docY });
}

// ─── tests ────────────────────────────────────────────────────────────────────

test.describe('Stamp Gallery', () => {

    test('gallery modal opens and closes', async ({ page }) => {
        await waitForApp(page);
        await page.click('#toolbar-fold-btn');

        const modal = page.locator('#stamp-gallery-modal');
        await expect(modal).not.toHaveClass(/open/);

        await page.click('#stamp-gallery-btn');
        await expect(modal).toHaveClass(/open/);

        await page.click('.gallery-close-btn');
        await expect(modal).not.toHaveClass(/open/);
    });

    test('clicking backdrop closes modal', async ({ page }) => {
        await waitForApp(page);
        await openGallery(page);

        const modal = page.locator('#stamp-gallery-modal');
        await modal.click({ position: { x: 5, y: 5 } });
        await expect(modal).not.toHaveClass(/open/);
    });

    test('coded glyphs are rendered with thumbnails', async ({ page }) => {
        await waitForApp(page);
        await openGallery(page);

        // Cloud, Heart, Selection are always present (coded glyphs)
        for (const label of ['Cloud', 'Heart', 'Selection']) {
            const item = page.locator('.gallery-item', { hasText: label });
            await expect(item).toBeVisible();
            await expect(item.locator('canvas.gallery-thumbnail')).toBeVisible();
        }
    });

    // ── Core flow: pick glyph → drag to size → stamp appears on canvas ─────────

    async function runGlyphStampFlow(page: Page, labelText: string) {
        await waitForApp(page);
        await openGallery(page);

        const modal = page.locator('#stamp-gallery-modal');

        // Pick the glyph by label text
        await page.locator('.gallery-item', { hasText: labelText }).click();
        await expect(modal).not.toHaveClass(/open/);

        const canvas = page.locator('#view-canvas');
        const box = (await canvas.boundingBox())!;
        const pageCx = box.x + Math.floor(box.width / 2);
        const pageCy = box.y + Math.floor(box.height / 2);
        const docCx = Math.floor(box.width / 2);
        const docCy = Math.floor(box.height / 2);

        const before = await getActiveLayerPixel(page, docCx, docCy);
        expect(before?.a, 'layer should be blank before stamp').toBe(0);

        // Drag to size the glyph
        await page.mouse.move(pageCx, pageCy);
        await page.mouse.down();
        await page.mouse.move(pageCx + 50, pageCy, { steps: 5 });
        await page.mouse.up();

        // Stamp at center
        await page.mouse.move(pageCx, pageCy);
        await page.mouse.down();
        await page.mouse.up();

        const after = await getActiveLayerPixel(page, docCx, docCy);
        expect(after?.a, `stamped "${labelText}" center pixel should be opaque`).toBe(255);
    }

    test('cloud glyph: drag to size → stamp paints pixels on canvas', async ({ page }) => {
        await runGlyphStampFlow(page, 'Cloud');
    });

    test('concentric heart glyph: drag to size → stamp paints pixels on canvas', async ({ page }) => {
        await runGlyphStampFlow(page, 'Heart');
    });

    test('selection item activates selection tool (not glyph sizing)', async ({ page }) => {
        await waitForApp(page);
        await openGallery(page);
        await page.locator('.gallery-item', { hasText: 'Selection' }).click();

        const canvas = page.locator('#view-canvas');
        const box = (await canvas.boundingBox())!;
        const pageCx = box.x + Math.floor(box.width / 2);
        const pageCy = box.y + Math.floor(box.height / 2);
        const docCx = Math.floor(box.width / 2);
        const docCy = Math.floor(box.height / 2);

        await page.mouse.move(pageCx - 20, pageCy - 20);
        await page.mouse.down();
        await page.mouse.move(pageCx + 20, pageCy + 20, { steps: 5 });
        await page.mouse.up();

        const pixel = await getActiveLayerPixel(page, docCx, docCy);
        expect(pixel?.a, 'selection alone should not paint pixels').toBe(0);
    });

    test('repeat stamps: glyph can be re-stamped multiple times without reopening gallery', async ({ page }) => {
        await waitForApp(page);
        await openGallery(page);
        await page.locator('.gallery-item', { hasText: 'Heart' }).click();

        const canvas = page.locator('#view-canvas');
        const box = (await canvas.boundingBox())!;
        const pageCx = box.x + Math.floor(box.width / 2);
        const pageCy = box.y + Math.floor(box.height / 2);

        // Size the glyph
        await page.mouse.move(pageCx, pageCy);
        await page.mouse.down();
        await page.mouse.move(pageCx + 40, pageCy, { steps: 5 });
        await page.mouse.up();

        // First stamp
        await page.mouse.move(pageCx, pageCy);
        await page.mouse.down();
        await page.mouse.up();

        // Second stamp
        const stamp2DocY = Math.floor(box.height / 2) + 100;
        const stamp2PageY = box.y + stamp2DocY;
        await page.mouse.move(pageCx, stamp2PageY);
        await page.mouse.down();
        await page.mouse.up();

        const pixel2 = await getActiveLayerPixel(page, Math.floor(box.width / 2), stamp2DocY);
        expect(pixel2?.a, 'second stamp should also be opaque').toBe(255);
    });

});
