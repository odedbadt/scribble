import { ClickAndDragTool } from "./click_and_drag_tool"
import { Editor } from "./editor";
import { Vector2 } from "./types";

export class LineTool  extends ClickAndDragTool {
    constructor(context:CanvasRenderingContext2D, editor:Editor) {
        super(context, editor, false);
    }
    editing_action(at:Vector2) {
        if (!this.from) {
            return false;
        }
        this.context.moveTo(
            this.from.x,this.from.y);
        this.context.lineTo(
            at.x,at.y);
        this.context.stroke();
        return true
    }
}
