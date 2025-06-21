import { Editor } from "./editor"
import { ClickAndDragTool } from "./click_and_drag_tool"
import { Vector2, bounding_rect } from "./types";
export class CircleTool extends ClickAndDragTool {

    editing_drag(from: Vector2, to: Vector2) {

        const margin = 0
        const r = Math.sqrt((to.x - from.x) * (to.x - from.x) +
            (to.y - from.y) * (to.y - from.y));
        const rb = r * 1.05;
        const extended_canvas_bounding_rect = { x: from.x - rb, y: from.y - rb, w: rb * 2, h: rb * 2 }
        const w = extended_canvas_bounding_rect.w;
        const h = extended_canvas_bounding_rect.h;

        this.extend_canvas_mapping(extended_canvas_bounding_rect, false);
        this.context!.beginPath();
        this.context!.fillStyle = 'red'
        this.context!.strokeStyle = 'black'
        this.context!.ellipse(rb, rb, r, r, 0, 0, Math.PI * 2);
        this.context!.fill();
        this.context!.stroke();

    }
}

