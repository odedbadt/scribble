import { OnSelectTool } from "./on_select_tool"
import { Editor } from "./editor";
import { parse_RGBA } from "./utils";

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
        const styled_buttons = document.getElementsByClassName('fillable')
        for (let j = 0; j < styled_buttons.length; ++j) {
            styled_buttons[j].classList.toggle('filled')
        }
    }


}
