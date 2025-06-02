export type Vector2 = {
    x: number;
    y: number;
}
export type Rect = {
    x: number;
    y: number;
    w: number;
    h: number;
}
export type RectToRectMapping = {
    from: Rect,
    to: Rect
}
export const unit_rect: Rect = { x: 0, y: 0, w: 1, h: 1 }
export const zero_vector: Vector2 = { x: 0, y: 0 }


export function bounding_rect(v1: Vector2, v2: Vector2, margin: number = 0): Rect {
    const left = Math.min(v1.x, v2.x) - margin;
    const top = Math.min(v1.y, v2.y) - margin;
    const right = Math.max(v1.x, v2.x) + margin;
    const bottom = Math.max(v1.y, v2.y) + margin;
    return { x: left, y: top, w: right - left, h: bottom - top };

}
export function vfloor(v: Vector2) {
    return { x: Math.floor(v.x), y: Math.floor(v.y) }
}
