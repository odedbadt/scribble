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
/**
 * Like tool_to_document but writes to a color token canvas.
 * Wherever the tool canvas has a non-transparent pixel, writes [255,255,255,255] to the token canvas.
 * The token canvas stores a white alpha-mask; the actual color is applied by the GPU tint shader.
 */
export declare function tool_to_token_canvas(tool_canvas: HTMLCanvasElement, rect_to_rect_mapping: RectToRectMapping, token_context: CanvasRenderingContext2D): void;
/**
 * Erases from a color token canvas.
 * Wherever the tool canvas has a non-transparent pixel, writes [0,0,0,0] to the token canvas.
 */
export declare function tool_erase_token_canvas(tool_canvas: HTMLCanvasElement, rect_to_rect_mapping: RectToRectMapping, token_context: CanvasRenderingContext2D): void;
/**
 * Like tool_to_ghost_canvas but erases pixels from the ghost canvas
 * wherever the tool canvas has non-transparent pixels.
 */
export declare function tool_erase_ghost_canvas(tool_canvas: HTMLCanvasElement, rect_to_rect_mapping: RectToRectMapping, ghost_context: CanvasRenderingContext2D): void;
/**
 * Like tool_to_document but writes actual pixel colors to the ghost canvas.
 * Used when ghost mode is active — strokes are stored invisible until revealed.
 */
export declare function tool_to_ghost_canvas(tool_canvas: HTMLCanvasElement, rect_to_rect_mapping: RectToRectMapping, ghost_context: CanvasRenderingContext2D, layer_color?: Uint8ClampedArray | undefined): void;
/**
 * Reveal brush commit: for each pixel covered by the tool canvas,
 * if the ghost canvas has a non-transparent pixel there, copy it to
 * the document canvas and clear it from the ghost canvas.
 */
export declare function reveal_ghost_to_document(tool_canvas: HTMLCanvasElement, rect_to_rect_mapping: RectToRectMapping, ghost_context: CanvasRenderingContext2D, document_context: CanvasRenderingContext2D): void;
export declare function init_canvas(tool: EditingTool, canvas_signal: Signal<HTMLCanvasElement>, canvas_bounds_mapping_signal: Signal<RectToRectMapping>): HTMLCanvasElement;
export declare function clear_canvas(canvas: HTMLCanvasElement): void;
//# sourceMappingURL=utils.d.ts.map