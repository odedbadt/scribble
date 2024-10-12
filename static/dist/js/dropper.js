"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Dropper = void 0;
const click_tool_js_1 = __importDefault(require("./click_tool.js"));
class Dropper extends click_tool_js_1.default {
    constructor(context, applier) {
        super(context, applier);
    }
    editing_start(from, buttons) {
        const color = this.app.art_context.getImageData(from[0], from[1], 1, 1).data;
        const sampled_color = `rgba(${color[0]},${color[1]},${color[2]},255)`;
        if (buttons & 1) {
            this.app.settings.fore_color = sampled_color;
            document.getElementById('color-selector-div-fore').style.backgroundColor = sampled_color;
        }
        else if (buttons & 2) {
            this.app.settings.back_color = sampled_color;
            document.getElementById('color-selector-div-back').style.backgroundColor = sampled_color;
        }
        if (this.applier.previous_tool_name) {
            this.app.select_tool(this.applier.previous_tool_name);
        }
    }
}
exports.Dropper = Dropper;
