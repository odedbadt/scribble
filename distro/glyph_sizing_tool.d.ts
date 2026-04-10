import { ClickAndDragTool } from "./click_and_drag_tool";
import { Vector2 } from "./types";
export type GlyphFn = (imageData: ImageData, cx: number, cy: number, r: number) => void;
/** Module-level slot: set before activating this tool, consumed in select(). */
export declare let pending_glyph_fn: GlyphFn | null;
export declare function set_pending_glyph(fn: GlyphFn): void;
/**
 * Drag-to-size glyph tool.
 * - Shows a live preview of the glyph as the user drags.
 * - On mouse release, rasterises the final glyph into the clipboard,
 *   then hands off to the stamp tool.
 */
export declare class GlyphSizingTool extends ClickAndDragTool {
    private _glyph_fn;
    select(): void;
    editing_start(): void;
    editing_drag(from: Vector2, to: Vector2): void;
    /** Override stop() — do NOT commit to document; instead rasterise to clipboard. */
    stop(at: Vector2): void;
    /** Ignore mandala mode — show a plain cursor during glyph sizing. */
    hover_action(at: Vector2): void;
    private _render_glyph_to_tool;
}
//# sourceMappingURL=glyph_sizing_tool.d.ts.map