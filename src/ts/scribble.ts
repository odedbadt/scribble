import { ClickAndDragTool } from "./click_and_drag_tool"
import { Editor } from "./editor";
import { Vector2 } from "./types";
import { rect_union } from "./utils";

export class ScribbleTool extends ClickAndDragTool {
    private _prev: Vector2 | null = null;
    editing_drag(to: Vector2) {
        if (!this.drag_start) {
            return false;
        }

        const context = this.context!;
        const canvas = this.canvas!;

        if (this._prev == null) {
            this._prev = { x: to.x, y: to.y }
        }

        const bounds = this.canvas_bounds_signal!.value.to;
        const fx = Math.floor(this._prev.x - bounds.x)
        const fy = Math.floor(this._prev.y - bounds.y)
        const cx = Math.floor(to.x - bounds.x)
        const cy = Math.floor(to.y - bounds.y)
        const lw = 5 * 1.2;
        const new_bounds = rect_union(
            bounds, { x: cx - lw, y: cy - lw, w: lw * 2, h: lw * 2 })
        this.extend_canvas(new_bounds);
        context.lineWidth = 5;
        context.fillStyle = 'rgb(1,1,1,0)'
        context.fillRect(0, 0, canvas.width, canvas.height);
        context.fillStyle = 'rgba(0,0,0,1)';
        context.beginPath()
        context.moveTo(fx, fy)
        context.lineTo(cx, cy)
        context.strokeStyle = 'rgba(0,0,0,1)';
        context.lineWidth = 20
        context.stroke()
        context.ellipse(cx, cy, 10, 10, 0, 0, Math.PI * 2)
        context.lineWidth = 0
        context.strokeStyle = 'rgba(0,0,0,0)'
        context.fill()
        this._prev = { ...to }
        this.canvas_bounds_signal!.value = {
            from: from_rect,
            to: new_bounds
        }
        this.canvas_signal!.value = this.canvas!;
        return true;

    }
    editing_start() {
        // nop, implemenet me
        return false;
    }
    editing_drag__(to: Vector2) {
        if (!this.drag_start) {
            return false;
        }


        if (!document.getElementById('rect_canvas') && this.canvas != null) {
            document.getElementById('canvas-area')!.appendChild(this.canvas); // OD: for testing
            this.canvas.setAttribute('id', 'rect_canvas')
        }
        this.context!.clearRect(0, 0, this.canvas!.width, this.canvas!.height)
        const margin = 5;
        const canvas_bounding_rect = bounding_rect(this.drag_start, to);
        const extended_canvas_bounding_rect = bounding_rect(this.drag_start, to, margin);
        const w = extended_canvas_bounding_rect.w;
        const h = extended_canvas_bounding_rect.h;
        this.extend_canvas(extended_canvas_bounding_rect);
        this.context!.fillStyle = '0xFF0000FF'; // OD: for testing;
        this.context!.fillRect(
            margin,
            margin,
            w - margin * 2,
            h - margin * 2);
        this.context!.beginPath();
        this.context!.moveTo(margin, margin);
        this.context!.lineTo(w - margin, h - margin);
        this.context!.moveTo(w - margin, margin);
        this.context!.lineTo(margin, h - margin);
        this.context!.moveTo(w / 2, margin);
        this.context!.lineTo(margin, h / 2);
        this.context!.moveTo(margin, margin);
        this.context!.lineTo(w - margin, h / 2);
        this.context!.moveTo(margin, margin);
        this.context!.lineTo(w / 2, h - margin);
        this.context!.stroke()
        const from_rect = {
            x: margin / w,
            y: margin / h,
            w: 1 - 2 * margin / w,
            h: 1 - 2 * margin / h
        }
        this.canvas_bounds_signal!.value = {
            from: from_rect,
            to: canvas_bounding_rect
        }
        this.canvas_signal!.value = this.canvas!;
        return true;
    }
}
