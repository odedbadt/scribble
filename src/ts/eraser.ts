import { ClickAndDragTool } from "./click_and_drag_tool"
import { Editor } from "./editor";
import { Vector2 } from "./types";
export class EraserTool extends ClickAndDragTool{
    private _recorded_to: any;
    constructor(editor:Editor) {
        super(editor);
        }
    hover_action(at:Vector2):boolean {
        if (!this.staging_context) {
            return false;
        }

        this.staging_context.fillStyle = this.app.settings.back_color
        this.staging_context.strokeStyle = this.app.settings.fore_color

        this.staging_context.lineWidth = 1
        this.staging_context.beginPath();
        const r = this.app.settings.line_width;
        this.staging_context.ellipse(
            at.x,at.y,r,r,0,0,Math.PI*2);
        this.staging_context.fill()
        this.staging_context.stroke()
        return true


    }

    editing_action(to:Vector2) {
        if (this._recorded_to) {
            this.applied_context.strokeStyle = this.app.settings.back_color
            this.applied_context.lineWidth = this.app.settings.line_width * 2
            this.applied_context.moveTo(
                this._recorded_to.x,this._recorded_to.y);
            this.applied_context.lineTo(
                to.x,to.y);
        }
        this._recorded_to = to;
        this.applied_context.stroke();
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
