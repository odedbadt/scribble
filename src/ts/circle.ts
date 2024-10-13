import { EditingToolApplier } from "./editing_tool_applier.js"
import { ClickAndDragTool } from "./click_and_drag_tool.js" 
export class CircleTool  extends ClickAndDragTool {
    constructor(context:CanvasRenderingContext2D, applier:EditingToolApplier) {
        super(context, applier, false);
    }
    editing_action(at:Vector2) {
        const r = Math.sqrt((at.x - this.from.x)*(at.x - this.from.x)+
        (at.y - this.from.y)*(at.y - this.from.y))
        this.context.ellipse(
                this.from.x,this.from.y,r,r,0,0,Math.PI*2);
        this.context.fill();
        return true;

    }
}

