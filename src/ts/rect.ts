import { ClickAndDragTool } from "./click_and_drag_tool.js"
import { EditingToolApplier } from "./editing_tool_applier.js";

export class RectTool extends ClickAndDragTool {
    constructor(context:CanvasRenderingContext2D, applier:EditingToolApplier) {
        super(context, applier, false);
    }
    editing_action(to:Vector2) {
        if (!this.from) {
            return false;
        }

        this.context.rect(
                this.from.x,this.from.y,to.x - this.from.x, to.y - this.from.y);
        this.context.fill();
        return true;
    }
}
