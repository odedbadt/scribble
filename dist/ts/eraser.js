import { ClickAndDragTool } from "./click_and_drag_tool.js";
export class EraserTool extends ClickAndDragTool {
    constructor(context, applier, tmp_context) {
        super(context, applier, true, tmp_context);
    }
    hover_action(at) {
        this.tmp_context.fillStyle = this.app.settings.back_color;
        this.tmp_context.strokeStyle = this.app.settings.fore_color;
        this.tmp_context.lineWidth = 1;
        this.tmp_context.beginPath();
        const r = 25; //this.app.settings.line_width / 2;
        this.tmp_context.ellipse(at.x, at.y, r, r, 0, 0, Math.PI * 2);
        this.tmp_context.fill();
        this.tmp_context.stroke();
        return true;
    }
    editing_action(to) {
        if (this._recorded_to) {
            this.context.strokeStyle = this.app.settings.back_color;
            this.context.lineWidth = 50;
            this.context.moveTo(this._recorded_to.x, this._recorded_to.y);
            this.context.lineTo(to.x, to.y);
        }
        this._recorded_to = to;
        this.context.stroke();
        return true;
    }
    editing_start() {
        return false;
    }
    editing_stop() {
        this._recorded_to = null;
        return false;
    }
}
