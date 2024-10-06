import ClickAndDragTool from "./click_and_drag_tool.js" 

export class EraserTool  extends ClickAndDragTool{
    constructor(context, applier) {
        super(context, applier, true);
        }
    editing_action(from, to) {
        if (this._recorded_to) {
            this.context.strokeStyle = this.app.settings.back_color
            this.context.lineWidth = 50
        this.context.moveTo(
            this._recorded_to[0],this._recorded_to[1]);
        this.context.lineTo(
            to[0],to[1]);
        }
        this._recorded_to = to;
        this.context.stroke();
        return true

    }
    editing_start() {
    }
    editing_stop() {
        this._recorded_to = null;
    }
}
