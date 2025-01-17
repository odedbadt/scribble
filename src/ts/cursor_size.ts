import { ClickAndDragTool } from "./click_and_drag_tool"
import { Editor } from "./editor";
import { Vector2, unit_rect } from "./types";
export class CursorSize  extends ClickAndDragTool {
    constructor(context:CanvasRenderingContext2D, editor:Editor,
        tmp_context:CanvasRenderingContext2D) {
        super(context, editor, false, tmp_context);
    }
    editing_start():boolean {
        if (!this.tmp_context) {
            return false;
        }
        this.tmp_context.fillStyle = this.app.settings.fore_color;
        this.tmp_context.strokeStyle = this.app.settings.fore_color;
        this.tmp_context.lineWidth = this.app.settings.line_width;
        this.tmp_context.lineCap = 'round';
        return false;
    }
    start(at:Vector2, buttons:number):boolean {
        this.app.settings.line_width = 0.5;
        super.start(at, buttons)
        return false
    }
    editing_action(at:Vector2) {
        if (this.from == null) {
            return false;
        }
        if (!this.tmp_context) {
            return false;
        }
        this.app.tool_tmp_context.clearRect(0,0,this.w,this.h);
        this.editor.art_to_staging()
        this.editor.staging_to_view()

        const r = Math.sqrt((at.x - this.from.x)*(at.x - this.from.x)+
        (at.y - this.from.y)*(at.y - this.from.y))
        this.tmp_context.beginPath();
        this.tmp_context.ellipse(
                this.from.x,this.from.y,r,r,0,0,Math.PI*2);
        this.tmp_context.fill();
        this.app.settings.line_width = 2*r;
        this.editor.tmp_tool_to_view()

        return false;
    }
    hover(at:Vector2):boolean{
        return false
    }
    editing_stop(at:Vector2):boolean {
        if (this.editor.previous_tool_name) {
            this.app.select_tool(this.editor.previous_tool_name)
        }
        return false;
    }
}