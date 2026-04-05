import { ScribbleTool } from "./scribble";
import { SettingName, settings } from "./settings_registry";
import { drawLine, drawThickLine, parseColor, RGBA } from "./pixel_utils";
import { Vector2 } from "./types";
import { mandala_mode } from "./mandala_mode";

const TRANSPARENT: RGBA = [0, 0, 0, 0];

export class EraserTool extends ScribbleTool {

    private _hole_active = false;

    constructor() {
        super();
    }

    private _is_hole_mode(): boolean {
        return settings.peek<string>(SettingName.EraserMode) === 'hole';
    }

    editing_start() {
        if (this._is_hole_mode()) {
            // Capture undo state NOW, before any pixels are changed during drag.
            this.begin_undo_capture?.();
            this._hole_active = true;
            // Hide the tool canvas overlay — we draw directly on the document.
            this.canvas_bounds_mapping = null;
            this.canvas!.width = 1;
            this.canvas!.height = 1;
            this._prev = null;
            // Draw the initial point.
            this._apply_hole(this.drag_start!, this.drag_start!);
        } else {
            this._stroke_color = parseColor(settings.peek<string>(SettingName.BackColor));
            this._prev = null;
            this.editing_drag(this.drag_start!, this.drag_start!);
        }
    }

    editing_drag(from: Vector2, to: Vector2) {
        if (this._hole_active) {
            this._apply_hole(from, to);
        } else {
            super.editing_drag(from, to);
        }
    }

    /** Punch transparent holes directly into the active layer canvas. */
    private _apply_hole(from: Vector2, to: Vector2) {
        const lw = settings.peek<number>(SettingName.LineWidth);
        const radius = Math.floor(lw / 2);
        const prev = this._prev ?? to;
        this._prev = { ...to };

        let line_pairs: Array<{ from: Vector2, to: Vector2 }>;
        if (mandala_mode.enabled && this.document_canvas) {
            const center = mandala_mode.center ?? {
                x: this.document_canvas.width / 2,
                y: this.document_canvas.height / 2,
            };
            line_pairs = mandala_mode.get_line_transforms(prev, to, center);
        } else {
            line_pairs = [{ from: prev, to }];
        }

        const doc_ctx = this.document_context!;
        const doc_canvas = this.document_canvas!;
        const imageData = doc_ctx.getImageData(0, 0, doc_canvas.width, doc_canvas.height);

        for (const pair of line_pairs) {
            const fx = Math.floor(pair.from.x);
            const fy = Math.floor(pair.from.y);
            const cx = Math.floor(pair.to.x);
            const cy = Math.floor(pair.to.y);
            if (radius <= 0) {
                drawLine(imageData, fx, fy, cx, cy, TRANSPARENT);
            } else {
                drawThickLine(imageData, fx, fy, cx, cy, radius, TRANSPARENT);
            }
        }

        doc_ctx.putImageData(imageData, 0, 0);
        // Trigger a re-render (no tool overlay to publish).
        this.document_dirty_signal!.value++;
    }

    stop(at: Vector2) {
        if (this._hole_active) {
            if (this.drag_start) {
                // Undo was already captured in editing_start(); just push the after-snapshot.
                this.push_undo_snapshot?.();
                this.document_dirty_signal!.value++;
            }
            this._hole_active = false;
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
        // Hole mode draws directly on the document during drag; nothing to commit.
        if (!this._is_hole_mode()) {
            super.commit_to_document(settings.peek<string>(SettingName.BackColor));
        }
    }

    hover_color(): RGBA {
        // Backcolor cursor in both modes: shows what the eraser will paint over.
        return parseColor(settings.peek<string>(SettingName.BackColor));
    }
}

