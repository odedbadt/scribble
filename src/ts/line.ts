import { ClickAndDragTool } from "./click_and_drag_tool.js" 
import { EditingToolApplier } from "./editing_tool_applier.js";

export class LineTool  extends ClickAndDragTool {
    constructor(context:CanvasRenderingContext2D, applier:EditingToolApplier) {
        super(context, applier, false);
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
