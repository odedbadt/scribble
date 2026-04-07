import { test, expect, Page } from '@playwright/test';

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
    await page.waitForFunction(
        () => typeof (window as any).app?.select_tool === 'function',
    );
}

test.describe('Selection + Stamp tool: transparency', () => {

    test('blank clipboard pixels stay transparent after stamp', async ({ page }) => {
        await waitForApp(page);

        await page.evaluate(() => (window as any).app.select_tool('scribble'));

        const canvas = page.locator('#view-canvas');
        const box = (await canvas.boundingBox())!;
        const docW = Math.floor(box.width);
        const docH = Math.floor(box.height);
        const pageCx = box.x + docW / 2;
        const pageCy = box.y + docH / 2;
        const docCx = Math.floor(docW / 2);
        const docCy = Math.floor(docH / 2);

        // Draw a red stroke at canvas center (default foreground is red-ish).
        await page.mouse.move(pageCx - 10, pageCy);
        await page.mouse.down();
        await page.mouse.move(pageCx + 10, pageCy);
        await page.mouse.up();

        const stroke = await getLayerPixel(page, 1, docCx, docCy);
        expect(stroke?.a, 'stroke must be opaque before selection').toBe(255);

        // Drag a 60×60 selection around the stroke → auto-copies + switches to stamp.
        await page.evaluate(() => (window as any).app.select_tool('selection'));
        await page.mouse.move(pageCx - 30, pageCy - 30);
        await page.mouse.down();
        await page.mouse.move(pageCx + 30, pageCy + 30);
        await page.mouse.up();

        // Wait for the tool to switch to stamp (signal fires synchronously but
        // Playwright needs a microtask flush).
        await page.waitForFunction(
            () => (window as any).app.editor?.tool?.constructor?.name === 'StampTool',
            { timeout: 2000 },
        );

        // Stamp 150px below center. Clipboard is ~61×61 (bounding_rect is inclusive).
        // Top-left of stamp on layer: (docCx - 30, docCy + 150 - 30) = (docCx-30, docCy+120)
        // The stroke pixel (center of clipboard) lands at (docCx, docCy+150).
        // The top-left corner of the stamp (docCx-30, docCy+120) was blank in the clipboard.
        const stampDocY = docCy + 150;
        await page.mouse.move(pageCx, box.y + stampDocY);
        await page.mouse.down();
        await page.mouse.up();

        // Center of stamp: should carry the copied stroke (opaque).
        const stampedStroke = await getLayerPixel(page, 1, docCx, stampDocY);
        expect(stampedStroke?.a, 'stamped stroke pixel should be opaque').toBe(255);

        // Top-left corner of stamp: was transparent in clipboard → must stay transparent.
        const stampedCorner = await getLayerPixel(page, 1, docCx - 30, stampDocY - 30);
        expect(stampedCorner?.a,
            'background clipboard pixels (alpha=0) must not overwrite layer — must stay transparent',
        ).toBe(0);
    });

    test('stamp does not erase existing content where clipboard is transparent', async ({ page }) => {
        // Setup:
        //   - "narrow" stroke at center   (x: docCx±10) → this gets copied to clipboard
        //   - "wide"   stroke 120px below (x: docCx±25) → this exists on layer 1 at stamp target
        //
        // We select 60×60 around the narrow stroke → clipboard has opaque pixels only at x offsets 20-40.
        // We stamp centered on the wide stroke row.
        // At docCx+22: wide stroke is opaque (alpha=255), clipboard is transparent (alpha=0 at offset 52).
        // With the bug (putImageData): alpha=0 overwrites → destroys existing content.
        // With the fix (drawImage source-over): alpha=0 skips → existing content preserved ✓
        await waitForApp(page);

        await page.evaluate(() => (window as any).app.select_tool('scribble'));

        const canvas = page.locator('#view-canvas');
        const box = (await canvas.boundingBox())!;
        const docW = Math.floor(box.width);
        const docH = Math.floor(box.height);
        const pageCx = box.x + docW / 2;
        const pageCy = box.y + docH / 2;
        const docCx = Math.floor(docW / 2);
        const docCy = Math.floor(docH / 2);

        // Narrow stroke at center (this is what gets copied into the clipboard).
        await page.mouse.move(pageCx - 10, pageCy);
        await page.mouse.down();
        await page.mouse.move(pageCx + 10, pageCy);
        await page.mouse.up();

        // Wide stroke 120px below center (x: docCx±25).
        // docCx+22 is within this stroke AND within the stamp bounds (±30 of stamp center)
        // but OUTSIDE the narrow clipboard stroke (±10 of center → offsets 20–40 in clipboard).
        const wideStrokePageY = pageCy + 120;
        const wideStrokeDocY = docCy + 120;
        await page.mouse.move(pageCx - 25, wideStrokePageY);
        await page.mouse.down();
        await page.mouse.move(pageCx + 25, wideStrokePageY);
        await page.mouse.up();

        // Verify the wide stroke drew at the check point (docCx+22, wideStrokeDocY).
        const wideCheck = await getLayerPixel(page, 1, docCx + 22, wideStrokeDocY);
        expect(wideCheck?.a, 'wide stroke must be opaque at check point before stamp').toBe(255);

        // Select 60×60 around the NARROW stroke at center → clipboard = narrow + transparent surround.
        await page.evaluate(() => (window as any).app.select_tool('selection'));
        await page.mouse.move(pageCx - 30, pageCy - 30);
        await page.mouse.down();
        await page.mouse.move(pageCx + 30, pageCy + 30);
        await page.mouse.up();

        await page.waitForFunction(
            () => (window as any).app.editor?.tool?.constructor?.name === 'StampTool',
            { timeout: 2000 },
        );

        // Stamp centered on the wide stroke row. Clipboard is ~61×61, centered at (docCx, wideStrokeDocY).
        // Stamp covers x: docCx-30 to docCx+30.
        // At x=docCx+22, clipboard offset=(52, 30): outside narrow stroke (offsets 20–40) → alpha=0.
        // The wide stroke at (docCx+22, wideStrokeDocY) must NOT be erased.
        await page.mouse.move(pageCx, wideStrokePageY);
        await page.mouse.down();
        await page.mouse.up();

        const preservedPoint = await getLayerPixel(page, 1, docCx + 22, wideStrokeDocY);
        expect(preservedPoint?.a,
            'existing content under transparent clipboard pixels must NOT be erased by stamp',
        ).toBe(255);
    });

});
