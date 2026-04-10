import { UndoableAction } from "./action_history";
import { LayerStack, Layer } from "./layer_stack";
import { Vector2, Rect, RectToRectMapping } from "./types";
import { Signal } from "@preact/signals";
export declare class Editor {
    private _history;
    private _undo_before;
    private _undo_before_layer;
    private _undo_before_layers;
    /** True while any Alt key is held. Updated in pointer event handlers. */
    alt_key: boolean;
    tool: any;
    private _last_hover_spot;
    _last_doc_pos: Vector2 | null;
    private _dragging_anchor_idx;
    placing_anchor: boolean;
    anchor_edit_mode: boolean;
    layer_stack: LayerStack;
    private _pan_start;
    private _pan_origin_data;
    private _alt_pending_layer_select;
    private _alt_drag_started;
    view_canvas: HTMLCanvasElement;
    tool_canvas_signal: Signal<HTMLCanvasElement>;
    tool_bounds_signal: Signal<RectToRectMapping>;
    view_port_signal: Signal<Rect>;
    document_dirty_signal: Signal<number>;
    /** The active drawing canvas — proxies to the current layer. */
    get document_canvas(): HTMLCanvasElement;
    /** The active drawing context — proxies to the current layer. */
    get document_context(): CanvasRenderingContext2D;
    constructor(layer_stack: LayerStack, view_canvas: HTMLCanvasElement, tool_canvas_signal: Signal<HTMLCanvasElement>, tool_bounds_signal: Signal<RectToRectMapping>, view_port_signal: Signal<Rect>, document_dirty_signal: Signal<number>);
    view_coords_to_doc_coords(view_coords: Vector2): Vector2;
    snap_radius_doc(): number;
    view_port_px(): Rect;
    select_tool(tool_name: string): void;
    deselect_tool(): void;
    pointerdown(event: MouseEvent): void;
    pointermove(event: MouseEvent): void;
    private _show_center_placement_cursor;
    private _show_anchor_placement_cursor;
    show_center_overlay(): void;
    clear_undo_history(): void;
    /** Discard a pending begin_undo_capture() without pushing (nothing changed). */
    cancel_undo_capture(): void;
    /**
     * Like push_undo_snapshot() but clips the stored before-data to `rect`,
     * so only that region is saved.  Intended for tools that capture a full
     * canvas before-snapshot and later discover the actual dirty bounds.
     */
    push_undo_snapshot_clipped(rect: Rect): void;
    begin_undo_capture(rect?: Rect): void;
    /** Capture a full-canvas before-snapshot for a specific (possibly non-active) layer. */
    begin_undo_capture_layer(layer: Layer): void;
    push_undo_snapshot(): void;
    /** Push an undo/redo snapshot for a specific (possibly non-active) layer. */
    push_undo_snapshot_layer(layer: Layer): void;
    /** Capture full-canvas before-snapshots for multiple layers (for multi-layer undo). */
    begin_undo_capture_layers(layers: Layer[]): void;
    /** Push a compound undo/redo entry for all previously captured layers. */
    push_undo_snapshot_layers(): void;
    undo(): void;
    redo(): void;
    _mark_dirty(): void;
    push_layer_action(action: UndoableAction): void;
    keydown(event: KeyboardEvent): void;
    pointerup(event: MouseEvent): void;
    pointerleave(event: MouseEvent): void;
}
//# sourceMappingURL=editor.d.ts.map