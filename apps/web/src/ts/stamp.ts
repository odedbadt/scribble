import { EditingTool } from "./editing_tool";
import { clipboard } from "./clipboard";
import { setPixel, RGBA } from "./pixel_utils";
import { Vector2 } from "./types";
import { mandala_mode } from "./mandala_mode";

export class StampTool extends EditingTool {
    select(): void {}

    hover(at: Vector2): void {
        if (!clipboard.data) {
            this._render_crosshair(at);
            return;
        }
        if (mandala_mode.enabled && this.document_canvas) {
            this._render_mandala_hover(at);
        } else {
            this._render_single_hover(at);
        }
    }

    start(at: Vector2, _buttons: number): void {
        if (!clipboard.data) return;

        if (mandala_mode.enabled && this.document_canvas) {
            this._stamp_mandala(at);
        } else {
            this._stamp_single(at);
        }

        // Keep cursor visible after stamp
        this.hover(at);
    }

    /** While button held after stamp, just track cursor — no repeated stamps. */
    drag(at: Vector2): void {
        this.hover(at);
    }

    stop(_at: Vector2): void {
        // Nothing to commit — stamp already happened in start()
    }

    pointer_leave(): void {
        this.canvas_bounds_mapping = null;
        this.canvas!.width = 1;
        this.canvas!.height = 1;
        this.canvas_signal!.value = null;
    }

    // ── single (non-mandala) helpers ─────────────────────────────────────────

    private _render_single_hover(at: Vector2): void {
        const data = clipboard.data!;
        const w = data.width;
        const h = data.height;
        const x = Math.floor(at.x - w / 2);
        const y = Math.floor(at.y - h / 2);
        this.canvas!.width = w;
        this.canvas!.height = h;
        this.canvas_bounds_mapping = {
            from: { x: 0, y: 0, w: 1, h: 1 },
            to: { x, y, w, h },
        };
        this.context!.putImageData(data, 0, 0);
        this.publish_signals();
    }

    private _stamp_single(at: Vector2): void {
        const data = clipboard.data!;
        const w = data.width;
        const h = data.height;
        const x = Math.floor(at.x - w / 2);
        const y = Math.floor(at.y - h / 2);
        const tmp = _make_tmp_canvas(data);
        this.begin_undo_capture!({ x, y, w, h });
        this.document_context!.drawImage(tmp, x, y);
        this.document_dirty_signal!.value++;
        this.push_undo_snapshot!();
    }

    // ── mandala helpers ───────────────────────────────────────────────────────

    private _mandala_center(): Vector2 {
        return mandala_mode.center ?? {
            x: this.document_canvas!.width / 2,
            y: this.document_canvas!.height / 2,
        };
    }

    private _render_mandala_hover(at: Vector2): void {
        const data = clipboard.data!;
        const docW = this.document_canvas!.width;
        const docH = this.document_canvas!.height;
        this.canvas!.width = docW;
        this.canvas!.height = docH;
        this.canvas_bounds_mapping = {
            from: { x: 0, y: 0, w: 1, h: 1 },
            to: { x: 0, y: 0, w: docW, h: docH },
        };
        const ctx = this.context!;
        ctx.clearRect(0, 0, docW, docH);
        const tmp = _make_tmp_canvas(data);
        const center = this._mandala_center();
        for (const t of mandala_mode.get_stamp_transforms(at, center)) {
            _draw_rotated(ctx, tmp, t.center, t.angle, t.flip);
        }
        this.publish_signals();
    }

    private _stamp_mandala(at: Vector2): void {
        const data = clipboard.data!;
        const docW = this.document_canvas!.width;
        const docH = this.document_canvas!.height;
        const tmp = _make_tmp_canvas(data);
        const center = this._mandala_center();
        const transforms = mandala_mode.get_stamp_transforms(at, center);
        this.begin_undo_capture!({ x: 0, y: 0, w: docW, h: docH });
        const ctx = this.document_context!;
        for (const t of transforms) {
            _draw_rotated(ctx, tmp, t.center, t.angle, t.flip);
        }
        this.document_dirty_signal!.value++;
        this.push_undo_snapshot!();
    }

    // ── crosshair (no clipboard) ──────────────────────────────────────────────

    private _render_crosshair(at: Vector2): void {
        const arm = 5;
        const size = arm * 2 + 1;
        this.canvas!.width = size;
        this.canvas!.height = size;
        this.canvas_bounds_mapping = {
            from: { x: 0, y: 0, w: 1, h: 1 },
            to: { x: at.x - arm, y: at.y - arm, w: size, h: size },
        };
        const imageData = new ImageData(size, size);
        const color: RGBA = [0, 0, 0, 200];
        for (let i = 0; i < size; i++) {
            if (i !== arm) setPixel(imageData, i, arm, color);
            if (i !== arm) setPixel(imageData, arm, i, color);
        }
        this.context!.putImageData(imageData, 0, 0);
        this.publish_signals();
    }
}

// ── module-level helpers ──────────────────────────────────────────────────────

function _make_tmp_canvas(data: ImageData): HTMLCanvasElement {
    const tmp = document.createElement('canvas');
    tmp.width = data.width;
    tmp.height = data.height;
    tmp.getContext('2d')!.putImageData(data, 0, 0);
    return tmp;
}

/** Draw `src` canvas centred at `center`, rotated by `angle`, optionally flipped horizontally. */
function _draw_rotated(
    ctx: CanvasRenderingContext2D,
    src: HTMLCanvasElement,
    center: Vector2,
    angle: number,
    flip: boolean,
): void {
    ctx.save();
    ctx.translate(Math.round(center.x), Math.round(center.y));
    ctx.rotate(angle);
    if (flip) ctx.scale(-1, 1);
    ctx.drawImage(src, -src.width / 2, -src.height / 2);
    ctx.restore();
}
