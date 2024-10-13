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
        this.context.clearRect(0, 0, this.w, this.h);
    }
}
export class NopTool extends EditingTool {
    constructor(context, applier, tmp_context) {
        super(context, applier, tmp_context);
    }
    select() {
        super.select();
    }
    start(at, buttons) {
        return false;
    }
    action(at) {
        return false;
    }
    stop(at) {
        return false;
    }
}
