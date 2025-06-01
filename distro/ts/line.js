import { ClickAndDragTool } from "./click_and_drag_tool";
export class LineTool extends ClickAndDragTool {
    constructor(editor) {
        super(editor);
        this.canvas = document.createElement("canvas");
        this.context = this.canvas.getContext('2d');
        this.staging_canvas = document.createElement("canvas");
        this.staging_context = this.staging_canvas.getContext('2d');
        this.staging_canvas.width = this.w;
        this.staging_canvas.height = this.h;
    }
    editing_action(to) {
        if (!this.from) {
            return false;
        }
        const flip = (to.x < this.from.x) !== (to.y < this.from.y);
        let staging_canvas = document.getElementById('rect_canvas');
        if (!document.getElementById('rect_canvas')) {
            document.getElementById('canvas-area').appendChild(this.staging_canvas); // OD: for testing
            this.staging_canvas.setAttribute('id', 'rect_canvas');
        }
        const draw_on_canvas = (context) => {
            context.fillStyle = 'rgb(1,1,1,0)';
            context.fillRect(0, 0, this.w, this.h);
            context.strokeStyle = this.app.settings.fore_color; // OD: for testing
            context.beginPath();
            if (flip) {
                context.moveTo(this.w, 0);
                context.lineTo(0, this.h);
            }
            else {
                context.moveTo(0, 0);
                context.lineTo(this.w, this.h);
            }
            context.stroke();
        };
        this.top_left = { x: Math.min(to.x, this.from.x), y: Math.min(to.y, this.from.y) };
        this.w = Math.floor(Math.abs(to.x - this.from.x));
        this.h = Math.floor(Math.abs(to.y - this.from.y));
        this.canvas.width = this.w;
        this.canvas.height = this.h;
        this.staging_canvas.width = this.w;
        this.staging_canvas.height = this.h;
        draw_on_canvas(this.context);
        return true;
    }
}
//# sourceMappingURL=line.js.map