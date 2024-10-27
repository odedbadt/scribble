import { EditingTool } from "./editing_tool"
import { Editor } from "./editor";
import { override_canvas_context } from "./utils";

export abstract class ClickTool extends EditingTool {
    constructor(context:CanvasRenderingContext2D, editor:Editor) {
            super(context, editor);
            this.start = this.start.bind(this);
        }
    select() {
    }
    start(at:Vector2, buttons:number):boolean {
        this.context.clearRect(0,0,this.w,this.h);
        override_canvas_context(this.editor.app.staging_context,
                                this.editor.app.art_canvas)
        this.editing_start(at, buttons);
        override_canvas_context(this.app.staging_context, this.app.tool_canvas, true)
        override_canvas_context(this.app.view_context, this.app.staging_canvas)
        override_canvas_context(this.app.art_context, this.app.staging_canvas)
        this.editor.undo_redo_buffer.push(this.app.art_context.getImageData(0,0,this.w,this.h))
        override_canvas_context(this.app.staging_context, this.app.art_canvas)
        override_canvas_context(this.app.staging_context, this.app.tool_canvas, true)
        override_canvas_context(this.app.view_context, this.app.staging_canvas)
        return true;
    }
    abstract editing_start(at:Vector2, buttons:number):boolean

}
