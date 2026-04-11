import { ClickAndDragTool } from "./click_and_drag_tool";
import { Vector2 } from "./types";
import { RGBA } from "./pixel_utils";
/**
 * Reveal brush — sweeps over the canvas and makes previously invisible
 * ghost-mode strokes visible by copying ghost pixels to the document canvas.
 *
 * Preview: the overlay shows the exact ghost pixels that will be revealed,
 * so what you see while brushing matches the committed result exactly.
 */
export declare class RevealBrush extends ClickAndDragTool {
    private _prev;
    private readonly _marker;
    constructor();
    editing_start(): void;
    editing_drag(from: Vector2, to: Vector2): void;
    commit_to_document(_color?: string | null): void;
    /** Always commits to document (and updates dirty signal) regardless of ghost mode. */
    stop(at: Vector2): void;
    hover_color(): RGBA;
}
//# sourceMappingURL=reveal_brush.d.ts.map