import { EditingTool } from "./editing_tool";
import { Vector2 } from "./types";
export declare class CloudStampTool extends EditingTool {
    private _last_pos;
    private _cloud_size;
    select(): void;
    deselect(): void;
    start(at: Vector2, _buttons: number): void;
    drag(_at: Vector2): void;
    stop(_at: Vector2): void;
    hover(at: Vector2): void;
    pointer_leave(): void;
}
//# sourceMappingURL=cloud_stamp.d.ts.map