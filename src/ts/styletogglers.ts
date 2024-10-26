import { OnSelectTool } from "./on_select_tool.js"
import { Editor } from "./editor.js";
import { parse_RGBA } from "./utils.js";

function _equal_colors(c1:Uint8ClampedArray,c2:Uint8ClampedArray):boolean {
    return c1[0] == c2[0] &&
    c1[1] == c2[1] &&
    c1[2] == c2[2]
}

export class FillStyleToggler extends OnSelectTool {
    start(at: Vector2, buttons:number):boolean {
        throw new Error("Method not implemented.");
    }
    action(at: Vector2): boolean {
        throw new Error("Method not implemented.");
    }
    stop(at: Vector2):boolean {
        throw new Error("Method not implemented.");
    }
    constructor(context:CanvasRenderingContext2D, editor:Editor) {
        super(context, editor)
        this.context = context;
        this.editor = editor;
        this.app = editor.app;
    }
    select_action() {
        this.app.settings.filled = !this.app.settings.filled;
        document.getElementsByClassName('fillstyle')[0].classList.toggle('filled')
    }


}
