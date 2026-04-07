import { EditingTool } from "./editing_tool";
import { clipboard } from "./clipboard";
import { setPixel, RGBA } from "./pixel_utils";
import { Vector2 } from "./types";

export class StampTool extends EditingTool {
    select(): void {}

    hover(at: Vector2): void {
        if (!clipboard.data) {
            this._render_crosshair(at);
            return;
        }
        const data = clipboard.data;
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

    start(at: Vector2, _buttons: number): void {
        if (!clipboard.data) return;
        const data = clipboard.data;
        const w = data.width;
        const h = data.height;
        const x = Math.floor(at.x - w / 2);
        const y = Math.floor(at.y - h / 2);

        // Use a temporary canvas + drawImage so alpha=0 clipboard pixels
        // leave the destination unchanged (source-over compositing),
        // matching how the hover preview looks via Three.js alpha blending.
        const tmp = document.createElement('canvas');
        tmp.width = w;
        tmp.height = h;
        tmp.getContext('2d')!.putImageData(data, 0, 0);

        this.begin_undo_capture!({ x, y, w, h });
        this.document_context!.drawImage(tmp, x, y);
        this.document_dirty_signal!.value++;
        this.push_undo_snapshot!();

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
