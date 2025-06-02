import { ClickAndDragTool } from "./click_and_drag_tool"
import { Editor } from "./editor";
import { Vector2, bounding_rect } from "./types";

export class LineTool extends ClickAndDragTool {

    editing_drag(to: Vector2) {
        if (!this.drag_start) {
            return false;
        }
        const flip: boolean = (to.x < this.drag_start.x) !== (to.y < this.drag_start.y)

        let staging_canvas: HTMLCanvasElement = document.getElementById('rect_canvas') as HTMLCanvasElement

        if (!document.getElementById('rect_canvas')) {
            document.getElementById('canvas-area')!.appendChild(this.canvas!); // OD: for testing
            this.canvas!.setAttribute('id', 'rect_canvas')
        }
        const draw_on_canvas = (context: CanvasRenderingContext2D) => {
            context.strokeStyle = 'black'; // OD: for testing
            context.beginPath()
            context.moveTo(this.drag_start!.x, this.drag_start!.y)
            context.lineTo(to.x, to.y)
            // if (flip) {
            //         context.moveTo(this.drag_start.x, this.drag_start.y)
            //         context.lineTo(to.x,to.y)
            //     } else {
            //         context.moveTo(0, 0)
            //         context.lineTo(this.w, this.h)
            //     }
            context.stroke()
        }
        const canvas_bounding_rect = bounding_rect(this.drag_start, to);
        this.canvas_bounds_signal!.value = {
            from: canvas_bounding_rect,
            to: canvas_bounding_rect
        };
        const w = canvas_bounding_rect.w;
        const h = canvas_bounding_rect.h;
        this.extend_canvas(canvas_bounding_rect);
        this.context!.fillStyle = 'rgb(1,1,1,0)'
        this.context!.fillRect(0, 0, w, h);
        draw_on_canvas(this.context!)
        return true;
    }
}
