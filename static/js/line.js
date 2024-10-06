import ClickAndDragTool from "./click_and_drag_tool.js" 

export class LineTool  extends ClickAndDragTool {
    constructor(context, applier) {
        super(context, applier, false);
    }
    editing_action(from, to) {
        this.context.moveTo(
            from[0],from[1]);
        this.context.lineTo(
            to[0],to[1]);
        this.context.stroke();
    }
}
