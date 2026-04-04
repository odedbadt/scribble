import { ActionHistory, UndoableAction } from "./action_history"
import { LayerStack } from "./layer_stack"
import { EditingTool, NopTool } from './editing_tool'
import { ScribbleTool } from "./scribble";
import { CircleTool } from "./circle";
import { ClearAllTool } from "./clearall";
import { Dropper } from "./dropper";
import { EraserTool } from "./eraser";
import { Floodfill } from "./floodfill";
import { LineTool } from "./line";
import { RectTool } from "./rect";
import { PolygonTool } from "./polygon";
import { TopoHullTool } from "./topo_hull";
import { HeartTool } from "./heart";
import { CloudStampTool } from "./cloud_stamp";
import { CursorSize } from './cursor_size'
//import { FillStyleToggler } from './styletogglers'
//import { mandala } from "./mandala";
import { Vector2, Rect, RectToRectMapping } from "./types"
import { init_canvas } from "./utils"
import { Signal } from "@preact/signals";
import { mandala_mode } from "./mandala_mode"
import { setPixel, RGBA, extract_sub_image } from "./pixel_utils"
import { anchor_manager, SNAP_RADIUS_SCREEN_PX } from "./anchor_manager"
const tool_classes = new Map<string, new (...args: any[]) => EditingTool>
    ([
        ["polygon", PolygonTool]
        , ["topo_hull", TopoHullTool]
        , ["heart", HeartTool]
        , ["cloud_stamp", CloudStampTool]
        , ["rect", RectTool]
        , ["scribble", ScribbleTool]
        , ["line", LineTool]
        , ["circle", CircleTool]
        , ["dropper", Dropper]
        , ["floodfill", Floodfill]
        , ["eraser", EraserTool]
        , ["clearall", ClearAllTool]
        , ["cursor_size", CursorSize]
        // , ["fillstyle", FillStyleToggler]
        // , ["mandala", mandala]
    ])
export class Editor {
    private _history: ActionHistory = new ActionHistory();
    private _undo_before: { x: number; y: number; data: ImageData } | null = null;
    tool: any;
    private _last_hover_spot: Vector2 | null;
    _last_doc_pos: Vector2 | null = null;
    private _dragging_anchor_idx: number = -1;
    placing_anchor: boolean = false;
    anchor_edit_mode: boolean = false;
    layer_stack: LayerStack;

    // Layer pan state
    private _pan_start: Vector2 | null = null;
    private _pan_origin_data: ImageData | null = null;
    view_canvas: HTMLCanvasElement;
    tool_canvas_signal: Signal<HTMLCanvasElement>;
    tool_bounds_signal: Signal<RectToRectMapping>;
    view_port_signal: Signal<Rect>;
    document_dirty_signal: Signal<number>;

    /** The active drawing canvas — proxies to the current layer. */
    get document_canvas(): HTMLCanvasElement { return this.layer_stack.active_layer.canvas; }
    /** The active drawing context — proxies to the current layer. */
    get document_context(): CanvasRenderingContext2D { return this.layer_stack.active_layer.context; }

    constructor(layer_stack: LayerStack,
        view_canvas: HTMLCanvasElement,
        tool_canvas_signal: Signal<HTMLCanvasElement>,
        tool_bounds_signal: Signal<RectToRectMapping>,
        view_port_signal: Signal<Rect>,
        document_dirty_signal: Signal<number>
    ) {
        this.tool_canvas_signal = tool_canvas_signal;
        this.tool_bounds_signal = tool_bounds_signal;
        this.view_port_signal = view_port_signal;
        this.document_dirty_signal = document_dirty_signal;
        this.layer_stack = layer_stack;
        this.tool = new NopTool();
        this.view_canvas = view_canvas;
        this._last_hover_spot = null;
    }

    view_coords_to_doc_coords(view_coords: Vector2): Vector2 {
        const vp = this.view_port_signal.value;
        const doc_w = this.document_canvas.width;
        const doc_h = this.document_canvas.height;
        return {
            x: Math.max(0, Math.min(doc_w - 1, Math.floor(vp.x + view_coords.x / this.view_canvas.clientWidth * vp.w))),
            y: Math.max(0, Math.min(doc_h - 1, Math.floor(vp.y + view_coords.y / this.view_canvas.clientHeight * vp.h)))
        }
    }

