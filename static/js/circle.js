import ClickAndDragTool from "./click_and_drag_tool.js" 

export class CircleTool  extends ClickAndDragTool {
    constructor(context, applier) {
        super(context, applier, false);
    }
    editing_action(at) {
        const r = Math.sqrt((at[0] - this.from[0])*(at[0] - this.from[0])+
        (at[1] - this.from[1])*(at[1] - this.from[1]))
        this.context.ellipse(
                this.from[0],this.from[1],r,r,0,0,Math.PI*2);
        this.context.fill();
        return true;

    }
}
