import { ClickAndDragTool } from "./click_and_drag_tool";
import { Vector2 } from "./types";
import { RGBA } from "./pixel_utils";
export declare class LineTool extends ClickAndDragTool {
    protected _stroke_color: RGBA;
    constructor();
    editing_start(): void;
    editing_drag(from: Vector2, to: Vector2): false | undefined;
}
//# sourceMappingURL=line.d.ts.map