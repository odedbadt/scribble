import { ClickAndDragTool } from "./click_and_drag_tool"
import { Editor } from "./editor";
import { Vector2 } from "./types";

export class RectTool extends ClickAndDragTool {
    constructor(editor:Editor) {
        super(editor);
    }
    editing_action(to:Vector2) {
        if (!this.from) {
            return false;
        }

        let tmp_canvas:HTMLCanvasElement|null = document.getElementById('rect_canvas') as HTMLCanvasElement

        if (!tmp_canvas) {
            tmp_canvas = document.createElement("canvas") as HTMLCanvasElement;
            document.body.appendChild(tmp_canvas); // OD: for testing
            tmp_canvas.setAttribute('id', 'rect_canvas')
        }
        this.tmp_canvas = tmp_canvas    
        this.tmp_context = this.tmp_canvas.getContext('2d')!
        this.top_left = {x:Math.min(to.x, this.from.x), y: Math.min(to.y, this.from.y)};
        this.w = Math.abs(to.x - this.from.x);
        this.h = Math.abs(to.y - this.from.y);
        this.tmp_canvas.width = this.w;
        this.tmp_canvas.height = this.h;
        this.tmp_context!.fillStyle = 'violet'; // OD: for testing
        this.tmp_context!.fillRect(0,0, this.w,this.h);
        return true;
    }
}
