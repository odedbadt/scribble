import { override_canvas_context } from "./utils"

export abstract class Filter {
    abstract override_canvas_context(
        context_to:CanvasRenderingContext2D, 
        canvas_from:HTMLCanvasElement, 
        keep?:boolean,
        avoid_native?:boolean):void
}

export class NopFilter extends Filter {
    override_canvas_context(
        context_to:CanvasRenderingContext2D, 
        canvas_from:HTMLCanvasElement, 
        keep?:boolean,
        avoid_native?:boolean):void {
            override_canvas_context(context_to, canvas_from, keep, avoid_native);
        }
}