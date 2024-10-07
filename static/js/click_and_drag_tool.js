import {EditingTool, override_canvas_context} from "./editing_tool.js"
export default class ClickAndDragTool extends EditingTool{
    constructor(context, applier, incremental) {
            super(context, applier);
            this.is_incremental = incremental;
            this.start = this.start.bind(this);
            this.action = this.action.bind(this);
            this.stop = this.stop.bind(this);
        }
    select() {
    }
    start() {
        this.context.clearRect(0,0,this.w,this.h)
        this.dirty = this.editing_start();
    }
    editing_start() {
        // nop, implemenet me
    }
    action(from, to) {
        override_canvas_context(this.applier.app.staging_context,
                                this.applier.app.art_canvas)
        this.applier.app.tool_context.beginPath();
        this.dirty = !!this.editing_action(from,to) || this.dirty;
        this.app.staging_context.drawImage(
            this.app.tool_canvas,0,0
        )
        if (!this.is_incremental) {
            override_canvas_context(this.app.staging_context, this.app.art_canvas)
        }
        override_canvas_context(this.app.staging_context, this.app.art_canvas)
        override_canvas_context(this.app.staging_context, this.app.tool_canvas, true)
        override_canvas_context(this.app.view_context, this.app.staging_canvas)
        if (!this.is_incremental) {
            this.context.clearRect(0,0,this.w,this.h);
        }
    }
    editing_action() {
        throw new "Not fully implemented tool"
    }
    stop() {
        this.dirty = !!this.editing_stop() || this.dirty;
        if (this.dirty) {
            override_canvas_context(this.app.art_context, this.app.staging_canvas)
            this.applier.undo_redo_buffer.push(
                this.app.art_context.getImageData(0,0,this.w,this.h)
            )
            this.from = null;
            override_canvas_context(this.app.staging_context, this.app.art_canvas)
            override_canvas_context(this.app.staging_context, this.app.tool_canvas, true)
            override_canvas_context(this.app.view_context, this.app.staging_canvas)
            this.dirty = false
        }
    }
    editing_stop() {
        // nop, implemenet me
    }

}
