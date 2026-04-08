import { EditingTool } from "./editing_tool";
import { SettingName, settings } from "./settings_registry";
import { Vector2 } from "./types";
import { drawLine, drawThickLine, parseColor, setPixel, RGBA } from "./pixel_utils";
import { tool_to_document } from "./utils";

// ── Types ──────────────────────────────────────────────────────────────────

type BezierPhase = 'idle' | 'set-endpoints' | 'set-cp1' | 'set-cp2';

/** Anchor point for the multi-section spline. `tangent` is the outgoing half-chord vector;
 *  when present it overrides the auto Catmull-Rom computation for this anchor. */
interface SplineAnchor {
    pt: Vector2;
    tangent?: Vector2;
}

const CLOSE_RADIUS = 10;     // px — snap to close multi-section spline
const TANGENT_MIN = 2;       // px — minimum drag to register a manual tangent

// ── Math helpers ───────────────────────────────────────────────────────────

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

/** Catmull-Rom outgoing CP at anchor i (uses tangent override if present). */
function catmull_cp1(anchors: SplineAnchor[], i: number, n: number, closed: boolean): Vector2 {
    const a = anchors[i];
    if (a.tangent) return { x: a.pt.x + a.tangent.x, y: a.pt.y + a.tangent.y };
    const prev = closed ? anchors[(i - 1 + n) % n].pt : (i > 0 ? anchors[i - 1].pt : a.pt);
    const next = anchors[(i + 1) % n].pt;
    return { x: a.pt.x + (next.x - prev.x) / 6, y: a.pt.y + (next.y - prev.y) / 6 };
}

/** Catmull-Rom incoming CP at anchor i (mirrors tangent override if present). */
function catmull_cp2(anchors: SplineAnchor[], i: number, n: number, closed: boolean): Vector2 {
    const a = anchors[i];
    if (a.tangent) return { x: a.pt.x - a.tangent.x, y: a.pt.y - a.tangent.y };
    const prev = anchors[(i - 1 + n) % n].pt; // only used when closed, safe
    const after = closed ? anchors[(i + 1) % n].pt : (i + 1 < n ? anchors[i + 1].pt : a.pt);
    return { x: a.pt.x - (after.x - prev.x) / 6, y: a.pt.y - (after.y - prev.y) / 6 };
}

function draw_spline_segment(
    imageData: ImageData,
    anchors: SplineAnchor[], from: number, to: number, n: number, closed: boolean,
    radius: number, color: RGBA
) {
    const cp1 = catmull_cp1(anchors, from, n, closed);
    const cp2 = catmull_cp2(anchors, to, n, closed);
    draw_bezier_curve(imageData, anchors[from].pt, cp1, cp2, anchors[to].pt, radius, color);
}

/** Draw all segments of a closed spline. */
function draw_spline_closed(imageData: ImageData, anchors: SplineAnchor[], radius: number, color: RGBA) {
    const n = anchors.length;
    for (let i = 0; i < n; i++) draw_spline_segment(imageData, anchors, i, (i + 1) % n, n, true, radius, color);
}

/** Draw all segments of an open spline. */
function draw_spline_open(imageData: ImageData, anchors: SplineAnchor[], radius: number, color: RGBA) {
    const n = anchors.length;
    if (n < 2) return;
    for (let i = 0; i < n - 1; i++) draw_spline_segment(imageData, anchors, i, i + 1, n, false, radius, color);
}

