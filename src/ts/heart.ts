import { ClickAndDragTool } from "./click_and_drag_tool";
import { SettingName, settings } from "./settings_registry";
import { Vector2 } from "./types";
import { drawFilledHeart, drawHeartOutline, drawFilledStraightSouthHeart, drawStraightSouthHeartOutline, parseColor, RGBA } from "./pixel_utils";
import { mandala_mode } from "./mandala_mode";

export class HeartTool extends ClickAndDragTool {
    protected _line_color: RGBA = [0, 0, 0, 255];
    protected _fill_color: RGBA = [255, 255, 255, 255];
    protected _fill: boolean = true;

    editing_start() {
        this._line_color = parseColor(settings.peek<string>(SettingName.ForeColor));
        this._fill_color = parseColor(settings.peek<string>(SettingName.FillColor));
        this._fill = settings.peek<boolean>(SettingName.Filled) ?? true;
    }

    editing_drag(from: Vector2, to: Vector2) {
        const r = Math.max(1, Math.floor(Math.sqrt(
            (to.x - from.x) ** 2 + (to.y - from.y) ** 2
        )));
        const lw = settings.peek<number>(SettingName.LineWidth);
        const thickness = Math.max(1, lw);

        const straight = settings.peek<string>(SettingName.HeartSouth) === 'straight';
        const drawAt = (imageData: ImageData, cx: number, cy: number) => {
            if (this._fill) {
                if (straight) {
                    drawFilledStraightSouthHeart(imageData, cx, cy, r, this._fill_color);
                    drawStraightSouthHeartOutline(imageData, cx, cy, r, thickness, this._line_color);
                } else {
                    drawFilledHeart(imageData, cx, cy, r, this._fill_color);
                    drawHeartOutline(imageData, cx, cy, r, thickness, this._line_color);
                }
            } else {
                if (straight) drawStraightSouthHeartOutline(imageData, cx, cy, r, thickness, this._line_color);
                else drawHeartOutline(imageData, cx, cy, r, thickness, this._line_color);
            }
        };

        const context = this.context!;
        const canvas = this.canvas!;

        if (mandala_mode.enabled && this.document_canvas) {
            const center = mandala_mode.center ?? { x: this.document_canvas.width / 2, y: this.document_canvas.height / 2 };
            const docW = this.document_canvas.width, docH = this.document_canvas.height;
            canvas.width = docW; canvas.height = docH;
            this.canvas_bounds_mapping = { from: { x: 0, y: 0, w: 1, h: 1 }, to: { x: 0, y: 0, w: docW, h: docH } };
            const imageData = context.getImageData(0, 0, docW, docH);
            for (const c of mandala_mode.get_point_transforms(from, center))
                drawAt(imageData, Math.round(c.x), Math.round(c.y));
            context.putImageData(imageData, 0, 0);
        } else {
            const bound = Math.ceil(r * 1.5) + 2;
            const br = { x: from.x - bound, y: from.y - bound, w: bound * 2, h: bound * 2 };
            canvas.width = br.w; canvas.height = br.h;
            this.canvas_bounds_mapping = { from: { x: 0, y: 0, w: 1, h: 1 }, to: br };
            const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
            drawAt(imageData, bound, bound);
            context.putImageData(imageData, 0, 0);
        }

        this.publish_signals();
    }
}
