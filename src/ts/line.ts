import { ClickAndDragTool } from "./click_and_drag_tool"
import { Editor } from "./editor";
import { Vector2 } from "./types";

export class LineTool extends ClickAndDragTool {
    constructor(editor:Editor) {
        super(editor);
        this.canvas = document.createElement("canvas") as HTMLCanvasElement;
        this.context = this.canvas.getContext('2d')! as CanvasRenderingContext2D
        this.staging_canvas = document.createElement("canvas") as HTMLCanvasElement;
        this.staging_context = this.staging_canvas.getContext('2d')!
        this.staging_canvas.width = this.w;
        this.staging_canvas.height = this.h;

    }
    editing_action(to:Vector2) {
        if (!this.from) {
            return false;
        }
        const flip:boolean = (to.x < this.from.x) !==(to.y < this.from.y)

        let staging_canvas:HTMLCanvasElement= document.getElementById('rect_canvas') as HTMLCanvasElement

        if (!document.getElementById('rect_canvas')) {
            document.getElementById('canvas-area')!.appendChild(this.staging_canvas); // OD: for testing
            this.staging_canvas.setAttribute('id', 'rect_canvas')
        }
        const draw_on_canvas = (context:CanvasRenderingContext2D) => {
        context.fillStyle = 'rgb(1,1,1,0)'
        context.fillRect(0,0, this.w, this.h);
        context.strokeStyle = this.app.settings.fore_color; // OD: for testing
        context.beginPath()
        if (flip) {
            context.moveTo(this.w,0)
            context.lineTo(0,this.h)
        } else {
            context.moveTo(0,0)
            context.lineTo(this.w,this.h)
        }
        context.stroke()
        }
        this.top_left = {x:Math.min(to.x, this.from.x), y: Math.min(to.y, this.from.y)};
        this.w = Math.floor(Math.abs(to.x - this.from.x));
        this.h = Math.floor(Math.abs(to.y - this.from.y));
        this.canvas.width = this.w;
        this.canvas.height = this.h;
        this.staging_canvas.width = this.w;
        this.staging_canvas.height = this.h;
        draw_on_canvas(this.context)

        return true;
    }
}
