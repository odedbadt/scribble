import { ClickTool } from  "./click_tool.js" 
import { EditingToolApplier } from "./editing_tool_applier.js";

export class Dropper extends ClickTool{
    action(at: Vector2): boolean {
        throw new Error("Method not implemented.");
    }
    stop(at: Vector2): boolean {
        throw new Error("Method not implemented.");
    }
    constructor(context:CanvasRenderingContext2D, applier:EditingToolApplier) {
        super(context, applier);
        }
    editing_start(at:Vector2, buttons:number):boolean {

        const color = this.app.art_context.getImageData(at.x,at.y,1,1).data;
        const sampled_color = `rgba(${color[0]},${color[1]},${color[2]},255)`;
        if (buttons & 1) {
            this.app.settings.fore_color = sampled_color;        
            document.getElementById('color-selector-div-fore')!.style.backgroundColor = sampled_color
        } else if (buttons & 2){
            this.app.settings.back_color = sampled_color;        
            document.getElementById('color-selector-div-back')!.style.backgroundColor = sampled_color
        }
        if (this.applier.previous_tool_name) {
            this.app.select_tool(this.applier.previous_tool_name)
        }
        return false
    }
}
