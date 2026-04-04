import { EditingTool } from "./editing_tool";
import { SettingName, settings } from "./settings_registry";
import { Vector2 } from "./types";
import { drawLine, drawThickLine, parseColor, setPixel, RGBA } from "./pixel_utils";
import { parse_RGBA, tool_to_document } from "./utils";

// ── Shared math ────────────────────────────────────────────────────────────

type BezierPhase = 'idle' | 'set-endpoints' | 'set-cp1' | 'set-cp2';

const CLOSE_RADIUS = 10; // doc-px snap radius to close multi-section spline

function bezier_pt(p0: Vector2, p1: Vector2, p2: Vector2, p3: Vector2, t: number): Vector2 {
    const mt = 1 - t, mt2 = mt * mt, mt3 = mt2 * mt, t2 = t * t, t3 = t2 * t;
    return {
        x: mt3 * p0.x + 3 * mt2 * t * p1.x + 3 * mt * t2 * p2.x + t3 * p3.x,
        y: mt3 * p0.y + 3 * mt2 * t * p1.y + 3 * mt * t2 * p2.y + t3 * p3.y,
    };
}

function draw_bezier_curve(
    imageData: ImageData,
    p0: Vector2, p1: Vector2, p2: Vector2, p3: Vector2,
    radius: number, color: RGBA
) {
    const STEPS = 200;
    let prev = p0;
    for (let i = 1; i <= STEPS; i++) {
        const curr = bezier_pt(p0, p1, p2, p3, i / STEPS);
        if (radius <= 0)
            drawLine(imageData, Math.round(prev.x), Math.round(prev.y), Math.round(curr.x), Math.round(curr.y), color);
        else
            drawThickLine(imageData, Math.round(prev.x), Math.round(prev.y), Math.round(curr.x), Math.round(curr.y), radius, color);
        prev = curr;
    }
}

/**
 * Draw a Catmull-Rom segment from p1→p2 given neighbours p0 and p3.
 * Converts to cubic Bézier control points internally.
 */
function draw_catmull_segment(
    imageData: ImageData,
    p0: Vector2, p1: Vector2, p2: Vector2, p3: Vector2,
    radius: number, color: RGBA
) {
    const cp1: Vector2 = { x: p1.x + (p2.x - p0.x) / 6, y: p1.y + (p2.y - p0.y) / 6 };
    const cp2: Vector2 = { x: p2.x - (p3.x - p1.x) / 6, y: p2.y - (p3.y - p1.y) / 6 };
    draw_bezier_curve(imageData, p1, cp1, cp2, p2, radius, color);
}

/** Draw a closed Catmull-Rom spline through all points. */
function draw_catmull_closed(imageData: ImageData, pts: Vector2[], radius: number, color: RGBA) {
    const n = pts.length;
    for (let i = 0; i < n; i++) {
        draw_catmull_segment(
            imageData,
            pts[(i - 1 + n) % n], pts[i], pts[(i + 1) % n], pts[(i + 2) % n],
            radius, color
        );
    }
}

/** Draw an open Catmull-Rom spline through pts (endpoints duplicated for natural tangents). */
function draw_catmull_open(imageData: ImageData, pts: Vector2[], radius: number, color: RGBA) {
    if (pts.length < 2) return;
    const ext = [pts[0], ...pts, pts[pts.length - 1]]; // duplicate first and last
    for (let i = 1; i < pts.length; i++) {
        draw_catmull_segment(imageData, ext[i - 1], ext[i], ext[i + 1], ext[i + 2], radius, color);
    }
}

function draw_handle_square(imageData: ImageData, pt: Vector2, color: RGBA) {
    const r = 3, x = Math.round(pt.x), y = Math.round(pt.y);
    for (let dx = -r; dx <= r; dx++) {
        setPixel(imageData, x + dx, y - r, color);
        setPixel(imageData, x + dx, y + r, color);
    }
    for (let dy = -r + 1; dy <= r - 1; dy++) {
        setPixel(imageData, x - r, y + dy, color);
        setPixel(imageData, x + r, y + dy, color);
    }
}

const HANDLE_COLOR: RGBA = [80, 120, 220, 200];
const ENDPOINT_COLOR: RGBA = [220, 80, 80, 200];
const CLOSE_RING_COLOR: RGBA = [0, 200, 0, 220];

// ── Tool ───────────────────────────────────────────────────────────────────

export class BezierTool extends EditingTool {
    // ── single-segment state (Filled = false) ──
    private _p0: Vector2 | null = null;
    private _p3: Vector2 | null = null;
    private _p1: Vector2 | null = null;
    private _p2: Vector2 | null = null;
    private _phase: BezierPhase = 'idle';
    private _in_drag = false;

    // ── multi-section state (Filled = true) ──
    private _anchors: Vector2[] = [];
    private _last_click_ms = 0;

    // ── shared ──
    private _stroke_color: RGBA = [0, 0, 0, 255];
    private _start_buttons = 0;

    select() { this._reset(); }
    deselect() { this._reset(); }

