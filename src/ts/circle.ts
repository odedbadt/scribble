import { Editor } from "./editor"
import { ClickAndDragTool } from "./click_and_drag_tool"
import { SettingName, settings } from "./settings_registry";
import { Vector2 } from "./types";
import { drawCircle, drawFilledCircle, drawThickCircle, parseColor, RGBA, applyPatternFill } from "./pixel_utils";
import { mandala_mode } from "./mandala_mode";
import { fill_pattern } from "./fill_pattern";

export class CircleTool extends ClickAndDragTool {
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
        const r = Math.floor(Math.sqrt(
            (to.x - from.x) * (to.x - from.x) +
            (to.y - from.y) * (to.y - from.y)
        ));

        const context = this.context!;
        const canvas = this.canvas!;
        const lw = settings.peek<number>(SettingName.LineWidth);
        const thickness = Math.max(1, lw);

        const drawAt = (imageData: ImageData, cx: number, cy: number) => {
            // 0: both, 1: fill only, 2: outline only
            if (this._fill_outline === 0 || this._fill_outline === 1) {
                drawFilledCircle(imageData, cx, cy, r, this._fill_color);
                if (this._fill_outline === 1) {
                    // Clear outline to transparent
                    for (let angle = 0; angle < 360; angle++) {
                        for (let t = 0; t < thickness; t++) {
                            const rad = r - t;
                            const x = Math.round(cx + rad * Math.cos(angle * Math.PI / 180));
                            const y = Math.round(cy + rad * Math.sin(angle * Math.PI / 180));
                            imageData.data[(y * imageData.width + x) * 4 + 3] = 0;
                        }
                    }
                }
            }
            if (this._fill_outline === 0 || this._fill_outline === 2) {
                drawThickCircle(imageData, cx, cy, r, thickness, this._line_color);
                if (this._fill_outline === 2) {
                    // Clear fill area to transparent
                    for (let y = -r + thickness; y <= r - thickness; y++) {
                        for (let x = -r + thickness; x <= r - thickness; x++) {
                            if (x * x + y * y <= (r - thickness) * (r - thickness)) {
                                const px = cx + x, py = cy + y;
                                if (px >= 0 && px < imageData.width && py >= 0 && py < imageData.height)
                                    imageData.data[(py * imageData.width + px) * 4 + 3] = 0;
                            }
                        }
                    }
                }
            }
        };

        if (mandala_mode.enabled && this.document_canvas) {
            const center = mandala_mode.center ?? { x: this.document_canvas.width / 2, y: this.document_canvas.height / 2 };
            const docW = this.document_canvas.width;
            const docH = this.document_canvas.height;
            canvas.width = docW;
            canvas.height = docH;
            this.canvas_bounds_mapping = { from: { x: 0, y: 0, w: 1, h: 1 }, to: { x: 0, y: 0, w: docW, h: docH } };
            const imageData = context.getImageData(0, 0, docW, docH);
            for (const c of mandala_mode.get_point_transforms(from, center)) {
                drawAt(imageData, Math.round(c.x), Math.round(c.y));
            }
            if ((this._fill_outline === 0 || this._fill_outline === 1) && fill_pattern.enabled.value && fill_pattern.data) {
                applyPatternFill(imageData, 0, 0, fill_pattern.data, this._fill_color);
            }
            context.putImageData(imageData, 0, 0);
        } else {
            const margin = 2;
            const rb = r + margin;
            const br = { x: from.x - rb, y: from.y - rb, w: rb * 2, h: rb * 2 };
            canvas.width = br.w;
            canvas.height = br.h;
            this.canvas_bounds_mapping = { from: { x: 0, y: 0, w: 1, h: 1 }, to: br };
            const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
            drawAt(imageData, rb, rb);
            if ((this._fill_outline === 0 || this._fill_outline === 1) && fill_pattern.enabled.value && fill_pattern.data) {
                applyPatternFill(imageData, Math.floor(br.x), Math.floor(br.y), fill_pattern.data, this._fill_color);
            }
            context.putImageData(imageData, 0, 0);
        }

        this.publish_signals();
    }
}
