import { EditingTool } from "./editing_tool";
import { Vector2 } from "./types";
export declare class BezierTool extends EditingTool {
    private _p0;
    private _p3;
    private _p1;
    private _p2;
    private _phase;
    private _in_drag;
    private _anchors;
    private _last_click_ms;
    private _dragging_tangent;
    private _stroke_color;
    private _fill_color;
    private _fill_outline;
    private _start_buttons;
    select(): void;
    deselect(): void;
    start(at: Vector2, buttons: number): void;
    drag(at: Vector2): void;
    stop(at: Vector2): void;
    hover(at: Vector2): void;
    pointer_leave(): void;
    private _single_start;
    private _single_drag;
    private _single_stop;
    private _single_render;
    private _single_commit;
    private _multi_start;
    private _multi_drag;
    private _multi_stop;
    private _multi_render;
    private _multi_commit;
    private _setup_canvas;
    private _do_commit;
    private _reset;
}
//# sourceMappingURL=bezier.d.ts.map