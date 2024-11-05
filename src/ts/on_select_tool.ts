import {EditingTool } from "./editing_tool"
import { Editor } from "./editor";

export abstract class OnSelectTool extends EditingTool{
    constructor(context:CanvasRenderingContext2D, editor:Editor, tmp_context?:CanvasRenderingContext2D) {
            super(context, editor, tmp_context);
            this.select = this.select.bind(this);
        }
    select() {
        this.context.clearRect(0,0,this.w,this.h);
        this.editor.art_to_staging()
        this.select_action();
        this.editor.tool_to_staging()
        this.editor.staging_to_view()
        this.editor.staging_to_art()
        this.editor.undo_redo_buffer.push(this.app.art_context.getImageData(0,0,this.w,this.h))
        this.editor.art_to_staging()
        this.editor.tool_to_staging()
        this.editor.staging_to_view()
        if (this.editor.previous_tool_name) {
            this.app.select_tool(this.editor.previous_tool_name)
        }
    }
    abstract select_action():void
    hover():boolean {
        return false

    }
}
