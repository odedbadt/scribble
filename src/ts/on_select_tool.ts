import {EditingTool } from "./editing_tool.js"
import { Editor } from "./editor.js";
import { override_canvas_context } from "./utils.js";

export abstract class OnSelectTool extends EditingTool{
    constructor(context:CanvasRenderingContext2D, editor:Editor, tmp_context?:CanvasRenderingContext2D) {
            super(context, editor, tmp_context);
            this.select = this.select.bind(this);
        }
    select() {
        this.context.clearRect(0,0,this.w,this.h);
        override_canvas_context(this.editor.app.staging_context,
                                this.editor.app.art_canvas)
        this.select_action();
        override_canvas_context(this.app.staging_context, this.app.tool_canvas, true)
        override_canvas_context(this.app.view_context, this.app.staging_canvas)
        override_canvas_context(this.app.art_context, this.app.staging_canvas)
        this.editor.undo_redo_buffer.push(this.app.art_context.getImageData(0,0,this.w,this.h))
        override_canvas_context(this.app.staging_context, this.app.art_canvas)
        override_canvas_context(this.app.staging_context, this.app.tool_canvas, true)
        override_canvas_context(this.app.view_context, this.app.staging_canvas)
        if (this.editor.previous_tool_name) {
            this.app.select_tool(this.editor.previous_tool_name)
        }
    }
    abstract select_action():void
    hover():boolean {
        return false

    }
}
