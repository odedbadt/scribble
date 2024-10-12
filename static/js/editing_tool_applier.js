
import { ScribbleTool } from './scribble.js'
import { EraserTool } from './eraser.js'
import { ClearAllTool } from './clearall.js'
import { LineTool } from './line.js'
import { RectTool } from './rect.js'
import { CircleTool } from './circle.js'
import { CursorSize } from './cursor_size.js'
import { Dropper } from './dropper.js'
import { Floodfill } from './floodfill.js'
import { NopTool } from './editing_tool.js'
import { UndoRedoBuffer } from './undo_redo_buffer.js'
const tool_js_classes = {
    scribble: ScribbleTool,
    rect: RectTool,
    line: LineTool,
    circle: CircleTool,
    dropper: Dropper,
    floodfill: Floodfill,
    eraser: EraserTool,
    clearall:ClearAllTool,
    cursor_size: CursorSize
}
export function override_canvas_context(context_to, canvas_from, keep) {
    if (!keep) {
        context_to.clearRect(0,0,canvas_from.width, canvas_from.height);
    }
    context_to.drawImage(
        canvas_from,0,0
    )
}
export class EditingToolApplier {
    constructor(app) {
        this.app = app;
        this.w = this.app.art_canvas.width;
        this.h = this.app.art_canvas.height;
        this.undo_redo_buffer = new UndoRedoBuffer(100);
        this.tool = new NopTool(app.tool_context, this, app.tool_tmp_context)
    }
    select_tool(tool_name) {
        this.previous_tool_name = this.current_tool_name;
        this.current_tool_name = tool_name;
        const tool_js_class = tool_js_classes[tool_name]
        if (!tool_js_class) {
            return;
        }
        this.tool = new tool_js_class(app.tool_context, this, app.tool_tmp_context)
            this.tool.select()
    }
    deselect_tool() {
        this.tool = null;
    }
    mousedown(event) {
        event.preventDefault()
        override_canvas_context(this.app.staging_context, this.app.art_canvas)
        this.tool.start([event.offsetX, event.offsetY], event.buttons);
    }
    mousemove(event) {
        if (event.buttons) {
            this.tool.action([event.offsetX, event.offsetY]);
            this.tool.hover([event.offsetX, event.offsetY])
            override_canvas_context(this.app.view_context, this.app.tool_tmp_canvas,true)
        } else {
            this.tool.hover([event.offsetX, event.offsetY])
            override_canvas_context(this.app.view_context, this.app.tool_tmp_canvas,true)
            
        }
        // Appply action
        override_canvas_context(this.app.view_context, this.app.staging_canvas)
        override_canvas_context(this.app.view_context, this.app.tool_tmp_canvas,true)
    }
    undo() {
        this.app.staging_context.clearRect(0,0,this.w, this.h);
        this.app.tool_context.clearRect(0,0,this.w, this.h);
        const undone_image_data = this.undo_redo_buffer.undo();
        this.app.clear_art_canvas();
        if (undone_image_data) {
            this.app.art_context.putImageData(undone_image_data, 0,0)
        }
        override_canvas_context(this.app.view_context, this.app.art_canvas)
    }
    redo() {
        const redone_image_data = this.undo_redo_buffer.redo();
        if (redone_image_data) {
            this.app.staging_context.clearRect(0,0,this.w, this.h);
            this.app.tool_context.clearRect(0,0,this.w, this.h);
            this.app.clear_art_canvas();
            this.app.art_context.putImageData(redone_image_data, 0,0)
            override_canvas_context(this.app.view_context, this.app.art_canvas)
        }
    }
    keydown(event) {
        if (event.code == 'KeyU') {
            this.undo()
        }
        if (event.code == 'KeyR') {
            this.redo()
        }
    }
    mouseup(event) {
        if (this.from) {
        }
        this.tool.stop();
    }
    mousein(event) {
        if (!!event.buttons) {

        }
        //this.mouseup(event);
    }
    mouseleave(event) {
        this.app.tool_tmp_context.clearRect(0,0,this.w,this.h);
        override_canvas_context(this.app.staging_context, this.app.art_canvas)
        override_canvas_context(this.app.staging_context, this.app.tool_canvas, true)
        override_canvas_context(this.app.view_context, this.app.staging_canvas)
        //override_canvas_context(this.app.staging_context, this.app.tool_canvas, true)
    }
}