import ClickAndDragTool from "./click_and_drag_tool.js" 

export class LineTool  extends ClickAndDragTool {
    constructor(context, applier) {
        super(context, applier, false);
    }
    editing_action(at) {
        this.context.moveTo(
            this.from[0],this.from[1]);
        this.context.lineTo(
            at[0],at[1]);
        this.context.stroke();
    }
}