    // Snap radius in document pixels, based on screen-pixel constant and current zoom
    snap_radius_doc(): number {
        const vp = this.view_port_signal.value;
        return SNAP_RADIUS_SCREEN_PX * (vp.w / this.view_canvas.clientWidth);
    }
    view_port_px(): Rect {
        const top_left_px = this.view_coords_to_doc_coords({
            x: this.view_port_signal.value.x,
            y: this.view_port_signal.value.y
        })
        return {
            x: top_left_px.x,
            y: top_left_px.y,
            w: this.view_port_signal.value.w,
            h: this.view_port_signal.value.h
        }
    }
    select_tool(tool_name: string) {
        //state_registry.set(StateValue.SelectedToolName, tool_name)
        const tool_class = tool_classes.get(tool_name);
        if (!tool_class) {
            return;
        }
        this.tool?.deselect?.();
        this.tool = new tool_class();
        this.tool.init_editor(this);

        init_canvas(this.tool, this.tool_canvas_signal, this.tool_bounds_signal);
        //this.tool_canvas_signal.value = this.tool.canvas;

        this.tool.context!.fillStyle = 'rgba(0,0,0,0)';
        this.tool.context!.fillRect(0, 0, this.tool.canvas!.width, this.tool.canvas!.height);
        if (this._last_hover_spot) {
            this.tool.hover(this.view_coords_to_doc_coords(this._last_hover_spot));
        }
        this.tool.select();
    }
    deselect_tool() {
        this.tool = null;
    }
    pointerdown(event: MouseEvent) {
        event.preventDefault();
        const raw = this.view_coords_to_doc_coords({ x: event.offsetX, y: event.offsetY });
        const radius = this.snap_radius_doc();
        // Right-click near anchor removes it; otherwise fall through to draw with back color
        if (event.button === 2) {
            const { removed, was_center } = anchor_manager.remove_nearest(raw, radius);
            if (was_center) mandala_mode.center = null;
            if (removed) return;
        }
        // Layer pan mode: start panning the designated layer
        if (this.layer_stack.pan_layer_index !== null) {
            const layer = this.layer_stack.layers.peek()[this.layer_stack.pan_layer_index];
            if (layer) {
                this._pan_start = raw;
                this._pan_origin_data = layer.context.getImageData(0, 0, layer.canvas.width, layer.canvas.height);
            }
            return;
        }
        // Anchor edit mode: drag existing or place new; never start a draw stroke
        if (this.anchor_edit_mode) {
            const idx = anchor_manager.nearest_idx(raw, radius);
            if (idx >= 0) {
                this._dragging_anchor_idx = idx;
                this.tool.pointer_leave();
            } else {
                anchor_manager.add(raw);
            }
            return;
        }
        const { pt: at } = anchor_manager.snap(raw, radius);
        if (mandala_mode.enabled && mandala_mode.center === null) {
            const idx = anchor_manager.add(at);
            anchor_manager.set_mandala_center(idx);
            mandala_mode.center = at;
            return;
        }
        this.tool.start(at, event.buttons);
    }
    pointermove(event: MouseEvent) {
        this._last_hover_spot = { x: event.offsetX, y: event.offsetY }
        const raw = this.view_coords_to_doc_coords({ x: event.offsetX, y: event.offsetY });
        this._last_doc_pos = raw;
        // Layer pan move
        if (this.layer_stack.pan_layer_index !== null && this._pan_start && event.buttons && this._pan_origin_data) {
            const dx = Math.round(raw.x - this._pan_start.x);
            const dy = Math.round(raw.y - this._pan_start.y);
            const layer = this.layer_stack.layers.peek()[this.layer_stack.pan_layer_index];
            if (layer) {
                layer.context.clearRect(0, 0, layer.canvas.width, layer.canvas.height);
                layer.context.putImageData(this._pan_origin_data, dx, dy);
                this._mark_dirty();
            }
            return;
        }
        // Dragging an existing anchor — just move it, no tool cursor
        if (this._dragging_anchor_idx >= 0) {
            anchor_manager.move(this._dragging_anchor_idx, raw);
            if (this._dragging_anchor_idx === anchor_manager.mandala_center_idx) {
                mandala_mode.center = anchor_manager.get_mandala_center();
            }
            return;
        }
        // Placing a new anchor from the toolbar button — show anchor dot, not draw cursor
        if (this.placing_anchor || this.anchor_edit_mode) {
            this._show_anchor_placement_cursor(raw);
            return;
        }
        const { pt: at } = anchor_manager.snap(raw, this.snap_radius_doc());
        if (mandala_mode.enabled && mandala_mode.center === null) {
            if (!event.buttons) this._show_center_placement_cursor(at);
            return;
        }
        if (event.buttons) {
            this.tool.drag(at);
            this.tool.hover(at);
        }
        else {
            this.tool.hover(at);
        }
        // Appply action
        // this.staging_to_view()
        // this.tmp_tool_to_view();

    }
    private _show_center_placement_cursor(at: Vector2) {
        const arm = 7;
        const size = arm * 2 + 1;
        this.tool.canvas!.width = size;
        this.tool.canvas!.height = size;
        this.tool.canvas_bounds_mapping = {
            from: { x: 0, y: 0, w: 1, h: 1 },
            to: { x: at.x - arm, y: at.y - arm, w: size, h: size },
        };
        const ctx = this.tool.context!;
        const imageData = ctx.getImageData(0, 0, size, size);
        const color: RGBA = [0, 0, 0, 255];
        for (let i = 0; i < size; i++) {
            setPixel(imageData, i, arm, color);
            setPixel(imageData, arm, i, color);
        }
        ctx.putImageData(imageData, 0, 0);
        this.tool.publish_signals();
    }

