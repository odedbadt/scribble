export type Vector2 = {
    x: number;
    y: number;
};
export type Rect = {
    x: number;
    y: number;
    w: number;
    h: number;
};
export type RectToRectMapping = {
    from: Rect;
    to: Rect;
};
export declare const unit_rect: Rect;
export declare const zero_vector: Vector2;
export declare function bounding_rect(v1: Vector2, v2: Vector2, margin?: number): Rect;
export declare function vfloor(v: Vector2): {
    x: number;
    y: number;
};
//# sourceMappingURL=types.d.ts.map