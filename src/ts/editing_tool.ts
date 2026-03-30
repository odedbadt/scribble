import { Editor } from "./editor"
import { MainApp } from "./main_app";
import { Rect, Vector2, RectToRectMapping } from "./types";
import { Signal, signal, computed, effect, batch } from "@preact/signals";

export abstract class EditingTool {
    canvas: HTMLCanvasElement | null = null;
    context: CanvasRenderingContext2D | null = null;
    canvas_bounds_mapping: RectToRectMapping | null = null;
    canvas_bounds_mapping_signal: Signal<RectToRectMapping> | null = null;

    zero: Vector2 | null = null
    safety = 0
    canvas_signal: Signal<HTMLCanvasElement | null> | null = null;
    private _editor: Editor | null = null;
    document_dirty_signal: Signal<number> | null = null;
    push_undo_snapshot: (() => void) | null = null;
    begin_undo_capture: ((rect?: Rect) => void) | null = null;
    cancel_undo_capture: (() => void) | null = null;
    push_undo_snapshot_clipped: ((rect: Rect) => void) | null = null;

    /** Always returns the currently active layer's context. */
    get document_context(): CanvasRenderingContext2D | null {
        return this._editor?.document_context ?? null;
    }
    /** Always returns the currently active layer's canvas. */
    get document_canvas(): HTMLCanvasElement | null {
        return this._editor?.document_canvas ?? null;
    }

    constructor() {

    }
    publish_signals() {
        // Always create a new object reference so the signal fires even when bounds are unchanged.
        // Preact signals use reference equality; reusing the same object would silently skip renders.
        const mapping = this.canvas_bounds_mapping;
        batch(() => {
            this.canvas_bounds_mapping_signal!.value = mapping
                ? { from: { ...mapping.from }, to: { ...mapping.to } }
                : null!;
            this.canvas_signal!.value = this.canvas;
        })
    }
    init_editor(editor: Editor) {
        this._editor = editor;
        this.document_dirty_signal = editor.document_dirty_signal;
        this.push_undo_snapshot = () => editor.push_undo_snapshot();
        this.begin_undo_capture = (rect?) => editor.begin_undo_capture(rect);
        this.cancel_undo_capture = () => editor.cancel_undo_capture();
        this.push_undo_snapshot_clipped = (rect) => editor.push_undo_snapshot_clipped(rect);
    }
    abstract select(): void
    abstract start(at: Vector2, buttons: number): void;
    abstract drag(at: Vector2): void;
    stop(at: Vector2): void {
        this.canvas_signal!.value = null;
    }
    abstract hover(at: Vector2): void;
    pointer_leave(): void {}
    deselect(): void {}
    /** Called when the document canvas origin shifts (grow left/top). Shift stored doc coords. */
    on_doc_origin_shift(_dx: number, _dy: number): void {}

}
export class NopTool extends EditingTool {

    select() {
    }
    start(at: Vector2, buttons: number) {
    }
    drag(at: Vector2) {
    }
    stop(at: Vector2) {
    }
    hover(at: Vector2) {
    }
}
