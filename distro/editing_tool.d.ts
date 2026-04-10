import { Editor } from "./editor";
import { Rect, Vector2, RectToRectMapping } from "./types";
import { Signal } from "@preact/signals";
import { LayerStack } from "./layer_stack";
import { Layer } from "./layer_stack";
export declare abstract class EditingTool {
    canvas: HTMLCanvasElement | null;
    context: CanvasRenderingContext2D | null;
    canvas_bounds_mapping: RectToRectMapping | null;
    canvas_bounds_mapping_signal: Signal<RectToRectMapping> | null;
    zero: Vector2 | null;
    safety: number;
    canvas_signal: Signal<HTMLCanvasElement | null> | null;
    private _editor;
    private _layer_stack;
    document_dirty_signal: Signal<number> | null;
    push_undo_snapshot: (() => void) | null;
    begin_undo_capture: ((rect?: Rect) => void) | null;
    cancel_undo_capture: (() => void) | null;
    push_undo_snapshot_clipped: ((rect: Rect) => void) | null;
    /** Capture before-snapshot for a single specific layer (for single-layer targeted undo). */
    begin_undo_capture_layer: ((layer: Layer) => void) | null;
    /** Push a single-layer undo/redo entry for the previously captured layer. */
    push_undo_snapshot_layer: ((layer: Layer) => void) | null;
    /** Capture before-snapshots for multiple layers (for multi-layer undo). */
    begin_undo_capture_layers: ((layers: Layer[]) => void) | null;
    /** Push a compound undo/redo entry for all previously captured layers. */
    push_undo_snapshot_layers: (() => void) | null;
    /** Returns true if the Alt key is currently held. */
    get_alt_key: (() => boolean) | null;
    /** The LayerStack, available after init_editor(). */
    get layer_stack(): LayerStack | null;
    /** Always returns the currently active layer's context. */
    get document_context(): CanvasRenderingContext2D | null;
    /** Always returns the currently active layer's canvas. */
    get document_canvas(): HTMLCanvasElement | null;
    constructor();
    publish_signals(): void;
    init_editor(editor: Editor): void;
    abstract select(): void;
    abstract start(at: Vector2, buttons: number): void;
    abstract drag(at: Vector2): void;
    stop(at: Vector2): void;
    abstract hover(at: Vector2): void;
    pointer_leave(): void;
    deselect(): void;
    keydown?(ev: KeyboardEvent): void;
    /** Called when the document canvas origin shifts (grow left/top). Shift stored doc coords. */
    on_doc_origin_shift(_dx: number, _dy: number): void;
}
export declare class NopTool extends EditingTool {
    select(): void;
    start(at: Vector2, buttons: number): void;
    drag(at: Vector2): void;
    stop(at: Vector2): void;
    hover(at: Vector2): void;
}
//# sourceMappingURL=editing_tool.d.ts.map