import { Editor } from "./editor"
import { ClickAndDragTool } from "./click_and_drag_tool"
import { Vector2 } from "./types";
export class CircleTool  extends ClickAndDragTool {
    constructor(editor:Editor) {
        super(editor);
    }
    editing_action(at:Vector2) {
        if (this.from == null) {
            return false;
        }
        const r = Math.sqrt((at.x - this.from.x)*(at.x - this.from.x)+
        (at.y - this.from.y)*(at.y - this.from.y))
        this.applied_context.ellipse(
                this.from.x,this.from.y,r,r,0,0,Math.PI*2);
        if (this.app.settings.filled) {
            this.applied_context.fill();
        } else {
            this.applied_context.stroke();
        }
        return true;

    }
}

