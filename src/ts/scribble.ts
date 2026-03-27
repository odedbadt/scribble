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
            // Extend canvas to cover the full document so all rotated points fit
            this.extend_canvas_mapping(
                { x: 0, y: 0, w: this.document_canvas!.width, h: this.document_canvas!.height },
                true
            );
        } else {
            line_pairs = [{ from: prev, to }];
            this.extend_canvas_mapping(to, true, radius + 1);
        }

        const context = this.context!;
        const canvas = this.canvas!;
        const bounds = this.canvas_bounds_mapping!.to;
        const imageData = context.getImageData(0, 0, canvas.width, canvas.height);

        for (const pair of line_pairs) {
            const fx = Math.floor(pair.from.x - bounds.x);
            const fy = Math.floor(pair.from.y - bounds.y);
            const cx = Math.floor(pair.to.x - bounds.x);
            const cy = Math.floor(pair.to.y - bounds.y);
            if (radius <= 0) {
                drawLine(imageData, fx, fy, cx, cy, this._stroke_color);
            } else {
                drawThickLine(imageData, fx, fy, cx, cy, radius, this._stroke_color);
            }
        }

        context.putImageData(imageData, 0, 0);
        this.publish_signals();
    }

    commit_to_document(color: string | null = null) {
        if (color == null) {
            const is_right = (this._start_buttons & 2) !== 0;
            color = settings.peek<string>(is_right ? SettingName.BackColor : SettingName.ForeColor);
        }
        super.commit_to_document(color);
    }

    editing_stop() {
        this._prev = null;
    }

    pointer_leave() {
        this._prev = null;
        super.pointer_leave();
    }
}