    private _show_anchor_placement_cursor(at: Vector2) {
        const arm = 5;
        const size = arm * 2 + 1;
        this.tool.canvas!.width = size;
        this.tool.canvas!.height = size;
        this.tool.canvas_bounds_mapping = {
            from: { x: 0, y: 0, w: 1, h: 1 },
            to: { x: at.x - arm, y: at.y - arm, w: size, h: size },
        };
        const ctx = this.tool.context!;
        const imageData = ctx.getImageData(0, 0, size, size);
        // Draw a small ring at the centre of the canvas (same style as anchor dots)
        const color: RGBA = [0, 100, 220, 200];
        for (let dy = -arm; dy <= arm; dy++) {
            for (let dx = -arm; dx <= arm; dx++) {
                const d = Math.sqrt(dx * dx + dy * dy);
                if (d >= arm - 0.6 && d <= arm + 0.6) {
                    setPixel(imageData, arm + dx, arm + dy, color);
                }
            }
        }
        setPixel(imageData, arm, arm, color);
        ctx.putImageData(imageData, 0, 0);
        this.tool.publish_signals();
    }

    show_center_overlay() {
        if (!mandala_mode.center) return;
        const at = mandala_mode.center;
        const arm = 4;
        const size = arm * 2 + 1;
        this.tool.canvas!.width = size;
        this.tool.canvas!.height = size;
        this.tool.canvas_bounds_mapping = {
            from: { x: 0, y: 0, w: 1, h: 1 },
            to: { x: at.x - arm, y: at.y - arm, w: size, h: size },
        };
        const ctx = this.tool.context!;
        const imageData = ctx.getImageData(0, 0, size, size);
        const color: RGBA = [80, 80, 80, 255];
        for (let i = 0; i < size; i++) {
            setPixel(imageData, i, arm, color);
            setPixel(imageData, arm, i, color);
        }
        ctx.putImageData(imageData, 0, 0);
        this.tool.publish_signals();
    }

    clear_undo_history() {
        this._history.clear();
        this._undo_before = null;
    }

    /** Discard a pending begin_undo_capture() without pushing (nothing changed). */
    cancel_undo_capture() {
        this._undo_before = null;
    }

