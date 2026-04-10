import { ClickAndDragTool } from "./click_and_drag_tool";
import { Vector2 } from "./types";
export declare class CursorSize extends ClickAndDragTool {
    start(at: Vector2, buttons: number): void;
    editing_drag(from: Vector2, to: Vector2): void;
    stop(at: Vector2): void;
    commit_to_document(): void;
}
//# sourceMappingURL=cursor_size.d.ts.map