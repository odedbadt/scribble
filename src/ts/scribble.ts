import { ClickAndDragTool } from "./click_and_drag_tool"
import { Editor } from "./editor";
import { SettingName, settings } from "./settings_registry";
import { Vector2 } from "./types";
import { rect_union } from "./utils";

export class ScribbleTool extends ClickAndDragTool {
    private _prev: Vector2 | null = null;
    editing_drag(from: Vector2, to: Vector2) {

        const context = this.context!;
        const canvas = this.canvas!;

        if (this._prev == null) {
            this._prev = { x: to.x, y: to.y }
        }

        const bounds = this.canvas_bounds_mapping_signal!.value.to;
        const fx = Math.floor(this._prev.x - bounds.x)
        const fy = Math.floor(this._prev.y - bounds.y)
        const cx = Math.floor(to.x - bounds.x)
        const cy = Math.floor(to.y - bounds.y)
        const lw = settings.peek<number>(SettingName.LineWidth);
        const lwb = lw * 1.2;
        const new_bounds = rect_union(
            bounds, { x: cx - lwb, y: cy - lwb, w: lwb * 2, h: lwb * 2 }
        );
        const from_bounds_px = {}
        const color = settings.peek<string>(SettingName.ForeColor);
        this.extend_canvas_mapping(new_bounds);
        context.lineWidth = lw;
        context.beginPath()
        context.moveTo(fx, fy)
        context.lineTo(cx, cy)
        context.strokeStyle = color
        context.stroke()
        context.ellipse(cx, cy, lw / 2, lw / 2, 0, 0, Math.PI * 2)
        context.fillStyle = color;
        context.fill()
        this._prev = { ...to }

    }
    editing_start() {
        // nop, implemenet me
        return false;
    }

}
