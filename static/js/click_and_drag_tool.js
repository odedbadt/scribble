export class ClickAndDragToolTool {
    constructor(context, applier, incremental) {
            this.context = context;
            this.w = context.canvas.clientWidth;
            this.h = context.canvas.clientHeight;
            this.applier = applier;
            this.is_incremental = incremental;
        }
    select() {
        this.context.clearRect(0,0,this.w,this.h)
    }
    action(from, to) {
        return this.editing_action(from,to);
    }
    editing_action() {
        throw new "Not fully implemented tool"
    }
    stop() {
        this._recorded_to = null;
    }
}
