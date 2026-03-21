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
import { CursorSize } from './cursor_size'
//import { FillStyleToggler } from './styletogglers'
//import { mandala } from "./mandala";
import { unit_rect, Vector2, Rect, RectToRectMapping, scale_rect } from "./types"
import { init_canvas, tool_to_document } from "./utils"
import { Signal, signal, computed, effect } from "@preact/signals";
import { StateValue, state_registry } from "./state_registry"
const v: new (...args: any[]) => EditingTool = RectTool
const tool_classes = new Map<string, new (...args: any[]) => EditingTool>
    ([
        ["rect", RectTool]
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
        this.tool.start(this.view_coords_to_doc_coords({ x: event.offsetX, y: event.offsetY }), event.buttons);
    }
    pointermove(event: MouseEvent) {
        this._last_hover_spot = { x: event.offsetX, y: event.offsetY }
        if (event.buttons) {
            this.tool.drag(this.view_coords_to_doc_coords({ x: event.offsetX, y: event.offsetY }));
            this.tool.hover(this.view_coords_to_doc_coords({ x: event.offsetX, y: event.offsetY }));
        }
        else {
            this.tool.hover(this.view_coords_to_doc_coords({ x: event.offsetX, y: event.offsetY }));
        }
        // Appply action
        // this.staging_to_view()
        // this.tmp_tool_to_view();

    }
    undo() {
        // this.art_to_staging();
        // //OD: fix this.app.tool_context.clearRect(0, 0, this._art_canvas_bounding_rect.w, this._art_canvas_bounding_rect.h);
        // const undone_image_data = this.undo_redo_buffer.undo();
        // this.app.clear_art_canvas();
        // if (undone_image_data) {
        //     this.document_context.putImageData(undone_image_data, 0, 0);
        // }
        // this.art_to_view();
        // this.art_to_staging();
    }
    redo() {
        // const redone_image_data = this.undo_redo_buffer.redo();
        // if (redone_image_data) {
        //     this.app.staging_context.clearRect(0, 0, this._art_canvas_bounding_rect.w, this._art_canvas_bounding_rect.h);
        //     this.app.tool_context.clearRect(0, 0, this._art_canvas_bounding_rect.w, this._art_canvas_bounding_rect.h);
        //     this.app.clear_art_canvas();
        //     this.document_context.putImageData(redone_image_data, 0, 0);
        //     this.art_to_view();
        //     this.art_to_staging();
        // }
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
        const at = this.view_coords_to_doc_coords({ x: event.offsetX, y: event.offsetY });
        this.tool.hover(at);
        this.tool.stop(at);
    }
    pointerin(event: MouseEvent) {
        if (!!event.buttons) {
        }
        //this.pointerup(event);
    }
    pointerleave(event: MouseEvent) {
        // this.app.tool_tmp_context.clearRect(0, 0, this._art_canvas_bounding_rect.w, this._art_canvas_bounding_rect.h);
        this._last_hover_spot = null;
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
