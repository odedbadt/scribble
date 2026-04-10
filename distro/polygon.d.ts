import { EditingTool } from "./editing_tool";
import { Vector2 } from "./types";
export declare class PolygonTool extends EditingTool {
    private _vertices;
    private _line_color;
    private _fill_color;
    private _fill_outline;
    private _last_click_time;
    select(): void;
    start(at: Vector2, buttons: number): void;
    drag(at: Vector2): void;
    stop(at: Vector2): void;
    hover(at: Vector2): void;
    pointer_leave(): void;
    private _setup_canvas;
    private _render;
    private _commit;
    private _reset;
}
//# sourceMappingURL=polygon.d.ts.map