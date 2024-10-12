export function override_canvas_context(context_to:CanvasRenderingContext2D, canvas_from:HTMLCanvasElement, keep?:boolean) {
    if (!keep) {
        context_to.clearRect(0, 0, canvas_from.width, canvas_from.height);
    }
    context_to.drawImage(canvas_from, 0, 0);
}
