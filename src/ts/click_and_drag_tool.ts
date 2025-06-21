import { EditingTool } from "./editing_tool"
import { Editor } from "./editor";
import { MainApp } from "./main_app";
import { Vector2, unit_rect, vfloor } from "./types";
import { signal, computed, effect, batch } from "@preact/signals";
export abstract class ClickAndDragTool extends EditingTool {
    is_incremental: boolean = false;
    dirty: boolean = false;
    drag_start: Vector2 | null = null;
    init() {
        this.is_incremental = false;
        this.start = this.start.bind(this);
        this.drag = this.drag.bind(this);
        this.stop = this.stop.bind(this);
        this.drag_start = null;
    }
    select(): void {
    }
    start(at: Vector2, buttons: number): void {
        this.drag_start = vfloor(at);
        this.editing_start();
    }
    editing_start() {
        // nop, implemenet me
    }
    drag(at: Vector2): void {
        if (!this.drag_start) {
            return;
        }
        // this.editor.app.tool_context.beginPath();
        this.editing_drag(vfloor(at));
        batch(() => {
            this.canvas_bounds_mapping_signal!.value = this.canvas_bounds_mapping!;
            this.canvas_signal!.value = this.canvas!;
        })
    }
    hover(at: any): boolean {
        if (!this.context) {
            return false;
        }
        const dirty = this.hover_action(at);
        if (dirty) {
            return true;
        }
        return false;
    }
    hover_action(at: any) {
        // nop
        return false;
    }
    editing_drag(at: Vector2) {
        throw new Error("Not fully implemented tool");
    }
    stop(at: Vector2): boolean {
        this.dirty = !!this.editing_stop(at) || this.dirty;
        if (this.dirty) {

            //this.editor.undo_redo_buffer.push(this.app.document_context!.getImageData(0, 0, this.w, this.h));
            //this.editor.tool_to_document()
            this.dirty = false;
            return true
        }
        this.drag_start = null;
        return false;
    }
    editing_stop(at: Vector2): boolean {
        // nop, implemenet me
        return false
    }
}
