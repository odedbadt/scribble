import { ClickAndDragTool } from "./click_and_drag_tool";
import { SettingName, settings } from "./settings_registry";
import { Vector2 } from "./types";
import { drawLine, drawThickLine, RGBA } from "./pixel_utils";
import { mandala_mode } from "./mandala_mode";
import { ghost_layer } from "./ghost_layer";
import { reveal_ghost_to_document } from "./utils";

/**
 * Reveal brush — sweeps over the canvas and makes previously invisible
 * ghost-mode strokes visible by copying ghost pixels to the document canvas.
 *
 * Preview: the overlay shows the exact ghost pixels that will be revealed,
 * so what you see while brushing matches the committed result exactly.
 */
export class RevealBrush extends ClickAndDragTool {
    private _prev: Vector2 | null = null;
    // Marker color used as a temporary mask before ghost pixels are sampled
    private readonly _marker: RGBA = [1, 1, 1, 255];

    constructor() {
        super();
        // Reveal brush always shows its overlay (it's previewing the reveal, not hiding it)
        this._suppress_overlay_in_ghost_mode = false;
    }

    editing_start() {
        this._prev = null;
        this.editing_drag(this.drag_start!, this.drag_start!);
    }

    editing_drag(from: Vector2, to: Vector2) {
        const lw = settings.peek<number>(SettingName.LineWidth);
        const radius = Math.floor(lw / 2);
        const prev = this._prev ?? to;
        this._prev = { ...to };

        let line_pairs: Array<{ from: Vector2, to: Vector2 }>;
        if (mandala_mode.enabled) {
            const center: Vector2 = mandala_mode.center ?? {
                x: this.document_canvas!.width / 2,
                y: this.document_canvas!.height / 2
            };
            line_pairs = mandala_mode.get_line_transforms(prev, to, center);
        } else {
            line_pairs = [{ from: prev, to }];
        }

        const context = this.context!;
        const canvas = this.canvas!;
        const imageData = context.getImageData(0, 0, canvas.width, canvas.height);

        // Step 1: mark newly covered pixels with a sentinel marker
        for (const pair of line_pairs) {
            const fx = Math.floor(pair.from.x);
            const fy = Math.floor(pair.from.y);
            const cx = Math.floor(pair.to.x);
            const cy = Math.floor(pair.to.y);
            if (radius <= 0) {
                drawLine(imageData, fx, fy, cx, cy, this._marker);
            } else {
                drawThickLine(imageData, fx, fy, cx, cy, radius, this._marker);
            }
        }

        // Step 2: replace every marked pixel with the corresponding ghost pixel
        // (transparent where ghost is empty — nothing to reveal there).
        // Tool canvas and document canvas share the same coordinate space
        // (mapping.to = full doc rect, tool canvas = full doc size).
        const gw = ghost_layer.canvas.width;
        const gh = ghost_layer.canvas.height;
        const ghost_idata = ghost_layer.context.getImageData(0, 0, gw, gh);
        const w = canvas.width;
        const h = canvas.height;
        const d = imageData.data;
        const gd = ghost_idata.data;

        for (let py = 0; py < h; py++) {
            for (let px = 0; px < w; px++) {
                const off = 4 * (py * w + px);
                if (d[off + 3] === 0) continue; // untouched pixel — skip
                // This pixel is within the brush sweep: show ghost pixel or clear
                if (px < gw && py < gh) {
                    const g_off = 4 * (py * gw + px);
                    if (gd[g_off + 3] > 0) {
                        d[off]     = gd[g_off];
                        d[off + 1] = gd[g_off + 1];
                        d[off + 2] = gd[g_off + 2];
                        d[off + 3] = gd[g_off + 3];
                    } else {
                        // Ghost is empty here — nothing to reveal, hide the pixel
                        d[off + 3] = 0;
                    }
                } else {
                    d[off + 3] = 0;
                }
            }
        }

        context.putImageData(imageData, 0, 0);
        this.publish_signals();
    }

    commit_to_document(_color: string | null = null) {
        if (!this.canvas_bounds_mapping) return;
        if (this.document_context == null) return;
        // The tool canvas already holds the ghost pixels we'll copy to document
        reveal_ghost_to_document(
            this.canvas!,
            this.canvas_bounds_mapping,
            ghost_layer.context,
            this.document_context
        );
        ghost_layer.dirty.value++;
    }

    /** Always commits to document (and updates dirty signal) regardless of ghost mode. */
    stop(at: Vector2) {
        if (this.drag_start) {
            this.begin_undo_capture?.(this.canvas_bounds_mapping?.to);
            this.commit_to_document();
            this.document_dirty_signal!.value++;
            this.push_undo_snapshot?.();
        }
        this.drag_start = null;
        this.canvas_bounds_mapping = null;
        this.canvas!.width = 1;
        this.canvas!.height = 1;
        this.canvas_signal!.value = null;
    }

    hover_color(): RGBA {
        return [180, 255, 180, 200];
    }
}
