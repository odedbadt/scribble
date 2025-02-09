import { ClickAndDragTool } from "./click_and_drag_tool"
import { Editor } from "./editor";
import { Vector2 } from "./types";

export class ScribbleTool extends ClickAndDragTool {
    c: number;
    constructor(editor:Editor) {
        super(editor);
        this.applied_canvas = document.createElement("canvas") as HTMLCanvasElement;
        this.applied_context = this.applied_canvas.getContext('2d', { willReadFrequently: true })! as CanvasRenderingContext2D
        this.staging_canvas = document.createElement("canvas") as HTMLCanvasElement;
        this.staging_context = this.staging_canvas.getContext('2d', { willReadFrequently: true })!
        this.w = 30;
        this.h = 30;
        this.c = 0;
        this.staging_canvas.width = this.w;
        this.staging_canvas.height = this.h;
        this.applied_canvas.width = this.w;
        this.applied_canvas.height = this.h;

        this.top_left = null;


    }
    editing_action(to:Vector2) {
        // if (!this.from) {
        //     return false;
        // }

        const extend_canvas = (canvas:HTMLCanvasElement) => {
            const w = canvas.width;
            const h = canvas.height;
            const ctx = canvas.getContext('2d')!
            const src_image_data = ctx.getImageData(0,0,w,h)
            canvas.width = w*3;
            canvas.height = h*3;
            ctx.beginPath()
            ctx.moveTo(0,0);
            ctx.lineTo(w*3,h*3);
            ctx.moveTo(w*3,0);
            ctx.lineTo(0,h*3);
            ctx.stroke();

            ctx.putImageData(src_image_data,w,h);
        }
        const draw_on_canvas = (context:CanvasRenderingContext2D) => {
            context.fillStyle = 'rgb(1,1,1,0)'
            context.fillRect(0,0, this.w, this.h);
            context.fillStyle = this.app.settings.fore_color;
            context.beginPath()


            context.ellipse(cx, cy, 10,10,0,0,Math.PI*2)
            context.fill()
        }
        if (this.top_left == null) {
            this.top_left = {x: Math.floor(to.x - this.w/2),
                            y: Math.floor(to.y - this.h/2)}
        }        
        const cx = Math.floor(to.x - this.top_left!.x)
        const cy = Math.floor(to.y - this.top_left!.y)        
        const extend = cy < 10 ||  cy > this.h - 10 ||
            cx < 10 ||  cx > this.w - 10

        draw_on_canvas(this.staging_context)
        draw_on_canvas(this.applied_context)
        
        if (extend) {
            console.log('W1', this.w, this.h);
            extend_canvas(this.staging_canvas)
            extend_canvas(this.applied_canvas)
            this.top_left!.x = this.top_left!.x - this.w;
            this.top_left!.y = this.top_left!.y - this.h;
            this.w = this.staging_canvas.width;
            this.h = this.staging_canvas.height;
            console.log('W2', this.w, this.h);

        }
        

        return true;
    }
}
