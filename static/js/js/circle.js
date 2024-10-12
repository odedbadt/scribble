"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CircleTool = void 0;
const click_and_drag_tool_js_1 = __importDefault(require("./click_and_drag_tool.js"));
class CircleTool extends click_and_drag_tool_js_1.default {
    constructor(context, applier) {
        super(context, applier, false);
    }
    editing_action(at) {
        const r = Math.sqrt((at[0] - this.from[0]) * (at[0] - this.from[0]) +
            (at[1] - this.from[1]) * (at[1] - this.from[1]));
        this.context.ellipse(this.from[0], this.from[1], r, r, 0, 0, Math.PI * 2);
        this.context.fill();
        return true;
    }
}
exports.CircleTool = CircleTool;
