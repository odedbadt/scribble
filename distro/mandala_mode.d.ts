import { Vector2 } from "./types";
export interface StampTransform {
    center: Vector2;
    angle: number;
    flip: boolean;
}
declare class MandalaMode {
    enabled: boolean;
    n: number;
    mirror: boolean;
    center: Vector2 | null;
    get_line_transforms(from: Vector2, to: Vector2, center: Vector2): Array<{
        from: Vector2;
        to: Vector2;
    }>;
    get_point_transforms(at: Vector2, center: Vector2): Vector2[];
    /** Returns center position + rotation angle + flip flag for each symmetry copy of a stamp. */
    get_stamp_transforms(at: Vector2, center: Vector2): StampTransform[];
}
export declare const mandala_mode: MandalaMode;
export {};
//# sourceMappingURL=mandala_mode.d.ts.map