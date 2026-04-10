import { EditingTool } from "./editing_tool";
import { Vector2 } from "./types";
export declare class TileFillTool extends EditingTool {
    select(): void;
    hover(_at: Vector2): void;
    start(_at: Vector2, _buttons: number): void;
    drag(_at: Vector2): void;
    stop(_at: Vector2): void;
    pointer_leave(): void;
    private _render_preview;
    /** Draw a faint crosshatch hint when no clipboard content is available. */
    private _render_empty_hint;
}
//# sourceMappingURL=tile_fill.d.ts.map