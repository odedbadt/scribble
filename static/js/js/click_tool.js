"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const editing_tool_js_1 = require("./editing_tool.js");
const utils_1 = require("./utils");
class ClickTool extends editing_tool_js_1.EditingTool {
    constructor(context, applier) {
        super(context, applier);
        this.start = this.start.bind(this);
    }
    select() {
    }
    start(at, buttons) {
        this.context.clearRect(0, 0, this.w, this.h);
        (0, utils_1.override_canvas_context)(this.applier.app.staging_context, this.applier.app.art_canvas);
        this.editing_start(at, buttons);
        (0, utils_1.override_canvas_context)(this.app.staging_context, this.app.tool_canvas, true);
        (0, utils_1.override_canvas_context)(this.app.view_context, this.app.staging_canvas);
        (0, utils_1.override_canvas_context)(this.app.art_context, this.app.staging_canvas);
        this.applier.undo_redo_buffer.push(this.app.art_context.getImageData(0, 0, this.w, this.h));
        (0, utils_1.override_canvas_context)(this.app.staging_context, this.app.art_canvas);
        (0, utils_1.override_canvas_context)(this.app.staging_context, this.app.tool_canvas, true);
        (0, utils_1.override_canvas_context)(this.app.view_context, this.app.staging_canvas);
    }
    editing_start(at) {
        throw "Not implemented";
    }
    action(from, to) {
    }
    stop() {
    }
    hover() {
    }
}
exports.default = ClickTool;
