import { EditingTool } from "./editing_tool";
import { Vector2 } from "./types";
export declare class Dropper extends EditingTool {
    private _buttons;
    private _pick;
    start(at: Vector2, buttons: number): void;
    drag(at: Vector2): void;
    hover(at: Vector2): boolean;
    select(): void;
    stop(at: Vector2): void;
}
//# sourceMappingURL=dropper.d.ts.map