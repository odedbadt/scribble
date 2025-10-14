import { ClickAndDragTool } from "./click_and_drag_tool"
import { Editor } from "./editor";
import { SettingName, settings } from "./settings_registry";
import { Vector2, bounding_rect } from "./types";

export class ScribbleTool extends ClickAndDragTool {
    private _prev: Vector2 | null = null;
    protected _stroke_color: string;
    constructor() {
        super()
        this._stroke_color = settings.peek<string>(
            SettingName.ForeColor);
    }
    editing_drag(from: Vector2, to: Vector2) {
        const lw = settings.peek<number>(SettingName.LineWidth);
        this.extend_canvas_mapping(to, true, lw / 2);
        const context = this.context!;
        const canvas = this.canvas!;

        if (this._prev == null) {
            this._prev = { x: to.x, y: to.y }
        }



        const bounds = this.canvas_bounds_mapping!.to;
        const fx = Math.floor(this._prev.x - bounds.x)
        const fy = Math.floor(this._prev.y - bounds.y)
        const cx = Math.floor(to.x - bounds.x)
        const cy = Math.floor(to.y - bounds.y)
        context.lineWidth = lw;
        context.moveTo(fx, fy)
        context.lineTo(cx, cy)
        context.strokeStyle = this._stroke_color;
        context.stroke()
        context.ellipse(cx, cy, lw / 2, lw / 2, 0, 0, Math.PI * 2)
        context.fillStyle = this._stroke_color;
        context.fill()
        this._prev = { ...to }
        this.publish_signals();

    }
    editing_stop() {
        this._prev = null;
    }

}
