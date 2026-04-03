# Copilot Instructions for scrib

## Build, Test, and Lint Commands

- **Build (local):**
  - `npm run build` — Runs webpack, outputs to `static/ts/` (main.bundle.js, three_demo.bundle.js)
- **Build (workspace root):**
  - `npm run build` — Compiles all packages via `tsc -b` (TypeScript project references)
  - `npm run bundle` — Webpack bundles all packages into `/dist/` (outputs `dist/scrib/bundle.js`)
  - `npm run clean` — Clears dist directories
- **Run a single test:**
  - `node tests/test_undo_redo_buffer.mjs` (no npm test script configured)
- **Serve:**
  - `node server.js` (Express server)

## High-Level Architecture

- **Monorepo:**
  - This package is part of a TypeScript npm workspace with two siblings: `@oded/tsutils` (shared utilities) and `@oded/plato` (3D visualization). No direct dependencies between them.
- **Frontend:**
  - Three canvas layers: document (artwork), tool (overlay), view (WebGL via Three.js)
  - Custom GLSL shaders for rendering (see `scrib_renderer.ts`, `glsl_shader_code.ts`)
  - Tool system: All tools extend `EditingTool` → `ClickTool`/`ClickAndDragTool` (see `editor.ts`)
  - State managed via `SettingsRegistry` and `StateRegistry` using `@preact/signals`
  - Pixel-perfect drawing (no anti-aliasing); core algorithms in `pixel_utils.ts`
- **Entry Points:**
  - `src/ts/main_app.ts` → main app
  - `src/ts/three_demo.ts` → Three.js demo
- **Backend:**
  - Express server (`server.js`), Python backend (`main.py`), Google App Engine deploy (`app.yaml`)
  - Firebase present in dependencies but not actively used
- **Archived Code:**
  - `src/ts/old/` is excluded from builds and should be ignored

## Key Conventions

- **Webpack:**
  - Operates in development mode with source maps
  - Root webpack config aliases `@oded/tsutils` for development
- **Tool Lifecycle:**
  - `select() → start() → drag()* → stop()`
- **Ignore:**
  - Do not reference or modify code in `src/ts/old/`
- **Pixel Drawing:**
  - All drawing is pixel-perfect; use `pixel_utils.ts` for algorithms

## Reference Docs
- See `CLAUDE.md` for detailed architecture and conventions
- See `README.md` for a project summary