/** Flood-fill an ImageData in-place from seed (x,y) replacing transparent pixels with color. */
function flood_fill_transparent(imageData: ImageData, x: number, y: number, color: RGBA) {
    const { width: w, height: h, data } = imageData;
    const ix = Math.round(x), iy = Math.round(y);
    if (ix < 0 || iy < 0 || ix >= w || iy >= h) return;
    const off0 = (iy * w + ix) * 4;
    if (data[off0 + 3] !== 0) return; // seed already filled
    const stack: number[] = [iy * w + ix];
    while (stack.length > 0) {
        const idx = stack.pop()!;
        const px = idx % w, py = Math.floor(idx / w);
        if (px < 0 || py < 0 || px >= w || py >= h) continue;
        const off = idx * 4;
        if (data[off + 3] !== 0) continue; // already filled or outline pixel
        // Use setPixel for alpha blending
        setPixel(imageData, px, py, color);
        stack.push(idx + 1, idx - 1, idx + w, idx - w);
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
    // ── single-segment state (BezierClosed = false) ──
    private _p0: Vector2 | null = null;
    private _p3: Vector2 | null = null;
    private _p1: Vector2 | null = null;
    private _p2: Vector2 | null = null;
    private _phase: BezierPhase = 'idle';
    private _in_drag = false;

    // ── multi-section state (BezierClosed = true) ──
    private _anchors: SplineAnchor[] = [];
    private _last_click_ms = 0;
    private _dragging_tangent = false; // true while dragging an anchor to set tangent

    // ── shared ──
    private _stroke_color: RGBA = [0, 0, 0, 255];
    private _fill_color: RGBA = [255, 255, 255, 255];
    private _fill_outline: number = 0; // 0: both, 1: fill only, 2: outline only
    private _start_buttons = 0;

    select() { this._reset(); }
    deselect() { this._reset(); }

    // ─────────────────────────────────────────────────────────────────────
    //  Dispatch
    // ─────────────────────────────────────────────────────────────────────

    start(at: Vector2, buttons: number) {
        this._start_buttons = buttons;
        const is_right = (buttons & 2) !== 0;
        this._stroke_color = parseColor(settings.peek<string>(is_right ? SettingName.BackColor : SettingName.ForeColor));
        this._fill_color = parseColor(settings.peek<string>(SettingName.FillColor));
        this._fill_outline = settings.peek<number>(SettingName.FillOutline) ?? 0;
        if (settings.peek<boolean>(SettingName.BezierClosed)) {
            this._multi_start(at);
        } else {
            this._single_start(at);
        }
    }

    drag(at: Vector2) {
        if (settings.peek<boolean>(SettingName.BezierClosed)) {
            this._multi_drag(at);
        } else {
            this._single_drag(at);
        }
    }

    stop(at: Vector2) {
        if (settings.peek<boolean>(SettingName.BezierClosed)) {
            this._multi_stop(at);
        } else {
            this._single_stop(at);
        }
    }

    hover(at: Vector2) {
        if (settings.peek<boolean>(SettingName.BezierClosed)) {
            if (this._anchors.length > 0 && !this._dragging_tangent) this._multi_render(at);
        } else {
            if (this._phase !== 'idle' && !this._in_drag) this._single_render(at);
        }
    }

    pointer_leave() {
        if (settings.peek<boolean>(SettingName.BezierClosed)) {
            if (this._anchors.length > 0) this._multi_render(null);
        } else {
            if (this._phase !== 'idle') this._single_render(null);
        }
    }

    // ─────────────────────────────────────────────────────────────────────
    //  Single-segment cubic Bézier (BezierClosed = false)
    // ─────────────────────────────────────────────────────────────────────

    private _single_start(at: Vector2) {
        const pt = { x: Math.round(at.x), y: Math.round(at.y) };
        if (this._phase === 'idle') {
            this._p0 = pt; this._p3 = pt; this._phase = 'set-endpoints';
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
            this._p1 = pt; this._phase = 'set-cp2'; this._single_render(pt);
        } else if (this._phase === 'set-cp2') {
            this._p2 = pt; this._single_commit();
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
        // 0: both, 1: fill only, 2: outline only
        if (this._fill_outline === 0 || this._fill_outline === 1) {
            // Fill: flood fill from center of curve
            const cx = Math.round((this._p0.x + this._p3.x) / 2);
            const cy = Math.round((this._p0.y + this._p3.y) / 2);
            flood_fill_transparent(imageData, cx, cy, this._fill_color);
        }
        if (this._fill_outline === 0 || this._fill_outline === 2) {
            draw_bezier_curve(imageData, this._p0, this._p1, this._p2, this._p3, radius, this._stroke_color);
            // If OutlineOnly, clear fill area (center) to transparent
            if (this._fill_outline === 2) {
                const cx = Math.round((this._p0.x + this._p3.x) / 2);
                const cy = Math.round((this._p0.y + this._p3.y) / 2);
                flood_fill_transparent(imageData, cx, cy, [0,0,0,0]);
            }
        }
        this.context!.putImageData(imageData, 0, 0);
        this._do_commit();
    }

    // ─────────────────────────────────────────────────────────────────────
    //  Multi-section Catmull-Rom spline (BezierClosed = true)
    // ─────────────────────────────────────────────────────────────────────

    private _multi_start(at: Vector2) {
        const pt = { x: Math.round(at.x), y: Math.round(at.y) };
        const now = Date.now();
        const is_double = now - this._last_click_ms < 300;
        this._last_click_ms = now;

        // Check close / double-click conditions first
        if (this._anchors.length >= 3) {
            const first = this._anchors[0].pt;
            const near = Math.hypot(pt.x - first.x, pt.y - first.y) < CLOSE_RADIUS;
            if (near || is_double) {
                this._multi_commit();
                return;
            }
        }

        // Add new anchor
        const anchor: SplineAnchor = { pt };
        this._anchors.push(anchor);

        if (settings.peek<boolean>(SettingName.BezierManualCP)) {
            this._dragging_tangent = true;
        }
        this._multi_render(pt);
    }

    private _multi_drag(at: Vector2) {
        const pt = { x: Math.round(at.x), y: Math.round(at.y) };
        if (this._dragging_tangent && this._anchors.length > 0) {
            const last = this._anchors[this._anchors.length - 1];
            const tx = pt.x - last.pt.x, ty = pt.y - last.pt.y;
            // Only set tangent if dragged enough
            last.tangent = Math.hypot(tx, ty) >= TANGENT_MIN ? { x: tx, y: ty } : undefined;
        }
        this._multi_render(pt);
    }

    private _multi_stop(at: Vector2) {
        this._dragging_tangent = false;
        this._multi_render(at);
    }

    private _multi_render(cursor: Vector2 | null) {
        if (!this.canvas || !this.context || !this.document_canvas) return;
        if (this._anchors.length === 0) { this.canvas_signal!.value = null; return; }
        const dims = this._setup_canvas(); if (!dims) return;
        const { docW, docH } = dims;
        const imageData = new ImageData(docW, docH);
        const radius = Math.floor((settings.peek<number>(SettingName.LineWidth) ?? 1) / 2);

        // Draw committed segments as open spline
        if (this._anchors.length >= 2) {
            draw_spline_open(imageData, this._anchors, radius, this._stroke_color);
        }

        // Rubber-band: preview next segment from last anchor to cursor
        if (cursor && this._anchors.length >= 1 && !this._dragging_tangent) {
            const last = this._anchors[this._anchors.length - 1].pt;
            drawLine(imageData, last.x, last.y, Math.round(cursor.x), Math.round(cursor.y), this._stroke_color);
        }

        // Close-ring on first anchor when close enough
        if (cursor && this._anchors.length >= 3 && !this._dragging_tangent) {
            const first = this._anchors[0].pt;
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
        const show_handles = settings.peek<boolean>(SettingName.BezierManualCP);
        for (const a of this._anchors) {
            draw_handle_square(imageData, a.pt, ENDPOINT_COLOR);
            if (show_handles && a.tangent) {
                const hx = a.pt.x + a.tangent.x, hy = a.pt.y + a.tangent.y;
                const hx2 = a.pt.x - a.tangent.x, hy2 = a.pt.y - a.tangent.y;
                drawLine(imageData, Math.round(hx2), Math.round(hy2), Math.round(hx), Math.round(hy), HANDLE_COLOR);
                draw_handle_square(imageData, { x: hx, y: hy }, HANDLE_COLOR);
                draw_handle_square(imageData, { x: hx2, y: hy2 }, HANDLE_COLOR);
            }
        }

        this.context.putImageData(imageData, 0, 0);
        this.publish_signals();
    }

    private _multi_commit() {
        if (this._anchors.length < 3) { this._reset(); return; }
        const dims = this._setup_canvas(); if (!dims) { this._reset(); return; }
        const { docW, docH } = dims;
        const imageData = new ImageData(docW, docH);
        const radius = Math.floor((settings.peek<number>(SettingName.LineWidth) ?? 1) / 2);
        // 0: both, 1: fill only, 2: outline only
        if (this._fill_outline === 0 || this._fill_outline === 2) {
            draw_spline_closed(imageData, this._anchors, radius, this._stroke_color);
            // If OutlineOnly, clear fill area (centroid) to transparent
            if (this._fill_outline === 2) {
                let cx = 0, cy = 0;
                for (const a of this._anchors) { cx += a.pt.x; cy += a.pt.y; }
                cx /= this._anchors.length; cy /= this._anchors.length;
                flood_fill_transparent(imageData, cx, cy, [0,0,0,0]);
            }
        }
        if (this._fill_outline === 0 || this._fill_outline === 1) {
            // Flood-fill from centroid
            let cx = 0, cy = 0;
            for (const a of this._anchors) { cx += a.pt.x; cy += a.pt.y; }
            cx /= this._anchors.length; cy /= this._anchors.length;
            flood_fill_transparent(imageData, cx, cy, this._fill_color);
        }
        this.context!.putImageData(imageData, 0, 0);
        this._do_commit();
    }

    // ─────────────────────────────────────────────────────────────────────
    //  Shared helpers
    // ─────────────────────────────────────────────────────────────────────

    private _setup_canvas() {
        if (!this.canvas || !this.context || !this.document_canvas) return null;
        const docW = this.document_canvas.width, docH = this.document_canvas.height;
        this.canvas.width = docW; this.canvas.height = docH;
        this.canvas_bounds_mapping = { from: { x: 0, y: 0, w: 1, h: 1 }, to: { x: 0, y: 0, w: docW, h: docH } };
        return { docW, docH };
    }

    private _do_commit() {
        this.begin_undo_capture?.(this.canvas_bounds_mapping!.to);
        tool_to_document(this.canvas!, this.canvas_bounds_mapping!, this.document_context!);
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
        this._dragging_tangent = false;
        this.canvas_bounds_mapping = null;
        if (this.canvas) { this.canvas.width = 1; this.canvas.height = 1; }
        if (this.canvas_signal) this.canvas_signal.value = null;
    }
}