    // ─────────────────────────────────────────────────────────────────────
    //  Dispatch based on mode
    // ─────────────────────────────────────────────────────────────────────

    start(at: Vector2, buttons: number) {
        this._start_buttons = buttons;
        const is_right = (buttons & 2) !== 0;
        this._stroke_color = parseColor(settings.peek<string>(is_right ? SettingName.BackColor : SettingName.ForeColor));
        if (settings.peek<boolean>(SettingName.Filled)) {
            this._multi_start(at);
        } else {
            this._single_start(at);
        }
    }

    drag(at: Vector2) {
        if (settings.peek<boolean>(SettingName.Filled)) {
            this._multi_render(at); // rubber-band preview while mouse held
        } else {
            this._single_drag(at);
        }
    }

    stop(at: Vector2) {
        if (!settings.peek<boolean>(SettingName.Filled)) {
            this._single_stop(at);
        }
        // multi-section: stop is handled in start (click-based, not drag-based)
    }

    hover(at: Vector2) {
        if (settings.peek<boolean>(SettingName.Filled)) {
            this._multi_render(at);
        } else {
            if (this._phase !== 'idle' && !this._in_drag) this._single_render(at);
        }
    }

    pointer_leave() {
        if (settings.peek<boolean>(SettingName.Filled)) {
            if (this._anchors.length > 0) this._multi_render(null);
        } else {
            if (this._phase !== 'idle') this._single_render(null);
        }
    }

    // ─────────────────────────────────────────────────────────────────────
    //  Single-segment cubic Bézier (Filled = false)
    // ─────────────────────────────────────────────────────────────────────

    private _single_start(at: Vector2) {
        const pt = { x: Math.round(at.x), y: Math.round(at.y) };
        if (this._phase === 'idle') {
            this._p0 = pt;
            this._p3 = pt;
            this._phase = 'set-endpoints';
        }
        this._in_drag = true;
        this._single_render(pt);
    }

    private _single_drag(at: Vector2) {
        const pt = { x: Math.round(at.x), y: Math.round(at.y) };
        if (this._phase === 'set-endpoints') this._p3 = pt;
        else if (this._phase === 'set-cp1') this._p1 = pt;
        else if (this._phase === 'set-cp2') this._p2 = pt;
        this._single_render(pt);
    }

    private _single_stop(at: Vector2) {
        const pt = { x: Math.round(at.x), y: Math.round(at.y) };
        this._in_drag = false;
        if (this._phase === 'set-endpoints') {
            this._p3 = pt;
            const p0 = this._p0!, p3 = this._p3;
            this._p1 = { x: Math.round(p0.x + (p3.x - p0.x) / 3), y: Math.round(p0.y + (p3.y - p0.y) / 3) };
            this._p2 = { x: Math.round(p0.x + 2 * (p3.x - p0.x) / 3), y: Math.round(p0.y + 2 * (p3.y - p0.y) / 3) };
            this._phase = 'set-cp1';
            this._single_render(pt);
        } else if (this._phase === 'set-cp1') {
            this._p1 = pt;
            this._phase = 'set-cp2';
            this._single_render(pt);
        } else if (this._phase === 'set-cp2') {
            this._p2 = pt;
            this._single_commit();
        }
    }

    private _single_render(cursor: Vector2 | null) {
        if (!this.canvas || !this.context || !this.document_canvas) return;
        if (this._phase === 'idle') { this.canvas_signal!.value = null; return; }
        const dims = this._setup_canvas(); if (!dims) return;
        const { docW, docH } = dims;
        const imageData = new ImageData(docW, docH);
        const radius = Math.floor((settings.peek<number>(SettingName.LineWidth) ?? 1) / 2);
        const p0 = this._p0!;
        let p1: Vector2, p2: Vector2, p3: Vector2;
        if (this._phase === 'set-endpoints') {
            p3 = cursor ?? this._p3 ?? p0; p1 = p0; p2 = p3;
        } else {
            p3 = this._p3!;
            p1 = this._phase === 'set-cp1' ? (cursor ?? this._p1!) : this._p1!;
            p2 = this._phase === 'set-cp2' ? (cursor ?? this._p2!) : this._p2!;
        }
        draw_bezier_curve(imageData, p0, p1, p2, p3, radius, this._stroke_color);
        if (this._phase !== 'set-endpoints') {
            drawLine(imageData, Math.round(p0.x), Math.round(p0.y), Math.round(p1.x), Math.round(p1.y), HANDLE_COLOR);
            drawLine(imageData, Math.round(p3.x), Math.round(p3.y), Math.round(p2.x), Math.round(p2.y), HANDLE_COLOR);
            draw_handle_square(imageData, p1, HANDLE_COLOR);
            draw_handle_square(imageData, p2, HANDLE_COLOR);
            draw_handle_square(imageData, p0, ENDPOINT_COLOR);
            draw_handle_square(imageData, p3, ENDPOINT_COLOR);
        }
        this.context.putImageData(imageData, 0, 0);
        this.publish_signals();
    }

