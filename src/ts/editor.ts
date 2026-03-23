import { UndoRedoBuffer } from "./undo_redo_buffer"
import { EditingTool, NopTool } from './editing_tool'
import { MainApp } from "./main_app";
import { ScribbleTool } from "./scribble";
import { CircleTool } from "./circle";
import { ClearAllTool } from "./clearall";
import { Dropper } from "./dropper";
import { EraserTool } from "./eraser";
import { Floodfill } from "./floodfill";
import { LineTool } from "./line";
import { RectTool } from "./rect";
import { PolygonTool } from "./polygon";
import { CursorSize } from './cursor_size'
//import { FillStyleToggler } from './styletogglers'
//import { mandala } from "./mandala";
import { unit_rect, Vector2, Rect, RectToRectMapping, scale_rect } from "./types"
import { init_canvas, tool_to_document } from "./utils"
import { Signal, signal, computed, effect } from "@preact/signals";
import { StateValue, state_registry } from "./state_registry"
import { mandala_mode } from "./mandala_mode"
import { setPixel, RGBA } from "./pixel_utils"
import { anchor_manager, SNAP_RADIUS_SCREEN_PX } from "./anchor_manager"
const v: new (...args: any[]) => EditingTool = RectTool
const tool_classes = new Map<string, new (...args: any[]) => EditingTool>
    ([
        ["polygon", PolygonTool]
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
    undo_redo_buffer: UndoRedoBuffer<ImageData>;
    tool: any;
    previous_tool_name: any;
    current_tool_name: any;
    from: any;
    private _last_hover_spot: Vector2 | null;
    _last_doc_pos: Vector2 | null = null;
    private _dragging_anchor_idx: number = -1;
    placing_anchor: boolean = false;
    anchor_edit_mode: boolean = false;
    document_canvas: HTMLCanvasElement;
    document_context: CanvasRenderingContext2D;
    view_canvas: HTMLCanvasElement;
    tool_canvas_signal: Signal<HTMLCanvasElement>;
    tool_bounds_signal: Signal<RectToRectMapping>;
    view_port_signal: Signal<Rect>;
    document_dirty_signal: Signal<number>;
    init_: any;
    constructor(document_canvas: HTMLCanvasElement,
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
        this.undo_redo_buffer = new UndoRedoBuffer(100);
        this.tool = new NopTool();
        this.document_canvas = document_canvas;
        this.view_canvas = view_canvas;
        this.document_context = this.document_canvas.getContext('2d', { willReadFrequently: true }) as CanvasRenderingContext2D;
        // Disable anti-aliasing/smoothing for pixel-perfect rendering
        this.document_context.imageSmoothingEnabled = false;
        this._last_hover_spot = null;
    }
    view_coords_to_doc_coords(view_coords: Vector2): Vector2 {
        const vp = this.view_port_signal.value;
        return {
            x: Math.floor(vp.x + view_coords.x / this.view_canvas.clientWidth * vp.w),
            y: Math.floor(vp.y + view_coords.y / this.view_canvas.clientHeight * vp.h)
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

    push_undo_snapshot() {
        const imageData = this.document_context.getImageData(
            0, 0, this.document_canvas.width, this.document_canvas.height
        );
        this.undo_redo_buffer.push(imageData);
    }
    undo() {
        const snapshot = this.undo_redo_buffer.undo();
        if (snapshot) {
            this.document_context.putImageData(snapshot, 0, 0);
            this.document_dirty_signal.value++;
        }
    }
    redo() {
        const snapshot = this.undo_redo_buffer.redo();
        if (snapshot) {
            this.document_context.putImageData(snapshot, 0, 0);
            this.document_dirty_signal.value++;
        }
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
    pointerin(event: MouseEvent) {
        if (!!event.buttons) {
        }
        //this.pointerup(event);
    }
    pointerleave(event: MouseEvent) {
        this._last_hover_spot = null;
        this._last_doc_pos = null;
        this._dragging_anchor_idx = -1;
        this.tool.pointer_leave();
    }
    staging_to_art() {
        // override_canvas_context(this.document_context, this.app.staging_canvas,
        //     this._art_canvas_bounding_rect, false, false, true)
    }
    staging_to_view() {
        // this._non_native_view_render_countdown = 10;
        // override_canvas_context(this.app.view_context, this.app.staging_canvas,
        //     this.view_port_signal.value, false, false, false)
        //     if (this._view_rendering_countdown_interval==undefined) {
        //         const _this = this;
        //         this._view_rendering_countdown_interval = setInterval(() => {
        //             _this._non_native_view_render_countdown--;
        //             if (_this._non_native_view_render_countdown <=0) {
        //                 _this._non_native_view_render_countdown = 10
        //                 override_canvas_context(this.app.view_context, this.app.staging_canvas,
        //                     this.view_port_signal.value, false, true, false)
        //                 window.clearInterval(this._view_rendering_countdown_interval)
        //                 this._view_rendering_countdown_interval=undefined;
        //             }
        //         }, 100)
        // }
    }
    art_to_view() {
        // this._non_native_view_render_countdown = 10;
        // override_canvas_context(this.app.view_context, this.app.document_canvas,
        //     this.view_port_signal.value, false, false, false)
        // if (this._view_rendering_countdown_interval==undefined) {
        //     const _this = this;
        //     this._view_rendering_countdown_interval = setInterval(() => {
        //         _this._non_native_view_render_countdown--;
        //         if (_this._non_native_view_render_countdown <=0) {
        //             _this._non_native_view_render_countdown = 10
        //             override_canvas_context(this.app.view_context, this.app.document_canvas,
        //                 this.view_port_signal.value, false, true, false)
        //                 window.clearInterval(this._view_rendering_countdown_interval)
        //                 this._view_rendering_countdown_interval=undefined;
        //         }
        //     }, 100)
        // }
    }
    art_to_staging() {
        // override_canvas_context(this.app.staging_context, this.app.document_canvas, this._art_canvas_bounding_rect, false, false, true)
    }
    tool_to_document() {
        const tool_canvas = this.tool_canvas_signal.value!;
        tool_to_document(tool_canvas,
            this.tool_bounds_signal.value!, this.document_context);
    }
    tool_to_view() {
        // override_canvas_context(this.app.view_context, this.app.tool_canvas,
        //     this.view_port_signal.value, false, false, false)
    }
    tmp_tool_to_staging() {
        // override_canvas_context(this.app.staging_context, this.app.tool_tmp_canvas,
        //     this._art_canvas_bounding_rect, true, false, true)
    }
    tmp_tool_to_view() {
        // override_canvas_context(this.app.view_context, this.app.tool_tmp_canvas,
        //     this.view_port_signal.value, true, false, false)
    }
}
