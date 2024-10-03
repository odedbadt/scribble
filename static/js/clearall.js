export class ClearAllTool {
    constructor(context, applier) {
        this.context = context; 
        this.applier = applier;
        this.app = applier.app;

            

    }
    select() {
        const w = this.context.canvas.clientWidth;
        const h = this. context.canvas.clientHeight;
        this.context.fillStyle = 'rgb(255,255,255)'
        this.context.fillRect(0, 0, w, h);
        if (this.applier.previous_tool_name) {
            this.app.select_tool(this.applier.previous_tool_name)
        }
    }
    

}
