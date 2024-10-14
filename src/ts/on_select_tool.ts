import {EditingTool } from "./editing_tool.js"
import { EditingToolApplier } from "./editing_tool_applier.js";
import { override_canvas_context } from "./utils.js";

export abstract class OnSelectTool extends EditingTool{
    constructor(context:CanvasRenderingContext2D, applier:EditingToolApplier, tmp_context?:CanvasRenderingContext2D) {
            super(context, applier, tmp_context);
            this.select = this.select.bind(this);
        }
    select() {
        this.context.clearRect(0,0,this.w,this.h);
        override_canvas_context(this.applier.app.staging_context,
                                this.applier.app.art_canvas)
        this.select_action();
        override_canvas_context(this.app.staging_context, this.app.tool_canvas, true)
        override_canvas_context(this.app.view_context, this.app.staging_canvas)
        override_canvas_context(this.app.art_context, this.app.staging_canvas)
        this.applier.undo_redo_buffer.push(this.app.art_context.getImageData(0,0,this.w,this.h))
        override_canvas_context(this.app.staging_context, this.app.art_canvas)
        override_canvas_context(this.app.staging_context, this.app.tool_canvas, true)
        override_canvas_context(this.app.view_context, this.app.staging_canvas)
    }
    abstract select_action():void
}
