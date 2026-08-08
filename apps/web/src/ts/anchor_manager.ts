import { signal } from "@preact/signals";
import { Vector2 } from "./types";
import { setPixel, RGBA } from "./pixel_utils";

export const SNAP_RADIUS_SCREEN_PX = 14; // screen pixels
const DOT_RADIUS_SCREEN_PX = 5; // screen pixels
const ANCHOR_COLOR: RGBA = [0, 100, 220, 200];
const SNAP_COLOR: RGBA = [0, 200, 80, 220];
const CENTER_COLOR: RGBA = [80, 80, 80, 220];

class AnchorManager {
    private _anchors: Vector2[] = [];
    mandala_center_idx: number = -1;
    dirty = signal(0);

    get anchors(): Vector2[] { return this._anchors; }

    add(pt: Vector2): number {
        this._anchors.push({ x: Math.round(pt.x), y: Math.round(pt.y) });
        this.dirty.value++;
        return this._anchors.length - 1;
    }

    clear() {
        this._anchors = [];
        this.mandala_center_idx = -1;
        this.dirty.value++;
    }

    set_mandala_center(idx: number) {
        this.mandala_center_idx = idx;
        this.dirty.value++;
    }

    get_mandala_center(): Vector2 | null {
        if (this.mandala_center_idx >= 0 && this.mandala_center_idx < this._anchors.length) {
            return this._anchors[this.mandala_center_idx];
        }
        return null;
    }

    move(idx: number, pt: Vector2) {
        if (idx < 0 || idx >= this._anchors.length) return;
        this._anchors[idx] = { x: Math.round(pt.x), y: Math.round(pt.y) };
        this.dirty.value++;
    }

    nearest_idx(pt: Vector2, radius: number): number {
        let best = -1;
        let bestDist = radius;
        for (let i = 0; i < this._anchors.length; i++) {
            const d = Math.hypot(this._anchors[i].x - pt.x, this._anchors[i].y - pt.y);
            if (d < bestDist) { bestDist = d; best = i; }
        }
        return best;
    }

    // Returns true if the mandala center was removed
    remove_nearest(pt: Vector2, radius: number): { removed: boolean; was_center: boolean } {
        const idx = this._anchors.findIndex(
            a => Math.hypot(a.x - pt.x, a.y - pt.y) < radius
        );
        if (idx < 0) return { removed: false, was_center: false };
        const was_center = idx === this.mandala_center_idx;
        this._anchors.splice(idx, 1);
        if (was_center) {
            this.mandala_center_idx = -1;
        } else if (this.mandala_center_idx > idx) {
            this.mandala_center_idx--;
        }
        this.dirty.value++;
        return { removed: true, was_center };
    }

    snap(pt: Vector2, radius: number): { pt: Vector2; snapped: boolean } {
        let best: Vector2 | null = null;
        let bestDist = radius;
        for (const a of this._anchors) {
            const d = Math.hypot(a.x - pt.x, a.y - pt.y);
            if (d < bestDist) { bestDist = d; best = a; }
        }
        return best ? { pt: best, snapped: true } : { pt, snapped: false };
    }

    draw_onto(imageData: ImageData, highlight_pt: Vector2 | null = null, snap_radius: number = 14, dot_radius_doc: number = 5) {
        for (let i = 0; i < this._anchors.length; i++) {
            const a = this._anchors[i];
            const is_center = i === this.mandala_center_idx;
            const snapping = !is_center && highlight_pt != null &&
                Math.hypot(a.x - highlight_pt.x, a.y - highlight_pt.y) < snap_radius;
            const color = is_center ? CENTER_COLOR : (snapping ? SNAP_COLOR : ANCHOR_COLOR);
            _draw_anchor_dot(imageData, a.x, a.y, color, dot_radius_doc);
            if (is_center) {
                // Cross arms through center
                const arm = Math.max(2, Math.round(dot_radius_doc * 0.8));
                for (let j = -arm; j <= arm; j++) {
                    setPixel(imageData, a.x + j, a.y, color);
                    setPixel(imageData, a.x, a.y + j, color);
                }
            }
        }
    }
}

function _draw_anchor_dot(imageData: ImageData, cx: number, cy: number, color: RGBA, r: number = DOT_RADIUS_SCREEN_PX) {
    r = Math.max(1, Math.round(r));
    for (let dy = -r; dy <= r; dy++) {
        for (let dx = -r; dx <= r; dx++) {
            const d = Math.sqrt(dx * dx + dy * dy);
            if (d >= r - 0.6 && d <= r + 0.6) {
                setPixel(imageData, cx + dx, cy + dy, color);
            }
        }
    }
    setPixel(imageData, cx, cy, color);
}

export const anchor_manager = new AnchorManager();
