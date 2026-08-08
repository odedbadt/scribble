import { Vector2 } from "./types";

function rotate(v: Vector2, center: Vector2, angle: number): Vector2 {
    const dx = v.x - center.x;
    const dy = v.y - center.y;
    return {
        x: center.x + dx * Math.cos(angle) - dy * Math.sin(angle),
        y: center.y + dx * Math.sin(angle) + dy * Math.cos(angle)
    };
}

export interface StampTransform {
    center: Vector2;
    angle: number;   // rotation angle in radians
    flip: boolean;   // true if the stamp should be flipped horizontally before rotation
}

class MandalaMode {
    enabled: boolean = false;
    n: number = 8;
    mirror: boolean = true;
    center: Vector2 | null = null;

    get_line_transforms(from: Vector2, to: Vector2, center: Vector2): Array<{ from: Vector2, to: Vector2 }> {
        const results: Array<{ from: Vector2, to: Vector2 }> = [];
        for (let i = 0; i < this.n; i++) {
            const angle = (Math.PI * 2 * i) / this.n;
            results.push({ from: rotate(from, center, angle), to: rotate(to, center, angle) });
            if (this.mirror) {
                const mfrom = { x: 2 * center.x - from.x, y: from.y };
                const mto = { x: 2 * center.x - to.x, y: to.y };
                results.push({ from: rotate(mfrom, center, angle), to: rotate(mto, center, angle) });
            }
        }
        return results;
    }

    get_point_transforms(at: Vector2, center: Vector2): Vector2[] {
        const results: Vector2[] = [];
        for (let i = 0; i < this.n; i++) {
            const angle = (Math.PI * 2 * i) / this.n;
            results.push(rotate(at, center, angle));
            if (this.mirror) {
                results.push(rotate({ x: 2 * center.x - at.x, y: at.y }, center, angle));
            }
        }
        return results;
    }

    /** Returns center position + rotation angle + flip flag for each symmetry copy of a stamp. */
    get_stamp_transforms(at: Vector2, center: Vector2): StampTransform[] {
        const results: StampTransform[] = [];
        for (let i = 0; i < this.n; i++) {
            const angle = (Math.PI * 2 * i) / this.n;
            results.push({ center: rotate(at, center, angle), angle, flip: false });
            if (this.mirror) {
                const mat = { x: 2 * center.x - at.x, y: at.y };
                results.push({ center: rotate(mat, center, angle), angle, flip: true });
            }
        }
        return results;
    }
}

export const mandala_mode = new MandalaMode();
