import { ClickAndDragTool } from "./click_and_drag_tool";
import { SettingName, settings } from "./settings_registry";
import { Vector2 } from "./types";
import { drawLine, drawThickLine, drawFilledCircle, setPixel, parseColor, RGBA } from "./pixel_utils";

export class TopoHullTool extends ClickAndDragTool {
    private _prev_point: Vector2 | null = null;
    private _pos_canvas: HTMLCanvasElement | null = null;
    private _pos_ctx: CanvasRenderingContext2D | null = null;
    private _neg_canvas: HTMLCanvasElement | null = null;
    private _neg_ctx: CanvasRenderingContext2D | null = null;
    private _ox: number = 0;
    private _oy: number = 0;
    private _cw: number = 1;
    private _ch: number = 1;
    private _has_session: boolean = false;
    private _is_right_stroke: boolean = false;

    private _alt_held: boolean = false;
    private _onKeyDown = (e: KeyboardEvent) => { if (e.key === 'Alt') { e.preventDefault(); this._alt_held = true; } };
    private _onKeyUp = (e: KeyboardEvent) => {
        if (e.key === 'Alt') {
            this._alt_held = false;
            if (this._has_session && !this.drag_start) this._commit_and_clear();
        }
    };

    select() {
        document.addEventListener('keydown', this._onKeyDown);
        document.addEventListener('keyup', this._onKeyUp);
    }

    deselect() {
        document.removeEventListener('keydown', this._onKeyDown);
        document.removeEventListener('keyup', this._onKeyUp);
        if (this._has_session || this.drag_start) this._commit_and_clear();
    }

    private _ensure_canvases() {
        if (!this._pos_canvas) {
            this._pos_canvas = document.createElement('canvas');
            this._pos_ctx = this._pos_canvas.getContext('2d', { willReadFrequently: true })!;
        }
        if (!this._neg_canvas) {
            this._neg_canvas = document.createElement('canvas');
            this._neg_ctx = this._neg_canvas.getContext('2d', { willReadFrequently: true })!;
        }
    }

    private _reset_curves() {
        this._ensure_canvases();
        this._pos_canvas!.width = 1; this._pos_canvas!.height = 1;
        this._neg_canvas!.width = 1; this._neg_canvas!.height = 1;
    }

