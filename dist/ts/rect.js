import { ClickAndDragTool } from "./click_and_drag_tool.js";
export class RectTool extends ClickAndDragTool {
    constructor(context, applier) {
        super(context, applier, false);
    }
    editing_action(to) {
        this.context.rect(this.from.x, this.from.y, to.x - this.from.x, to.y - this.from.y);
        this.context.fill();
        return true;
    }
}
