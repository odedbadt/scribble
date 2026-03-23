import { ClickAndDragTool } from "./click_and_drag_tool"
import { Editor } from "./editor";
import { SettingName, settings } from "./settings_registry";
import { Vector2, bounding_rect } from "./types";
import { drawFilledRect, drawRect, parseColor, RGBA } from "./pixel_utils";

export class RectTool extends ClickAndDragTool {
    protected _stroke_color: RGBA;
    protected _fill: boolean = true;

    constructor() {
        super();
        this._stroke_color = [0, 0, 0, 255];
    }

    editing_start() {
        const colorStr = settings.peek<string>(SettingName.ForeColor);
        this._stroke_color = parseColor(colorStr);
        this._fill = settings.peek<boolean>(SettingName.Filled) ?? true;
    }

    editing_drag(from: Vector2, to: Vector2) {
        const context = this.context!;
        const canvas = this.canvas!;

        const extended_canvas_bounding_rect = bounding_rect(from, to);
        this.extend_canvas_mapping(extended_canvas_bounding_rect, false);

        const bounds = this.canvas_bounds_mapping!.to;
        const w = Math.floor(extended_canvas_bounding_rect.w);
        const h = Math.floor(extended_canvas_bounding_rect.h);

        // Get image data and draw using pixel-perfect algorithms
        const imageData = context.getImageData(0, 0, canvas.width, canvas.height);

        if (this._fill) {
            drawFilledRect(imageData, 0, 0, w, h, this._stroke_color);
        } else {
            drawRect(imageData, 0, 0, w, h, this._stroke_color);
        }

        context.putImageData(imageData, 0, 0);
        this.publish_signals();
    }
}
