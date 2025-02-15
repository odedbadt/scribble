import { Editor } from "./editor"
import { MainApp } from "./main_app";
import { Rect, Vector2 } from "./types";

export abstract class EditingTool {
    canvas: HTMLCanvasElement;
    context: CanvasRenderingContext2D;
    staging_canvas: HTMLCanvasElement;
    staging_context: CanvasRenderingContext2D;
    bounds: Rect;
    editor: Editor;
    app: MainApp;
    h:number = 200;
    w:number = 200;
    x:number = 0;
    y:number = 0;
    safety = 0

    constructor(editor: Editor,
    ) {
        this.editor = editor;
        this.app = editor.app;
        this.canvas = document.createElement("canvas") as HTMLCanvasElement;
        this.context = this.canvas.getContext('2d', { willReadFrequently: true })! as CanvasRenderingContext2D
        this.staging_canvas = document.createElement("canvas") as HTMLCanvasElement;
        this.staging_context = this.staging_canvas.getContext('2d', { willReadFrequently: true })! as CanvasRenderingContext2D
        this.canvas = document.createElement("canvas") as HTMLCanvasElement;
        this.context = this.canvas.getContext('2d')!;
        this.canvas.width = this.w;
        this.canvas.height = this.h;
        this.staging_canvas = document.createElement("canvas") as HTMLCanvasElement;
        this.staging_context = this.staging_canvas.getContext('2d')!;
        this.staging_canvas.width = this.w;
        this.staging_canvas.height = this.h;
        this.bounds = {x:0, y:0, w:100, h:100}

    }
    extend_canvas(bounds:Rect)  {
        const w = this.canvas.width;
        const h = this.canvas.height;
        const ctx = this.canvas.getContext('2d')!
        const src_image_data = ctx.getImageData(0,0,w,h)
        this.canvas.width = bounds.w;
        this.canvas.height = bounds.h;
        ctx.putImageData(src_image_data,-bounds.x,-bounds.y);        
        this.editor.app.state.overlay_position = {...bounds};
        this.bounds = {...bounds}

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
