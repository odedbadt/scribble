"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RectTool = void 0;
const click_and_drag_tool_js_1 = __importDefault(require("./click_and_drag_tool.js"));
class RectTool extends click_and_drag_tool_js_1.default {
    constructor(context, applier) {
        super(context, applier, false);
    }
    editing_action(to) {
        this.context.rect(this.from[0], this.from[1], to[0] - this.from[0], to[1] - this.from[1]);
        this.context.fill();
        return true;
    }
}
exports.RectTool = RectTool;
