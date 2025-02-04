import { UndoRedoBuffer } from "./undo_redo_buffer"
import { EditingTool, NopTool } from './editing_tool'
import { MainApp } from "./main_app";
// import { ScribbleTool } from "./scribble";
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
const v:new (...args:any[])=>EditingTool = RectTool
 const tool_classes = new Map<string, new (...args:any[])=>EditingTool>
 ([
    //  ["scribble", ScribbleTool]
    ["rect",  RectTool]
    // ,["line",  LineTool]
    // ,["circle",  CircleTool]
    // ,["dropper",  Dropper]
    // ,["floodfill",  Floodfill]
    // ,["eraser",  EraserTool]
    // ,["clearall", ClearAllTool]
    // ,["cursor_size", CursorSize]
    // ,["fillstyle", FillStyleToggler]
    // ,["mandala", mandala]
 ])
export class Editor {
    app: MainApp;
    undo_redo_buffer: UndoRedoBuffer<ImageData>;
    tool: any;
    previous_tool_name: any;
    current_tool_name: any;
    from: any;
    private _last_hover_spot: Vector2 | null;
    private _view_canvas_bounding_rect: Rect;
    private _art_canvas_bounding_rect: Rect;
    private _non_native_view_render_countdown = 10 
    private _view_rendering_countdown_interval?: NodeJS.Timeout|undefined = undefined;
    constructor(app: MainApp) {
        this.app = app;
        this._view_canvas_bounding_rect = {
            x:0, y: 0, w: this.app.view_canvas.offsetWidth, h: this.app.view_canvas.offsetHeight
        }
        this._art_canvas_bounding_rect = {
            x:0, y: 0, w: this.app.document_canvas.offsetWidth, h: this.app.document_canvas.offsetHeight
        }
        this.undo_redo_buffer = new UndoRedoBuffer(100);
        this.tool = new NopTool(this);
        this._last_hover_spot = null;
    }
    view_coords_to_art_coords(view_coords:Vector2):Vector2 {
        return {
            x: this.app.state.view_port.x +
            view_coords.x  / 
            this._view_canvas_bounding_rect.w * this.app.state.view_port.w,
            y: this.app.state.view_port.y +
            view_coords.y  / 
            this._view_canvas_bounding_rect.h * this.app.state.view_port.h
                }
    }
    view_port_px():Rect {
        const top_left_px = this.view_coords_to_art_coords({
            x:this._view_canvas_bounding_rect.x,
            y:this._view_canvas_bounding_rect.y
        })
        return {
            x: top_left_px.x,
            y: top_left_px.y,
            w: this.app.state.view_port.w,
            h: this.app.state.view_port.h
        }
    }
    staging_to_art() {
        
        // override_canvas_context(this.app.document_context, this.app.staging_canvas,
        //     this._art_canvas_bounding_rect, false, false, true)
    }
    staging_to_view() {
        // this._non_native_view_render_countdown = 10;
        // override_canvas_context(this.app.view_context, this.app.staging_canvas,
        //     this.app.state.view_port, false, false, false)
        //     if (this._view_rendering_countdown_interval==undefined) {
        //         const _this = this;
        //         this._view_rendering_countdown_interval = setInterval(() => {
        //             _this._non_native_view_render_countdown--;
        //             if (_this._non_native_view_render_countdown <=0) {
        //                 _this._non_native_view_render_countdown = 10
        //                 override_canvas_context(this.app.view_context, this.app.staging_canvas,
        //                     this.app.state.view_port, false, true, false)
        //                 window.clearInterval(this._view_rendering_countdown_interval)
        //                 this._view_rendering_countdown_interval=undefined;
        //             }
        //         }, 100)
        // }  
    } 
    art_to_view() {
        // this._non_native_view_render_countdown = 10;
        // override_canvas_context(this.app.view_context, this.app.document_canvas,
        //     this.app.state.view_port, false, false, false)        
        // if (this._view_rendering_countdown_interval==undefined) {
        //     const _this = this;
        //     this._view_rendering_countdown_interval = setInterval(() => {
        //         _this._non_native_view_render_countdown--;
        //         if (_this._non_native_view_render_countdown <=0) {
        //             _this._non_native_view_render_countdown = 10
        //             override_canvas_context(this.app.view_context, this.app.document_canvas,
        //                 this.app.state.view_port, false, true, false)
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
        const tool_image_data = this.tool.canvas.getContext('2d')!.getImageData(0,0,this.tool.w, this.tool.h)
        const tool_data = tool_image_data.data;

        const document_image_data = this.app.document_context.getImageData(
            this.tool.top_left.x,this.tool.top_left.y,
            this.tool.w, this.tool.h)
        const document_data = document_image_data.data;
        for (let y = 0; y < this.tool.h;++y) {
            for (let x = 0; x < this.tool.w;++x) {
                const document_x = x + this.tool.top_left.x; 
                const document_y = y + this.tool.top_left.y; 
                const tool_base_offset = 4*(y*this.tool.w+x);
                const document_base_offset = 4*(document_y*this.app.document_canvas.width+document_x);
                if (tool_data[tool_base_offset+3] > 0) {
                    document_data[document_base_offset+0] = tool_data[tool_base_offset+0]
                    document_data[document_base_offset+1] = tool_data[tool_base_offset+1]
                    document_data[document_base_offset+2] = tool_data[tool_base_offset+2]
                    document_data[document_base_offset+3] = tool_data[tool_base_offset+3]
                }
            }
        }
        this.app.document_context.putImageData(tool_image_data, this.tool.top_left.x, this.tool.top_left.y)

                
        
    }
    tool_to_view() {
        // override_canvas_context(this.app.view_context, this.app.tool_canvas,
        //     this.app.state.view_port, false, false, false)
    }
    tmp_tool_to_staging() {
        // override_canvas_context(this.app.staging_context, this.app.tool_tmp_canvas,
        //     this._art_canvas_bounding_rect, true, false, true)
    }
    tmp_tool_to_view() {
        // override_canvas_context(this.app.view_context, this.app.tool_tmp_canvas,
        //     this.app.state.view_port, true, false, false)
    }
    select_tool(tool_name:string) {
        this.previous_tool_name = this.current_tool_name;
        this.current_tool_name = tool_name;
        const tool_class = tool_classes.get(tool_name);
        if (!tool_class) {
            return;
        }
        this.tool = new tool_class(this);
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
       
        // this.staging_to_view()
        // this.tmp_tool_to_view();
        this.refresh_overlay()
    }
    undo() {
        // this.art_to_staging();
        // //OD: fix this.app.tool_context.clearRect(0, 0, this._art_canvas_bounding_rect.w, this._art_canvas_bounding_rect.h);
        // const undone_image_data = this.undo_redo_buffer.undo();
        // this.app.clear_art_canvas();
        // if (undone_image_data) {
        //     this.app.document_context.putImageData(undone_image_data, 0, 0);
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
        //     this.app.document_context.putImageData(redone_image_data, 0, 0);
        //     this.art_to_view();
        //     this.art_to_staging();
        // }
    }
    keydown(event:KeyboardEvent) {
        if (event.code == 'KeyU') {
            this.undo();
        }
        if (event.code == 'KeyR') {
            this.redo();
        }
    }
    refresh_overlay() {
        this.app.state.overlay_position.x = Math.floor(this.tool.top_left.x);
        this.app.state.overlay_position.y = Math.floor(this.tool.top_left.y);
        this.app.state.overlay_position.w = Math.floor(this.tool.w);
        this.app.state.overlay_position.h = Math.floor(this.tool.h);

    }

    pointerup(event:MouseEvent) {
        this.tool.hover(this.view_coords_to_art_coords({ x: event.offsetX, y: event.offsetY }));
        this.refresh_overlay()
        this.tool.stop();
        
    
    }
    pointerin(event:MouseEvent) {
        if (!!event.buttons) {
        }
        //this.pointerup(event);
    }
    pointerleave(event:MouseEvent) {
        // this.app.tool_tmp_context.clearRect(0, 0, this._art_canvas_bounding_rect.w, this._art_canvas_bounding_rect.h);
        this.art_to_staging();
        this.staging_to_view();
        this._last_hover_spot = null
    }

}