    private _single_commit() {
        if (!this._p0 || !this._p1 || !this._p2 || !this._p3) { this._reset(); return; }
        const dims = this._setup_canvas(); if (!dims) { this._reset(); return; }
        const { docW, docH } = dims;
        const imageData = new ImageData(docW, docH);
        const radius = Math.floor((settings.peek<number>(SettingName.LineWidth) ?? 1) / 2);
        draw_bezier_curve(imageData, this._p0, this._p1, this._p2, this._p3, radius, this._stroke_color);
        this.context!.putImageData(imageData, 0, 0);
        this._do_commit();
    }

    // ─────────────────────────────────────────────────────────────────────
    //  Multi-section closed Catmull-Rom spline (Filled = true)
    // ─────────────────────────────────────────────────────────────────────

    private _multi_start(at: Vector2) {
        const pt = { x: Math.round(at.x), y: Math.round(at.y) };
        const now = Date.now();
        const is_double = now - this._last_click_ms < 300;
        this._last_click_ms = now;

        if (this._anchors.length >= 3) {
            const first = this._anchors[0];
            const near = Math.hypot(pt.x - first.x, pt.y - first.y) < CLOSE_RADIUS;
            if (near || is_double) {
                this._multi_commit();
                return;
            }
        }
        this._anchors.push(pt);
        this._multi_render(pt);
    }

    private _multi_render(cursor: Vector2 | null) {
        if (!this.canvas || !this.context || !this.document_canvas) return;
        if (this._anchors.length === 0) { this.canvas_signal!.value = null; return; }
        const dims = this._setup_canvas(); if (!dims) return;
        const { docW, docH } = dims;
        const imageData = new ImageData(docW, docH);
        const radius = Math.floor((settings.peek<number>(SettingName.LineWidth) ?? 1) / 2);

        // Draw committed segments as open Catmull-Rom through placed anchors
        if (this._anchors.length >= 2) {
            draw_catmull_open(imageData, this._anchors, radius, this._stroke_color);
        }

        // Rubber-band: preview next segment from last anchor to cursor
        if (cursor && this._anchors.length >= 1) {
            const last = this._anchors[this._anchors.length - 1];
            drawLine(imageData, last.x, last.y, Math.round(cursor.x), Math.round(cursor.y), this._stroke_color);
        }

        // Highlight first anchor when cursor is close enough to close
        if (cursor && this._anchors.length >= 3) {
            const first = this._anchors[0];
            if (Math.hypot(cursor.x - first.x, cursor.y - first.y) < CLOSE_RADIUS) {
                const r = 4;
                for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) {
                    const d = Math.sqrt(dx * dx + dy * dy);
                    if (d >= r - 0.6 && d <= r + 0.6)
                        setPixel(imageData, first.x + dx, first.y + dy, CLOSE_RING_COLOR);
                }
            }
        }

        // Anchor markers
        for (const a of this._anchors) draw_handle_square(imageData, a, ENDPOINT_COLOR);

        this.context.putImageData(imageData, 0, 0);
        this.publish_signals();
    }

    private _multi_commit() {
        if (this._anchors.length < 3) { this._reset(); return; }
        const dims = this._setup_canvas(); if (!dims) { this._reset(); return; }
        const { docW, docH } = dims;
        const imageData = new ImageData(docW, docH);
        const radius = Math.floor((settings.peek<number>(SettingName.LineWidth) ?? 1) / 2);
        draw_catmull_closed(imageData, this._anchors, radius, this._stroke_color);
        this.context!.putImageData(imageData, 0, 0);
        this._do_commit();
    }

    // ─────────────────────────────────────────────────────────────────────
    //  Shared helpers
    // ─────────────────────────────────────────────────────────────────────

    private _setup_canvas() {
        if (!this.canvas || !this.context || !this.document_canvas) return null;
        const docW = this.document_canvas.width, docH = this.document_canvas.height;
        this.canvas.width = docW;
        this.canvas.height = docH;
        this.canvas_bounds_mapping = { from: { x: 0, y: 0, w: 1, h: 1 }, to: { x: 0, y: 0, w: docW, h: docH } };
        return { docW, docH };
    }

    private _do_commit() {
        const color_arr = parse_RGBA(settings.peek<string>((this._start_buttons & 2) ? SettingName.BackColor : SettingName.ForeColor));
        this.begin_undo_capture?.(this.canvas_bounds_mapping!.to);
        tool_to_document(this.canvas!, this.canvas_bounds_mapping!, this.document_context!, color_arr);
        this.document_dirty_signal!.value++;
        this.push_undo_snapshot?.();
        this._reset();
    }

    private _reset() {
        this._p0 = this._p1 = this._p2 = this._p3 = null;
        this._phase = 'idle';
        this._in_drag = false;
        this._anchors = [];
        this._last_click_ms = 0;
        this.canvas_bounds_mapping = null;
        if (this.canvas) { this.canvas.width = 1; this.canvas.height = 1; }
        this.canvas_signal!.value = null;
    }
}
