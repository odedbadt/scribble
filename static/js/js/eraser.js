"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EraserTool = void 0;
const click_and_drag_tool_js_1 = __importDefault(require("./click_and_drag_tool.js"));
class EraserTool extends click_and_drag_tool_js_1.default {
    constructor(context, applier, tmp_context) {
        super(context, applier, true, tmp_context);
    }
    hover_action(at) {
        this.tmp_context.fillStyle = this.app.settings.back_color;
        this.tmp_context.strokeStyle = this.app.settings.fore_color;
        this.tmp_context.lineWidth = 1;
        this.tmp_context.beginPath();
        const r = 25; //this.app.settings.line_width / 2;
        this.tmp_context.ellipse(at[0], at[1], r, r, 0, 0, Math.PI * 2);
        this.tmp_context.fill();
        this.tmp_context.stroke();
    }
    editing_action(to) {
        if (this._recorded_to) {
            this.context.strokeStyle = this.app.settings.back_color;
            this.context.lineWidth = 50;
            this.context.moveTo(this._recorded_to[0], this._recorded_to[1]);
            this.context.lineTo(to[0], to[1]);
        }
        this._recorded_to = to;
        this.context.stroke();
        return true;
    }
    editing_start() {
    }
    editing_stop() {
        this._recorded_to = null;
    }
}
exports.EraserTool = EraserTool;
