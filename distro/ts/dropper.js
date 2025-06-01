import { ClickTool } from "./click_tool";
export class Dropper extends ClickTool {
    action(at) {
        throw new Error("Method not implemented.");
    }
    stop(at) {
        throw new Error("Method not implemented.");
    }
    constructor(editor) {
        super(editor);
    }
    editing_start(at, buttons) {
        const color = this.app.document_context.getImageData(at.x, at.y, 1, 1).data;
        const sampled_color = `rgba(${color[0]},${color[1]},${color[2]},255)`;
        this.app.color_stack.select_color(Array.from(color), !!(buttons & 1), true);
        if (this.editor.previous_tool_name) {
            this.app.select_tool(this.editor.previous_tool_name);
        }
        return false;
    }
    hover(at) {
        return false;
    }
}
//# sourceMappingURL=dropper.js.map