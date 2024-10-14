import { ClickAndDragTool } from "./click_and_drag_tool.js" 
import { EditingToolApplier } from "./editing_tool_applier.js";
export class EraserTool extends ClickAndDragTool{
    private _recorded_to: any;
    constructor(context:CanvasRenderingContext2D
        , applier:EditingToolApplier, tmp_context:CanvasRenderingContext2D) {
        super(context, applier, true, tmp_context);
        }
    hover_action(at:Vector2):boolean {
        if (!this.tmp_context) {
            return false;
        }                

        this.tmp_context.fillStyle = this.app.settings.back_color
        this.tmp_context.strokeStyle = this.app.settings.fore_color
        
        this.tmp_context.lineWidth = 1
        this.tmp_context.beginPath();
        const r = this.app.settings.line_width;
        this.tmp_context.ellipse(
            at.x,at.y,r,r,0,0,Math.PI*2);
        this.tmp_context.fill()
        this.tmp_context.stroke()
        return true
        
    
    }
    
    editing_action(to:Vector2) {
        if (this._recorded_to) {
            this.context.strokeStyle = this.app.settings.back_color
            this.context.lineWidth = this.app.settings.line_width * 2
            this.context.moveTo(
                this._recorded_to.x,this._recorded_to.y);
            this.context.lineTo(
                to.x,to.y);
        }
        this._recorded_to = to;
        this.context.stroke();
        return true

    }
    editing_start():boolean {
        return false
    }
    editing_stop():boolean {
        this._recorded_to = null;
        return false
    }
}
