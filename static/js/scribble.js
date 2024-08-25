export class ScribbleTool {
    constructor(app, 
        main_canvas) {
            this.app = app;

        }
    select_tool() {
        this.main_canvas.strokeStyle = this.app.settings.fore_color;
    }
}
    
