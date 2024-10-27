import { Editor } from "./editor"
import { ClickAndDragTool } from "./click_and_drag_tool"
export class CircleTool  extends ClickAndDragTool {
    constructor(context:CanvasRenderingContext2D, editor:Editor) {
        super(context, editor, false);
    }
    editing_action(at:Vector2) {
        if (this.from == null) {
            return false;
        }
        const r = Math.sqrt((at.x - this.from.x)*(at.x - this.from.x)+
        (at.y - this.from.y)*(at.y - this.from.y))
        this.context.ellipse(
                this.from.x,this.from.y,r,r,0,0,Math.PI*2);
        if (this.app.settings.filled) {
            this.context.fill();
        } else {
            this.context.stroke();
        }
        return true;

    }
}

