import { Vector2 } from "./types";

function rotate(v: Vector2, center: Vector2, angle: number): Vector2 {
    const dx = v.x - center.x;
    const dy = v.y - center.y;
    return {
        x: center.x + dx * Math.cos(angle) - dy * Math.sin(angle),
        y: center.y + dx * Math.sin(angle) + dy * Math.cos(angle)
    };
}

class MandalaMode {
    enabled: boolean = false;
    n: number = 8;
    mirror: boolean = true;

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
}

export const mandala_mode = new MandalaMode();
