import { ClickAndDragTool } from "./click_and_drag_tool";
import { SettingName, settings } from "./settings_registry";
import { Vector2 } from "./types";
import { drawLine, drawThickLine, drawFilledCircle, RGBA } from "./pixel_utils";
import { mandala_mode } from "./mandala_mode";
import { ghost_layer } from "./ghost_layer";
import { reveal_ghost_to_document } from "./utils";

/**
 * Reveal brush — sweeps over the canvas and makes previously invisible
 * ghost-mode strokes visible by copying ghost pixels to the document canvas.
 */
export class RevealBrush extends ClickAndDragTool {
    private _prev: Vector2 | null = null;
    // Bright highlight color so user can see where they're brushing
    private readonly _brush_color: RGBA = [255, 230, 50, 120];

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

        for (const pair of line_pairs) {
            const fx = Math.floor(pair.from.x);
            const fy = Math.floor(pair.from.y);
            const cx = Math.floor(pair.to.x);
            const cy = Math.floor(pair.to.y);
            if (radius <= 0) {
                drawLine(imageData, fx, fy, cx, cy, this._brush_color);
            } else {
                drawThickLine(imageData, fx, fy, cx, cy, radius, this._brush_color);
            }
        }

        context.putImageData(imageData, 0, 0);
        this.publish_signals();
    }

    commit_to_document(_color: string | null = null) {
        if (!this.canvas_bounds_mapping) return;
        if (this.document_context == null) return;
        reveal_ghost_to_document(
            this.canvas!,
            this.canvas_bounds_mapping,
            ghost_layer.context,
            this.document_context
        );
        ghost_layer.dirty.value++;
    }

    hover_color(): RGBA {
        return this._brush_color;
    }
}
