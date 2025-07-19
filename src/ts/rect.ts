import { ClickAndDragTool } from "./click_and_drag_tool"
import { Editor } from "./editor";
import { SettingName, settings } from "./settings_registry";
import { Vector2, bounding_rect } from "./types";
import { extend_canvas_mapping } from "./utils";


export class RectTool extends ClickAndDragTool {
    editing_start() {
        // nop, implemenet me
        return false;
    }
    editing_drag(from: Vector2, to: Vector2) {
        const context = this.context!;
        const margin = 0;
        const extended_canvas_bounding_rect = bounding_rect(from, to, margin);
        const w = extended_canvas_bounding_rect.w;
        const h = extended_canvas_bounding_rect.h;
        extend_canvas_mapping(this, extended_canvas_bounding_rect, false);
        const color = settings.peek<string>(SettingName.ForeColor);
        context.fillStyle = color; // OD: for testing;
        context.fillRect(
            margin,
            margin,
            w - margin * 2,
            h - margin * 2);

    }
}
