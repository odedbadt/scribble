export class ScribbleTool {
    constructor(context, applier) {
            this.context = context;
            this.applier = applier;
            this.is_incremental = true;

        }
    action(from, to) {
        if (this._recorded_to) {
        this.context.moveTo(
            this._recorded_to[0],this._recorded_to[1]);
        this.context.lineTo(
            to[0],to[1]);
        }
        this._recorded_to = to;

        this.context.stroke();
    }
    start() {

    }
    stop() {
        this._recorded_to = null;
    }

}
