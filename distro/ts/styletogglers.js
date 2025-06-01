import { OnSelectTool } from "./on_select_tool";
function _equal_colors(c1, c2) {
    return c1[0] == c2[0] &&
        c1[1] == c2[1] &&
        c1[2] == c2[2];
}
export class FillStyleToggler extends OnSelectTool {
    start(at, buttons) {
        throw new Error("Method not implemented.");
    }
    action(at) {
        throw new Error("Method not implemented.");
    }
    stop(at) {
        throw new Error("Method not implemented.");
    }
    constructor(editor) {
        super(editor);
        this.editor = editor;
        this.app = editor.app;
    }
    select_action() {
        this.app.settings.filled = !this.app.settings.filled;
        const styled_buttons = document.getElementsByClassName('fillable');
        for (let j = 0; j < styled_buttons.length; ++j) {
            styled_buttons[j].classList.toggle('filled');
        }
    }
}
//# sourceMappingURL=styletogglers.js.map