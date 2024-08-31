export class RectTool {
    constructor(app) {
            this.app = app; 


        }
    select_tool() {

    }
    mousedown(event) {
        this.w = this.app.art_canvas.width;
        this.h = this.app.art_canvas.height;
        this.app.staging_context.clearRect(0,0,this.w,this.h);
        this.app.staging_context.drawImage(
            this.app.art_canvas,0,0
        )
        this.from = [event.offsetX, event.offsetY];
    }
    mousemove(event) {
        if (this.from) {
            this.app.staging_context.clearRect(0,0,this.w,this.h);
            this.app.staging_context.drawImage(
                this.app.art_canvas,0,0
            )
            this.app.tool_context.clearRect(0,0,this.w,this.h);    
            this.app.tool_context.beginPath();
            this.app.tool_context.fillStyle = this.app.settings.fore_color;
            this.app.tool_context.rect(
                this.from[0],this.from[1],
                event.offsetX - this.from[0],
                event.offsetY - this.from[1]);
            this.app.tool_context.fill();
            this.app.staging_context.drawImage(
                this.app.tool_canvas,0,0
            )
            this.app.staging_context.clearRect(0,0,this.w,this.h);

            this.app.staging_context.drawImage(
                this.app.art_canvas,0,0
            )
            this.app.staging_context.drawImage(
                this.app.tool_canvas,0,0
            )
            this.app.tool_context.clearRect(0,0,this.w,this.h);    
            this.app.view_context.clearRect(0,0,this.w,this.h);    
            this.app.view_context.drawImage(
                this.app.staging_canvas,0,0
            )        
            }
    
    }
    mouseup(event) {
        this.from = null;
        this.app.art_context.drawImage(
            this.app.staging_canvas,0,0
        )
        this.app.view_context.clearRect(0,0,this.w,this.h);    
        this.app.view_context.drawImage(
            this.app.art_canvas,0,0
        )        
        this.app.staging_context.clearRect(0,0,this.w,this.h);    
    }
}
    
