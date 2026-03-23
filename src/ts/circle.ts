import { Editor } from "./editor"
import { ClickAndDragTool } from "./click_and_drag_tool"
import { SettingName, settings } from "./settings_registry";
import { Vector2 } from "./types";
import { drawCircle, drawFilledCircle, drawThickCircle, parseColor, RGBA } from "./pixel_utils";

export class CircleTool extends ClickAndDragTool {
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
        const r = Math.floor(Math.sqrt(
            (to.x - from.x) * (to.x - from.x) +
            (to.y - from.y) * (to.y - from.y)
        ));

        const margin = 2;
        const rb = r + margin;
        const br = { x: from.x - rb, y: from.y - rb, w: rb * 2, h: rb * 2 };

        const context = this.context!;
        const canvas = this.canvas!;

        canvas.width = br.w;
        canvas.height = br.h;
        this.canvas_bounds_mapping = { from: { x: 0, y: 0, w: 1, h: 1 }, to: br };

        const cx = rb;
        const cy = rb;

        // Get image data and draw using pixel-perfect algorithms
        const imageData = context.getImageData(0, 0, canvas.width, canvas.height);

        if (this._fill) {
            drawFilledCircle(imageData, cx, cy, r, this._stroke_color);
        } else {
            const lw = settings.peek<number>(SettingName.LineWidth);
            drawThickCircle(imageData, cx, cy, r, Math.max(1, Math.floor(lw / 2)), this._stroke_color);
        }

        context.putImageData(imageData, 0, 0);
        this.publish_signals();
    }
}
