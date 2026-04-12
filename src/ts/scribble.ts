import { ClickAndDragTool } from "./click_and_drag_tool"
import { Editor } from "./editor";
import { SettingName, settings } from "./settings_registry";
import { Vector2 } from "./types";
import { drawLine, drawThickLine, drawFilledCircle, parseColor, RGBA } from "./pixel_utils";
import { mandala_mode } from "./mandala_mode";

export class ScribbleTool extends ClickAndDragTool {
    protected _prev: Vector2 | null = null;
    protected _stroke_color: RGBA;

    constructor() {
        super()
        this._stroke_color = [0, 0, 0, 255];
    }

    editing_start() {
        const is_right = (this._start_buttons & 2) !== 0;
        const colorStr = settings.peek<string>(is_right ? SettingName.BackColor : SettingName.ForeColor);
        this._stroke_color = parseColor(colorStr);
        this._prev = null;
        this.editing_drag(this.drag_start!, this.drag_start!);
    }

    editing_drag(from: Vector2, to: Vector2) {
        const lw = settings.peek<number>(SettingName.LineWidth);
        const radius = Math.floor(lw / 2);
        const prev = this._prev ?? to;
        this._prev = { ...to };

        let line_pairs: Array<{ from: Vector2, to: Vector2 }>;
        if (mandala_mode.enabled) {
            const center: Vector2 = mandala_mode.center ?? {
                x: this.document_canvas!.width / 2,
                y: this.document_canvas!.height / 2
            };
            line_pairs = mandala_mode.get_line_transforms(prev, to, center);
        } else {
            line_pairs = [{ from: prev, to }];
        }

        const context = this.context!;
        const canvas = this.canvas!;
        const cw = canvas.width;
        const ch = canvas.height;
        const pad = radius + 1;

        // Compute tight bounding box around all line pairs to minimise getImageData cost.
        let bx0 = cw, by0 = ch, bx1 = 0, by1 = 0;
        for (const pair of line_pairs) {
            const minX = Math.min(pair.from.x, pair.to.x);
            const maxX = Math.max(pair.from.x, pair.to.x);
            const minY = Math.min(pair.from.y, pair.to.y);
            const maxY = Math.max(pair.from.y, pair.to.y);
            bx0 = Math.min(bx0, Math.floor(minX) - pad);
            by0 = Math.min(by0, Math.floor(minY) - pad);
            bx1 = Math.max(bx1, Math.ceil(maxX) + pad);
            by1 = Math.max(by1, Math.ceil(maxY) + pad);
        }
        bx0 = Math.max(0, bx0); by0 = Math.max(0, by0);
        bx1 = Math.min(cw, bx1); by1 = Math.min(ch, by1);
        if (bx1 <= bx0 || by1 <= by0) return;

        const imageData = context.getImageData(bx0, by0, bx1 - bx0, by1 - by0);

        for (const pair of line_pairs) {
            const fx = Math.floor(pair.from.x) - bx0;
            const fy = Math.floor(pair.from.y) - by0;
            const cx = Math.floor(pair.to.x) - bx0;
            const cy = Math.floor(pair.to.y) - by0;
            if (radius <= 0) {
                drawLine(imageData, fx, fy, cx, cy, this._stroke_color);
            } else {
                drawThickLine(imageData, fx, fy, cx, cy, radius, this._stroke_color);
            }
        }

        context.putImageData(imageData, bx0, by0);
        this.publish_signals();
    }

    commit_to_document(color: string | null = null) {
        if (color == null) {
            const is_right = (this._start_buttons & 2) !== 0;
            color = settings.peek<string>(is_right ? SettingName.BackColor : SettingName.ForeColor);
        }
        super.commit_to_document(color);
    }

    on_doc_origin_shift(dx: number, dy: number): void {
        super.on_doc_origin_shift(dx, dy);
        if (this._prev) {
            this._prev.x += dx;
            this._prev.y += dy;
        }
    }

    editing_stop() {
        this._prev = null;
    }

    pointer_leave() {
        this._prev = null;
        super.pointer_leave();
    }
}
