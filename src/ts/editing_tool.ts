import { Editor } from "./editor"
import { MainApp } from "./main_app";
import { Rect, Vector2, RectToRectMapping } from "./types";
import { Signal, signal, computed, effect } from "@preact/signals";

export abstract class EditingTool {
    canvas: HTMLCanvasElement | null = null;
    context: CanvasRenderingContext2D | null = null;
    canvas_bounds_signal: Signal<RectToRectMapping> | null = null;
    safety = 0
    canvas_signal: Signal<HTMLCanvasElement> | null = null;


    init_canvas(canvas_signal: Signal<HTMLCanvasElement>,
        canvas_bounds_signal: Signal<RectToRectMapping>) {
        this.canvas = document.createElement("canvas") as HTMLCanvasElement;
        this.context = this.canvas.getContext('2d', {
            'willReadFrequently': true,
            alpha: true
        })!;
        this.canvas.width = 200;
        this.canvas.height = 200;
        this.canvas_signal = canvas_signal;
        //canvas_signal.value = this.canvas;
        // set completely arbitrary bounds (might be dropped)
        this.canvas_bounds_signal = canvas_bounds_signal;
        return this.canvas
    }
    extend_canvas(bounds: Rect) {
        const w = this.canvas!.width;
        const h = this.canvas!.height;
        const ctx = this.canvas!.getContext('2d')!;
        const src_image_data = ctx.getImageData(0, 0, w, h)
        this.canvas!.width = bounds.w;
        this.canvas!.height = bounds.h;
        ctx.putImageData(src_image_data, -bounds.x, -bounds.y);
        //this.canvas_bounds_signal!.value = { from: bounds, to: bounds };


    }
    select() {
        this.context!.clearRect(0, 0,
            this.canvas!.width,
            this.canvas!.height);
    }
    abstract start(at: Vector2, buttons: number): void;
    abstract drag(at: Vector2): void;
    abstract stop(at: Vector2): void;
    abstract hover(at: Vector2): void;

}
export class NopTool extends EditingTool {

    select() {
        super.select();
    }
    start(at: Vector2, buttons: number) {
    }
    drag(at: Vector2) {
    }
    stop(at: Vector2) {
    }
    hover(at: Vector2) {
    }
}
