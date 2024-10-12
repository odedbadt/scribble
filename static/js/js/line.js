"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LineTool = void 0;
const click_and_drag_tool_js_1 = __importDefault(require("./click_and_drag_tool.js"));
const types_1 = require("./types");
class LineTool extends click_and_drag_tool_js_1.default {
    constructor(context, applier) {
        super(context, applier, false);
    }
    editing_action(at) {
        this.context.moveTo(this.from.x, this.from.y);
        this.context.lineTo(at.x, at.y);
        this.context.stroke();
    }
}
exports.LineTool = LineTool;
