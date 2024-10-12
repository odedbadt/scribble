"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClickAndDragTool = void 0;
const editing_tool_js_1 = require("./editing_tool.js");
class ClickAndDragTool extends editing_tool_js_1.EditingTool {
    constructor(context, applier, incremental, tmp_context) {
        super(context, applier, tmp_context);
        this.is_incremental = incremental;
        this.start = this.start.bind(this);
        this.action = this.action.bind(this);
        this.stop = this.stop.bind(this);
        this.dirty = false;
    }
    select() {
    }
    start(at) {
        this.context.clearRect(0, 0, this.w, this.h);
        this.context.fillStyle = this.app.settings.fore_color;
        this.context.strokeStyle = this.app.settings.fore_color;
        this.context.lineWidth = this.app.settings.line_width;
        this.context.lineCap = 'round';
        this.dirty = this.editing_start();
        this.from = at;
    }
    editing_start() {
        // nop, implemenet me
        return false;
    }
    action(at) {
        if (!this.is_incremental) {
            (0, editing_tool_js_1.override_canvas_context)(this.app.staging_context, this.app.art_canvas);
        }
        (0, editing_tool_js_1.override_canvas_context)(this.applier.app.staging_context, this.applier.app.art_canvas);
        this.applier.app.tool_context.beginPath();
        this.dirty = !!this.editing_action(at) || this.dirty;
        if (!this.is_incremental) {
            (0, editing_tool_js_1.override_canvas_context)(this.app.staging_context, this.app.art_canvas);
        }
        (0, editing_tool_js_1.override_canvas_context)(this.app.staging_context, this.app.art_canvas);
        (0, editing_tool_js_1.override_canvas_context)(this.app.staging_context, this.app.tool_canvas, true);
        (0, editing_tool_js_1.override_canvas_context)(this.app.view_context, this.app.staging_canvas);
        if (!this.is_incremental) {
            this.context.clearRect(0, 0, this.w, this.h);
        }
    }
    hover(at) {
        if (!this.tmp_context) {
            return;
        }
        this.tmp_context.clearRect(0, 0, this.w, this.h);
        const dirty = this.hover_action(at);
        if (dirty) {
            (0, editing_tool_js_1.override_canvas_context)(this.app.view_context, this.app.tool_tmp_canvas, true);
        }
    }
    hover_action(at) {
        // nop
        return false;
    }
    editing_action(at) {
        throw new "Not fully implemented tool";
    }
    stop() {
        this.dirty = !!this.editing_stop() || this.dirty;
        if (this.dirty) {
            (0, editing_tool_js_1.override_canvas_context)(this.app.art_context, this.app.staging_canvas);
            this.applier.undo_redo_buffer.push(this.app.art_context.getImageData(0, 0, this.w, this.h));
            this.from = null;
            (0, editing_tool_js_1.override_canvas_context)(this.app.staging_context, this.app.art_canvas);
            (0, editing_tool_js_1.override_canvas_context)(this.app.staging_context, this.app.tool_canvas, true);
            (0, editing_tool_js_1.override_canvas_context)(this.app.view_context, this.app.staging_canvas);
            this.dirty = false;
        }
    }
    editing_stop() {
        // nop, implemenet me
    }
}
exports.ClickAndDragTool = ClickAndDragTool;
