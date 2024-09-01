
export function override_canvas_context(context_to, canvas_from, keep) {
    if (!keep) {
        context_to.clearRect(0,0,canvas_from.width, canvas_from.height);    
    }
    context_to.drawImage(
        canvas_from,0,0
    )
}

export class EditingToolApplier {
    constructor(app,toolClass) {
        this.app = app; 
        this.tool = new toolClass(app.tool_context, this)
    }
    select_tool() {

    }
    mousedown(event) {
        this.w = this.app.art_canvas.width;
        this.h = this.app.art_canvas.height;
        override_canvas_context(this.app.staging_context, this.app.art_canvas)
        this.from = [event.offsetX, event.offsetY];
        if (this.tool.start) {
            this.tool.start()
        }
    }

    mousemove(event) {
        if (this.from) {
            this.app.tool_context.fillStyle = this.app.settings.fore_color;
            this.app.tool_context.strokeStyle = this.app.settings.fore_color;
            this.app.tool_context.lineWidth = this.app.settings.line_width;
            this.app.tool_context.lineCap = 'round';
            if (!this.tool.is_incremental) 
                override_canvas_context(this.app.staging_context, this.app.art_canvas)
            this.app.tool_context.beginPath();
            // Appply action
            this.tool.action(this.from, [event.offsetX, event.offsetY])
            
            this.app.staging_context.drawImage(
                this.app.tool_canvas,0,0
            )
            if (!this.tool.is_incremental) 
                override_canvas_context(this.app.staging_context, this.app.art_canvas)
                this.app.staging_context.clearRect(0,0,this.w,this.h);
            

            override_canvas_context(this.app.staging_context, this.app.art_canvas)
            override_canvas_context(this.app.staging_context, this.app.tool_canvas, true)

            if (!this.tool.is_incremental) {
                this.app.tool_context.clearRect(0,0,this.w,this.h);
            }
            override_canvas_context(this.app.view_context, this.app.staging_canvas)




        } else {
            override_canvas_context(this.app.staging_context, this.app.art_canvas, false)
            this.app.staging_context.beginPath()
            this.app.staging_context.ellipse(event.offsetX, event.offsetY,10,10,0,0,Math.PI*2)
            this.app.staging_context.fill()
            override_canvas_context(this.app.view_context, this.app.staging_canvas)
            

        }
    }

    mouseup(event) {
        this.from = null;
        override_canvas_context(this.app.art_context, this.app.staging_canvas)
        if (this.tool.stop) {
        this.tool.stop()
        }

    }

}