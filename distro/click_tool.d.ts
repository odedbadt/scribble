import { EditingTool } from "./editing_tool";
import { Vector2 } from "./types";
export declare abstract class ClickTool extends EditingTool {
    init(): void;
    select(): void;
    drag(at: Vector2): void;
    stop(at: Vector2): void;
    editing_stop(at: Vector2): void;
}
//# sourceMappingURL=click_tool.d.ts.map