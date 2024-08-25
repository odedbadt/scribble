export class ScribbleTool {
    constructor(app) {
            this.app = app;


        }
    select_tool() {
        this.app.main_context.strokeStyle = this.app.settings.fore_color;
        this.app.main_context.fillStyle = this.app.settings.fore_color;
        console.log(this)

    }
    mousedown(event) {
        this.app.main_context.ellipse(event.offsetX, event.offsetY, 10,10, 0, 0, Math.PI * 2)
        this.app.main_context.fill();
        this.previous_drawn_point = [event.offsetX, event.offsetY];
    }
    mouseup(event) {
        this.previous_drawn_point = null;
        console.log('U');
     }
    mousemove(event) {
        if (event.buttons) {
            if (this.previous_drawn_point) {
                this.app.main_context.beginPath();
                this.app.main_context.moveTo(
                    this.previous_drawn_point[0],
                    this.previous_drawn_point[1]);
                this.app.main_context.lineTo(event.offsetX, event.offsetY);
                this.app.main_context.stroke();
                this.previous_drawn_point = [event.offsetX, event.offsetY];
            }
        }
    }
}
    
