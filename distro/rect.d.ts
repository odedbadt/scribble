import { ClickAndDragTool } from "./click_and_drag_tool";
import { Vector2 } from "./types";
import { RGBA } from "./pixel_utils";
export declare class RectTool extends ClickAndDragTool {
    protected _line_color: RGBA;
    protected _fill_color: RGBA;
    protected _fill_outline: number;
    constructor();
    editing_start(): void;
    editing_drag(from: Vector2, to: Vector2): void;
}
//# sourceMappingURL=rect.d.ts.map