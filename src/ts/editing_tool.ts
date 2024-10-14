import { EditingToolApplier } from "./editing_tool_applier.js"
import { MainApp } from "./main_app.js";

export abstract class EditingTool {
    context: CanvasRenderingContext2D;
    applier: EditingToolApplier;
    w: number;
    h: number;
    app: MainApp;
    tmp_context: CanvasRenderingContext2D | undefined;
    constructor(context:CanvasRenderingContext2D, applier:EditingToolApplier, tmp_context?:CanvasRenderingContext2D) {
        this.context = context;
        this.applier = applier;
        this.w = context.canvas.clientWidth;
        this.h = context.canvas.clientHeight;
        this.app = applier.app;
        this.tmp_context = tmp_context;
    }
    select() {
        this.context.clearRect(0, 0, this.w, this.h);
    }
    abstract start(at:Vector2, buttons:number):boolean;
    abstract action(at:Vector2):boolean;
    abstract stop(at:Vector2):boolean;
}
export class NopTool extends EditingTool {
    constructor(context:CanvasRenderingContext2D, applier:EditingToolApplier, tmp_context?:CanvasRenderingContext2D) {
        super(context, applier, tmp_context);
    }
    select() {
        super.select();
    }
    start(at:Vector2, buttons:number):boolean {
        return false
    }
    action(at:Vector2):boolean {
        return false
    }
    stop(at:Vector2):boolean {
        return false
    }
}
