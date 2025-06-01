import { ClickAndDragTool } from "./click_and_drag_tool";
import { rect_union } from "./utils";
export class ScribbleTool extends ClickAndDragTool {
    constructor(editor) {
        super(editor);
        this._prev = null;
        this.w = 30;
        this.h = 30;
        this.staging_canvas.width = this.w;
        this.staging_canvas.height = this.h;
        this.canvas.width = this.w;
        this.canvas.height = this.h;
        this.top_left = null;
    }
    editing_action(to) {
        if (!this.from) {
            return false;
        }
        if (this.top_left == null) {
            this.top_left = { x: Math.floor(to.x - this.w / 2),
                y: Math.floor(to.y - this.h / 2) };
        }
        if (this._prev == null) {
            this._prev = { x: to.x, y: to.y };
        }
        const extend_canvas = (canvas) => {
            const w = canvas.width;
            const h = canvas.height;
            const ctx = canvas.getContext('2d');
            const src_image_data = ctx.getImageData(0, 0, w, h);
            canvas.width = w * 3;
            canvas.height = h * 3;
            // ctx.beginPath()
            // ctx.moveTo(0,0);
            // ctx.lineTo(w*3,h*3);
            // ctx.moveTo(w*3,0);
            // ctx.lineTo(0,h*3);
            // ctx.stroke();
            ctx.putImageData(src_image_data, w, h);
        };
        const fx = Math.floor(this._prev.x - this.bounds.x);
        const fy = Math.floor(this._prev.y - this.bounds.y);
        const cx = Math.floor(to.x - this.bounds.x);
        const cy = Math.floor(to.y - this.bounds.y);
        const lw = this.app.settings.line_width * 1.2;
        this.extend_canvas(rect_union(this.bounds, { x: cx - lw, y: cy - lw, w: lw * 2, h: lw * 2 }));
        this.context.fillStyle = 'rgb(1,1,1,0)';
        this.context.fillRect(0, 0, this.w, this.h);
        this.context.fillStyle = this.app.settings.fore_color;
        this.context.beginPath();
        this.context.moveTo(fx, fy);
        this.context.lineTo(cx, cy);
        this.context.strokeStyle = this.app.settings.fore_color;
        this.context.lineWidth = 20;
        this.context.stroke();
        this.context.ellipse(cx, cy, 10, 10, 0, 0, Math.PI * 2);
        this.context.lineWidth = 0;
        this.context.strokeStyle = 'rgba(0,0,0,0)';
        this.context.fill();
        this._prev = Object.assign({}, to);
        return true;
    }
}
//# sourceMappingURL=scribble.js.map