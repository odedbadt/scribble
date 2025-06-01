import { ClickAndDragTool } from "./click_and_drag_tool";
export class EraserTool extends ClickAndDragTool {
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
        const fx = Math.floor(this._prev.x - this.top_left.x);
        const fy = Math.floor(this._prev.y - this.top_left.y);
        const cx = Math.floor(to.x - this.top_left.x);
        const cy = Math.floor(to.y - this.top_left.y);
        const draw_on_canvas = (context) => {
            context.fillStyle = 'rgb(1,1,1,0)';
            context.fillRect(0, 0, this.w, this.h);
            context.fillStyle = this.app.settings.back_color;
            context.beginPath();
            context.moveTo(fx, fy);
            context.lineTo(cx, cy);
            context.strokeStyle = this.app.settings.back_color;
            context.lineWidth = 20;
            context.stroke();
            context.ellipse(cx, cy, 10, 10, 0, 0, Math.PI * 2);
            context.lineWidth = 0;
            context.strokeStyle = 'rgba(1,1,1,1)';
            context.fill();
        };
        const extend = cy < 10 || cy > this.h - 10 ||
            cx < 10 || cx > this.w - 10;
        draw_on_canvas(this.staging_context);
        draw_on_canvas(this.context);
        if (extend) {
            extend_canvas(this.staging_canvas);
            extend_canvas(this.canvas);
            this.top_left.x = this.top_left.x - this.w;
            this.top_left.y = this.top_left.y - this.h;
            this.w = this.staging_canvas.width;
            this.h = this.staging_canvas.height;
        }
        this._prev = { x: to.x, y: to.y };
        return true;
    }
}
//# sourceMappingURL=eraser.js.map