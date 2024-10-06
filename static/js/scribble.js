import ClickAndDragTool from "./click_and_drag_tool.js" 

export class ScribbleTool extends ClickAndDragTool{
    constructor(context, applier) {
            super(context, applier, true);
        }
    editing_action(from, to) {
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
