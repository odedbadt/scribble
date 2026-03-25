import { EditingTool } from "./editing_tool";
import { Vector2 } from "./types";
import { SettingName, settings } from "./settings_registry";
import { drawCloud, drawRainbow, RGBA } from "./pixel_utils";

const CLOUD_COLOR: RGBA = [170, 170, 170, 255];
const GHOST_COLOR: RGBA = [170, 170, 170, 120];

export class CloudStampTool extends EditingTool {
    private _last_pos: Vector2 | null = null;

    private _cloud_size(): number {
        const lw = settings.peek<number>(SettingName.LineWidth) ?? 1;
        return Math.max(12, Math.floor(lw * 5));
    }

    select() {
        this._last_pos = null;
    }

    deselect() {
        this._last_pos = null;
    }

    start(at: Vector2, _buttons: number) {
        this.push_undo_snapshot?.();
        const w = this.document_canvas!.width;
        const h = this.document_canvas!.height;
        const imageData = this.document_context!.getImageData(0, 0, w, h);
        const size = this._cloud_size();

        if (this._last_pos) {
            const dx = at.x - this._last_pos.x;
            const dy = at.y - this._last_pos.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const bandWidth = Math.max(2, Math.floor(dist / 20));
            drawRainbow(imageData, this._last_pos.x, this._last_pos.y, at.x, at.y, bandWidth);
            // Redraw previous cloud on top to cover rainbow endpoint
            drawCloud(imageData, this._last_pos.x, this._last_pos.y, size, CLOUD_COLOR);
        }

        drawCloud(imageData, at.x, at.y, size, CLOUD_COLOR);
        this.document_context!.putImageData(imageData, 0, 0);
        this.document_dirty_signal!.value++;
        this._last_pos = { x: at.x, y: at.y };
    }

    drag(_at: Vector2) {}
    stop(_at: Vector2) {}

    hover(at: Vector2) {
        const size = this._cloud_size();
        const ctx = this.context!;

        if (this._last_pos) {
            // Full-document overlay: rainbow preview + ghost cloud
            const docW = this.document_canvas!.width;
            const docH = this.document_canvas!.height;
            this.canvas!.width = docW;
            this.canvas!.height = docH;
            this.canvas_bounds_mapping = {
                from: { x: 0, y: 0, w: 1, h: 1 },
                to: { x: 0, y: 0, w: docW, h: docH }
            };
            const imageData = ctx.getImageData(0, 0, docW, docH);
            const dx = at.x - this._last_pos.x;
            const dy = at.y - this._last_pos.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const bandWidth = Math.max(2, Math.floor(dist / 20));
            drawRainbow(imageData, this._last_pos.x, this._last_pos.y, at.x, at.y, bandWidth);
            drawCloud(imageData, at.x, at.y, size, GHOST_COLOR);
            ctx.putImageData(imageData, 0, 0);
        } else {
            // Just a ghost cloud near the cursor
            const bound = Math.ceil(size * 1.6);
            const w = bound * 2 + 1;
            const h = bound * 2 + 1;
            this.canvas!.width = w;
            this.canvas!.height = h;
            this.canvas_bounds_mapping = {
                from: { x: 0, y: 0, w: 1, h: 1 },
                to: { x: at.x - bound, y: at.y - bound, w, h }
            };
            const imageData = ctx.getImageData(0, 0, w, h);
            drawCloud(imageData, bound, bound, size, GHOST_COLOR);
            ctx.putImageData(imageData, 0, 0);
        }

        this.publish_signals();
    }

    pointer_leave() {
        this.canvas_bounds_mapping = null;
        this.canvas!.width = 1;
        this.canvas!.height = 1;
        this.canvas_signal!.value = null;
    }
}
