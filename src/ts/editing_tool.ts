import { Editor } from "./editor"
import { MainApp } from "./main_app";
import { Rect, Vector2, RectToRectMapping } from "./types";
import { Signal, signal, computed, effect } from "@preact/signals";

export abstract class EditingTool {
    canvas: HTMLCanvasElement | null = null;
    context: CanvasRenderingContext2D | null = null;
    canvas_bounds_mapping: RectToRectMapping | null = null;
    canvas_bounds_mapping_signal: Signal<RectToRectMapping> | null = null;

    zero: Vector2 | null = null
    safety = 0
    canvas_signal: Signal<HTMLCanvasElement> | null = null;

    init_canvas(canvas_signal: Signal<HTMLCanvasElement>,
        canvas_bounds_mapping_signal: Signal<RectToRectMapping>) {
        this.canvas_bounds_mapping_signal = canvas_bounds_mapping_signal;
        this.canvas_signal = canvas_signal;
        if (this.canvas == null) {
            if (document.getElementById('tool_canvas')) {
                this.canvas = document.getElementById('tool_canvas')! as HTMLCanvasElement;
            } else {
                this.canvas = document.createElement("canvas") as HTMLCanvasElement;
                // OD: for testing:             
                this.canvas.setAttribute('id', 'tool_canvas');
                document.getElementById('canvas-area')!.appendChild(this.canvas);
            }
        } else { // this.canvas != null, illegal state
            throw new Error('init_canvas called twice');
        }
        this.init_context();
        // set completely arbitrary bounds (might be dropped)
        this.canvas!.width = 1;
        this.canvas!.height = 1;
        //canvas_signal.value = this.canvas;
        return this.canvas
    }
    init_context() {
        this.context = this.canvas!.getContext('2d', {
            'willReadFrequently': true,
            alpha: true
        })!;
    }
    tool_canvas_to_document_canvas(v: Vector2): Vector2 {
        if (this.canvas_bounds_mapping == null || this.canvas == null) {
            throw new Error('cannot map before mapping is set')
        }
        const from: Rect = this.canvas_bounds_mapping.from;
        const to: Rect = this.canvas_bounds_mapping.to;
        const cw = this.canvas.width;
        const ch = this.canvas.height;
        return {
            x: (v.x / cw - from.x) * to.w + to.x,
            y: (v.y / ch - from.y) * to.h + to.y
        }
    }
    document_canvas_tool_canvas(v: Vector2): Vector2 {
        if (this.canvas_bounds_mapping == null || this.canvas == null) {
            throw new Error('cannot map before mapping is set')
        }
        const from: Rect = this.canvas_bounds_mapping.from;
        const to: Rect = this.canvas_bounds_mapping.to;
        const cw = this.canvas.width;
        const ch = this.canvas.height;
        return {
            x: ((v.x - to.x) / to.w + from.x) * cw,
            y: ((v.y - to.y) / to.h + from.y) * ch
        }
    }
    extend_canvas_mapping(to: Rect, copy: boolean = true) {
        console.log(copy);
        if (this.canvas == null) {
            throw new Error('cannot extend without a canvas')
        }
        if (this.context == null) {
            this.init_context();
        }
        if (this.canvas_bounds_mapping == null) {
            this.canvas_bounds_mapping = {
                from: { x: 0, y: 0, w: 1, h: 1 },
                to: { ...to }
            }
        }
        const prev_mapping = this.canvas_bounds_mapping;
        const w = this.canvas.width;
        const h = this.canvas.height;
        const ctx = this.canvas!.getContext('2d')!;
        if (copy) {
            const src_image_data = ctx.getImageData(0, 0, w, h)
            this.canvas.width = to.w;
            this.canvas.height = to.h;
            ctx.putImageData(src_image_data,
                prev_mapping.from.x * prev_mapping.from.w,
                prev_mapping.from.y * prev_mapping.from.h);
        } else {
            this.canvas.width = to.w;
            this.canvas.height = to.h;
        }
        // const ratio = {
        //     x: old_mapping.to.w / to.w, y:
        //         old_mapping.to.h / to.h
        // }
        // this.canvas_bounds_mapping = {
        //     to:to,
        //     from: {x:to.x+(old_mapping.to.x-to.x)/to.w,
        //     y:to.y+(old_mapping.to.y-to.y)/to.h,
        //     w:old_mapping.from.w*old_mapping.to.w/to.w,
        //     h:old_mapping.from.h*old_mapping.to.h/to.h      
        // }
        // }
        this.canvas_bounds_mapping = {
            to: to,
            from: {
                x: 0, y: 0, w: 1, h: 1
            }
        }
        this.context!.fillStyle = 'rgba(0,0,0,0)';
        this.context!.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }
    select() {
        this.context!.fillStyle = 'rgba(0,0,0,0)';
        this.context!.fillRect(0, 0, this.canvas!.width, this.canvas!.height);
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
