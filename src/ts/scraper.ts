import { ScribbleTool } from "./scribble";
import { SettingName, settings } from "./settings_registry";
import { drawLine, drawThickLine, parseColor, RGBA } from "./pixel_utils";
import { Vector2 } from "./types";
import { mandala_mode } from "./mandala_mode";

const TRANSPARENT: RGBA = [0, 0, 0, 0];

/**
 * Scraper tool — punches transparent holes into layers.
 *
 * Simple (no alt): erases the active layer only at stroke pixels.
 * Alt (topmost): per-pixel topmost — at each stroke pixel, erases whichever layer
 *   has the topmost non-transparent paint there.  No layer locking.
 */
export class ScraperTool extends ScribbleTool {

    private _hole_active = false;
    private _is_topmost_mode = false;
    private _topmost_undo_captured = false;
    /** Tracks which pixels have already been processed this stroke (prevents double-erase on overlapping segments). */
    private _visited: Uint8Array | null = null;
    private _visited_doc_w = 0;

    constructor() {
        super();
    }

    editing_start() {
        this._is_topmost_mode = !!(this.get_alt_key?.());
        this._hole_active = true;
        this._topmost_undo_captured = false;
        this.canvas_bounds_mapping = null;
        this.canvas!.width = 1;
        this.canvas!.height = 1;
        this._prev = null;
        this._visited = null;

        if (this._is_topmost_mode && this.document_canvas) {
            const w = this.document_canvas.width;
            const h = this.document_canvas.height;
            this._visited = new Uint8Array(w * h);
            this._visited_doc_w = w;
            this._apply_hole_topmost_perpixel(this.drag_start!, this.drag_start!);
        } else if (!this._is_topmost_mode) {
            this.begin_undo_capture?.();
            this._apply_hole_active_layer(this.drag_start!, this.drag_start!);
        }
    }

    editing_drag(from: Vector2, to: Vector2) {
        if (this._hole_active) {
            if (this._is_topmost_mode) {
                this._apply_hole_topmost_perpixel(from, to);
            } else {
                this._apply_hole_active_layer(from, to);
            }
        } else {
            super.editing_drag(from, to);
        }
    }

    /** Simple mode: punch holes in the active layer only. */
    private _apply_hole_active_layer(from: Vector2, to: Vector2) {
        this._apply_hole_to_layer(
            this.document_canvas!,
            this.document_context!,
            from, to,
        );
    }

    /**
     * Alt (topmost) mode: per-pixel topmost erasing.
     * For each pixel in the stroke, finds the topmost visible layer with paint and
     * erases that pixel there.  Captures undo for all layers on first modification.
     */
    private _apply_hole_topmost_perpixel(from: Vector2, to: Vector2) {
        if (!this.layer_stack || !this.document_canvas) return;

        const lw = settings.peek<number>(SettingName.LineWidth);
        const radius = Math.floor(lw / 2);
        const prev = this._prev ?? to;
        this._prev = { ...to };

        const fx = Math.floor(prev.x), fy = Math.floor(prev.y);
        const tx = Math.floor(to.x),   ty = Math.floor(to.y);

        const layers = this.layer_stack.layers.peek();
        const doc_w = this.document_canvas.width;
        const doc_h = this.document_canvas.height;

        // Bounding box of the thick-line segment.
        const bx0 = Math.max(0, Math.min(fx, tx) - radius);
        const by0 = Math.max(0, Math.min(fy, ty) - radius);
        const bx1 = Math.min(doc_w, Math.max(fx, tx) + radius + 1);
        const by1 = Math.min(doc_h, Math.max(fy, ty) + radius + 1);
        if (bx1 <= bx0 || by1 <= by0) return;
        const bw = bx1 - bx0, bh = by1 - by0;

        // Build stroke mask: which pixels are covered by the thick line.
        const mask = new Uint8Array(bw * bh);
        this._mark_thick_line_mask(mask, bx0, by0, bw, bh, fx, fy, tx, ty, radius);

        // Load ImageData for all layers.
        const layer_datas = layers.map(layer =>
            layer.visible ? layer.context.getImageData(bx0, by0, bw, bh) : null,
        );

        // Per-pixel topmost erase. Skip pixels already processed this stroke.
        const dirty = new Set<number>();
        for (let j = 0; j < bh; j++) {
            for (let i = 0; i < bw; i++) {
                if (!mask[j * bw + i]) continue;
                const doc_px = bx0 + i, doc_py = by0 + j;
                const vid = doc_py * this._visited_doc_w + doc_px;
                if (this._visited![vid]) continue; // already erased in an earlier segment
                const idx = (j * bw + i) * 4;
                for (let li = layers.length - 1; li >= 0; li--) {
                    const ld = layer_datas[li];
                    if (!ld) continue;
                    if (ld.data[idx + 3] > 0) {
                        ld.data[idx] = 0;
                        ld.data[idx + 1] = 0;
                        ld.data[idx + 2] = 0;
                        ld.data[idx + 3] = 0;
                        dirty.add(li);
                        this._visited![vid] = 1;
                        break;
                    }
                }
            }
        }

        if (dirty.size === 0) return;

        // Capture undo for all layers before first modification.
        if (!this._topmost_undo_captured) {
            this._topmost_undo_captured = true;
            this.begin_undo_capture_layers?.(layers);
        }

        for (const li of dirty) {
            layers[li].context.putImageData(layer_datas[li]!, bx0, by0);
        }
        this.document_dirty_signal!.value++;
    }

