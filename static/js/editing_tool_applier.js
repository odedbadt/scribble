import { ScribbleTool } from './scribble.js'
import { EraserTool } from './eraser.js'
import { ClearAllTool } from './clearall.js'
import { LineTool } from './line.js'
import { RectTool } from './rect.js'
import { CircleTool } from './circle.js'
import { Dropper } from './dropper.js'
import { Floodfill } from './floodfill.js'
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
        this.undo_redo_buffer.push(
            this.app.art_context.getImageData(0,0,this.w,this.h)
        )
        this.dirty = false
    }
    select_tool(tool_name) {
        this.previous_tool_name = this.current_tool_name;
        this.current_tool_name = tool_name;
        const tool_js_class = tool_js_classes[tool_name]
        if (!tool_js_class) {
            return;
        }
        this.tool = new tool_js_class(app.tool_context, this)
        if (this.tool && this.tool.select) {
            this.tool.select()
            this.dirty = true
        }
    }
    deselect_tool() {
        this.tool = null;
    }
    mousedown(event) {
        if (event.buttons != 1) {
            return;
        }
        override_canvas_context(this.app.staging_context, this.app.art_canvas)
        this.from = [event.offsetX, event.offsetY];
        if (this.tool && this.tool.start) {
            this.tool.start(this.from);
            this.dirty = true;
            }
    }
    mousemove(event) {
        if (!!this.from && !!!event.buttons) {
            return
        }
        if (!this.tool) {
            return;
        }
        this.app.tool_context.fillStyle = this.app.settings.fore_color;
        this.app.tool_context.strokeStyle = this.app.settings.fore_color;
        this.app.tool_context.lineWidth = this.app.settings.line_width;
        this.app.tool_context.lineCap = 'round';
        if (!this.tool.is_incremental)
            override_canvas_context(this.app.staging_context, this.app.art_canvas)
        this.app.tool_context.beginPath();
        // Appply action
        if (this.from && this.tool.action) {
            this.tool.action(this.from, [event.offsetX, event.offsetY])
            this.dirty = true;
        }
        this.app.staging_context.drawImage(
            this.app.tool_canvas,0,0
        )
        if (!this.tool.is_incremental)
            override_canvas_context(this.app.staging_context, this.app.art_canvas)
            this.app.staging_context.clearRect(0,0,this.w,this.h);
        override_canvas_context(this.app.staging_context, this.app.art_canvas)
        override_canvas_context(this.app.staging_context, this.app.tool_canvas, true)
        override_canvas_context(this.app.view_context, this.app.staging_canvas)
        if (!this.tool.is_incremental) {
            this.app.tool_context.clearRect(0,0,this.w,this.h);
        }
        override_canvas_context(this.app.view_context, this.app.staging_canvas)
        this.app.view_context.beginPath()
        this.app.view_context.fill()
    }
    undo() {
        const prev_image_data = this.undo_redo_buffer.undo();
        if (prev_image_data) {
            this.app.staging_context.clearRect(0,0,this.w, this.h);
            this.app.tool_context.clearRect(0,0,this.w, this.h);
            this.app.clear_art_canvas();
//            this.app.art_context.clearRect(0,0,this.w, this.h);
            this.app.art_context.putImageData(prev_image_data, 0,0)
            override_canvas_context(this.app.view_context, this.app.art_canvas)
        }
    }
    redo() {
        const prev_image_data = this.undo_redo_buffer.redo();
        if (prev_image_data) {
            this.app.staging_context.clearRect(0,0,this.w, this.h);
            this.app.tool_context.clearRect(0,0,this.w, this.h);
            this.app.clear_art_canvas();
            this.app.art_context.putImageData(prev_image_data, 0,0)
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
        if (this.tool && this.tool.stop) {
            this.tool.stop()
            this.dirty = true;
        }
        if (this.dirty) {
            this.undo_redo_buffer.push(this.app.art_context.getImageData(0,0,this.w,this.h))
            override_canvas_context(this.app.art_context, this.app.staging_canvas)
            this.from = null;
            override_canvas_context(this.app.staging_context, this.app.art_canvas)
            override_canvas_context(this.app.staging_context, this.app.tool_canvas, true)
            override_canvas_context(this.app.view_context, this.app.staging_canvas)
            this.dirty = false
        }
    }
    mousein(event) {
        if (!!event.buttons) {

        }
        //this.mouseup(event);
    }
    commit() {
        override_canvas_context(this.app.staging_context, this.app.art_canvas)
        override_canvas_context(this.app.staging_context, this.app.tool_canvas, true)
        override_canvas_context(this.app.view_context, this.app.staging_canvas)
        override_canvas_context(this.app.art_context, this.app.staging_canvas)
        this.undo_redo_buffer.push(this.app.art_context.getImageData(0,0,this.w,this.h))
    }
}