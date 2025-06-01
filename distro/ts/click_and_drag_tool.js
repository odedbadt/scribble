import { EditingTool } from "./editing_tool";
export class ClickAndDragTool extends EditingTool {
    constructor(editor) {
        super(editor);
        this.is_incremental = false;
        this.start = this.start.bind(this);
        this.action = this.action.bind(this);
        this.stop = this.stop.bind(this);
        this.dirty = false;
        this.top_left = { x: 0, y: 0 };
        this.from = { x: 0, y: 0 };
    }
    select() {
    }
    start(at, buttons) {
        this.context.clearRect(0, 0, this.w, this.h);
        this.context.fillStyle = this.app.settings.fore_color;
        this.context.strokeStyle = this.app.settings.fore_color;
        this.context.lineWidth = this.app.settings.line_width;
        this.context.lineCap = 'round';
        this.dirty = this.editing_start();
        this.from = at;
        this.x = at.x;
        this.y = at.y;
        return false;
    }
    editing_start() {
        // nop, implemenet me
        return false;
    }
    action(at) {
        // this.editor.app.tool_context.beginPath();
        this.dirty = !!this.editing_action(at) || this.dirty;
        return true;
    }
    hover(at) {
        if (!this.staging_context) {
            return false;
        }
        const dirty = this.hover_action(at);
        if (dirty) {
            return true;
        }
        return false;
    }
    hover_action(at) {
        // nop
        return false;
    }
    editing_action(at) {
        throw new Error("Not fully implemented tool");
    }
    stop(at) {
        this.dirty = !!this.editing_stop(at) || this.dirty;
        if (this.dirty) {
            this.editor.undo_redo_buffer.push(this.app.document_context.getImageData(0, 0, this.w, this.h));
            this.from = null;
            this.editor.tool_to_document();
            this.dirty = false;
            return true;
        }
        return false;
    }
    editing_stop(at) {
        // nop, implemenet me
        return false;
    }
}
//# sourceMappingURL=click_and_drag_tool.js.map