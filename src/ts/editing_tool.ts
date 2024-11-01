import { Editor } from "./editor"
import { MainApp } from "./main_app";
import { Vector2 } from "./types";

export abstract class EditingTool {
    context: CanvasRenderingContext2D;
    editor: Editor;
    w: number;
    h: number;
    app: MainApp;
    tmp_context: CanvasRenderingContext2D | undefined;
    constructor(context:CanvasRenderingContext2D, 
        editor:Editor, 
        tmp_context?:CanvasRenderingContext2D,
        ) {
        this.context = context;
        this.editor = editor;
        this.w = context.canvas.clientWidth;
        this.h = context.canvas.clientHeight;
        this.app = editor.app;
        this.tmp_context = tmp_context;
    }
    select() {
        this.context.clearRect(0, 0, this.w, this.h);
    }
    abstract start(at:Vector2, buttons:number):boolean;
    abstract action(at:Vector2):boolean;
    abstract stop(at:Vector2):boolean;
    abstract hover(at:Vector2):boolean;

}
export class NopTool extends EditingTool {
    constructor(context:CanvasRenderingContext2D, editor:Editor, tmp_context?:CanvasRenderingContext2D) {
        super(context, editor, tmp_context);
    }
    select() {
        super.select();
    }
    start(at:Vector2, buttons:number):boolean {
        return false
    }
    action(at:Vector2):boolean {
        return false
    }
    stop(at:Vector2):boolean {
        return false
    }
    hover(at:Vector2):boolean {
        return false
    }


}
