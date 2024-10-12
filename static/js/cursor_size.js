import ClickAndDragTool from "./click_and_drag_tool.js" 
import { override_canvas_context } from "./editing_tool.js"
export class CursorSize  extends ClickAndDragTool {
    constructor(context, applier, tmp_context) {
        super(context, applier, false, tmp_context);
    }
    editing_action(at) {
        const r = Math.sqrt((at[0] - this.from[0])*(at[0] - this.from[0])+
        (at[1] - this.from[1])*(at[1] - this.from[1]))
        this.tmp_context.beginPath();
        this.tmp_context.ellipse(
                this.from[0],this.from[1],r,r,0,0,Math.PI*2);
        this.tmp_context.fill();
        this.app.settings.line_width = 2*r;
        override_canvas_context(this.app.view_context, this.app.tool_tmp_canvas, true);
        return false;

    }
    hover(at) {
    }
}
