import { EditingTool } from "./editing_tool";
export class ClickTool extends EditingTool {
    constructor(editor) {
        super(editor);
        this.start = this.start.bind(this);
    }
    select() {
    }
    start(at, buttons) {
        this.context.clearRect(0, 0, this.w, this.h);
        this.editing_start(at, buttons);
        this.editor.undo_redo_buffer.push(this.app.document_context.getImageData(0, 0, this.w, this.h));
        return true;
    }
}
//# sourceMappingURL=click_tool.js.map