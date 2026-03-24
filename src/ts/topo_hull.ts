import { ClickAndDragTool } from "./click_and_drag_tool";
import { SettingName, settings } from "./settings_registry";
import { Vector2 } from "./types";
import { drawLine, drawThickLine, drawFilledCircle, setPixel, parseColor, RGBA } from "./pixel_utils";

export class TopoHullTool extends ClickAndDragTool {
    private _prev_point: Vector2 | null = null;
    private _curve_canvas: HTMLCanvasElement | null = null;
    private _curve_ctx: CanvasRenderingContext2D | null = null;
    private _ox: number = 0;
    private _oy: number = 0;
    private _cw: number = 1;
    private _ch: number = 1;
    private _has_session: boolean = false;

    private _alt_held: boolean = false;
    private _onKeyDown = (e: KeyboardEvent) => { if (e.key === 'Alt') { e.preventDefault(); this._alt_held = true; } };
    private _onKeyUp   = (e: KeyboardEvent) => {
        if (e.key === 'Alt') {
            this._alt_held = false;
            // Commit as soon as Alt is released (if no stroke is in progress)
            if (this._has_session && !this.drag_start) {
                this._commit_session();
                this.canvas_bounds_mapping = null;
                this.canvas!.width = 1;
                this.canvas!.height = 1;
                this.canvas_signal!.value = null;
            }
        }
    };

    select() {
        document.addEventListener('keydown', this._onKeyDown);
        document.addEventListener('keyup',   this._onKeyUp);
    }

    deselect() {
        document.removeEventListener('keydown', this._onKeyDown);
        document.removeEventListener('keyup',   this._onKeyUp);
        this._commit_session();
    }

    private _get_curve_canvas(): { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D } {
        if (!this._curve_canvas) {
            this._curve_canvas = document.createElement('canvas');
            this._curve_ctx = this._curve_canvas.getContext('2d', { willReadFrequently: true })!;
        }
        return { canvas: this._curve_canvas, ctx: this._curve_ctx! };
    }

    editing_start() {
        const p = this.drag_start!;
        if (!this._alt_held || !this._has_session) {
            // Fresh session: reset curve canvas
            const lw = settings.peek<number>(SettingName.LineWidth);
            const margin = Math.floor(lw / 2) + 2;
            this._ox = Math.floor(p.x) - margin;
            this._oy = Math.floor(p.y) - margin;
            this._cw = margin * 2 + 1;
            this._ch = margin * 2 + 1;
            const { canvas } = this._get_curve_canvas();
            canvas.width = this._cw;
            canvas.height = this._ch;
            this._has_session = false;
        }
        this._prev_point = { ...p };
        this._draw_segment(null, p);
    }

    editing_drag(_from: Vector2, to: Vector2) {
        const prev = this._prev_point!;
        this._prev_point = { ...to };
        this._draw_segment(prev, to);
    }

    hover(at: Vector2): false | undefined {
        if (this._has_session) return undefined;
        return super.hover(at);
    }

    pointer_leave() {
        if (this._has_session) return; // keep session overlay visible
        super.pointer_leave();
    }

    stop(at: Vector2) {
        if (this._alt_held) {
            // Keep overlay alive for next stroke; don't commit yet
            this._has_session = true;
            this.drag_start = null;
            return;
        }
        this._commit_session();
        super.stop(at);
    }

    private _commit_session() {
        if (!this._has_session && !this.drag_start) return;
        // Commit the accumulated curve to the document
        if (this.canvas && this.canvas_bounds_mapping && this.document_context) {
            const color = settings.peek<string>(SettingName.ForeColor);
            super.commit_to_document(color);
            this.document_dirty_signal!.value++;
            this.push_undo_snapshot?.();
        }
        this._has_session = false;
        if (this._curve_canvas) {
            this._curve_canvas.width = 1;
            this._curve_canvas.height = 1;
        }
    }

