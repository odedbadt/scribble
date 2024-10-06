import ClickAndDragTool from "./click_and_drag_tool.js" 

export class RectTool extends ClickAndDragTool {
    constructor(context, applier) {
        super(context, applier, false);
    }
    editing_action(from, to) {
        this.context.rect(
                from[0],from[1],to[0] - from[0], to[1] - from[1]);
        this.context.fill();
        return true;
    }
}
