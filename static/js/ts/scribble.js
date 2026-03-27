"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ScribbleTool = void 0;
const click_and_drag_tool_1 = require("./click_and_drag_tool");
class ScribbleTool extends click_and_drag_tool_1.ClickAndDragTool {
    constructor(context, applier, tmp_context) {
        super(context, applier, true, tmp_context);
    }
    hover_action(at) {
        if (!this.tmp_context) {
            return false;
        }
        this.tmp_context.fillStyle = this.app.settings.fore_color;
        this.tmp_context.beginPath();
        const r = this.app.settings.line_width / 2;
        this.tmp_context.ellipse(at.x, at.y, r, r, 0, 0, Math.PI * 2);
        this.tmp_context.fill();
        return true;
    }
    editing_action(to) {
        if (this._recorded_to) {
            this.context.moveTo(this._recorded_to.x, this._recorded_to.y);
            this.context.lineTo(to.x, to.y);
        }
        this._recorded_to = to;
        this.context.stroke();
        return true;
    }
    editing_stop() {
        // nop, implemenet me
        this._recorded_to = null;
    }
}
exports.ScribbleTool = ScribbleTool;