    /**
     * Like push_undo_snapshot() but clips the stored before-data to `rect`,
     * so only that region is saved.  Intended for tools that capture a full
     * canvas before-snapshot and later discover the actual dirty bounds.
     */
    push_undo_snapshot_clipped(rect: Rect) {
        if (!this._undo_before) return;
        const { data: fullBefore } = this._undo_before;
        this._undo_before = null;
        const { x, y } = rect;
        const before = extract_sub_image(fullBefore, rect);
        const after = this.document_context.getImageData(x, y, rect.w, rect.h);
        const ctx = this.document_context;
        this._history.push({
            undo() { ctx.putImageData(before, x, y); },
            redo() { ctx.putImageData(after, x, y); },
        });
    }

    begin_undo_capture(rect?: Rect) {
        const cw = this.document_canvas.width;
        const ch = this.document_canvas.height;
        const x = rect ? Math.max(0, Math.floor(rect.x)) : 0;
        const y = rect ? Math.max(0, Math.floor(rect.y)) : 0;
        const w = rect ? Math.min(Math.ceil(rect.w + (rect.x - x)), cw - x) : cw;
        const h = rect ? Math.min(Math.ceil(rect.h + (rect.y - y)), ch - y) : ch;
        if (w <= 0 || h <= 0) return;
        this._undo_before = { x, y, data: this.document_context.getImageData(x, y, w, h) };
    }

    push_undo_snapshot() {
        if (!this._undo_before) return;
        const { x, y, data: before } = this._undo_before;
        this._undo_before = null;
        const after = this.document_context.getImageData(x, y, before.width, before.height);
        const ctx = this.document_context;
        this._history.push({
            undo() { ctx.putImageData(before, x, y); },
            redo() { ctx.putImageData(after, x, y); },
        });
    }

    undo() {
        const did_undo = this._history.undo();
        if (did_undo) this._mark_dirty();
    }

    redo() {
        const did_redo = this._history.redo();
        if (did_redo) this._mark_dirty();
    }

    _mark_dirty(): void {
        this.layer_stack.recomposite();
        this.document_dirty_signal.value++;
    }

    push_layer_action(action: UndoableAction): void {
        this._history.push(action);
    }
    keydown(event: KeyboardEvent) {
        if (event.code == 'KeyU') {
            this.undo();
        }
        if (event.code == 'KeyR') {
            this.redo();
        }
    }

    pointerup(event: MouseEvent) {
        // Finish layer pan
        if (this.layer_stack.pan_layer_index !== null && this._pan_start && this._pan_origin_data) {
            const raw = this.view_coords_to_doc_coords({ x: event.offsetX, y: event.offsetY });
            const dx = Math.round(raw.x - this._pan_start.x);
            const dy = Math.round(raw.y - this._pan_start.y);
            const idx = this.layer_stack.pan_layer_index;
            const layer = this.layer_stack.layers.peek()[idx];
            if (layer && (dx !== 0 || dy !== 0)) {
                const before = this._pan_origin_data;
                const after = layer.context.getImageData(0, 0, layer.canvas.width, layer.canvas.height);
                const mark = () => this._mark_dirty();
                this._history.push({
                    undo() { layer.context.putImageData(before, 0, 0); mark(); },
                    redo() { layer.context.putImageData(after, 0, 0); mark(); },
                });
            }
            this._pan_start = null;
            this._pan_origin_data = null;
            return;
        }
        if (this._dragging_anchor_idx >= 0) {
            this._dragging_anchor_idx = -1;
            return;
        }
        if (this.anchor_edit_mode) {
            return;
        }
        const raw = this.view_coords_to_doc_coords({ x: event.offsetX, y: event.offsetY });
        const { pt: at } = anchor_manager.snap(raw, this.snap_radius_doc());
        this.tool.stop(at);
        this.tool.hover(at);
    }
    pointerleave(event: MouseEvent) {
        this._last_hover_spot = null;
        this._last_doc_pos = null;
        this._dragging_anchor_idx = -1;
        this.tool.pointer_leave();
    }
}

