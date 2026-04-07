import { ClickAndDragTool } from "./click_and_drag_tool";
import { clipboard } from "./clipboard";
import { setPixel, RGBA } from "./pixel_utils";
import { Rect, Vector2, bounding_rect, vfloor } from "./types";
import { state_registry, StateValue } from "./state_registry";

/** Draw a 1px marching-ants outline (alternating black/white pixels) on an ImageData. */
function draw_selection_outline(imageData: ImageData, w: number, h: number): void {
    for (let px = 0; px < w; px++) {
        const color_top: RGBA = (px) % 2 === 0 ? [0, 0, 0, 255] : [255, 255, 255, 255];
        const color_bot: RGBA = (px + h - 1) % 2 === 0 ? [0, 0, 0, 255] : [255, 255, 255, 255];
        setPixel(imageData, px, 0, color_top);
        if (h > 1) setPixel(imageData, px, h - 1, color_bot);
    }
    for (let py = 1; py < h - 1; py++) {
        const color_l: RGBA = (py) % 2 === 0 ? [0, 0, 0, 255] : [255, 255, 255, 255];
        const color_r: RGBA = (py + w - 1) % 2 === 0 ? [0, 0, 0, 255] : [255, 255, 255, 255];
        setPixel(imageData, 0, py, color_l);
        if (w > 1) setPixel(imageData, w - 1, py, color_r);
    }
}

export class SelectionTool extends ClickAndDragTool {
    private _selection: Rect | null = null;

    editing_start(): void {
        // New drag clears old selection
        this._selection = null;
    }

    editing_drag(from: Vector2, to: Vector2): void {
        const sel = bounding_rect(from, to);
        const w = Math.max(1, Math.floor(sel.w));
        const h = Math.max(1, Math.floor(sel.h));

        this.canvas!.width = w;
        this.canvas!.height = h;
        this.canvas_bounds_mapping = {
            from: { x: 0, y: 0, w: 1, h: 1 },
            to: { x: Math.floor(sel.x), y: Math.floor(sel.y), w, h },
        };

        const imageData = new ImageData(w, h);
        draw_selection_outline(imageData, w, h);
        this.context!.putImageData(imageData, 0, 0);
        // publish_signals() called by base drag()
    }

    /** Override: auto-copy to clipboard and switch to stamp tool. */
    stop(at: Vector2): void {
        if (!this.drag_start) return;
        const sel = bounding_rect(vfloor(this.drag_start), vfloor(at));
        this._selection = {
            x: Math.floor(sel.x),
            y: Math.floor(sel.y),
            w: Math.max(1, Math.floor(sel.w)),
            h: Math.max(1, Math.floor(sel.h)),
        };
        this.drag_start = null;
        // Auto-copy selection to clipboard
        const s = this._selection;
        clipboard.data = this.document_context!.getImageData(s.x, s.y, s.w, s.h);
        clipboard.rect = { x: s.x, y: s.y };
        // Clear selection display and hand off to stamp tool
        this._clear_selection_display();
        this._selection = null;
        state_registry.set(StateValue.SelectedToolName, 'stamp');
    }

    hover_action(at: Vector2): void {
        if (this._selection) {
            this._render_selection();
        } else {
            this._render_crosshair(at);
        }
    }

    /** Keep the selection outline visible when cursor leaves. */
    pointer_leave(): void {
        if (this._selection) return;
        super.pointer_leave();
    }

    deselect(): void {
        this._clear_selection_display();
        this._selection = null;
    }

    keydown(ev: KeyboardEvent): void {
        if (!this._selection) return;
        if (ev.code === 'Escape') {
            this._clear_selection_display();
            this._selection = null;
        }
    }

    cut(): void {
        if (!this._selection) return;
        const sel = this._selection;
        clipboard.data = this.document_context!.getImageData(sel.x, sel.y, sel.w, sel.h);
        clipboard.rect = { x: sel.x, y: sel.y };
        this.begin_undo_capture!(sel);
        this.document_context!.clearRect(sel.x, sel.y, sel.w, sel.h);
        this.document_dirty_signal!.value++;
        this.push_undo_snapshot!();
        this._clear_selection_display();
        this._selection = null;
    }

    private _render_selection(): void {
        if (!this._selection) return;
        const sel = this._selection;
        const w = sel.w;
        const h = sel.h;

        this.canvas!.width = w;
        this.canvas!.height = h;
        this.canvas_bounds_mapping = {
            from: { x: 0, y: 0, w: 1, h: 1 },
            to: sel,
        };

        const imageData = new ImageData(w, h);
        draw_selection_outline(imageData, w, h);
        this.context!.putImageData(imageData, 0, 0);
        this.publish_signals();
    }

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

    private _clear_selection_display(): void {
        this.canvas_bounds_mapping = null;
        this.canvas!.width = 1;
        this.canvas!.height = 1;
        this.canvas_signal!.value = null;
    }
}
