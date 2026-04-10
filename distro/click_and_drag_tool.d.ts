import { EditingTool } from "./editing_tool";
import { Vector2 } from "./types";
import { RGBA } from "./pixel_utils";
export declare abstract class ClickAndDragTool extends EditingTool {
    dirty: boolean;
    drag_start: Vector2 | null;
    protected _start_buttons: number;
    private _hover_circle_cache;
    private _hover_circle_cache_radius;
    private _hover_circle_cache_color;
    init(): void;
    select(): void;
    start(at: Vector2, buttons: number): void;
    editing_start(): void;
    drag(at: Vector2): void;
    hover(at: Vector2): false | undefined;
    hover_color(): RGBA;
    hover_action(at: Vector2): void;
    _draw_center_cross(imageData: ImageData, center: {
        x: number;
        y: number;
    }): void;
    pointer_leave(): void;
    editing_drag(from: Vector2, to: Vector2): void;
    commit_to_document(color?: string | null): void;
    stop(at: Vector2): void;
    on_doc_origin_shift(dx: number, dy: number): void;
}
//# sourceMappingURL=click_and_drag_tool.d.ts.map