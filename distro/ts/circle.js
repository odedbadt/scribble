import { ClickAndDragTool } from "./click_and_drag_tool";
export class CircleTool extends ClickAndDragTool {
    constructor(editor) {
        super(editor);
    }
    editing_action(at) {
        if (this.from == null) {
            return false;
        }
        const r = Math.sqrt((at.x - this.from.x) * (at.x - this.from.x) +
            (at.y - this.from.y) * (at.y - this.from.y));
        this.context.ellipse(this.from.x, this.from.y, r, r, 0, 0, Math.PI * 2);
        if (this.app.settings.filled) {
            this.context.fill();
        }
        else {
            this.context.stroke();
        }
        return true;
    }
}
//# sourceMappingURL=circle.js.map