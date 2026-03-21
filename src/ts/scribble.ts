import { ClickAndDragTool } from "./click_and_drag_tool"
import { Editor } from "./editor";
import { SettingName, settings } from "./settings_registry";
import { Vector2, bounding_rect } from "./types";
import { drawLine, drawThickLine, drawFilledCircle, parseColor, RGBA } from "./pixel_utils";

export class ScribbleTool extends ClickAndDragTool {
    private _prev: Vector2 | null = null;
    protected _stroke_color: RGBA;

    constructor() {
        super()
        this._stroke_color = [0, 0, 0, 255];
    }

    editing_start() {
        const colorStr = settings.peek<string>(SettingName.ForeColor);
        this._stroke_color = parseColor(colorStr);
    }

    editing_drag(from: Vector2, to: Vector2) {
        const lw = settings.peek<number>(SettingName.LineWidth);
        const radius = Math.floor(lw / 2);
        this.extend_canvas_mapping(to, true, radius + 1);
        const context = this.context!;
        const canvas = this.canvas!;

        if (this._prev == null) {
            this._prev = { x: to.x, y: to.y }
        }

        const bounds = this.canvas_bounds_mapping!.to;
        const fx = Math.floor(this._prev.x - bounds.x);
        const fy = Math.floor(this._prev.y - bounds.y);
        const cx = Math.floor(to.x - bounds.x);
        const cy = Math.floor(to.y - bounds.y);

        // Get image data and draw using pixel-perfect algorithms
        const imageData = context.getImageData(0, 0, canvas.width, canvas.height);

        if (radius <= 0) {
            // For 1px brush, just draw a line
            drawLine(imageData, fx, fy, cx, cy, this._stroke_color);
        } else {
            // For thicker brushes, draw thick line
            drawThickLine(imageData, fx, fy, cx, cy, radius, this._stroke_color);
        }

        context.putImageData(imageData, 0, 0);

        this._prev = { ...to }
        this.publish_signals();
    }

    editing_stop() {
        this._prev = null;
    }

    pointer_leave() {
        this._prev = null;
    }
}
