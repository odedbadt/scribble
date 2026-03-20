# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Monorepo Context

This package lives inside a TypeScript npm workspace at `../` alongside two sibling packages:
- **`tsutils`** (`@oded/tsutils`) — shared utilities: vec2, color, canvas, three_utils
- **`plato`** (`@oded/plato`) — 3D Platonic solids visualization

Scrib does **not** depend on `tsutils` or `plato`; the packages are independently bundled.

From the **workspace root** (`../`):
- `npm run build` — compiles all packages via `tsc -b` (TypeScript project references)
- `npm run bundle` — webpack bundles all packages into `/dist/` (outputs `dist/scrib/bundle.js`)
- `npm run clean` — clears dist directories

The root webpack (`../webpack.config.cjs`) aliases `@oded/tsutils` to its source files for development.

## Commands (within this package)

- **Build:** `npm run build` — runs webpack locally, outputs to `static/ts/` (main.bundle.js, three_demo.bundle.js)
- **Run tests:** `node tests/test_undo_redo_buffer.mjs` (no npm test script configured)
- **Serve:** `node server.js` (Express server)

Webpack operates in development mode with source maps enabled. TypeScript is compiled via ts-loader using `tsconfig.json`.

## Architecture

### Canvas Layering

The app uses three canvas layers:
1. **Document canvas** — persistent artwork storage
2. **Tool canvas** — live drawing overlay (active tool renders here, then commits to document)
3. **View canvas** — WebGL display via Three.js (orthographic camera + nearest-filter textures for pixel-perfect rendering)

Three.js (`scrib_renderer.ts`) renders document and overlay textures using custom GLSL shaders (`glsl_shader_code.ts`).

### Tool Hierarchy

All drawing tools extend from `EditingTool` (abstract base), then either `ClickTool` or `ClickAndDragTool`:

```
EditingTool
├── ClickTool → FloodFill, Dropper, ClearAll
└── ClickAndDragTool → Scribble, Line, Rect, Circle, Eraser, CursorSize
```

Tool lifecycle: `select() → start() → drag()* → stop()`. The `Editor` class (`editor.ts`) routes pointer events to the active tool and handles coordinate conversion (view → document space).

### State Management

Two signal-based registries (using `@preact/signals`):
- **`SettingsRegistry`** (`settings_registry.ts`) — drawing settings: `ForeColor`, `BackColor`, `LineWidth`
- **`StateRegistry`** (`state_registry.ts`) — UI state: `SelectedToolName` (supports previous-value restoration for tools like Dropper)

### Pixel Drawing

All drawing is pixel-perfect (no anti-aliasing). `pixel_utils.ts` contains the core algorithms:
- Bresenham's line algorithm (`drawLine`, `drawThickLine`)
- Midpoint circle algorithm (`drawCircle`, `drawFilledCircle`)
- Direct `ImageData` manipulation via `setPixel`/`getPixel`

### Entry Points

- `src/ts/main_app.ts` → `main.bundle.js` — full drawing application
- `src/ts/three_demo.ts` → `three_demo.bundle.js` — Three.js rendering demo

### Backend

Express server (`server.js`) + Python backend (`main.py`) with Google App Engine deployment (`app.yaml`). Firebase integration is present in dependencies but usage is in archived code.

### Archived Code

`src/ts/old/` is excluded from compilation and should be ignored entirely.
