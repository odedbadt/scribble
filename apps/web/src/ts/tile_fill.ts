import { EditingTool } from "./editing_tool";
import { clipboard } from "./clipboard";
import { fill_pattern } from "./fill_pattern";
import { Vector2 } from "./types";
import { setPixel, RGBA } from "./pixel_utils";

export class TileFillTool extends EditingTool {
    select(): void {
        // Immediately save clipboard as the active fill pattern and enable it
        if (clipboard.data) {
            fill_pattern.data = clipboard.data;
            fill_pattern.enabled.value = true;
        }
        this._render_preview();
    }

    hover(_at: Vector2): void {
        this._render_preview();
    }

    start(_at: Vector2, _buttons: number): void {
        if (!clipboard.data || !this.document_canvas) return;
        const docW = this.document_canvas.width;
        const docH = this.document_canvas.height;
        // Update pattern data to latest clipboard before committing
        fill_pattern.data = clipboard.data;
        fill_pattern.enabled.value = true;
        const tmp = _make_tmp(clipboard.data);
        this.begin_undo_capture!({ x: 0, y: 0, w: docW, h: docH });
        _tile(this.document_context!, tmp, docW, docH);
        this.document_dirty_signal!.value++;
        this.push_undo_snapshot!();
        this._render_preview(); // keep preview visible
    }

    drag(_at: Vector2): void {}

    stop(_at: Vector2): void {}

    pointer_leave(): void {
        this.canvas_bounds_mapping = null;
        this.canvas!.width = 1;
        this.canvas!.height = 1;
        this.canvas_signal!.value = null;
    }

    private _render_preview(): void {
        if (!this.document_canvas) return;
        const docW = this.document_canvas.width;
        const docH = this.document_canvas.height;
        this.canvas!.width = docW;
        this.canvas!.height = docH;
        this.canvas_bounds_mapping = {
            from: { x: 0, y: 0, w: 1, h: 1 },
            to: { x: 0, y: 0, w: docW, h: docH },
        };
        const ctx = this.context!;
        ctx.clearRect(0, 0, docW, docH);
        if (clipboard.data) {
            _tile(ctx, _make_tmp(clipboard.data), docW, docH);
        } else {
            this._render_empty_hint(docW, docH);
        }
        this.publish_signals();
    }

    /** Draw a faint crosshatch hint when no clipboard content is available. */
    private _render_empty_hint(docW: number, docH: number): void {
        const imageData = new ImageData(docW, docH);
        const color: RGBA = [120, 120, 120, 80];
        const step = 16;
        for (let x = 0; x < docW; x += step) {
            for (let y = 0; y < docH; y++) setPixel(imageData, x, y, color);
        }
        for (let y = 0; y < docH; y += step) {
            for (let x = 0; x < docW; x++) setPixel(imageData, x, y, color);
        }
        this.context!.putImageData(imageData, 0, 0);
    }
}

function _make_tmp(data: ImageData): HTMLCanvasElement {
    const tmp = document.createElement('canvas');
    tmp.width = data.width;
    tmp.height = data.height;
    tmp.getContext('2d')!.putImageData(data, 0, 0);
    return tmp;
}

function _tile(ctx: CanvasRenderingContext2D, src: HTMLCanvasElement, docW: number, docH: number): void {
    for (let y = 0; y < docH; y += src.height) {
        for (let x = 0; x < docW; x += src.width) {
            ctx.drawImage(src, x, y);
        }
    }
}
