import ClickAndDragTool from "./click_and_drag_tool.js" 

export class ScribbleTool extends ClickAndDragTool{
    constructor(context, applier, tmp_context) {
            super(context, applier, true, tmp_context);
        }
    hover_action(at) {
        this.tmp_context.fillStyle = this.app.settings.fore_color;

        this.tmp_context.beginPath();
        const r = this.app.settings.line_width / 2;
        this.tmp_context.ellipse(
            at[0],at[1],r,r,0,0,Math.PI*2);
        this.tmp_context.fill()

    }
    editing_action(to) {
        if (this._recorded_to) {
        this.context.moveTo(
            this._recorded_to[0],this._recorded_to[1]);
        this.context.lineTo(
            to[0],to[1]);
        }


        this._recorded_to = to;
        this.context.stroke();
        return true;
    }
    editing_stop() {
        // nop, implemenet me
        this._recorded_to = null;
    }
}
