import { ClickAndDragTool } from "./click_and_drag_tool.js"
import { override_canvas_context } from "./utils.js"
import { EditingToolApplier } from "./editing_tool_applier.js";
export class CursorSize  extends ClickAndDragTool {
    constructor(context:CanvasRenderingContext2D, applier:EditingToolApplier, 
        tmp_context:CanvasRenderingContext2D) {
        super(context, applier, false, tmp_context);
    }
    editing_action(at:Vector2) {
        const r = Math.sqrt((at.x - this.from.x)*(at.x - this.from.x)+
        (at.y - this.from.y)*(at.y - this.from.y))
        this.tmp_context.beginPath();
        this.tmp_context.ellipse(
                this.from.x,this.from.y,r,r,0,0,Math.PI*2);
        this.tmp_context.fill();
        this.app.settings.line_width = 2*r;
        override_canvas_context(this.app.view_context, this.app.tool_tmp_canvas, true);
        return false;
    }
    hover(at:Vector2):boolean{
        return false
    }
}