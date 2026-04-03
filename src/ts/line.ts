import { ClickAndDragTool } from "./click_and_drag_tool"
import { Editor } from "./editor";
import { SettingName, settings } from "./settings_registry";
import { Vector2, bounding_rect } from "./types";
import { drawLine, drawThickLine, parseColor, RGBA } from "./pixel_utils";
import { mandala_mode } from "./mandala_mode";

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
        const context = this.context!;
        const canvas = this.canvas!;

        let pairs: Array<{ from: Vector2, to: Vector2 }>;
        if (mandala_mode.enabled && this.document_canvas) {
            const center = mandala_mode.center ?? { x: this.document_canvas.width / 2, y: this.document_canvas.height / 2 };
            pairs = mandala_mode.get_line_transforms(from, to, center);
        } else {
            pairs = [{ from, to }];
        }

        const imageData = context.getImageData(0, 0, canvas.width, canvas.height);

        for (const pair of pairs) {
            const x0 = Math.floor(pair.from.x);
            const y0 = Math.floor(pair.from.y);
            const x1 = Math.floor(pair.to.x);
            const y1 = Math.floor(pair.to.y);
            if (radius <= 0) {
                drawLine(imageData, x0, y0, x1, y1, this._stroke_color);
            } else {
                drawThickLine(imageData, x0, y0, x1, y1, radius, this._stroke_color);
            }
        }

        context.putImageData(imageData, 0, 0);
        this.publish_signals();
    }
}
