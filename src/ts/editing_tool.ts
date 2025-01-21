import { Editor } from "./editor"
import { MainApp } from "./main_app";
import { Vector2 } from "./types";

export abstract class EditingTool {
    canvas: HTMLCanvasElement;
    context: CanvasRenderingContext2D;
    tmp_canvas?: HTMLCanvasElement;
    tmp_context?: CanvasRenderingContext2D;
    editor: Editor;
    app: MainApp;
    h:number = 100;
    w:number = 100;

    constructor(editor: Editor,
    ) {
        this.editor = editor;
        this.app = editor.app;
        this.canvas = new HTMLCanvasElement;
        this.context = this.canvas.getContext('2d')!;
        this.canvas.width = 100;
        this.canvas.height = 100;
        this.tmp_canvas = new HTMLCanvasElement;
        this.tmp_context = this.tmp_canvas.getContext('2d')!;
        this.tmp_canvas.width = 100;
        this.tmp_canvas.height = 100;
    }

    select() {
        this.context!.clearRect(0, 0,
            this.canvas!.width,
            this.canvas!.height);
    }
    abstract start(at: Vector2, buttons: number): boolean;
    abstract action(at: Vector2): boolean;
    abstract stop(at: Vector2): boolean;
    abstract hover(at: Vector2): boolean;

}
export class NopTool extends EditingTool {
    constructor(editor: Editor) {
        super(editor);
    }
    select() {
        super.select();
    }
    start(at: Vector2, buttons: number): boolean {
        return false
    }
    action(at: Vector2): boolean {
        return false
    }
    stop(at: Vector2): boolean {
        return false
    }
    hover(at: Vector2): boolean {
        return false
    }


}
