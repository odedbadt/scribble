"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClearAllTool = void 0;
const on_select_tool_js_1 = __importDefault(require("./on_select_tool.js"));
class ClearAllTool extends on_select_tool_js_1.default {
    constructor(context, applier) {
        super(context, applier);
        this.context = context;
        this.applier = applier;
        this.app = applier.app;
    }
    select_action() {
        const w = this.context.canvas.clientWidth;
        const h = this.context.canvas.clientHeight;
        this.context.fillStyle = this.app.settings.back_color;
        this.context.fillRect(0, 0, w, h);
    }
}
exports.ClearAllTool = ClearAllTool;
