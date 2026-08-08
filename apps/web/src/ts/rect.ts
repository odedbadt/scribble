import { ClickAndDragTool } from "./click_and_drag_tool"
import { Editor } from "./editor";
import { SettingName, settings } from "./settings_registry";
import { Vector2, bounding_rect } from "./types";
import { drawFilledRect, drawRect, drawThickRect, parseColor, RGBA, applyPatternFill } from "./pixel_utils";
import { fill_pattern } from "./fill_pattern";

export class RectTool extends ClickAndDragTool {
    protected _line_color: RGBA;
    protected _fill_color: RGBA;
    protected _fill_outline: number = 0; // 0: both, 1: fill only, 2: outline only

    constructor() {
        super();
        this._line_color = [0, 0, 0, 255];
        this._fill_color = [255, 255, 255, 255];
    }

    editing_start() {
        this._line_color = parseColor(settings.peek<string>(SettingName.ForeColor));
        this._fill_color = parseColor(settings.peek<string>(SettingName.FillColor));
        this._fill_outline = settings.peek<number>(SettingName.FillOutline) ?? 0;
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

        // 0: both, 1: fill only, 2: outline only
        if (this._fill_outline === 0 || this._fill_outline === 1) {
            drawFilledRect(imageData, 0, 0, w, h, this._fill_color);
            if (fill_pattern.enabled.value && fill_pattern.data) {
                applyPatternFill(imageData, Math.floor(br.x), Math.floor(br.y), fill_pattern.data, this._fill_color);
            }
            if (this._fill_outline === 1) {
                // Clear outline to transparent
                for (let i = 0; i < thickness; i++) {
                    for (let x = i; x < w - i; x++) {
                        imageData.data[(i * w + x) * 4 + 3] = 0;
                        imageData.data[((h - 1 - i) * w + x) * 4 + 3] = 0;
                    }
                    for (let y = i; y < h - i; y++) {
                        imageData.data[(y * w + i) * 4 + 3] = 0;
                        imageData.data[(y * w + (w - 1 - i)) * 4 + 3] = 0;
                    }
                }
            }
        }
        if (this._fill_outline === 0 || this._fill_outline === 2) {
            drawThickRect(imageData, 0, 0, w, h, thickness, this._line_color);
            if (this._fill_outline === 2) {
                // Clear fill area to transparent
                for (let y = thickness; y < h - thickness; y++) {
                    for (let x = thickness; x < w - thickness; x++) {
                        imageData.data[(y * w + x) * 4 + 3] = 0;
                    }
                }
            }
        }

        context.putImageData(imageData, 0, 0);
        this.publish_signals();
    }
}
