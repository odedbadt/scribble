import { ClickAndDragTool } from "./click_and_drag_tool";
import { Vector2 } from "./types";
export declare class TopoHullTool extends ClickAndDragTool {
    private _prev_point;
    private _pos_canvas;
    private _pos_ctx;
    private _neg_canvas;
    private _neg_ctx;
    private _ox;
    private _oy;
    private _cw;
    private _ch;
    private _has_session;
    private _is_right_stroke;
    private _alt_held;
    private _onKeyDown;
    private _onKeyUp;
    select(): void;
    deselect(): void;
    private _ensure_canvases;
    private _reset_curves;
    editing_start(): void;
    editing_drag(_from: Vector2, to: Vector2): void;
    hover(at: Vector2): false | undefined;
    pointer_leave(): void;
    stop(at: Vector2): void;
    private _commit_and_clear;
    private _expand;
    private _draw_segment;
    private _bfs_outside;
    private _flood_and_publish;
}
//# sourceMappingURL=topo_hull.d.ts.map