import { EditingTool } from "./editing_tool";
import { Vector2 } from "./types";
export declare class StampTool extends EditingTool {
    select(): void;
    hover(at: Vector2): void;
    start(at: Vector2, _buttons: number): void;
    /** While button held after stamp, just track cursor — no repeated stamps. */
    drag(at: Vector2): void;
    stop(_at: Vector2): void;
    pointer_leave(): void;
    private _render_single_hover;
    private _stamp_single;
    private _mandala_center;
    private _render_mandala_hover;
    private _stamp_mandala;
    private _render_crosshair;
}
//# sourceMappingURL=stamp.d.ts.map