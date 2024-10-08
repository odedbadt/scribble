import ClickAndDragTool from "./click_and_drag_tool.js" 

export class RectTool extends ClickAndDragTool {
    constructor(context, applier) {
        super(context, applier, false);
    }
    editing_action(to) {
        this.context.rect(
                this.from[0],this.from[1],to[0] - this.from[0], to[1] - this.from[1]);
        this.context.fill();
        return true;
    }
}
