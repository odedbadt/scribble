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
import { override_canvas_context } from "./utils";
import { CursorSize } from './cursor_size'
import { FillStyleToggler } from './styletogglers'
import { mandala } from "./mandala";
import { unit_rect, Vector2, Rect } from "./types"
const v:new (...args:any[])=>EditingTool = ScribbleTool
 const tool_classes = new Map<string, new (...args:any[])=>EditingTool>
 ([
     ["scribble", ScribbleTool]
    ,["rect",  RectTool]
    ,["line",  LineTool]
    ,["circle",  CircleTool]
    ,["dropper",  Dropper]
    ,["floodfill",  Floodfill]
    ,["eraser",  EraserTool]
    ,["clearall", ClearAllTool]
    ,["cursor_size", CursorSize]
    ,["fillstyle", FillStyleToggler]
    ,["mandala", mandala]
 ])
export class Editor {
    app: any;
    undo_redo_buffer: UndoRedoBuffer<RenderingContext>;
    tool: any;
    previous_tool_name: any;
    current_tool_name: any;
    from: any;
    private _last_hover_spot: Vector2 | null;
    private _view_canvas_bounding_rect: Rect;
    private _art_canvas_bounding_rect: Rect;
    constructor(app: MainApp) {
        this.app = app;
        this._view_canvas_bounding_rect = {
            x:0, y: 0, w: this.app.view_canvas.width, h: this.app.view_canvas.height
        }
        this._art_canvas_bounding_rect = {
            x:0, y: 0, w: this.app.art_canvas.width, h: this.app.art_canvas.height
        }
        this.undo_redo_buffer = new UndoRedoBuffer(100);
        this.tool = new NopTool(app.tool_context, this, app.tool_tmp_context);
        this._last_hover_spot = null;
    }
    view_coords_to_art_coords(view_coords:Vector2):Vector2 {
        return {
            x: this._art_canvas_bounding_rect.x + (view_coords.x -
                this._view_canvas_bounding_rect.x)
                         / this._view_canvas_bounding_rect.w * this._art_canvas_bounding_rect.w,
            y: this._art_canvas_bounding_rect.y + (view_coords.y -
                this._view_canvas_bounding_rect.y)
                        / this._view_canvas_bounding_rect.h * this._art_canvas_bounding_rect.h
                }
    }
    staging_to_art() {
        override_canvas_context(this.app.staging_context, this.app.art_canvas,
            this._view_canvas_bounding_rect)
    }
    view_port_px():Rect {
        const top_left_px = this.view_coords_to_art_coords({
            x:this._view_canvas_bounding_rect.x,
            y:this._view_canvas_bounding_rect.y
        })
        return {
            x: top_left_px.x,
            y: top_left_px.y,
            w: this.app.state.view_port.w * this._art_canvas_bounding_rect.w,
            h: this.app.state.view_port.h * this._art_canvas_bounding_rect.h
        }
    }
    staging_to_view() {
        override_canvas_context(this.app.view_context, this.app.staging_canvas,
            this.view_port_px(), true, true)
    }
    art_to_view() {
        override_canvas_context(this.app.staging_context, this.app.art_canvas,
            this.view_port_px(), true)
    }
    art_to_staging() {
        override_canvas_context(this.app.staging_context, this.app.art_canvas,
            this._art_canvas_bounding_rect)
    }
    tool_to_staging() {
        override_canvas_context(this.app.staging_context, this.app.tool_canvas,
            this._view_canvas_bounding_rect, false, true)
    }
    tool_to_view() {
        override_canvas_context(this.app.view_context, this.app.tool_canvas,
            this._view_canvas_bounding_rect)
    }
    tmp_tool_to_staging() {
        override_canvas_context(this.app.staging_context, this.app.tmp_tool_canvas,
            this._art_canvas_bounding_rect)
    }
    tmp_tool_to_view() {
        override_canvas_context(this.app.view_context, this.app.tool_tmp_canvas,
            this.view_port_px(), true)
    }
    select_tool(tool_name:string) {
        this.previous_tool_name = this.current_tool_name;
        this.current_tool_name = tool_name;
        const tool_class = tool_classes.get(tool_name);
        if (!tool_class) {
            return;
        }
        this.tool = new tool_class(this.app.tool_context, this, this.app.tool_tmp_context);
        this.tool.select();
        if (this._last_hover_spot) {
            this.tool.hover(this.view_coords_to_art_coords(this._last_hover_spot));
            this.tmp_tool_to_view();
        }
    }
    deselect_tool() {
        this.tool = null;
    }
    pointerdown(event:MouseEvent) {
        event.preventDefault();
        this.art_to_staging();
        this.tool.start(this.view_coords_to_art_coords({ x: event.offsetX, y: event.offsetY }), event.buttons);
    }
    pointermove(event:MouseEvent) {
        this._last_hover_spot = { x: event.offsetX, y: event.offsetY }
        if (event.buttons) {
            this.tool.action(this.view_coords_to_art_coords({ x: event.offsetX, y: event.offsetY }));
            this.tool.hover(this.view_coords_to_art_coords({ x: event.offsetX, y: event.offsetY }));
            this.tmp_tool_to_view();
        }
        else {
            this.tool.hover(this.view_coords_to_art_coords({ x: event.offsetX, y: event.offsetY }));
            this.tmp_tool_to_view();
        }
        // Appply action
       
        this.staging_to_view()
        this.tmp_tool_to_view();
    }
    undo() {
        this.art_to_staging();
        this.app.tool_context.clearRect(0, 0, this._art_canvas_bounding_rect.w, this._art_canvas_bounding_rect.h);
        const undone_image_data = this.undo_redo_buffer.undo();
        this.app.clear_art_canvas();
        if (undone_image_data) {
            this.app.art_context.putImageData(undone_image_data, 0, 0);
        }
        this.art_to_view();
        this.art_to_staging();
    }
    redo() {
        const redone_image_data = this.undo_redo_buffer.redo();
        if (redone_image_data) {
            this.app.staging_context.clearRect(0, 0, this._art_canvas_bounding_rect.w, this._art_canvas_bounding_rect.h);
            this.app.tool_context.clearRect(0, 0, this._art_canvas_bounding_rect.w, this._art_canvas_bounding_rect.h);
            this.app.clear_art_canvas();
            this.app.art_context.putImageData(redone_image_data, 0, 0);
            this.art_to_view();
            this.art_to_staging();
        }
    }
    keydown(event:KeyboardEvent) {
        if (event.code == 'KeyU') {
            this.undo();
        }
        if (event.code == 'KeyR') {
            this.redo();
        }
    }
    pointerup(event:MouseEvent) {
        this.tool.hover(this.view_coords_to_art_coords({ x: event.offsetX, y: event.offsetY }));
        this.tool.stop();
    }
    pointerin(event:MouseEvent) {
        if (!!event.buttons) {
        }
        //this.pointerup(event);
    }
    pointerleave(event:MouseEvent) {
        this.app.tool_tmp_context.clearRect(0, 0, this._art_canvas_bounding_rect.w, this._art_canvas_bounding_rect.h);
        this.art_to_staging();
        this.tool_to_staging();
        this.staging_to_view();
        this._last_hover_spot = null
    }
}