    private _expand(to: Vector2) {
        const lw = settings.peek<number>(SettingName.LineWidth);
        const margin = Math.floor(lw / 2) + 2;
        const newOX = Math.min(this._ox, Math.floor(to.x) - margin);
        const newOY = Math.min(this._oy, Math.floor(to.y) - margin);
        const newCW = Math.max(this._ox + this._cw, Math.ceil(to.x) + margin + 1) - newOX;
        const newCH = Math.max(this._oy + this._ch, Math.ceil(to.y) + margin + 1) - newOY;
        if (newOX === this._ox && newOY === this._oy && newCW === this._cw && newCH === this._ch) return;
        const { canvas, ctx } = this._get_curve_canvas();
        const old = ctx.getImageData(0, 0, this._cw, this._ch);
        canvas.width = newCW;
        canvas.height = newCH;
        ctx.putImageData(old, this._ox - newOX, this._oy - newOY);
        this._ox = newOX; this._oy = newOY; this._cw = newCW; this._ch = newCH;
    }

    private _draw_segment(from: Vector2 | null, to: Vector2) {
        this._expand(to);
        const { ctx } = this._get_curve_canvas();
        const lw = settings.peek<number>(SettingName.LineWidth);
        const radius = Math.floor(lw / 2);
        const color = parseColor(settings.peek<string>(SettingName.ForeColor));
        const curveData = ctx.getImageData(0, 0, this._cw, this._ch);
        if (!from) {
            const tx = Math.round(to.x - this._ox), ty = Math.round(to.y - this._oy);
            if (radius <= 0) setPixel(curveData, tx, ty, color);
            else drawFilledCircle(curveData, tx, ty, radius, color);
        } else {
            const fx = Math.round(from.x - this._ox), fy = Math.round(from.y - this._oy);
            const tx = Math.round(to.x - this._ox), ty = Math.round(to.y - this._oy);
            if (radius <= 0) drawLine(curveData, fx, fy, tx, ty, color);
            else drawThickLine(curveData, fx, fy, tx, ty, radius, color);
        }
        ctx.putImageData(curveData, 0, 0);
        this._flood_and_publish(curveData, color);
    }

    private _flood_and_publish(curveData: ImageData, color: RGBA) {
        if (!this.canvas || !this.context) return;
        const w = this._cw, h = this._ch;
        const total = w * h;
        const src = curveData.data;

        const out = new Uint8ClampedArray(src);
        const outside = new Uint8Array(total);
        const queue = new Int32Array(total);
        let qHead = 0, qTail = 0;

        const seed = (i: number) => {
            if (!outside[i] && src[i * 4 + 3] === 0) { outside[i] = 1; queue[qTail++] = i; }
        };
        for (let x = 0; x < w; x++) { seed(x); seed((h - 1) * w + x); }
        for (let y = 1; y < h - 1; y++) { seed(y * w); seed(y * w + w - 1); }

        while (qHead < qTail) {
            const pos = queue[qHead++];
            const x = pos % w, y = (pos / w) | 0;
            if (x > 0)   { const n = pos-1; if (!outside[n] && src[n*4+3]===0) { outside[n]=1; queue[qTail++]=n; } }
            if (x < w-1) { const n = pos+1; if (!outside[n] && src[n*4+3]===0) { outside[n]=1; queue[qTail++]=n; } }
            if (y > 0)   { const n = pos-w; if (!outside[n] && src[n*4+3]===0) { outside[n]=1; queue[qTail++]=n; } }
            if (y < h-1) { const n = pos+w; if (!outside[n] && src[n*4+3]===0) { outside[n]=1; queue[qTail++]=n; } }
        }

        for (let i = 0; i < total; i++) {
            if (!outside[i] && src[i * 4 + 3] === 0) {
                out[i*4] = color[0]; out[i*4+1] = color[1]; out[i*4+2] = color[2]; out[i*4+3] = color[3];
            }
        }

        this.canvas.width = w;
        this.canvas.height = h;
        this.canvas_bounds_mapping = {
            from: { x: 0, y: 0, w: 1, h: 1 },
            to: { x: this._ox, y: this._oy, w, h }
        };
        this.context.putImageData(new ImageData(out, w, h), 0, 0);
        this.publish_signals();
    }
}
