import { ClickAndDragTool } from "./click_and_drag_tool"
import { Editor } from "./editor";
import { Vector2, bounding_rect } from "./types";

export class LineTool extends ClickAndDragTool {

    editing_drag(from: Vector2, to: Vector2) {
        if (!from) {
            return false;
        }
        this.extend_canvas_mapping(to, true, 0);

        const context = this.context!;

        const margin = 5;
        const canvas_bounding_rect = bounding_rect(from, to);
        const extended_canvas_bounding_rect = bounding_rect(from, to, margin);
        const w = extended_canvas_bounding_rect.w;
        const h = extended_canvas_bounding_rect.h;
        context.strokeStyle = 'red'; // OD: for testing;
        const flip = (to.x > from.x) !== (to.y > from.y)
        if (flip) {
            context.beginPath()
            context.moveTo(w - margin, margin)
            context.lineTo(margin, h - margin)
            context.stroke();
        } else {
            context.beginPath()
            context.moveTo(margin, margin)
            context.lineTo(w - margin, h - margin)
            context.stroke();
        }
        // context.fillRect(
        //     margin,
        //     margin,
        //     w - margin * 2,
        //     h - margin * 2);
        // context.beginPath();
        // context.moveTo(margin, margin);
        // context.lineTo(w - margin, h - margin);
        // context.moveTo(w - margin, margin);
        // context.lineTo(margin, h - margin);
        // context.moveTo(w / 2, margin);
        // context.lineTo(margin, h / 2);
        // context.moveTo(margin, margin);
        // context.lineTo(w - margin, h / 2);
        // context.moveTo(margin, margin);
        // context.lineTo(w / 2, h - margin);
        // context.stroke()
        const from_rect = {
            x: margin / w,
            y: margin / h,
            w: 1 - 2 * margin / w,
            h: 1 - 2 * margin / h
        }
        console.log('Drag', from, to, '->', canvas_bounding_rect)
        console.log('Will send: ', from_rect);
        this.canvas_bounds_mapping_signal!.value = {
            from: from_rect,
            to: canvas_bounding_rect
        }
        console.log('Rect Sent')
        this.canvas_signal!.value = this.canvas!;
        console.log('Canvas Sent')
        return true;
    }
}
