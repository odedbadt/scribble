"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EditingToolApplier = void 0;
const scribble_js_1 = require("./scribble.js");
const eraser_js_1 = require("./eraser.js");
const clearall_js_1 = require("./clearall.js");
const line_js_1 = require("./line.js");
const rect_js_1 = require("./rect.js");
const circle_js_1 = require("./circle.js");
const dropper_js_1 = require("./dropper.js");
const floodfill_js_1 = require("./floodfill.js");
const editing_tool_js_1 = require("./editing_tool.js");
const undo_redo_buffer_js_1 = require("./undo_redo_buffer.js");
const utils_1 = require("./utils");
const tool_js_classes = {
    scribble: scribble_js_1.ScribbleTool,
    rect: rect_js_1.RectTool,
    line: line_js_1.LineTool,
    circle: circle_js_1.CircleTool,
    dropper: dropper_js_1.Dropper,
    floodfill: floodfill_js_1.Floodfill,
    eraser: eraser_js_1.EraserTool,
    clearall: clearall_js_1.ClearAllTool,
};
class EditingToolApplier {
    constructor(app) {
        this.app = app;
        this.w = this.app.art_canvas.width;
        this.h = this.app.art_canvas.height;
        this.undo_redo_buffer = new undo_redo_buffer_js_1.UndoRedoBuffer(100);
        this.tool = new editing_tool_js_1.NopTool(app.tool_context, this, app.tool_tmp_context);
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
