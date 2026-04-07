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
        const r = Math.floor(Math.sqrt(
            (to.x - from.x) * (to.x - from.x) +
            (to.y - from.y) * (to.y - from.y)
        ));

        const context = this.context!;
        const canvas = this.canvas!;
        const lw = settings.peek<number>(SettingName.LineWidth);
        const thickness = Math.max(1, lw);

        const drawAt = (imageData: ImageData, cx: number, cy: number) => {
            if (this._fill) {
                drawFilledCircle(imageData, cx, cy, r, this._fill_color);
                drawThickCircle(imageData, cx, cy, r, thickness, this._line_color);
            } else {
                drawThickCircle(imageData, cx, cy, r, thickness, this._line_color);
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
            if (this._fill && fill_pattern.enabled.value && fill_pattern.data) {
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
            if (this._fill && fill_pattern.enabled.value && fill_pattern.data) {
                applyPatternFill(imageData, Math.floor(br.x), Math.floor(br.y), fill_pattern.data, this._fill_color);
            }
            context.putImageData(imageData, 0, 0);
        }

        this.publish_signals();
    }
}
