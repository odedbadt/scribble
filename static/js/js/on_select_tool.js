"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const editing_tool_js_1 = require("./editing_tool.js");
class OnSelectTool extends editing_tool_js_1.EditingTool {
    constructor(context, applier) {
        super(context, applier);
        this.select = this.select.bind(this);
    }
    select() {
        this.context.clearRect(0, 0, this.w, this.h);
        (0, editing_tool_js_1.override_canvas_context)(this.applier.app.staging_context, this.applier.app.art_canvas);
        this.select_action();
        (0, editing_tool_js_1.override_canvas_context)(this.app.staging_context, this.app.tool_canvas, true);
        (0, editing_tool_js_1.override_canvas_context)(this.app.view_context, this.app.staging_canvas);
        (0, editing_tool_js_1.override_canvas_context)(this.app.art_context, this.app.staging_canvas);
        this.applier.undo_redo_buffer.push(this.app.art_context.getImageData(0, 0, this.w, this.h));
        (0, editing_tool_js_1.override_canvas_context)(this.app.staging_context, this.app.art_canvas);
        (0, editing_tool_js_1.override_canvas_context)(this.app.staging_context, this.app.tool_canvas, true);
        (0, editing_tool_js_1.override_canvas_context)(this.app.view_context, this.app.staging_canvas);
    }
    start(at) {
    }
    action(at) {
    }
    stop() {
    }
}
exports.default = OnSelectTool;
