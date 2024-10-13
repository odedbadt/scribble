import { ClickAndDragTool } from "./click_and_drag_tool";
export class CircleTool extends ClickAndDragTool {
    constructor(context, applier) {
        super(context, applier, false);
    }
    editing_action(at) {
        const r = Math.sqrt((at.x - this.from.x) * (at.x - this.from.x) +
            (at.y - this.from.y) * (at.y - this.from.y));
        this.context.ellipse(this.from.x, this.from.y, r, r, 0, 0, Math.PI * 2);
        this.context.fill();
        return true;
    }
}
