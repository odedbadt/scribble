"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NopTool = exports.EditingTool = void 0;
class EditingTool {
    constructor(context, applier, tmp_context) {
        this.context = context;
        this.w = context.canvas.clientWidth;
        this.h = context.canvas.clientHeight;
        this.applier = applier;
        this.app = applier.app;
        this.tmp_context = tmp_context;
    }
    select() {
        this.context.clearRect(0, 0, this.w, this.h);
    }
    start(at) {
    }
    action(at) {
    }
    stop(at) {
    }
}
exports.EditingTool = EditingTool;
class NopTool extends EditingTool {
    constructor(context, applier, tmp_context) {
        super(context, applier, tmp_context);
    }
    select() {
        super.select();
    }
    start(at) {
        super.start(at);
    }
    action(at) {
        super.action(at);
    }
    stop(at) {
        super.stop(at);
    }
}
exports.NopTool = NopTool;
