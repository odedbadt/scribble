import { Rect, Vector2, RectToRectMapping } from "./types";
import { EditingTool } from "./editing_tool";
import { Signal } from "@preact/signals";
export declare function parse_RGBA(color: string | Uint8ClampedArray): Uint8ClampedArray;
export declare function hsl_to_rgb(hsl: number[]): number[];
export declare function vec_diff(v1: number[], v2: number[]): number[];
export declare function norm2(v: number[]): number;
export declare function dist2(v1: number[], v2: number[]): number;
export declare function dist2_to_set(v: number[], set: number[][]): number;
export declare function scale_rect(r: Rect, scale: Vector2): {
    x: number;
    y: number;
    w: number;
    h: number;
};
export declare function rect_union(r1: Rect, r2: Rect, margin?: number): Rect;
export declare function tool_to_document(tool_canvas: HTMLCanvasElement, rect_to_rect_mapping: RectToRectMapping, document_context: CanvasRenderingContext2D, layer_color?: Uint8ClampedArray | undefined): void;
export declare function init_canvas(tool: EditingTool, canvas_signal: Signal<HTMLCanvasElement>, canvas_bounds_mapping_signal: Signal<RectToRectMapping>): HTMLCanvasElement;
export declare function clear_canvas(canvas: HTMLCanvasElement): void;
//# sourceMappingURL=utils.d.ts.map