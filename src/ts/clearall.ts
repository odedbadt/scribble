import { EditingToolApplier } from "./editing_tool_applier.js";
import { OnSelectTool } from "./on_select_tool.js"

export class ClearAllTool extends OnSelectTool {
    start(at: Vector2, buttons:number):boolean {
        throw new Error("Method not implemented.");
    }
    action(at: Vector2): boolean {
        throw new Error("Method not implemented.");
    }
    stop(at: Vector2):boolean {
        throw new Error("Method not implemented.");
    }
    constructor(context:CanvasRenderingContext2D, applier:EditingToolApplier) {
        super(context, applier)
        this.context = context;
        this.applier = applier;
        this.app = applier.app;
    }
    select_action() {
        const w = this.context.canvas.clientWidth;
        const h = this.context.canvas.clientHeight;
        this.context.fillStyle = this.app.settings.back_color;
        this.context.fillRect(0, 0, w, h);

    }
}
