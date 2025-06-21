import { ClickAndDragTool } from "./click_and_drag_tool"
import { Editor } from "./editor";
import { Vector2, bounding_rect } from "./types";


export class RectTool extends ClickAndDragTool {
    editing_start() {
        // nop, implemenet me
        return false;
    }
    editing_drag(to: Vector2) {
        if (!this.drag_start || this.canvas == null || this.context == null) {
            return false;
        }
        const canvas = this.canvas;
        const context = this.context;
        const margin = 0;
        const canvas_bounding_rect = bounding_rect(this.drag_start, to);
        const extended_canvas_bounding_rect = bounding_rect(this.drag_start, to, margin);
        const w = extended_canvas_bounding_rect.w;
        const h = extended_canvas_bounding_rect.h;
        this.extend_canvas_mapping(extended_canvas_bounding_rect, false);

        context.fillStyle = 'green'; // OD: for testing;
        context.fillRect(
            margin,
            margin,
            w - margin * 2,
            h - margin * 2);
        context.beginPath();
        context.moveTo(margin, margin);
        context.lineTo(w - margin, h - margin);
        context.moveTo(w - margin, margin);
        context.lineTo(margin, h - margin);
        context.moveTo(w / 2, margin);
        context.lineTo(margin, h / 2);
        context.moveTo(margin, margin);
        context.lineTo(w - margin, h / 2);
        context.moveTo(margin, margin);
        context.lineTo(w / 2, h - margin);
        context.stroke()
        const from_rect = {
            x: margin / w,
            y: margin / h,
            w: 1 - 2 * margin / w,
            h: 1 - 2 * margin / h
        }


    }
}
