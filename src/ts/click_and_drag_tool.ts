import {EditingTool} from "./editing_tool"
import { Editor } from "./editor";
import { MainApp } from "./main_app";
import { Vector2, unit_rect } from "./types";
import { override_canvas_context } from "./utils";

export abstract class ClickAndDragTool extends EditingTool {
    is_incremental: boolean;
    dirty: boolean;
    from: Vector2 | null;
    tmp_context: CanvasRenderingContext2D | undefined;
    constructor(context: CanvasRenderingContext2D, editor: Editor, incremental: boolean |  null, tmp_context?: CanvasRenderingContext2D) {
        super(context, editor, tmp_context);
        this.is_incremental = !!incremental;
        this.start = this.start.bind(this);
        this.action = this.action.bind(this);
        this.stop = this.stop.bind(this);
        this.dirty = false;
        this.from = null;
    }
    select(): void {
    }
    start(at: Vector2, buttons:number):boolean {
        this.context.clearRect(0, 0, this.w, this.h);
        this.context.fillStyle = this.app.settings.fore_color;
        this.context.strokeStyle = this.app.settings.fore_color;
        this.context.lineWidth = this.app.settings.line_width;
        this.context.lineCap = 'round';
        this.dirty = this.editing_start();
        this.from = at;
        return false
    }
    editing_start() {
        // nop, implemenet me
        return false;
    }
    action(at: Vector2):boolean {
        this.editor.art_to_staging()
        this.editor.app.tool_context.beginPath();
        this.dirty = !!this.editing_action(at) || this.dirty;
        if (!this.is_incremental) {
            this.editor.staging_to_art()
        }
        this.editor.art_to_staging()
        this.editor.tool_to_staging()
        this.editor.staging_to_view()
        this.editor.tmp_tool_to_view()
        if (!this.is_incremental) {
            this.context.clearRect(0, 0, this.w, this.h);
        }
        return true
    }
    hover(at: any):boolean {
        if (!this.tmp_context) {
            return false;
        }
        this.tmp_context.clearRect(0, 0, this.w, this.h);
        const dirty = this.hover_action(at);
        if (dirty) {
            this.editor.tool_to_view()
            return true;
        }
        return false;
    }
    hover_action(at: any) {
        // nop
        return false;
    }
    editing_action(at: Vector2):boolean {
        throw new Error("Not fully implemented tool");
    }
    stop(at:Vector2):boolean {
        this.dirty = !!this.editing_stop(at) || this.dirty;
        if (this.dirty) {
            this.editor.staging_to_art()
            this.editor.undo_redo_buffer.push(this.app.art_context.getImageData(0, 0, this.w, this.h));
            this.from = null;
            this.editor.art_to_staging()
            this.editor.tool_to_staging()
            this.editor.staging_to_view()
            this.dirty = false;
            return true
        }
        return false
    }
    editing_stop(at:Vector2):boolean {
        // nop, implemenet me
        return false
    }
}
