import ClickTool from "./click_tool.js" 

export class Dropper extends ClickTool{
    constructor(context, applier) {
        super(context, applier);
        }
    editing_start(from) {
        const color = this.app.art_context.getImageData(from[0],from[1],1,1).data;
        const sampled_color = `rgba(${color[0]},${color[1]},${color[2]},255)`;
        this.app.settings.fore_color = sampled_color;
        document.getElementById('color-selector-div-fore').style.backgroundColor = sampled_color
        if (this.applier.previous_tool_name) {
            this.app.select_tool(this.applier.previous_tool_name)
        }
    }
}
