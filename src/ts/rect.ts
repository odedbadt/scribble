import { ClickAndDragTool } from "./click_and_drag_tool"
import { Editor } from "./editor";
import { Vector2 } from "./types";

export class RectTool extends ClickAndDragTool {
    constructor(editor:Editor) {
        super(editor);
        this.applied_canvas = document.createElement("canvas") as HTMLCanvasElement;
        this.applied_context = this.applied_canvas.getContext('2d')! as CanvasRenderingContext2D
        this.staging_canvas = document.createElement("canvas") as HTMLCanvasElement;
        this.staging_context = this.staging_canvas.getContext('2d')!
        this.staging_canvas.width = this.w;
        this.staging_canvas.height = this.h;

    }
    editing_action(to:Vector2) {
        if (!this.from) {
            return false;
        }

        // let tmp_canvas:HTMLCanvasElement|null = document.getElementById('rect_canvas') as HTMLCanvasElement

        // if (!tmp_canvas) {
        //     document.getElementById('canvas-area')!.appendChild(tmp_canvas); // OD: for testing
        //     tmp_canvas.setAttribute('id', 'rect_canvas')
        // }
        // this.tmp_canvas = tmp_canvas
        this.top_left = {x:Math.min(to.x, this.from.x), y: Math.min(to.y, this.from.y)};
        this.w = Math.abs(to.x - this.from.x);
        this.h = Math.abs(to.y - this.from.y);
        this.staging_context!.fillStyle = this.app.settings.fore_color; // OD: for testing
        this.staging_context!.fillRect(0,0, this.w, this.h);
        this.staging_context!.beginPath()
        // this.tmp_context!.moveTo(this.w,0)
        // this.tmp_context!.lineTo(0,this.h)
        this.staging_context!.moveTo(0,0)
        this.staging_context!.lineTo(this.w,this.h)
        this.staging_context!.stroke()
        
        this.applied_canvas.width = this.w;
        this.applied_canvas.height = this.h;
        this.applied_context!.fillStyle = this.app.settings.fore_color; // OD: for testing
        this.applied_context!.fillRect(0,0, this.w, this.h);
        this.applied_context!.beginPath()
        this.applied_context!.moveTo(0,0)
        this.applied_context!.lineTo(this.w,this.h)
        this.applied_context!.moveTo(this.w,0)
        this.applied_context!.lineTo(0,this.h)
        this.applied_context!.stroke()        
        return true;
    }
}
