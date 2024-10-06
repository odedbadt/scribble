export function override_canvas_context(context_to, canvas_from, keep) {
    if (!keep) {
        context_to.clearRect(0,0,canvas_from.width, canvas_from.height);
    }
    context_to.drawImage(
        canvas_from,0,0
    )
}

export class EditingTool {
    constructor(context, applier, incremental) {
            this.context = context;
            this.w = context.canvas.clientWidth;
            this.h = context.canvas.clientHeight;
            this.applier = applier;
            this.app = applier.app;
        }
    select() {
        this.applier.undo_redo_buffer.push(this.app.art_context.getImageData(0, 0, this.w, this.h))
        this.context.clearRect(0, 0, this.w, this.h)
    }
    stop() {
    }

}