    /**
     * Marks mask[1] for every pixel covered by a thick-line from (x0,y0) to (x1,y1)
     * with the given radius, using the same Bresenham + filled-circle algorithm as
     * drawThickLine so the stroke footprint is pixel-perfect identical.
     */
    private _mark_thick_line_mask(
        mask: Uint8Array,
        bx0: number, by0: number, bw: number, bh: number,
        x0: number, y0: number, x1: number, y1: number,
        radius: number,
    ) {
        const markCircle = (cx: number, cy: number) => {
            if (radius <= 0) {
                const mi = (cy - by0) * bw + (cx - bx0);
                if (cx >= bx0 && cx < bx0 + bw && cy >= by0 && cy < by0 + bh) mask[mi] = 1;
                return;
            }
            for (let dy = -radius; dy <= radius; dy++) {
                const xExtent = Math.floor(Math.sqrt(radius * radius - dy * dy));
                for (let dx = -xExtent; dx <= xExtent; dx++) {
                    const px = cx + dx, py = cy + dy;
                    if (px >= bx0 && px < bx0 + bw && py >= by0 && py < by0 + bh) {
                        mask[(py - by0) * bw + (px - bx0)] = 1;
                    }
                }
            }
        };

        const adx = Math.abs(x1 - x0), ady = Math.abs(y1 - y0);
        const sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
        let err = adx - ady;
        while (true) {
            markCircle(x0, y0);
            if (x0 === x1 && y0 === y1) break;
            const e2 = 2 * err;
            if (e2 > -ady) { err -= ady; x0 += sx; }
            if (e2 < adx) { err += adx; y0 += sy; }
        }
    }

    /** Core hole-punch for simple mode: erase transparent pixels into the given context. */
    private _apply_hole_to_layer(
        canvas: HTMLCanvasElement,
        ctx: CanvasRenderingContext2D,
        from: Vector2,
        to: Vector2,
    ) {
        const lw = settings.peek<number>(SettingName.LineWidth);
        const radius = Math.floor(lw / 2);
        const prev = this._prev ?? to;
        this._prev = { ...to };

        let line_pairs: Array<{ from: Vector2, to: Vector2 }>;
        if (mandala_mode.enabled) {
            const center = mandala_mode.center ?? {
                x: canvas.width / 2,
                y: canvas.height / 2,
            };
            line_pairs = mandala_mode.get_line_transforms(prev, to, center);
        } else {
            line_pairs = [{ from: prev, to }];
        }

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        for (const pair of line_pairs) {
            const pfx = Math.floor(pair.from.x);
            const pfy = Math.floor(pair.from.y);
            const ptx = Math.floor(pair.to.x);
            const pty = Math.floor(pair.to.y);
            if (radius <= 0) {
                drawLine(imageData, pfx, pfy, ptx, pty, TRANSPARENT);
            } else {
                drawThickLine(imageData, pfx, pfy, ptx, pty, radius, TRANSPARENT);
            }
        }
        ctx.putImageData(imageData, 0, 0);
        this.document_dirty_signal!.value++;
    }

    stop(at: Vector2) {
        if (this._hole_active) {
            if (this.drag_start) {
                if (this._is_topmost_mode) {
                    if (this._topmost_undo_captured) {
                        this.push_undo_snapshot_layers?.();
                    }
                } else {
                    this.push_undo_snapshot?.();
                }
                this.document_dirty_signal!.value++;
            }
            this._hole_active = false;
            this._is_topmost_mode = false;
            this._topmost_undo_captured = false;
            this._visited = null;
            this._prev = null;
            this.drag_start = null;
            this.canvas_bounds_mapping = null;
            this.canvas!.width = 1;
            this.canvas!.height = 1;
            this.canvas_signal!.value = null;
        } else {
            super.stop(at);
        }
    }

    commit_to_document(_color: string | null = null) {
        // Scraper never paints — it only erases. No backcolor commit.
    }

    hover_color(): RGBA {
        return parseColor(settings.peek<string>(SettingName.BackColor));
    }

