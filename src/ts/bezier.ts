import { EditingTool } from "./editing_tool";
import { SettingName, settings } from "./settings_registry";
import { Vector2 } from "./types";
import { drawLine, drawThickLine, parseColor, setPixel, RGBA } from "./pixel_utils";
import { parse_RGBA, tool_to_document } from "./utils";

type BezierPhase = 'idle' | 'set-endpoints' | 'set-cp1' | 'set-cp2';

function bezier_pt(p0: Vector2, p1: Vector2, p2: Vector2, p3: Vector2, t: number): Vector2 {
    const mt = 1 - t;
    const mt2 = mt * mt;
    const mt3 = mt2 * mt;
    const t2 = t * t;
    const t3 = t2 * t;
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
        if (radius <= 0) {
            drawLine(imageData, Math.round(prev.x), Math.round(prev.y), Math.round(curr.x), Math.round(curr.y), color);
        } else {
            drawThickLine(imageData, Math.round(prev.x), Math.round(prev.y), Math.round(curr.x), Math.round(curr.y), radius, color);
        }
        prev = curr;
    }
}

function draw_handle_square(imageData: ImageData, pt: Vector2, color: RGBA) {
    const r = 3;
    const x = Math.round(pt.x);
    const y = Math.round(pt.y);
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

/** Draw the closing segment (P3→P0) using control points mirrored around P3 and P0
 *  for G1 continuity at both junctions. */
function draw_closing_segment(
    imageData: ImageData,
    p0: Vector2, p1: Vector2, p2: Vector2, p3: Vector2,
    radius: number, color: RGBA
) {
    // Mirror CP2 around P3 → tangent continues smoothly out of P3
    const cp3: Vector2 = { x: 2 * p3.x - p2.x, y: 2 * p3.y - p2.y };
    // Mirror CP1 around P0 → tangent arrives smoothly into P0
    const cp4: Vector2 = { x: 2 * p0.x - p1.x, y: 2 * p0.y - p1.y };
    draw_bezier_curve(imageData, p3, cp3, cp4, p0, radius, color);
}

export class BezierTool extends EditingTool {
    private _p0: Vector2 | null = null;
    private _p3: Vector2 | null = null;
    private _p1: Vector2 | null = null;
    private _p2: Vector2 | null = null;
    private _phase: BezierPhase = 'idle';
    private _in_drag = false;
    private _stroke_color: RGBA = [0, 0, 0, 255];
    private _start_buttons = 0;

    select() { this._reset(); }
    deselect() { this._reset(); }

    start(at: Vector2, buttons: number) {
        this._start_buttons = buttons;
        const is_right = (buttons & 2) !== 0;
        this._stroke_color = parseColor(settings.peek<string>(is_right ? SettingName.BackColor : SettingName.ForeColor));
        const pt = { x: Math.round(at.x), y: Math.round(at.y) };
        if (this._phase === 'idle') {
            this._p0 = pt;
            this._p3 = pt;
            this._phase = 'set-endpoints';
        }
        this._in_drag = true;
        this._render(pt);
    }

    drag(at: Vector2) {
        const pt = { x: Math.round(at.x), y: Math.round(at.y) };
        if (this._phase === 'set-endpoints') {
            this._p3 = pt;
        } else if (this._phase === 'set-cp1') {
            this._p1 = pt;
        } else if (this._phase === 'set-cp2') {
            this._p2 = pt;
        }
        this._render(pt);
    }

    stop(at: Vector2) {
        const pt = { x: Math.round(at.x), y: Math.round(at.y) };
        this._in_drag = false;
        if (this._phase === 'set-endpoints') {
            this._p3 = pt;
            // Default control points at 1/3 and 2/3 along the line
            const p0 = this._p0!;
            const p3 = this._p3;
            this._p1 = {
                x: Math.round(p0.x + (p3.x - p0.x) / 3),
                y: Math.round(p0.y + (p3.y - p0.y) / 3),
            };
            this._p2 = {
                x: Math.round(p0.x + 2 * (p3.x - p0.x) / 3),
                y: Math.round(p0.y + 2 * (p3.y - p0.y) / 3),
            };
            this._phase = 'set-cp1';
            this._render(pt);
        } else if (this._phase === 'set-cp1') {
            this._p1 = pt;
            this._phase = 'set-cp2';
            this._render(pt);
        } else if (this._phase === 'set-cp2') {
            this._p2 = pt;
            this._commit();
        }
    }

    hover(at: Vector2) {
        if (this._phase === 'idle') return;
        if (!this._in_drag) this._render(at);
    }

    pointer_leave() {
        if (this._phase !== 'idle') this._render(null);
    }

    private _setup_canvas() {
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
        if (!this.canvas || !this.context || !this.document_canvas) return;
        if (this._phase === 'idle') { this.canvas_signal!.value = null; return; }

        const dims = this._setup_canvas();
        if (!dims) return;
        const { docW, docH } = dims;

        const imageData = new ImageData(docW, docH);
        const lw = settings.peek<number>(SettingName.LineWidth);
        const radius = Math.floor(lw / 2);

        const p0 = this._p0!;

        // Resolve the four control points for the current preview
        let p1: Vector2;
        let p2: Vector2;
        let p3: Vector2;

        if (this._phase === 'set-endpoints') {
            p3 = cursor ?? this._p3 ?? p0;
            p1 = p0;
            p2 = p3;
        } else {
            p3 = this._p3!;
            if (this._phase === 'set-cp1') {
                p1 = cursor ?? this._p1!;
                p2 = this._p2!;
            } else {
                p1 = this._p1!;
                p2 = cursor ?? this._p2!;
            }
        }

        draw_bezier_curve(imageData, p0, p1, p2, p3, radius, this._stroke_color);

        // In closed mode, draw the mirrored return segment for a smooth closed curve.
        if (settings.peek<boolean>(SettingName.Filled) && this._phase !== 'set-endpoints') {
            draw_closing_segment(imageData, p0, p1, p2, p3, radius, this._stroke_color);
        }

        // Draw handle guides and markers during control-point phases
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

    private _commit() {
        if (!this._p0 || !this._p1 || !this._p2 || !this._p3) { this._reset(); return; }

        const dims = this._setup_canvas();
        if (!dims) { this._reset(); return; }
        const { docW, docH } = dims;

        // Render clean curve (no handles) for commit
        const imageData = new ImageData(docW, docH);
        const lw = settings.peek<number>(SettingName.LineWidth);
        const radius = Math.floor(lw / 2);
        draw_bezier_curve(imageData, this._p0, this._p1, this._p2, this._p3, radius, this._stroke_color);
        if (settings.peek<boolean>(SettingName.Filled)) {
            draw_closing_segment(imageData, this._p0, this._p1, this._p2, this._p3, radius, this._stroke_color);
        }
        this.context!.putImageData(imageData, 0, 0);

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
        this.canvas_bounds_mapping = null;
        if (this.canvas) { this.canvas.width = 1; this.canvas.height = 1; }
        this.canvas_signal!.value = null;
    }
}
