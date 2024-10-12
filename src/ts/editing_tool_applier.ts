import {UndoRedoBuffer } from './undo_rredo_buffer'
import {NopTool} frim './editing_tool'
export class EditingToolApplier {
    app: any;
    w: any;
    h: any;
    undo_redo_buffer: UndoRedoBuffer;
    tool: any;
    previous_tool_name: any;
    current_tool_name: any;
    from: any;
    constructor(app) {
        this.app = app;
        this.w = this.app.art_canvas.width;
        this.h = this.app.art_canvas.height;
        this.undo_redo_buffer = UndoRedoBuffer(100);
        this.tool = new NopTool(app.tool_context, this, app.tool_tmp_context);
    }
    select_tool(tool_name) {
        this.previous_tool_name = this.current_tool_name;
        this.current_tool_name = tool_name;
        const tool_js_class = tool_js_classes[tool_name];
        if (!tool_js_class) {
            return;
        }
        this.tool = new tool_js_class(this.app.tool_context, this, this.app.tool_tmp_context);
        this.tool.select();
    }
    deselect_tool() {
        this.tool = null;
    }
    mousedown(event) {
        event.preventDefault();
        (0, utils_1.override_canvas_context)(this.app.staging_context, this.app.art_canvas);
        this.tool.start({ x: event.offsetX, y: event.offsetY }, event.buttons);
    }
    mousemove(event) {
        if (event.buttons) {
            this.tool.action({ x: event.offsetX, y: event.offsetY });
            this.tool.hover({ x: event.offsetX, y: event.offsetY });
            (0, utils_1.override_canvas_context)(this.app.view_context, this.app.tool_tmp_canvas, true);
        }
        else {
            this.tool.hover({ x: event.offsetX, y: event.offsetY });
            (0, utils_1.override_canvas_context)(this.app.view_context, this.app.tool_tmp_canvas, true);
        }
        // Appply action
        (0, utils_1.override_canvas_context)(this.app.view_context, this.app.staging_canvas);
        if (this.tool.hover) {
            (0, utils_1.override_canvas_context)(this.app.view_context, this.app.tool_tmp_canvas, true);
        }
    }
    undo() {
        this.app.staging_context.clearRect(0, 0, this.w, this.h);
        this.app.tool_context.clearRect(0, 0, this.w, this.h);
        const undone_image_data = this.undo_redo_buffer.undo();
        this.app.clear_art_canvas();
        if (undone_image_data) {
            this.app.art_context.putImageData(undone_image_data, 0, 0);
        }
        (0, utils_1.override_canvas_context)(this.app.view_context, this.app.art_canvas);
    }
    redo() {
        const redone_image_data = this.undo_redo_buffer.redo();
        if (redone_image_data) {
            this.app.staging_context.clearRect(0, 0, this.w, this.h);
            this.app.tool_context.clearRect(0, 0, this.w, this.h);
            this.app.clear_art_canvas();
            this.app.art_context.putImageData(redone_image_data, 0, 0);
            (0, utils_1.override_canvas_context)(this.app.view_context, this.app.art_canvas);
        }
    }
    keydown(event) {
        if (event.code == 'KeyU') {
            this.undo();
        }
        if (event.code == 'KeyR') {
            this.redo();
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
        this.app.tool_tmp_context.clearRect(0, 0, this.w, this.h);
        (0, utils_1.override_canvas_context)(this.app.staging_context, this.app.art_canvas);
        (0, utils_1.override_canvas_context)(this.app.staging_context, this.app.tool_canvas, true);
        (0, utils_1.override_canvas_context)(this.app.view_context, this.app.staging_canvas);
        //override_canvas_context(this.app.staging_context, this.app.tool_canvas, true)
    }
}
exports.EditingToolApplier = EditingToolApplier;
