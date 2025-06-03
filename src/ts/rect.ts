import { ClickAndDragTool } from "./click_and_drag_tool"
import { Editor } from "./editor";
import { Vector2, bounding_rect } from "./types";


export class RectTool extends ClickAndDragTool {
    editing_start() {
        // nop, implemenet me
        return false;
    }
    editing_drag(to: Vector2) {
        if (!this.drag_start) {
            return false;
        }

        let staging_canvas: HTMLCanvasElement = document.getElementById('rect_canvas') as HTMLCanvasElement

        if (!document.getElementById('rect_canvas') && this.canvas != null) {
            document.getElementById('canvas-area')!.appendChild(this.canvas); // OD: for testing
            this.canvas.setAttribute('id', 'rect_canvas')
        }
        this.context!.clearRect(0, 0, this.canvas!.width, this.canvas!.height)

        const margin = 5;
        const canvas_bounding_rect = bounding_rect(this.drag_start, to);
        const extended_canvas_bounding_rect = bounding_rect(this.drag_start, to, margin);
        console.log('Sending', this.drag_start, to, '->', canvas_bounding_rect)
        const canvas_w = this.canvas!.width;
        const canvas_h = this.canvas!.height;





        canvas_bounding_rect;
        const w = extended_canvas_bounding_rect.w;
        const h = extended_canvas_bounding_rect.h;
        this.extend_canvas(extended_canvas_bounding_rect);
        this.context!.fillStyle = 'red'; // OD: for testing;
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
        console.log('From rect: ', from_rect);
        this.canvas_bounds_signal!.value = {
            from: from_rect,
            to: canvas_bounding_rect
        }
        this.canvas_signal!.value = this.canvas!;
        return true;
    }
}
