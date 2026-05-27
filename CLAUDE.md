# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Monorepo Context

This package lives inside a TypeScript npm workspace at `../` alongside two sibling packages (`tsutils`, `plato`). Scrib does **not** import `@oded/tsutils` or `@oded/plato`; it is independently bundled.

From the **workspace root** (`../`):
- `npm run build` — `tsc -b` across all workspace packages (project references)
- `npm run bundle` — webpack across all packages, outputs to `../dist/`
- `npm run clean` — clears dist directories

## Commands (within this package)

- **Build:** `npm run build` — runs the local `webpack.config.js`, outputs `main.bundle.js` and `three_demo.bundle.js` to `distro/`. Webpack runs in `development` mode with source maps; `ts-loader` uses the local `tsconfig.json`.
- **Serve:** `node server.js` — Express on `PORT` (default 8080) with optional `BASE_PATH` prefix. Static at `/`, bundles at `/distro`.
- **E2E / visual regression:** `npm test` (Playwright). The config (`playwright.config.ts`) auto-starts `python3 -m http.server 9191` as the test webServer; tests load `http://localhost:9191`. Snapshots live under `tests/snapshots/` with `maxDiffPixelRatio: 0.001`.
- **Standalone test:** `node tests/test_undo_redo_buffer.mjs` and `node tests/test_ghost_layer.mjs` (plain Node, no harness).
- **Single Playwright test:** `npx playwright test tests/test_line_tool_artifacts.spec.ts` (or any `.spec.ts`).

## Architecture

### Canvas layering and rendering

Drawing is layered over three conceptual surfaces:
1. **Layer canvases** — managed by `LayerStack` (`layer_stack.ts`). Multiple stacked `Layer`s, each its own offscreen canvas. The stack also maintains a `composite_canvas` (full composite) and an `above_composite_canvas` (composite of layers above the active one) so the renderer can show the active layer in isolation when needed.
2. **Tool canvas** — a transient overlay created per tool via `init_canvas`; the active tool draws here, then commits into the active layer (`tool_to_document` in `utils.ts`) on `stop()`.
3. **View canvas** — `<canvas id="view-canvas">` driven by `ScribRenderer` (`scrib_renderer.ts`), which uses Three.js (`OrthographicCamera`, `NearestFilter` `CanvasTexture`s, custom GLSL in `glsl_shader_code.ts`) to composite layers + overlay + anchors with pixel-perfect scaling.

`Editor` (`editor.ts`) owns the `LayerStack`, routes pointer events to the active tool, and converts view→document coordinates via `view_coords_to_doc_coords` using `view_port_signal`. `document_canvas`/`document_context` are getters that proxy to `layer_stack.active_layer`.

### Tool hierarchy

All tools extend `EditingTool` (`editing_tool.ts`) and are registered in the `tool_classes` map at the top of `editor.ts`. Two intermediate base classes:

- **`ClickTool`** (`click_tool.ts`) — single-click commit. Subclasses: `Floodfill`, `Dropper`, `ClearAllTool`, `StampTool`, `TileFillTool`, `CursorSize`.
- **`ClickAndDragTool`** (`click_and_drag_tool.ts`) — start/drag/stop strokes. Subclasses include `ScribbleTool`, `LineTool`, `BezierTool`, `RectTool`, `CircleTool`, `EraserTool`, `ScraperTool`, `PolygonTool`, `TopoHullTool`, `HeartTool`, `CloudStampTool`, `RevealBrush`, `SelectionTool`, `GlyphSizingTool`.

Tool lifecycle: `select() → start() → drag()* → stop()` (with optional `hover()`, `cancel()`, `keydown()`, `pointer_leave()`, `deselect()`, `on_doc_origin_shift()`). `init_editor(editor)` wires per-tool callbacks for undo capture (single-layer, multi-layer, clipped, etc.).

### Undo/redo

`ActionHistory` (`action_history.ts`) records `UndoableAction`s. Tools never mutate history directly — they call `editor.begin_undo_capture*` before drawing and `editor.push_undo_snapshot*` on commit. Variants: full-canvas, clipped-rect, single-layer, and multi-layer, so a tool only snapshots the bytes it actually changed. `tests/test_undo_redo_buffer.mjs` exercises the buffer.

### State management

Two signal-based registries (`@preact/signals`):
- **`SettingsRegistry`** (`settings_registry.ts`) — drawing settings (`ForeColor`, `BackColor`, `LineWidth`, ...).
- **`StateRegistry`** (`state_registry.ts`) — UI state (`SelectedToolName`, with previous-value restoration for momentary tools like Dropper).

Other singleton modules: `anchor_manager` (snap anchors), `mandala_mode` (symmetry), `ghost_layer` (reference image), `color_token_registry` (palette tokens used by GLSL color-token shader), `fill_pattern`.

### Pixel drawing

`pixel_utils.ts` is the pixel-perfect (no anti-aliasing) primitive layer: Bresenham `drawLine`/`drawThickLine`, midpoint `drawCircle`/`drawFilledCircle`, direct `ImageData` `setPixel`/`getPixel`, plus `extract_sub_image`.

### Entry points

- `src/ts/main_app.ts` → `distro/main.bundle.js` — full app (loaded by `index.html`).
- `src/ts/three_demo.ts` → `distro/three_demo.bundle.js` — Three.js rendering demo (`three_demo.html`).

### Backend

- `server.js` — Express static server (Node ≥ 20).
- `main.py` + `app.yaml` + `requirements.txt` — Python/Google App Engine deployment.
- Firebase and `googleapis` are present in `package.json` but not actively imported by current TypeScript sources.

### TypeScript build notes

- `tsconfig.json` has `composite: true`, `outDir: ./distro`, `rootDir: ./src/ts`, `strict: true`, custom `typeRoots: ["./types", "./node_modules/@types"]`.
- The `exclude` glob `src/ts/old/*.ts` is a vestige — the directory does not currently exist.
