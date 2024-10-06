import ClickAndDragTool from "./click_and_drag_tool.js" 

export class CircleTool  extends ClickAndDragTool {
    constructor(context, applier) {
        super(context, applier, false);
    }
    editing_action(from, to) {
        const r = Math.sqrt((to[0] - from[0])*(to[0] - from[0])+
        (to[1] - from[1])*(to[1] - from[1]))
        this.context.ellipse(
                from[0],from[1],r,r,0,0,Math.PI*2);
        this.context.fill();
    }
}
