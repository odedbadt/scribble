import { EditingTool } from "./editing_tool";
import { SettingName, settings } from "./settings_registry";
import { Vector2 } from "./types";
import { drawLine, drawThickLine, drawFilledPolygon, drawPolygonOutline, parseColor, setPixel, RGBA } from "./pixel_utils";
import { tool_to_document } from "./utils";

const CLOSE_RADIUS_DOC = 10; // doc pixels to snap-close the polygon

export class PolygonTool extends EditingTool {
    private _vertices: Vector2[] = [];
    private _line_color: RGBA = [0, 0, 0, 255];
    private _fill_color: RGBA = [255, 255, 255, 255];
    private _fill_outline: number = 0; // 0: both, 1: fill only, 2: outline only
    private _last_click_time: number = 0;

    select() {
        this._vertices = [];
    }

    start(at: Vector2, buttons: number) {
        const now = Date.now();
        const is_double = now - this._last_click_time < 300;
        this._last_click_time = now;

        this._line_color = parseColor(settings.peek<string>(SettingName.ForeColor));
        this._fill_color = parseColor(settings.peek<string>(SettingName.FillColor));
        this._fill_outline = settings.peek<number>(SettingName.FillOutline) ?? 0;

        if (this._vertices.length >= 2) {
            const first = this._vertices[0];
            const close = Math.hypot(at.x - first.x, at.y - first.y) < CLOSE_RADIUS_DOC;
            if (close || is_double) {
                this._commit();
                return;
            }
        }
        this._vertices.push({ x: Math.round(at.x), y: Math.round(at.y) });
        this._render(at);
    }

    drag(at: Vector2) {}

    stop(at: Vector2) {
        // Don't clear canvas — polygon accumulates across clicks
    }

    hover(at: Vector2) {
        this._render(at);
    }

    pointer_leave() {
        this._render(null);
    }

    private _setup_canvas(): { docW: number; docH: number } | null {
        if (!this.canvas || !this.context || !this.document_canvas) return null;
        const docW = this.document_canvas.width;
        const docH = this.document_canvas.height;
        this.canvas.width = docW;
        this.canvas.height = docH;
        this.canvas_bounds_mapping = {
            from: { x: 0, y: 0, w: 1, h: 1 },
            to: { x: 0, y: 0, w: docW, h: docH },
        };
        return { docW, docH };
    }

    private _render(cursor: Vector2 | null) {
        if (!this.canvas || !this.context) return;

        if (this._vertices.length === 0) {
            this.canvas_signal!.value = null;
            return;
        }

        const dims = this._setup_canvas();
        if (!dims) return;
        const { docW, docH } = dims;

        const ctx = this.context;
        const imageData = ctx.getImageData(0, 0, docW, docH);
        const lw = settings.peek<number>(SettingName.LineWidth);
        const radius = Math.floor(lw / 2);
        const color = this._line_color;

        // Draw committed edges
        for (let i = 1; i < this._vertices.length; i++) {
            const a = this._vertices[i - 1];
            const b = this._vertices[i];
            if (radius <= 0) drawLine(imageData, a.x, a.y, b.x, b.y, color);
            else drawThickLine(imageData, a.x, a.y, b.x, b.y, radius, color);
        }

        // Rubber-band line from last vertex to cursor
        if (cursor && this._vertices.length > 0) {
            const last = this._vertices[this._vertices.length - 1];
            drawLine(imageData, last.x, last.y, Math.round(cursor.x), Math.round(cursor.y), color);
        }

        // Highlight first vertex when cursor is close enough to close
        if (cursor && this._vertices.length >= 2) {
            const first = this._vertices[0];
            if (Math.hypot(cursor.x - first.x, cursor.y - first.y) < CLOSE_RADIUS_DOC) {
                const ring: RGBA = [0, 200, 0, 220];
                const r = 4;
                for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) {
                    const d = Math.sqrt(dx * dx + dy * dy);
                    if (d >= r - 0.6 && d <= r + 0.6) setPixel(imageData, first.x + dx, first.y + dy, ring);
                }
            }
        }

        ctx.putImageData(imageData, 0, 0);
        this.publish_signals();
    }

    private _commit() {
        if (this._vertices.length < 2) {
            this._reset();
            return;
        }

        const dims = this._setup_canvas();
        if (!dims) { this._reset(); return; }
        const { docW, docH } = dims;

        const ctx = this.context!;
        const imageData = ctx.getImageData(0, 0, docW, docH);
        const lw = settings.peek<number>(SettingName.LineWidth);
        const color = this._line_color;

        // 0: both, 1: fill only, 2: outline only
        if (this._fill_outline === 0 || this._fill_outline === 1) {
            drawFilledPolygon(imageData, this._vertices, this._fill_color);
            if (this._fill_outline === 1) {
                // Clear outline to transparent (approximate by clearing pixels near the edge)
                // We'll use the outline function to mark edge pixels
                const edgeMask = new Uint8ClampedArray(docW * docH * 4);
                drawPolygonOutline({ ...imageData, data: edgeMask }, this._vertices, Math.floor(lw / 2), [255,255,255,255]);
                for (let i = 0; i < edgeMask.length; i++) {
                    if (edgeMask[i * 4 + 3] > 0) imageData.data[i * 4 + 3] = 0;
                }
            }
        }
        if (this._fill_outline === 0 || this._fill_outline === 2) {
            drawPolygonOutline(imageData, this._vertices, Math.floor(lw / 2), color);
            if (this._fill_outline === 2) {
                // Clear fill area to transparent (approximate by clearing pixels inside)
                // We'll use the fill function to mark fill pixels
                const fillMask = new Uint8ClampedArray(docW * docH * 4);
                drawFilledPolygon({ ...imageData, data: fillMask }, this._vertices, [255,255,255,255]);
                for (let i = 0; i < docW * docH; i++) {
                    if (fillMask[i * 4 + 3] > 0) imageData.data[i * 4 + 3] = 0;
                }
            }
        }
        ctx.putImageData(imageData, 0, 0);

        this.begin_undo_capture?.(this.canvas_bounds_mapping!.to);
        tool_to_document(this.canvas!, this.canvas_bounds_mapping!, this.document_context!);
        this.document_dirty_signal!.value++;
        this.push_undo_snapshot?.();

        this._reset();
    }

    private _reset() {
        this._vertices = [];
        this.canvas_bounds_mapping = null;
        this.canvas_signal!.value = null;
    }
}
