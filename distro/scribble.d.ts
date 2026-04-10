import { ClickAndDragTool } from "./click_and_drag_tool";
import { Vector2 } from "./types";
import { RGBA } from "./pixel_utils";
export declare class ScribbleTool extends ClickAndDragTool {
    protected _prev: Vector2 | null;
    protected _stroke_color: RGBA;
    constructor();
    editing_start(): void;
    editing_drag(from: Vector2, to: Vector2): void;
    commit_to_document(color?: string | null): void;
    on_doc_origin_shift(dx: number, dy: number): void;
    editing_stop(): void;
    pointer_leave(): void;
}
//# sourceMappingURL=scribble.d.ts.map