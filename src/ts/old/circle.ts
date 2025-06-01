import { Editor } from "./editor"
import { ClickAndDragTool } from "./click_and_drag_tool"
import { Vector2 } from "./types";
export class CircleTool extends ClickAndDragTool {
    constructor(editor: Editor) {
        super(editor);
    }
    editing_drag(at: Vector2) {
        if (this.drag_start == null) {
            return false;
        }
        const r = Math.sqrt((at.x - this.drag_start.x) * (at.x - this.drag_start.x) +
            (at.y - this.drag_start.y) * (at.y - this.drag_start.y))
        this.context.ellipse(
            this.drag_start.x, this.drag_start.y, r, r, 0, 0, Math.PI * 2);
        if (this.app.settings.filled) {
            this.context.fill();
        } else {
            this.context.stroke();
        }
        return true;

    }
}

