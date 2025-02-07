import { EditingTool } from "./editing_tool"
import { Editor } from "./editor";


export abstract class OnSelectTool extends EditingTool {
    constructor(editor: Editor) {
        super(editor);
        this.select = this.select.bind(this);
    }
    select() {
        this.applied_context.clearRect(0, 0, this.w, this.h);
        
        this.select_action();
        //
        
        
        this.editor.undo_redo_buffer.push(this.app.document_context.getImageData(0, 0, this.w, this.h))
        
        //
        
        if (this.editor.previous_tool_name) {
            this.app.select_tool(this.editor.previous_tool_name)
        }
    }
    abstract select_action(): void
    hover(): boolean {
        return false

    }
}
