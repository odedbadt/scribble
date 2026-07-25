import { test, expect, devices } from '@playwright/test';

test.use({ ...devices['Pixel 7'] });

const BASE = 'http://localhost:9192';

test('mobile drawer renders with all v1 tools', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(String(e)));
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });

  await page.goto(BASE);
  await page.waitForLoadState('networkidle');

  // Drawer auto-opens on mobile (UA + viewport <= 800)
  const drawer = page.locator('#mobile-tool-selector');
  await expect(drawer).toBeVisible();
  await expect(drawer).toHaveClass(/open/);

  // All 8 v1 tools present and tappable
  const tools = ['scribble', 'line', 'rect', 'circle', 'floodfill', 'dropper', 'eraser', 'clearall'];
  for (const t of tools) {
    await expect(page.locator(`.mobile-tool-btn[data-tool="${t}"]`)).toBeVisible();
  }

  // FABs visible
  await expect(page.locator('#mobile-undo-btn')).toBeVisible();
  await expect(page.locator('#mobile-redo-btn')).toBeVisible();
  await expect(page.locator('#mobile-save-btn')).toBeVisible();
  await expect(page.locator('#mobile-drawer-handle')).toBeVisible();

  // Fill style button
  await expect(page.locator('#mobile-fillstyle-btn')).toBeVisible();

  // Color swatches
  await expect(page.locator('.mobile-color-btn').first()).toBeVisible();
  await expect(page.locator('.mobile-color-btn')).toHaveCount(16);

  // More colors expander present, HSL canvases were relocated into it
  await expect(page.locator('#mobile-more-colors-btn')).toBeVisible();
  const relocated = page.locator('#mobile-more-colors-panel #color-pickers-row');
  await expect(relocated).toHaveCount(1);

  // No JS errors so far
  expect(errors, errors.join('\n')).toEqual([]);
});

test('tool selection drives window.app.editor.tool', async ({ page }) => {
  await page.goto(BASE);
  await page.waitForLoadState('networkidle');

  for (const tool of ['line', 'rect', 'circle', 'floodfill', 'dropper', 'eraser']) {
    await page.locator(`.mobile-tool-btn[data-tool="${tool}"]`).click();
    const active = await page.evaluate(() => {
      const app = (window as any).app;
      return app?.editor?.tool?.constructor?.name ?? null;
    });
    expect(active, `tool=${tool} → app.editor.tool=${active}`).not.toBeNull();
  }
});

test('undo/redo FABs invoke editor', async ({ page }) => {
  await page.goto(BASE);
  await page.waitForLoadState('networkidle');

  const undoCalled = await page.evaluate(() => {
    const app = (window as any).app;
    let calls = 0;
    const orig = app.editor.undo.bind(app.editor);
    app.editor.undo = (...args: any[]) => { calls++; return orig(...args); };
    document.getElementById('mobile-undo-btn')!.click();
    return calls;
  });
  expect(undoCalled).toBe(1);

  const redoCalled = await page.evaluate(() => {
    const app = (window as any).app;
    let calls = 0;
    const orig = app.editor.redo.bind(app.editor);
    app.editor.redo = (...args: any[]) => { calls++; return orig(...args); };
    document.getElementById('mobile-redo-btn')!.click();
    return calls;
  });
  expect(redoCalled).toBe(1);
});

test('fill/outline button cycles state', async ({ page }) => {
  await page.goto(BASE);
  await page.waitForLoadState('networkidle');

  const states: number[] = [];
  for (let i = 0; i < 4; i++) {
    await page.locator('#mobile-fillstyle-btn').click();
    states.push(await page.evaluate(() => (window as any).app.settings.peek('fill_outline')));
  }
  // Starts at 0 (Both); each click increments mod 3 → 1, 2, 0, 1
  expect(states).toEqual([1, 2, 0, 1]);
});

test('more-colors expander shows HSL picker with non-zero size', async ({ page }) => {
  await page.goto(BASE);
  await page.waitForLoadState('networkidle');

  await page.locator('#mobile-more-colors-btn').click();
  // setTimeout(0) defers replot_palette one tick; wait for it
  await page.waitForFunction(() => {
    const hl = document.getElementById('hl-selector-canvas') as HTMLCanvasElement;
    return hl.width === hl.offsetWidth && hl.offsetWidth > 0;
  });
  const dims = await page.evaluate(() => {
    const hl = document.getElementById('hl-selector-canvas') as HTMLCanvasElement;
    const sat = document.getElementById('sat-selector-canvas') as HTMLCanvasElement;
    return {
      hl_disp: { w: hl.offsetWidth, h: hl.offsetHeight },
      hl_internal: { w: hl.width, h: hl.height },
      sat_disp: { w: sat.offsetWidth, h: sat.offsetHeight },
      sat_internal: { w: sat.width, h: sat.height },
    };
  });
  expect(dims.hl_disp.w).toBeGreaterThan(0);
  expect(dims.hl_disp.h).toBeGreaterThan(0);
  expect(dims.sat_disp.w).toBeGreaterThan(0);
  expect(dims.sat_disp.h).toBeGreaterThan(0);
  // replot_palette should have synced internal dims to displayed dims
  expect(dims.hl_internal.w).toBe(dims.hl_disp.w);
  expect(dims.sat_internal.w).toBe(dims.sat_disp.w);
});
