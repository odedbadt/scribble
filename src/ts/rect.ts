import { ClickAndDragTool } from "./click_and_drag_tool"
import { Editor } from "./editor";
import { SettingName, settings } from "./settings_registry";
import { Vector2, bounding_rect } from "./types";
import { drawFilledRect, drawRect, drawThickRect, parseColor, RGBA } from "./pixel_utils";

export class RectTool extends ClickAndDragTool {
    protected _line_color: RGBA;
    protected _fill_color: RGBA;
    protected _fill: boolean = true;

    constructor() {
        super();
        this._line_color = [0, 0, 0, 255];
        this._fill_color = [255, 255, 255, 255];
    }

    editing_start() {
        this._line_color = parseColor(settings.peek<string>(SettingName.ForeColor));
        this._fill_color = parseColor(settings.peek<string>(SettingName.FillColor));
        this._fill = settings.peek<boolean>(SettingName.Filled) ?? true;
    }

    editing_drag(from: Vector2, to: Vector2) {
        const context = this.context!;
        const canvas = this.canvas!;

        const br = bounding_rect(from, to);
        const w = Math.floor(br.w);
        const h = Math.floor(br.h);

        canvas.width = w;
        canvas.height = h;
        this.canvas_bounds_mapping = { from: { x: 0, y: 0, w: 1, h: 1 }, to: br };

        const imageData = context.getImageData(0, 0, w, h);
        const lw = settings.peek<number>(SettingName.LineWidth);
        const thickness = Math.max(1, lw);

        if (this._fill) {
            drawFilledRect(imageData, 0, 0, w, h, this._fill_color);
            drawThickRect(imageData, 0, 0, w, h, thickness, this._line_color);
        } else {
            drawThickRect(imageData, 0, 0, w, h, thickness, this._line_color);
        }

        context.putImageData(imageData, 0, 0);
        this.publish_signals();
    }
}
