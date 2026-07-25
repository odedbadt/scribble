# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- **Build:** `npm run build` — runs webpack locally, outputs both bundles to `distro/` (`main.bundle.js`, `three_demo.bundle.js`). `index.html` loads scripts directly from `distro/`.
- **Test:** `npm test` — Playwright suite (see Testing). Webserver: `python3 -m http.server 9191` (auto-started, reused if already running). Snapshot diffs use `maxDiffPixelRatio: 0.001`.
- **Single Playwright test:** `npx playwright test tests/test_line_tool_artifacts.spec.ts`
- **Node tests (no DOM):** `node tests/test_undo_redo_buffer.mjs`, `node tests/test_ghost_layer.mjs`
- **Express server:** `node server.js` — serves `index.html`, `static/`, `distro/`, and a `/stamps-list` JSON endpoint. Honors `PORT` and `BASE_PATH` env vars.
- **Electron dev:** `npm run electron:dev` — loads `index.html` via `file://` with IPC `scrib:save`/`scrib:open` for native PNG dialogs (`electron/main.cjs`, `electron/preload.cjs`).

Webpack is development mode with source maps. TypeScript compiles via ts-loader using `tsconfig.json` (`outDir: ./distro`, `rootDir: ./src/ts`, strict).

## Architecture

### Canvas Layering

Drawing surfaces are layered:
1. **Layer stack** (`layer_stack.ts`) — multiple persistent document layers, each its own `HTMLCanvasElement`. The active layer receives edits; a `composite_canvas` and an `above_composite_canvas` (everything above the active layer) are kept up to date for the renderer.
2. **Tool / overlay canvas** — live drawing preview for the active tool, committed to the active layer on `stop()`.
3. **View canvas** — WebGL display via Three.js (orthographic camera, nearest-filter textures for pixel-perfect output).

`scrib_renderer.ts` uploads the composites + overlay as textures and runs custom GLSL from `glsl_shader_code.ts`.

### Tool Hierarchy

All tools extend `EditingTool` (`editing_tool.ts`), then either `ClickTool` or `ClickAndDragTool`. The registry lives in `editor.ts` (`tool_classes` map) and is the source of truth for tool names:

```
EditingTool
├── ClickTool        → Floodfill, Dropper, ClearAllTool, CursorSize
└── ClickAndDragTool → ScribbleTool, LineTool, BezierTool, RectTool, CircleTool,
                       PolygonTool, TopoHullTool, HeartTool, CloudStampTool,
                       EraserTool, ScraperTool, SelectionTool, StampTool,
                       TileFillTool, GlyphSizingTool, RevealBrush
```

Tool lifecycle: `select() → start() → drag()* → stop()`. `Editor` (`editor.ts`) routes pointer events, manages alt-key state for layer picking, snaps to anchors via `anchor_manager`, and converts view → document coordinates.

### State / Settings

Two signal-based registries (using `@preact/signals`):
- **`settings_registry.ts`** — drawing settings (`ForeColor`, `BackColor`, `LineWidth`, fill style, etc.).
- **`state_registry.ts`** — UI state (`SelectedToolName`, with previous-value restoration for tools like Dropper).

Other signal-driven subsystems: `color_token_registry` (palette tokens), `mandala_mode`, `anchor_manager` (snap anchors, `SNAP_RADIUS_SCREEN_PX`), `ghost_layer`, `fill_pattern`, `stamp_gallery`.

### Undo / Redo

`action_history.ts` stores `UndoableAction` entries. `Editor` captures a per-stroke `_undo_before` (single layer) or `_undo_before_layers` (multi-layer ops) before edits, then commits an action on `stop()`. The non-DOM logic is covered by `tests/test_undo_redo_buffer.mjs`.

### Pixel Drawing

All drawing is pixel-perfect (no AA). `pixel_utils.ts`:
- Bresenham (`drawLine`, `drawThickLine`)
- Midpoint circle (`drawCircle`, `drawFilledCircle`)
- Direct `ImageData` via `setPixel` / `getPixel`, `extract_sub_image`, `RGBA` type

### Entry Points

- `src/ts/main_app.ts` → `distro/main.bundle.js` — full drawing app (`MainApp` class)
- `src/ts/three_demo.ts` → `distro/three_demo.bundle.js` — Three.js rendering demo

### Mobile UI

Single bundle, runtime-switched via CSS media query `@media (max-width: 800px), (pointer: coarse)` (`static/style.css`). All 18 tools are compiled in; mobile exposes a curated subset.

- **Drawer** `#mobile-tool-selector` — 8 tools (scribble, line, rect, circle, floodfill, dropper, eraser, clearall), fill/outline tristate, size slider, 16 quick swatches, expandable "More colors".
- **Floating action buttons** (`.mobile-fab`, direct children of `body`, also excepted from the body-children hide rule in `static/style.css`) — `#mobile-undo-btn`, `#mobile-redo-btn`, `#mobile-save-btn`, `#mobile-drawer-handle`.
- **HSL picker relocation** — the desktop `#color-pickers-row` (containing `#hl-selector-canvas` + `#sat-selector-canvas`) is moved into `#mobile-more-colors-panel` at `DOMContentLoaded` *only when the mobile media query matches*. Pointer-event listeners follow the nodes. `MainApp.replot_palette()` resizes canvas internal dims to displayed dims and re-plots after the move (called on first expander open).
- **Public app methods used by the mobile script** — `app.select_tool`, `app.set_line_width`, `app.color_stack.select_color`, `app.cycle_fill_outline`, `app.undo`, `app.redo`, `app.save`, `app.replot_palette`. Defined on `MainApp` in `main_app.ts`.
- **Deferred to v2** — mandala, layers, bezier/polygon/topo_hull, selection+cut, scraper, stamps+gallery, ghost/reveal, color tokens, anchor snap, heart/cloud_stamp/tile_fill/glyph_sizing.

Touch gestures: two-finger pan/zoom handled in `MainApp.init_touch_gestures()`. Single-touch drawing routes through `editor.ts`'s pointer event handlers (coalesced for high-rate touch).

### Testing

Playwright (`playwright.config.ts`) runs Chromium against `http://localhost:9191` with viewport `1280×720`. Snapshots live under `tests/snapshots/{testFilePath}/`. The webserver is `python3 -m http.server 9191` with `reuseExistingServer: true`. Adding a new visual test means: write the spec, run it once to capture baselines, then commit the resulting PNGs.

Mobile smoke tests live in `tests/_mobile_smoke.spec.ts` and run via `playwright.mobile.config.ts` against Pixel 7 emulation (Chromium with `pointer: coarse` + 412 px viewport): `npx playwright test --config=playwright.mobile.config.ts`. Requires a server on `:9192` (e.g. `python3 -m http.server 9192`).

### Backend

`server.js` — Express dev server.

### Archived Code

`src/ts/old/` is excluded from compilation (see `tsconfig.json`) — ignore entirely.
