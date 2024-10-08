export function override_canvas_context(context_to, canvas_from, keep) {
    if (!keep) {
        context_to.clearRect(0,0,canvas_from.width, canvas_from.height);
    }
    context_to.drawImage(
        canvas_from,0,0
    )
}

export class EditingTool {
    constructor(context, applier, tmp_context) {
            this.context = context;
            this.w = context.canvas.clientWidth;
            this.h = context.canvas.clientHeight;
            this.applier = applier;
            this.app = applier.app;
            this.tmp_context = tmp_context;
    }
    select() {
        this.context.clearRect(0, 0, this.w, this.h)
    }
    start() {

    }
    action() {

    }
    stop() {
    }

}
export class NopTool extends EditingTool{
    constructor(context, applier, tmp_context) {
        super(context, applier, tmp_context)
    }
    select() {
        super.select()
    }
    start() {
        super.start()
    }
    action() {
        super.action()
    }
    stop() {
        super.stop()
    }

}
