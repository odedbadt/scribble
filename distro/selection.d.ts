import { ClickAndDragTool } from "./click_and_drag_tool";
import { Vector2 } from "./types";
export declare class SelectionTool extends ClickAndDragTool {
    private _selection;
    editing_start(): void;
    editing_drag(from: Vector2, to: Vector2): void;
    /** Override: auto-copy to clipboard and switch to stamp tool. */
    stop(at: Vector2): void;
    hover_action(at: Vector2): void;
    /** Keep the selection outline visible when cursor leaves. */
    pointer_leave(): void;
    deselect(): void;
    keydown(ev: KeyboardEvent): void;
    cut(): void;
    private _render_selection;
    private _render_crosshair;
    private _clear_selection_display;
}
//# sourceMappingURL=selection.d.ts.map