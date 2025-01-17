import { Editor } from "./editor";
import { OnSelectTool } from "./on_select_tool"
import { Vector2 } from "./types";

export class ClearAllTool extends OnSelectTool {
    start(at: Vector2, buttons:number):boolean {
        throw new Error("Method not implemented.");
    }
    action(at: Vector2): boolean {
        throw new Error("Method not implemented.");
    }
    stop(at: Vector2):boolean {
        throw new Error("Method not implemented.");
    }
    constructor(context:CanvasRenderingContext2D, editor:Editor) {
        super(context, editor)
        this.context = context;
        this.editor = editor;
        this.app = editor.app;
    }
    select_action() {
        const w = this.context.canvas.clientWidth;
        const h = this.context.canvas.clientHeight;
        this.context.fillStyle = this.app.settings.back_color;
        this.context.fillRect(0, 0, w, h);
    }
    hover():boolean {
        return false
    }    
}
