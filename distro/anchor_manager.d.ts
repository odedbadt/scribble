import { Vector2 } from "./types";
export declare const SNAP_RADIUS_SCREEN_PX = 14;
declare class AnchorManager {
    private _anchors;
    mandala_center_idx: number;
    dirty: import("@preact/signals-core").Signal<number>;
    get anchors(): Vector2[];
    add(pt: Vector2): number;
    clear(): void;
    set_mandala_center(idx: number): void;
    get_mandala_center(): Vector2 | null;
    move(idx: number, pt: Vector2): void;
    nearest_idx(pt: Vector2, radius: number): number;
    remove_nearest(pt: Vector2, radius: number): {
        removed: boolean;
        was_center: boolean;
    };
    snap(pt: Vector2, radius: number): {
        pt: Vector2;
        snapped: boolean;
    };
    draw_onto(imageData: ImageData, highlight_pt?: Vector2 | null, snap_radius?: number, dot_radius_doc?: number): void;
}
export declare const anchor_manager: AnchorManager;
export {};
//# sourceMappingURL=anchor_manager.d.ts.map