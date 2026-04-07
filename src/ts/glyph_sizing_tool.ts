import { ClickAndDragTool } from "./click_and_drag_tool";
import { clipboard } from "./clipboard";
import { Vector2 } from "./types";
import { state_registry, StateValue } from "./state_registry";

export type GlyphFn = (imageData: ImageData, cx: number, cy: number, r: number) => void;

/** Module-level slot: set before activating this tool, consumed in select(). */
export let pending_glyph_fn: GlyphFn | null = null;
export function set_pending_glyph(fn: GlyphFn) { pending_glyph_fn = fn; }

/**
 * Drag-to-size glyph tool.
 * - Shows a live preview of the glyph as the user drags.
 * - On mouse release, rasterises the final glyph into the clipboard,
 *   then hands off to the stamp tool.
 */
export class GlyphSizingTool extends ClickAndDragTool {
    private _glyph_fn: GlyphFn | null = null;

    select(): void {
        // pending_glyph_fn is read lazily in editing_start() to survive the double-instantiation
        // that occurs because select_tool() fires both the signal subscription and a direct call.
    }

    editing_start(): void {
        if (pending_glyph_fn) {
            this._glyph_fn = pending_glyph_fn;
            pending_glyph_fn = null;
        }
    }

    editing_drag(from: Vector2, to: Vector2): void {
        if (!this._glyph_fn) return;
        const r = Math.max(4, Math.round(Math.hypot(to.x - from.x, to.y - from.y)));
        this._render_glyph_to_tool(from, r);
    }

    /** Override stop() — do NOT commit to document; instead rasterise to clipboard. */
    stop(at: Vector2): void {
        if (this.drag_start && this._glyph_fn) {
            const r = Math.max(4, Math.round(Math.hypot(at.x - this.drag_start.x, at.y - this.drag_start.y)));
            const bound = r + 4;
            const w = bound * 2;
            const h = bound * 2;
            const imageData = new ImageData(w, h);
            this._glyph_fn(imageData, bound, bound, r);
            clipboard.data = imageData;
            clipboard.rect = null;
        }
        this.drag_start = null;
        this.canvas_bounds_mapping = null;
        this.canvas!.width = 1;
        this.canvas!.height = 1;
        this.canvas_signal!.value = null;
        // Switch to stamp tool
        state_registry.set(StateValue.SelectedToolName, 'stamp');
    }

    private _render_glyph_to_tool(center: Vector2, r: number): void {
        if (!this._glyph_fn) return;
        const bound = r + 4;
        const w = bound * 2;
        const h = bound * 2;
        this.canvas!.width = w;
        this.canvas!.height = h;
        this.canvas_bounds_mapping = {
            from: { x: 0, y: 0, w: 1, h: 1 },
            to: { x: center.x - bound, y: center.y - bound, w, h },
        };
        const imageData = new ImageData(w, h);
        this._glyph_fn(imageData, bound, bound, r);
        this.context!.putImageData(imageData, 0, 0);
    }
}
