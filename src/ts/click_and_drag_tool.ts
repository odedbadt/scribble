import {EditingTool} from "./editing_tool.js"
import { EditingToolApplier } from "./editing_tool_applier.js";
import { MainApp } from "./main_app.js";
import { override_canvas_context } from "./utils.js";

export abstract class ClickAndDragTool extends EditingTool {
    is_incremental: boolean;
    dirty: boolean;
    from: Vector2 | null;
    tmp_context: CanvasRenderingContext2D | undefined;
    constructor(context: CanvasRenderingContext2D, applier: EditingToolApplier, incremental: boolean |  null, tmp_context?: CanvasRenderingContext2D) {
        super(context, applier, tmp_context);
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
        override_canvas_context(this.applier.app.staging_context, this.applier.app.art_canvas);
        this.applier.app.tool_context.beginPath();
        this.dirty = !!this.editing_action(at) || this.dirty;
        if (!this.is_incremental) {
            override_canvas_context(this.app.staging_context, this.app.art_canvas);
        }
        override_canvas_context(this.app.staging_context, this.app.art_canvas);
        override_canvas_context(this.app.staging_context, this.app.tool_canvas, true);
        override_canvas_context(this.app.view_context, this.app.staging_canvas);
        override_canvas_context(this.app.view_context, this.app.tool_tmp_canvas, true);
        if (!this.is_incremental) {
            this.context.clearRect(0, 0, this.w, this.h);
        }
        return true
    }
    hover(at: any) {
        if (!this.tmp_context) {
            return;
        }
        this.tmp_context.clearRect(0, 0, this.w, this.h);
        const dirty = this.hover_action(at);
        if (dirty) {
            override_canvas_context(this.app.view_context, this.app.tool_tmp_canvas, true);
        }
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
            override_canvas_context(this.app.art_context, this.app.staging_canvas);
            this.applier.undo_redo_buffer.push(this.app.art_context.getImageData(0, 0, this.w, this.h));
            this.from = null;
            override_canvas_context(this.app.staging_context, this.app.art_canvas);
            override_canvas_context(this.app.staging_context, this.app.tool_canvas, true);
            override_canvas_context(this.app.view_context, this.app.staging_canvas);
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