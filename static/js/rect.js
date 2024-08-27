export class RectTool {
    constructor(app) {
            this.app = app; 


        }
    select_tool() {

    }
    mousedown(event) {
        this.app.staging_context.putImageData(
            this.app.main_context.getImageData(0,0,600,600)
            ,0,0);
        this.app.staging_context.clearRect(0,0,600,600);
        this.from = [event.offsetX, event.offsetY];
    }
    mouseup(event) {
        this.from = null;
        this.app.main_context.putImageData(
            this.app.staging_context.getImageData(0,0,600,600)
            ,0,0);

    }
    mousemove(event) {
        if (this.from) {
            this.app.staging_context.putImageData(
                this.app.main_context.getImageData(0,0,600,600)
                ,0,0);
            this.app.staging_context.beginPath();
            this.app.staging_context.fillStyle = this.app.settings.fore_color;
            this.app.staging_context.rect(
                this.from[0],this.from[1],
                event.offsetX -this.from[0], 
                event.offsetY -this.from[1]);
            this.app.staging_context.fill();

        }
    }
}
    
