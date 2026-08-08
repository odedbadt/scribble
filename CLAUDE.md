# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Monorepo Layout

```
scrib/
├── apps/
│   ├── web/       # browser build, targets desktop/laptop
│   └── desktop/   # Electron shell, wraps apps/web for now (keyboard-first UX planned)
├── packages/      # shared engine code (reserved; populated in later refactor steps)
├── package.json   # workspace root — npm workspaces
└── CLAUDE.md
```

The RN apps for mobile (`apps/sketcher/`, `apps/kids/`) will be added later. `packages/` is reserved for shared engine code (pixel utils, tools, state registries, renderer) that will be extracted from `apps/web/src/ts/` in future steps.

## Commands

Run from the repo root unless noted. `npm -w @scrib/web run <script>` is shorthand for running a script inside the `apps/web` workspace.

- **Install:** `npm install` — installs all workspaces; deps hoist to root `node_modules/`.
- **Build web:** `npm run build:web` — webpack in `apps/web`, outputs to `apps/web/distro/` (`main.bundle.js`, `three_demo.bundle.js`). `apps/web/index.html` loads scripts directly from `distro/`.
- **Test web:** `npm run test:web` — Playwright suite. Webserver: `python3 -m http.server 9191` from `apps/web` (auto-started, reused). Snapshot diffs use `maxDiffPixelRatio: 0.001`.
- **Single Playwright test:** `cd apps/web && npx playwright test tests/test_line_tool_artifacts.spec.ts`
- **Node tests (no DOM):** `node apps/web/tests/test_undo_redo_buffer.mjs`, `node apps/web/tests/test_ghost_layer.mjs`
- **Express dev server:** `npm run dev:web` — serves `apps/web/index.html`, `static/`, `distro/`, and a `/stamps-list` JSON endpoint on port 8080. Honors `PORT` and `BASE_PATH` env vars.
- **Electron desktop:** `npm run dev:desktop` — builds `apps/web` first, then launches Electron. Loads `apps/web/index.html` via `file://` with IPC `scrib:save`/`scrib:open` for native PNG dialogs (`apps/desktop/electron/main.cjs`, `preload.cjs`).

Webpack is development mode with source maps. TypeScript compiles via ts-loader using `apps/web/tsconfig.json` (`outDir: ./distro`, `rootDir: ./src/ts`, strict).

## Architecture

All paths below are relative to `apps/web/` unless noted.

### Canvas Layering

Drawing surfaces are layered:
1. **Layer stack** (`src/ts/layer_stack.ts`) — multiple persistent document layers, each its own `HTMLCanvasElement`. The active layer receives edits; a `composite_canvas` and an `above_composite_canvas` (everything above the active layer) are kept up to date for the renderer.
2. **Tool / overlay canvas** — live drawing preview for the active tool, committed to the active layer on `stop()`.
3. **View canvas** — WebGL display via Three.js (orthographic camera, nearest-filter textures for pixel-perfect output).

`src/ts/scrib_renderer.ts` uploads the composites + overlay as textures and runs custom GLSL from `src/ts/glsl_shader_code.ts`.

### Tool Hierarchy

All tools extend `EditingTool` (`src/ts/editing_tool.ts`), then either `ClickTool` or `ClickAndDragTool`. The registry lives in `src/ts/editor.ts` (`tool_classes` map) and is the source of truth for tool names:

```
EditingTool
├── ClickTool        → Floodfill, Dropper, ClearAllTool, CursorSize
└── ClickAndDragTool → ScribbleTool, LineTool, BezierTool, RectTool, CircleTool,
                       PolygonTool, TopoHullTool, HeartTool, CloudStampTool,
                       EraserTool, ScraperTool, SelectionTool, StampTool,
                       TileFillTool, GlyphSizingTool, RevealBrush
```

Tool lifecycle: `select() → start() → drag()* → stop()`. `Editor` (`src/ts/editor.ts`) routes pointer events, manages alt-key state for layer picking, snaps to anchors via `anchor_manager`, and converts view → document coordinates.

### State / Settings

Two signal-based registries (using `@preact/signals`):
- **`src/ts/settings_registry.ts`** — drawing settings (`ForeColor`, `BackColor`, `LineWidth`, fill style, etc.).
- **`src/ts/state_registry.ts`** — UI state (`SelectedToolName`, with previous-value restoration for tools like Dropper).

Other signal-driven subsystems: `color_token_registry` (palette tokens), `mandala_mode`, `anchor_manager` (snap anchors, `SNAP_RADIUS_SCREEN_PX`), `ghost_layer`, `fill_pattern`, `stamp_gallery`.

### Undo / Redo

`src/ts/action_history.ts` stores `UndoableAction` entries. `Editor` captures a per-stroke `_undo_before` (single layer) or `_undo_before_layers` (multi-layer ops) before edits, then commits an action on `stop()`. The non-DOM logic is covered by `tests/test_undo_redo_buffer.mjs`.

### Pixel Drawing

All drawing is pixel-perfect (no AA). `src/ts/pixel_utils.ts`:
- Bresenham (`drawLine`, `drawThickLine`)
- Midpoint circle (`drawCircle`, `drawFilledCircle`)
- Direct `ImageData` via `setPixel` / `getPixel`, `extract_sub_image`, `RGBA` type

### Entry Points

- `apps/web/src/ts/main_app.ts` → `apps/web/distro/main.bundle.js` — full drawing app (`MainApp` class)
- `apps/web/src/ts/three_demo.ts` → `apps/web/distro/three_demo.bundle.js` — Three.js rendering demo

### Platform Target

Web app targets desktop and laptop browsers only. Handhelds are served by separate native Expo React Native apps (`apps/sketcher/`, `apps/kids/`), planned but not yet scaffolded. Desktop is currently a native Electron wrapper of the web build (`apps/desktop/`); desktop-specific UX (native menubar, expanded keyboard shortcuts, multi-window) is planned.

### Testing

Playwright (`apps/web/playwright.config.ts`) runs Chromium against `http://localhost:9191` with viewport `1280×720`. Snapshots live under `apps/web/tests/snapshots/{testFilePath}/`. The webserver is `python3 -m http.server 9191` with `reuseExistingServer: true`. Adding a new visual test means: write the spec, run it once to capture baselines, then commit the resulting PNGs.

### Backend

`apps/web/server.js` — Express dev server.

### Archived Code

`apps/web/src/ts/old/` is excluded from compilation (see `apps/web/tsconfig.json`) — ignore entirely.
