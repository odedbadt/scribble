import { ClickAndDragTool } from "./click_and_drag_tool";
import { SettingName, settings } from "./settings_registry";
import { Vector2 } from "./types";
import { drawLine, drawThickLine, parseColor, RGBA } from "./pixel_utils";

export class TopoHullTool extends ClickAndDragTool {
    private _points: Vector2[] = [];

    editing_start() {
        this._points = [{ ...this.drag_start! }];
        this._render();
    }

    editing_drag(_from: Vector2, to: Vector2) {
        this._points.push({ ...to });
        this._render();
    }

    private _render() {
        if (!this.canvas || !this.context || this._points.length === 0) return;

        let minX = this._points[0].x, minY = this._points[0].y;
        let maxX = minX, maxY = minY;
        for (const p of this._points) {
            if (p.x < minX) minX = p.x;
            if (p.y < minY) minY = p.y;
            if (p.x > maxX) maxX = p.x;
            if (p.y > maxY) maxY = p.y;
        }

        const lw = settings.peek<number>(SettingName.LineWidth);
        const radius = Math.floor(lw / 2);
        const margin = radius + 2;

        const ox = Math.floor(minX) - margin;
        const oy = Math.floor(minY) - margin;
        const w = Math.ceil(maxX) - Math.floor(minX) + margin * 2 + 1;
        const h = Math.ceil(maxY) - Math.floor(minY) + margin * 2 + 1;

        this.canvas.width = w;
        this.canvas.height = h;
        this.canvas_bounds_mapping = {
            from: { x: 0, y: 0, w: 1, h: 1 },
            to: { x: ox, y: oy, w, h }
        };

        const color = parseColor(settings.peek<string>(SettingName.ForeColor));
        const imageData = this.context.getImageData(0, 0, w, h);

        // Draw curve path
        for (let i = 1; i < this._points.length; i++) {
            const a = this._points[i - 1];
            const b = this._points[i];
            const ax = Math.round(a.x - ox), ay = Math.round(a.y - oy);
            const bx = Math.round(b.x - ox), by = Math.round(b.y - oy);
            if (radius <= 0) drawLine(imageData, ax, ay, bx, by, color);
            else drawThickLine(imageData, ax, ay, bx, by, radius, color);
        }

        // Flood fill from all border pixels to mark exterior
        const total = w * h;
        const outside = new Uint8Array(total);
        const queue: number[] = [];

        const seed = (x: number, y: number) => {
            const i = y * w + x;
            if (!outside[i] && imageData.data[i * 4 + 3] === 0) {
                outside[i] = 1;
                queue.push(i);
            }
        };

        for (let x = 0; x < w; x++) { seed(x, 0); seed(x, h - 1); }
        for (let y = 1; y < h - 1; y++) { seed(0, y); seed(w - 1, y); }

        let qi = 0;
        while (qi < queue.length) {
            const pos = queue[qi++];
            const x = pos % w;
            const y = (pos / w) | 0;
            const left = pos - 1, right = pos + 1, up = pos - w, down = pos + w;
            if (x > 0     && !outside[left]  && imageData.data[left  * 4 + 3] === 0) { outside[left]  = 1; queue.push(left); }
            if (x < w - 1 && !outside[right] && imageData.data[right * 4 + 3] === 0) { outside[right] = 1; queue.push(right); }
            if (y > 0     && !outside[up]    && imageData.data[up    * 4 + 3] === 0) { outside[up]    = 1; queue.push(up); }
            if (y < h - 1 && !outside[down]  && imageData.data[down  * 4 + 3] === 0) { outside[down]  = 1; queue.push(down); }
        }

        // Fill interior (unreached transparent pixels)
        for (let i = 0; i < total; i++) {
            if (!outside[i] && imageData.data[i * 4 + 3] === 0) {
                imageData.data[i * 4]     = color[0];
                imageData.data[i * 4 + 1] = color[1];
                imageData.data[i * 4 + 2] = color[2];
                imageData.data[i * 4 + 3] = color[3];
            }
        }

        this.context.putImageData(imageData, 0, 0);
        this.publish_signals();
    }
}
