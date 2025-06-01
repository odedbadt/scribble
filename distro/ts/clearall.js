import { OnSelectTool } from "./on_select_tool";
export class ClearAllTool extends OnSelectTool {
    start(at, buttons) {
        throw new Error("Method not implemented.");
    }
    action(at) {
        throw new Error("Method not implemented.");
    }
    stop(at) {
        throw new Error("Method not implemented.");
    }
    constructor(editor) {
        super(editor);
        this.editor = editor;
        this.app = editor.app;
    }
    select_action() {
        const w = this.context.canvas.clientWidth;
        const h = this.context.canvas.clientHeight;
        this.context.fillStyle = this.app.settings.back_color;
        this.context.fillRect(0, 0, w, h);
    }
    hover() {
        return false;
    }
}
//# sourceMappingURL=clearall.js.map