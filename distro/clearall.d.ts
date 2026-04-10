import { EditingTool } from "./editing_tool";
import { Vector2 } from "./types";
export declare class ClearAllTool extends EditingTool {
    select(): void;
    start(at: Vector2, buttons: number): void;
    drag(at: Vector2): void;
    stop(at: Vector2): void;
    hover(at: Vector2): void;
}
//# sourceMappingURL=clearall.d.ts.map