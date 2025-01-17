import { ClickAndDragTool } from "./click_and_drag_tool"
import { Editor } from "./editor";
import { Vector2 } from "./types";

export class RectTool extends ClickAndDragTool {
    constructor(context:CanvasRenderingContext2D, editor:Editor) {
        super(context, editor, false);
    }
    editing_action(to:Vector2) {
        if (!this.from) {
            return false;
        }

        this.context.rect(
                this.from.x,this.from.y,to.x - this.from.x, to.y - this.from.y);
        if (this.app.settings.filled) {
            this.context.fill();
         } else {
             this.context.stroke();
         }
        return true;
    }
}
