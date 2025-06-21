import { Editor } from "./editor"
import { ClickAndDragTool } from "./click_and_drag_tool"
import { Vector2, bounding_rect } from "./types";
export class CircleTool extends ClickAndDragTool {

    editing_drag(to: Vector2) {
        if (!this.drag_start) {
            return;
        }
        const margin = 0
        const r = Math.sqrt((to.x - this.drag_start!.x) * (to.x - this.drag_start!.x) +
            (to.y - this.drag_start!.y) * (to.y - this.drag_start.y));
        const extended_canvas_bounding_rect = { x: this.drag_start.x - r, y: this.drag_start.y - r, w: r * 2, h: r * 2 }
        const w = extended_canvas_bounding_rect.w;
        const h = extended_canvas_bounding_rect.h;

        this.extend_canvas_mapping(extended_canvas_bounding_rect, false);
        this.context!.beginPath();
        this.context!.fillStyle = 'red'
        this.context!.strokeStyle = 'black'
        this.context!.ellipse(r, r, r, r, 0, 0, Math.PI * 2);
        this.context!.fill();
        this.context!.stroke();

    }
}

