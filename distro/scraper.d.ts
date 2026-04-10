import { ScribbleTool } from "./scribble";
import { RGBA } from "./pixel_utils";
import { Vector2 } from "./types";
/**
 * Scraper tool — punches transparent holes into layers.
 *
 * Simple (no alt): erases the active layer only at stroke pixels.
 * Alt (topmost): per-pixel topmost — at each stroke pixel, erases whichever layer
 *   has the topmost non-transparent paint there.  No layer locking.
 */
export declare class ScraperTool extends ScribbleTool {
    private _hole_active;
    private _is_topmost_mode;
    private _topmost_undo_captured;
    /** Tracks which pixels have already been processed this stroke (prevents double-erase on overlapping segments). */
    private _visited;
    private _visited_doc_w;
    constructor();
    editing_start(): void;
    editing_drag(from: Vector2, to: Vector2): void;
    /** Simple mode: punch holes in the active layer only. */
    private _apply_hole_active_layer;
    /**
     * Alt (topmost) mode: per-pixel topmost erasing.
     * For each pixel in the stroke, finds the topmost visible layer with paint and
     * erases that pixel there.  Captures undo for all layers on first modification.
     */
    private _apply_hole_topmost_perpixel;
    /**
     * Marks mask[1] for every pixel covered by a thick-line from (x0,y0) to (x1,y1)
     * with the given radius, using the same Bresenham + filled-circle algorithm as
     * drawThickLine so the stroke footprint is pixel-perfect identical.
     */
    private _mark_thick_line_mask;
    /** Core hole-punch for simple mode: erase transparent pixels into the given context. */
    private _apply_hole_to_layer;
    stop(at: Vector2): void;
    commit_to_document(_color?: string | null): void;
    hover_color(): RGBA;
    hover_action(at: Vector2): void;
    /** Renders the scraper cursor as a per-pixel preview of what will be revealed. */
    private _hover_hole_preview;
    /** Writes an 8-px checkerboard pixel using document-space coordinates. */
    private _write_checker;
}
//# sourceMappingURL=scraper.d.ts.map