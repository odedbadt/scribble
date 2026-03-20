import { ClickAndDragTool } from "./click_and_drag_tool"
import { Editor } from "./editor";
import { SettingName, settings } from "./settings_registry";
import { Vector2, bounding_rect } from "./types";
import { drawLine, drawThickLine, parseColor, RGBA } from "./pixel_utils";

export class LineTool extends ClickAndDragTool {
    protected _stroke_color: RGBA;

    constructor() {
        super();
        this._stroke_color = [0, 0, 0, 255];
    }

    editing_start() {
        const colorStr = settings.peek<string>(SettingName.ForeColor);
        this._stroke_color = parseColor(colorStr);
    }

    editing_drag(from: Vector2, to: Vector2) {
        if (!from) {
            return false;
        }

        const lw = settings.peek<number>(SettingName.LineWidth);
        const radius = Math.floor(lw / 2);
        const margin = radius + 1;

        const extended_canvas_bounding_rect = bounding_rect(from, to);
        this.extend_canvas_mapping(extended_canvas_bounding_rect, false, margin);

        const bounds = this.canvas_bounds_mapping!.to;
        const context = this.context!;
        const canvas = this.canvas!;

        const x0 = Math.floor(from.x - bounds.x);
        const y0 = Math.floor(from.y - bounds.y);
        const x1 = Math.floor(to.x - bounds.x);
        const y1 = Math.floor(to.y - bounds.y);

        // Get image data and draw using pixel-perfect algorithms
        const imageData = context.getImageData(0, 0, canvas.width, canvas.height);

        if (radius <= 0) {
            drawLine(imageData, x0, y0, x1, y1, this._stroke_color);
        } else {
            drawThickLine(imageData, x0, y0, x1, y1, radius, this._stroke_color);
        }

        context.putImageData(imageData, 0, 0);
        this.publish_signals();
    }
}
