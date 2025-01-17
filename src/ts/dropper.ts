import { ClickTool } from  "./click_tool"
import { Editor } from "./editor";
import { Vector2 } from "./types";

export class Dropper extends ClickTool{
    action(at: Vector2): boolean {
        throw new Error("Method not implemented.");
    }
    stop(at: Vector2): boolean {
        throw new Error("Method not implemented.");
    }
    constructor(context:CanvasRenderingContext2D, editor:Editor) {
        super(context, editor);
        }
    editing_start(at:Vector2, buttons:number):boolean {

        const color = this.app.art_context.getImageData(at.x,at.y,1,1).data;
        const sampled_color = `rgba(${color[0]},${color[1]},${color[2]},255)`;
        this.app.color_stack.select_color(color, !!(buttons & 1), true)
        if (this.editor.previous_tool_name) {
            this.app.select_tool(this.editor.previous_tool_name)
        }
        return false
    }
    hover(at:Vector2):boolean {
        return false
    }    
}
