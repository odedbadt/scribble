import { ClickAndDragTool } from "./click_and_drag_tool"
import { Editor } from "./editor";
import { ReadonlySignal } from "@preact/signals";
import { FillOutlineState } from "./FillOutlineState";
import { Vector2, bounding_rect } from "./types";
import { drawFilledRect, drawRect, drawThickRect, parseColor, RGBA, applyPatternFill } from "./pixel_utils";
import { fill_pattern } from "./fill_pattern";

export class RectTool extends ClickAndDragTool {
    protected _line_color: RGBA = [0, 0, 0, 255];
    protected _fill_rgba: RGBA = [255, 255, 255, 255];
    protected _fill_mode: number = 0; // 0: both, 1: fill only, 2: outline only

    constructor(
        fore_color: ReadonlySignal<string>,
        line_width: ReadonlySignal<number>,
        private _fill_color: ReadonlySignal<string>,
        private _fill_outline: ReadonlySignal<FillOutlineState>,
    ) {
        super(fore_color, line_width);
    }

    editing_start() {
        this._line_color = parseColor(this._fore_color.peek());
        this._fill_rgba = parseColor(this._fill_color.peek());
        this._fill_mode = this._fill_outline.peek() ?? 0;
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
        const lw = this._line_width.peek();
        const thickness = Math.max(1, lw);

        // 0: both, 1: fill only, 2: outline only
        if (this._fill_mode === 0 || this._fill_mode === 1) {
            drawFilledRect(imageData, 0, 0, w, h, this._fill_rgba);
            if (fill_pattern.enabled.value && fill_pattern.data) {
                applyPatternFill(imageData, Math.floor(br.x), Math.floor(br.y), fill_pattern.data, this._fill_rgba);
            }
            if (this._fill_mode === 1) {
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
        if (this._fill_mode === 0 || this._fill_mode === 2) {
            drawThickRect(imageData, 0, 0, w, h, thickness, this._line_color);
            if (this._fill_mode === 2) {
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
