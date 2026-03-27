# Copilot Instructions

## Commands

```bash
npm run build          # webpack → static/ts/main.bundle.js + three_demo.bundle.js
node server.js         # Express server on :8080 (or $PORT)

# Run the only test file:
node tests/test_undo_redo_buffer.mjs
```

From the **monorepo root** (`../`):
```bash
npm run build          # tsc -b (TypeScript project references, all packages)
npm run bundle         # webpack all packages → /dist/
npm run clean          # clear dist directories
```

## Architecture

### Three-Layer Canvas Pipeline

All drawing is CPU-side pixel manipulation — Three.js is used only for display.

1. **Document canvas** — off-screen `<canvas>`, stores committed artwork as `ImageData`
2. **Tool canvas** — ephemeral overlay that grows as a stroke expands (`extend_canvas_mapping()`); blitted to document on `stop()`
3. **View canvas** — WebGL `<canvas>` rendered by `ScribRenderer` (Three.js, orthographic camera, `NearestFilter` textures)

Data flow: pointer event → `Editor` (coord conversion) → active tool renders to tool canvas → `publish_signals()` → `ScribRenderer` updates `CanvasTexture` → Three.js renders to screen.

### Tool System

All tools extend `EditingTool`. Two concrete base classes:

- **`ClickTool`** — instant action on single click (`start()` does the work). Examples: `Dropper`, `FloodFill`, `ClearAll`.
- **`ClickAndDragTool`** — stroke lifecycle with `editing_start()` / `editing_drag(from, to)` / `editing_stop()`. Examples: `ScribbleTool`, `LineTool`, `RectTool`, `CircleTool`, `Eraser`.

Tool lifecycle: `select() → start(at, buttons) → drag(at)* → stop(at) → deselect()`

Tools are registered in `editor.ts` as a `Map<string, ToolClass>` keyed by lowercase name.

### State Management

Two signal-based registries using `@preact/signals`:

- **`SettingsRegistry`** (`settings_registry.ts`) — drawing settings: `ForeColor`, `BackColor`, `LineWidth`, `Filled`
- **`StateRegistry`** (`state_registry.ts`) — UI state: `SelectedToolName` (with `.push()` / `.pop()` for temporary tool switches, e.g. Dropper restores the previous tool on `stop()`)

### Undo/Redo

`UndoRedoBuffer<ImageData>` in `undo_redo_buffer.ts` — generic ring buffer that auto-grows. `Editor` stores full `ImageData` snapshots. Keyboard: `U` = undo, `R` = redo.

## Key Conventions

### Pixel-perfect rendering — no exceptions
- All drawing uses `ImageData` directly via `setPixel()` / `getPixel()` from `pixel_utils.ts`
- `imageSmoothingEnabled = false` on every context
- `NearestFilter` on Three.js textures (min and mag)
- Never use canvas 2D drawing APIs (arc, lineTo, etc.) for actual content

### Right-click = back color
Tools check `buttons & 2` to decide whether to use `ForeColor` or `BackColor`.

### Mandala mode
Tools that support symmetry check `mandala_mode.enabled` and call `mandala_mode.get_line_transforms()` / `get_point_transforms()`. When mandala is active, `extend_canvas_mapping()` is called with the full document rect to cover all reflected strokes.

### Tool canvas sizing
`extend_canvas_mapping(point_or_rect, copy_existing, padding?)` grows the tool canvas as needed. Tools call this in `editing_drag()`, passing each new stroke point with a radius-based padding.

### `src/ts/old/` is excluded
That directory is excluded from `tsconfig.json` and must be ignored entirely.
