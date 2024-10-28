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
import { Mandala } from "./mandala";
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
    ,["mandala", Mandala]
 ])
export class Editor {
    app: any;
    w: any;
    h: any;
    undo_redo_buffer: UndoRedoBuffer<RenderingContext>;
    tool: any;
    previous_tool_name: any;
    current_tool_name: any;
    from: any;
    private _last_hover_spot: Vector2 | null;
    constructor(app: MainApp) {
        this.app = app;
        this.w = this.app.art_canvas.width;
        this.h = this.app.art_canvas.height;
        this.undo_redo_buffer = new UndoRedoBuffer(100);
        this.tool = new NopTool(app.tool_context, this, app.tool_tmp_context);
        this._last_hover_spot = null;
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
            this.tool.hover(this._last_hover_spot);
            override_canvas_context(this.app.view_context, this.app.tool_tmp_canvas, true);
        }
    }
    deselect_tool() {
        this.tool = null;
    }
    pointerdown(event:MouseEvent) {
        event.preventDefault();
        override_canvas_context(this.app.staging_context, this.app.art_canvas);
        this.tool.start({ x: event.offsetX, y: event.offsetY }, event.buttons);
    }
    pointermove(event:MouseEvent) {
        this._last_hover_spot = { x: event.offsetX, y: event.offsetY }
        if (event.buttons) {
            this.tool.action({ x: event.offsetX, y: event.offsetY });
            this.tool.hover({ x: event.offsetX, y: event.offsetY });
            override_canvas_context(this.app.view_context, this.app.tool_tmp_canvas, true);
        }
        else {
            this.tool.hover({ x: event.offsetX, y: event.offsetY });
            override_canvas_context(this.app.view_context, this.app.tool_tmp_canvas, true);
        }
        // Appply action
        
        override_canvas_context(this.app.view_context, this.app.staging_canvas);
        override_canvas_context(this.app.view_context, this.app.tool_tmp_canvas, true);
    }
    undo() {
        override_canvas_context(this.app.staging_context, this.app.art_canvas);
        this.app.tool_context.clearRect(0, 0, this.w, this.h);
        const undone_image_data = this.undo_redo_buffer.undo();
        this.app.clear_art_canvas();
        if (undone_image_data) {
            this.app.art_context.putImageData(undone_image_data, 0, 0);
        }
        override_canvas_context(this.app.view_context, this.app.art_canvas);
        override_canvas_context(this.app.staging_context, this.app.art_canvas);
    }
    redo() {
        const redone_image_data = this.undo_redo_buffer.redo();
        if (redone_image_data) {
            this.app.staging_context.clearRect(0, 0, this.w, this.h);
            this.app.tool_context.clearRect(0, 0, this.w, this.h);
            this.app.clear_art_canvas();
            this.app.art_context.putImageData(redone_image_data, 0, 0);
            override_canvas_context(this.app.view_context, this.app.art_canvas);
            override_canvas_context(this.app.staging_context, this.app.art_canvas);
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
        this.tool.hover({ x: event.offsetX, y: event.offsetY });
        this.tool.stop();
    }
    pointerin(event:MouseEvent) {
        if (!!event.buttons) {
        }
        //this.pointerup(event);
    }
    pointerleave(event:MouseEvent) {
        this.app.tool_tmp_context.clearRect(0, 0, this.w, this.h);
        override_canvas_context(this.app.staging_context, this.app.art_canvas);
        override_canvas_context(this.app.staging_context, this.app.tool_canvas, true);
        override_canvas_context(this.app.view_context, this.app.staging_canvas);
        //override_canvas_context(this.app.staging_context, this.app.tool_canvas, true)
        this._last_hover_spot = null
    }
}