    editing_start() {
        // Right-click subtracts only when inside an Alt session
        this._is_right_stroke = (this._start_buttons & 2) !== 0 && (this._alt_held || this._has_session);
        const p = this.drag_start!;
        if (!this._alt_held || !this._has_session) {
            const lw = settings.peek<number>(SettingName.LineWidth);
            const margin = Math.floor(lw / 2) + 2;
            this._ox = Math.floor(p.x) - margin;
            this._oy = Math.floor(p.y) - margin;
            this._cw = margin * 2 + 1;
            this._ch = margin * 2 + 1;
            this._ensure_canvases();
            this._pos_canvas!.width = this._cw; this._pos_canvas!.height = this._ch;
            this._neg_canvas!.width = this._cw; this._neg_canvas!.height = this._ch;
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
        if (this._has_session) return;
        super.pointer_leave();
    }

    stop(at: Vector2) {
        if (this._alt_held) {
            this._has_session = true;
            this.drag_start = null;
            return;
        }
        this._commit_and_clear();
    }

    private _commit_and_clear() {
        if ((this.drag_start || this._has_session) && this.canvas && this.canvas_bounds_mapping) {
            this.begin_undo_capture?.(this.canvas_bounds_mapping.to);
            super.commit_to_document(settings.peek<string>(SettingName.ForeColor));
            this.document_dirty_signal!.value++;
            this.push_undo_snapshot?.();
        }
        this._has_session = false;
        this.drag_start = null;
        this.canvas_bounds_mapping = null;
        this.canvas!.width = 1;
        this.canvas!.height = 1;
        this.canvas_signal!.value = null;
        this._reset_curves();
    }

    private _expand(to: Vector2) {
        const lw = settings.peek<number>(SettingName.LineWidth);
        const margin = Math.floor(lw / 2) + 2;
        const newOX = Math.min(this._ox, Math.floor(to.x) - margin);
        const newOY = Math.min(this._oy, Math.floor(to.y) - margin);
        const newCW = Math.max(this._ox + this._cw, Math.ceil(to.x) + margin + 1) - newOX;
        const newCH = Math.max(this._oy + this._ch, Math.ceil(to.y) + margin + 1) - newOY;
        if (newOX === this._ox && newOY === this._oy && newCW === this._cw && newCH === this._ch) return;
        const dx = this._ox - newOX, dy = this._oy - newOY;
        const posOld = this._pos_ctx!.getImageData(0, 0, this._cw, this._ch);
        this._pos_canvas!.width = newCW; this._pos_canvas!.height = newCH;
        this._pos_ctx!.putImageData(posOld, dx, dy);
        const negOld = this._neg_ctx!.getImageData(0, 0, this._cw, this._ch);
        this._neg_canvas!.width = newCW; this._neg_canvas!.height = newCH;
        this._neg_ctx!.putImageData(negOld, dx, dy);
        this._ox = newOX; this._oy = newOY; this._cw = newCW; this._ch = newCH;
    }

    private _draw_segment(from: Vector2 | null, to: Vector2) {
        this._ensure_canvases();
        this._expand(to);
        const ctx = this._is_right_stroke ? this._neg_ctx! : this._pos_ctx!;
        const lw = settings.peek<number>(SettingName.LineWidth);
        const radius = Math.floor(lw / 2);
        const color = parseColor(settings.peek<string>(SettingName.ForeColor));
        const data = ctx.getImageData(0, 0, this._cw, this._ch);
        if (!from) {
            const tx = Math.round(to.x - this._ox), ty = Math.round(to.y - this._oy);
            if (radius <= 0) setPixel(data, tx, ty, color);
            else drawFilledCircle(data, tx, ty, radius, color);
        } else {
            const fx = Math.round(from.x - this._ox), fy = Math.round(from.y - this._oy);
            const tx = Math.round(to.x - this._ox), ty = Math.round(to.y - this._oy);
            if (radius <= 0) drawLine(data, fx, fy, tx, ty, color);
            else drawThickLine(data, fx, fy, tx, ty, radius, color);
        }
        ctx.putImageData(data, 0, 0);
        this._flood_and_publish();
    }

    private _bfs_outside(src: Uint8ClampedArray, w: number, h: number): Uint8Array {
        const total = w * h;
        const outside = new Uint8Array(total);
        const queue = new Int32Array(total);
        let qh = 0, qt = 0;
        const seed = (i: number) => { if (!outside[i] && src[i*4+3]===0) { outside[i]=1; queue[qt++]=i; } };
        for (let x = 0; x < w; x++) { seed(x); seed((h-1)*w+x); }
        for (let y = 1; y < h-1; y++) { seed(y*w); seed(y*w+w-1); }
        while (qh < qt) {
            const p = queue[qh++];
            const x = p%w, y = (p/w)|0;
            if (x>0)   { const n=p-1; if (!outside[n]&&src[n*4+3]===0){outside[n]=1;queue[qt++]=n;} }
            if (x<w-1) { const n=p+1; if (!outside[n]&&src[n*4+3]===0){outside[n]=1;queue[qt++]=n;} }
            if (y>0)   { const n=p-w; if (!outside[n]&&src[n*4+3]===0){outside[n]=1;queue[qt++]=n;} }
            if (y<h-1) { const n=p+w; if (!outside[n]&&src[n*4+3]===0){outside[n]=1;queue[qt++]=n;} }
        }
        return outside;
    }

    private _flood_and_publish() {
        if (!this.canvas || !this.context) return;
        this._ensure_canvases();
        const w = this._cw, h = this._ch;
        const total = w * h;
        const posData = this._pos_ctx!.getImageData(0, 0, w, h).data;
        const negData = this._neg_ctx!.getImageData(0, 0, w, h).data;
        const color = parseColor(settings.peek<string>(SettingName.ForeColor));
        const posOut = this._bfs_outside(posData, w, h);
        const negOut = this._bfs_outside(negData, w, h);

        // Fill: inside positive hull AND outside negative hull
        const out = new Uint8ClampedArray(total * 4);
        for (let i = 0; i < total; i++) {
            if (!posOut[i] && negOut[i]) {
                out[i*4]=color[0]; out[i*4+1]=color[1]; out[i*4+2]=color[2]; out[i*4+3]=color[3];
            }
        }
        this.canvas.width = w;
        this.canvas.height = h;
        this.canvas_bounds_mapping = { from: {x:0,y:0,w:1,h:1}, to: {x:this._ox,y:this._oy,w,h} };
        this.context.putImageData(new ImageData(out, w, h), 0, 0);
        this.publish_signals();
    }
}
