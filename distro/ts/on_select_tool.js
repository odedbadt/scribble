import { EditingTool } from "./editing_tool";
export class OnSelectTool extends EditingTool {
    constructor(editor) {
        super(editor);
        this.select = this.select.bind(this);
    }
    select() {
        this.context.clearRect(0, 0, this.w, this.h);
        this.select_action();
        //
        this.editor.undo_redo_buffer.push(this.app.document_context.getImageData(0, 0, this.w, this.h));
        //
        if (this.editor.previous_tool_name) {
            this.app.select_tool(this.editor.previous_tool_name);
        }
    }
    hover() {
        return false;
    }
}
//# sourceMappingURL=on_select_tool.js.map