    hover_action(at: Vector2) {
        if (this.layer_stack && !mandala_mode.enabled) {
            this._hover_hole_preview(at);
            return;
        }
        super.hover_action(at);
    }

    /** Renders the scraper cursor as a per-pixel preview of what will be revealed. */
    private _hover_hole_preview(at: Vector2) {
        const lw = settings.peek<number>(SettingName.LineWidth);
        const radius = Math.floor(lw / 2);
        const margin = 1;
        const half = radius + margin;
        const size = half * 2 + 1;
        const cx = Math.floor(at.x);
        const cy = Math.floor(at.y);
        const x0 = cx - half;
        const y0 = cy - half;

        const ls = this.layer_stack!;
        const layers = ls.layers.peek();
        const doc_w = this.document_canvas?.width ?? 0;
        const doc_h = this.document_canvas?.height ?? 0;
        const is_alt = this.get_alt_key?.() ?? false;

        const sx = Math.max(0, x0);
        const sy = Math.max(0, y0);
        const ex = Math.min(doc_w, x0 + size);
        const ey = Math.min(doc_h, y0 + size);
        const fw = Math.max(0, ex - sx);
        const fh = Math.max(0, ey - sy);
        const ox = sx - x0;
        const oy = sy - y0;

        const layer_imgs: Array<Uint8ClampedArray | null> = layers.map(layer => {
            if (!layer.visible || fw <= 0 || fh <= 0) return null;
            return layer.context.getImageData(sx, sy, fw, fh).data;
        });

        const composited = new ImageData(size, size);

        for (let py = 0; py < size; py++) {
            for (let px = 0; px < size; px++) {
                const dx = px - half;
                const dy = py - half;
                if (Math.sqrt(dx * dx + dy * dy) > radius + 0.5) continue;

                const di = (py * size + px) * 4;
                const lpx = px - ox;
                const lpy = py - oy;

                if (lpx < 0 || lpx >= fw || lpy < 0 || lpy >= fh) {
                    this._write_checker(composited.data, di, x0 + px, y0 + py);
                    continue;
                }

                // Determine which layer is being "punched through" at this pixel.
                let target_idx: number;
                if (is_alt) {
                    // Alt mode: per-pixel topmost non-transparent layer.
                    target_idx = -1;
                    for (let i = layers.length - 1; i >= 0; i--) {
                        const ld = layer_imgs[i];
                        if (!ld) continue;
                        if (ld[(lpy * fw + lpx) * 4 + 3] > 0) { target_idx = i; break; }
                    }
                } else {
                    // Simple mode: active layer only.
                    target_idx = ls.active_index.peek();
                }

                if (target_idx <= 0) {
                    this._write_checker(composited.data, di, x0 + px, y0 + py);
                    continue;
                }

                let r = 0, g = 0, b = 0, a = 0;
                for (let i = 0; i < target_idx; i++) {
                    const ld = layer_imgs[i];
                    if (!ld) continue;
                    const si = (lpy * fw + lpx) * 4;
                    const src_a = ld[si + 3];
                    if (src_a === 0) continue;
                    const sa = src_a / 255;
                    if (src_a === 255) {
                        r = ld[si]; g = ld[si + 1]; b = ld[si + 2]; a = 1;
                    } else {
                        const out_a = sa + a * (1 - sa);
                        if (out_a > 0) {
                            r = (ld[si]     * sa + r * a * (1 - sa)) / out_a;
                            g = (ld[si + 1] * sa + g * a * (1 - sa)) / out_a;
                            b = (ld[si + 2] * sa + b * a * (1 - sa)) / out_a;
                            a = out_a;
                        }
                    }
                }

                if (a === 0) {
                    this._write_checker(composited.data, di, x0 + px, y0 + py);
                } else {
                    composited.data[di]     = Math.round(r);
                    composited.data[di + 1] = Math.round(g);
                    composited.data[di + 2] = Math.round(b);
                    composited.data[di + 3] = Math.round(a * 255);
                }
            }
        }

        this.canvas!.width = size;
        this.canvas!.height = size;
        this.canvas_bounds_mapping = {
            from: { x: 0, y: 0, w: 1, h: 1 },
            to: { x: x0, y: y0, w: size, h: size },
        };
        this.context!.putImageData(composited, 0, 0);
        this.publish_signals();
    }

    /** Writes an 8-px checkerboard pixel using document-space coordinates. */
    private _write_checker(data: Uint8ClampedArray, di: number, doc_x: number, doc_y: number) {
        const c = (Math.floor(doc_x / 8) ^ Math.floor(doc_y / 8)) & 1 ? 220 : 180;
        data[di]     = c;
        data[di + 1] = c;
        data[di + 2] = c;
        data[di + 3] = 255;
    }
}
