import ClickAndDragTool from "./click_and_drag_tool.js" 
import { Vector2 } from "./types"
export class LineTool  extends ClickAndDragTool {
    constructor(context, applier) {
        super(context, applier, false);
    }
    editing_action(at) {
        this.context.moveTo(
            this.from.x,this.from.y);
        this.context.lineTo(
            at.x,at.y);
        this.context.stroke();
    }
}
