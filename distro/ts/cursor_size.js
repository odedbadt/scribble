import { ClickAndDragTool } from "./click_and_drag_tool";
export class CursorSize extends ClickAndDragTool {
    constructor(editor) {
        super(editor);
    }
    editing_start() {
        if (!this.staging_context) {
            return false;
        }
        this.staging_context.fillStyle = this.app.settings.fore_color;
        this.staging_context.strokeStyle = this.app.settings.fore_color;
        this.staging_context.lineWidth = this.app.settings.line_width;
        this.staging_context.lineCap = 'round';
        return false;
    }
    start(at, buttons) {
        this.app.settings.line_width = 0.5;
        super.start(at, buttons);
        return false;
    }
    editing_action(at) {
        if (this.from == null) {
            return false;
        }
        if (!this.staging_context) {
            return false;
        }
        //this.app.tool_tmp_context.clearRect(0,0,this.w,this.h);
        const r = Math.sqrt((at.x - this.from.x) * (at.x - this.from.x) +
            (at.y - this.from.y) * (at.y - this.from.y));
        this.staging_context.beginPath();
        this.staging_context.ellipse(this.from.x, this.from.y, r, r, 0, 0, Math.PI * 2);
        this.staging_context.fill();
        this.app.settings.line_width = 2 * r;
        return false;
    }
    hover(at) {
        return false;
    }
    editing_stop(at) {
        if (this.editor.previous_tool_name) {
            this.app.select_tool(this.editor.previous_tool_name);
        }
        return false;
    }
}
//# sourceMappingURL=cursor_size.js.map