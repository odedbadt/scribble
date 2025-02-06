import { Editor } from "./editor"
import { MainApp } from "./main_app";
import { Vector2 } from "./types";

export abstract class EditingTool {
    applied_canvas: HTMLCanvasElement;
    applied_context: CanvasRenderingContext2D;
    staging_canvas: HTMLCanvasElement;
    staging_context: CanvasRenderingContext2D;
    editor: Editor;
    app: MainApp;
    h:number = 100;
    w:number = 100;
    x:number = 0;
    y:number = 0;

    constructor(editor: Editor,
    ) {
        this.editor = editor;
        this.app = editor.app;
        this.applied_canvas = document.createElement("canvas") as HTMLCanvasElement;
        this.applied_context = this.applied_canvas.getContext('2d')!;
        this.applied_canvas.width = 100;
        this.applied_canvas.height = 100;
        this.staging_canvas = document.createElement("canvas") as HTMLCanvasElement;
        this.staging_context = this.staging_canvas.getContext('2d')!;
        this.staging_canvas.width = 100;
        this.staging_canvas.height = 100;

    }

    select() {
        this.applied_context!.clearRect(0, 0,
            this.applied_canvas!.width,
            this.applied_canvas!.height);
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
