import {Vector2} from './types'
import { EditingToolApplier } from './editing_tool_applier'
export class EditingTool {
    context: CanvasRenderingContext2D;
    w: number;
    h: number;
    applier: any;
    app: any;
    tmp_context: any;
    constructor(context:CanvasRenderingContext2D, applier:EditingToolApplier, tmp_context) {
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
    abstract start(at:Vector2);
    abstract action(at:Vector2):boolean;
    abstract stop(at:Vector2);
}
export class NopTool extends EditingTool {
    constructor(context:CanvasRenderingContext2D, applier:EditingToolApplier, tmp_context) {
        super(context, applier, tmp_context);
    }
    select() {
        super.select();
    }
    start(at:Vector2) {
        super.start(at:Vector2);
    }
    action(at:Vector2) {
        super.action(at:Vector2);
    }
    stop(at:Vector2) {
        super.stop(at:Vector2);
    }
}
