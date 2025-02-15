import { Editor } from "./editor"
import { MainApp } from "./main_app";
import { Rect, Vector2 } from "./types";

export abstract class EditingTool {
    applied_canvas: HTMLCanvasElement;
    applied_context: CanvasRenderingContext2D;
    staging_canvas: HTMLCanvasElement;
    staging_context: CanvasRenderingContext2D;
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
        this.applied_canvas = document.createElement("canvas") as HTMLCanvasElement;
        this.applied_context = this.applied_canvas.getContext('2d', { willReadFrequently: true })! as CanvasRenderingContext2D
        this.staging_canvas = document.createElement("canvas") as HTMLCanvasElement;
        this.staging_context = this.staging_canvas.getContext('2d', { willReadFrequently: true })! as CanvasRenderingContext2D
        this.applied_canvas = document.createElement("canvas") as HTMLCanvasElement;
        this.applied_context = this.applied_canvas.getContext('2d')!;
        this.applied_canvas.width = this.w;
        this.applied_canvas.height = this.h;
        this.staging_canvas = document.createElement("canvas") as HTMLCanvasElement;
        this.staging_context = this.staging_canvas.getContext('2d')!;
        this.staging_canvas.width = this.w;
        this.staging_canvas.height = this.h;

    }
    extend_canvases(bounds:Rect)  {
        const extend_canvas = (canvas:HTMLCanvasElement) => {
            if (this.safety > 1) {

                return;
            }
            this.safety++
            const w = canvas.width;
            const h = canvas.height;
            const ctx = canvas.getContext('2d')!
            const src_image_data = ctx.getImageData(0,0,w,h)
            canvas.width = bounds.w;
            canvas.height = bounds.h;
            ctx.putImageData(src_image_data,-bounds.x,-bounds.y);
            }
            extend_canvas(this.applied_canvas)
            extend_canvas(this.staging_canvas);
            this.editor.app.state.overlay_position= bounds;

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
