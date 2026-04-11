import { Rect, Vector2, RectToRectMapping } from "./types";
import { EditingTool } from "./editing_tool";
import { Signal } from "@preact/signals";
export function parse_RGBA(color: string | Uint8ClampedArray): Uint8ClampedArray {
    if (color instanceof Uint8ClampedArray) {
        return color
    }
    // Match the pattern for "rgb(r, g, b)"
    let regex = /rgba\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*\)/;
    // Execute the regex on the input string
    let result = regex.exec(color);
    if (result) {
        // Return the extracted r, g, b values as an array of numbers
        let r = parseInt(result[1]);
        let g = parseInt(result[2]);
        let b = parseInt(result[3]);
        let a = parseInt(result[4]);
        return Uint8ClampedArray.from([r, g, b, a]);
    } else {
        throw new Error("Invalid rgb string format");
    }
}

export function hsl_to_rgb(hsl: number[]): number[] {
    let r, g, b;
    const h = hsl[0];
    const s = hsl[1];
    const l = hsl[2];
    if (s === 0) {
        r = g = b = l; // achromatic
    } else {
        const hue2rgb = (p: number, q: number, t: number) => {
            if (t < 0) t += 1;
            if (t > 1) t -= 1;
            if (t < 1 / 6) return p + (q - p) * 6 * t;
            if (t < 1 / 2) return q;
            if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
            return p;
        };

        const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        const p = 2 * l - q;
        r = hue2rgb(p, q, h + 1 / 3);
        g = hue2rgb(p, q, h);
        b = hue2rgb(p, q, h - 1 / 3);
    }

    return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
}
export function vec_diff(v1: number[], v2: number[]): number[] {
    if (!v1) {
        return v2;
    }
    if (!v2) {
        return v1;
    }
    let res = []
    for (let j = 0; j < v1.length; ++j) {
        res.push(v1[j] - v2[j])
    }
    return res
}
export function norm2(v: number[]): number {
    let res = 0
    for (let j = 0; j < v.length; ++j) {
        res = res + v[j] * v[j]
    }
    return res
}

export function dist2(v1: number[], v2: number[]) {
    return norm2(vec_diff(v1, v2));
}

export function dist2_to_set(v: number[], set: number[][]): number {
    let min_dist2 = -1; //dist2(v, set[0]);
    let min_j = 0;
    for (let j = 0; j < set.length; ++j) {
        if (set[j] == undefined) {
            continue
        }
        const dist2_j = dist2(v, set[j])
        if (min_dist2 == -1 || dist2_j < min_dist2) {
            min_dist2 = dist2_j;
            min_j = j
        }
    }
    if (min_dist2 == -1) {
        debugger
    }
    return min_dist2
}

export function scale_rect(r: Rect, scale: Vector2) {
    return {
        x: r.x * scale.x,
        y: r.y * scale.y,
        w: r.w * scale.x,
        h: r.h * scale.y
    }
}
// Returns the smallest rect that contains r1 and a margin-padded r2.
// The margin expands r2 only — r1 is never shrunk, only grown if needed.
export function rect_union(r1: Rect, r2: Rect, margin: number = 0) {
    if (r1 == null) {
        return r2;
    }
    if (r2 == null) {
        return r1;
    }
    const left = Math.max(0, Math.min(r1.x, r2.x - margin));
    const top = Math.max(0, Math.min(r1.y, r2.y - margin));
    const right = Math.max(r1.x + r1.w, r2.x + r2.w + margin);
    const bottom = Math.max(r1.y + r1.h, r2.y + r2.h + margin);
    return { x: left, y: top, w: right - left, h: bottom - top }
}
export function tool_to_document(tool_canvas: HTMLCanvasElement,
    rect_to_rect_mapping: RectToRectMapping,
    document_context: CanvasRenderingContext2D,
    layer_color?: Uint8ClampedArray | undefined) {
    const tool_context = tool_canvas.getContext('2d',
        { willReadFrequently: true })! as CanvasRenderingContext2D;
    const tw = tool_canvas.width;
    const th = tool_canvas.height;
    const pixel_from_rect = scale_rect(rect_to_rect_mapping.from,
        { x: tw, y: th });
    const pixel_to_rect = rect_to_rect_mapping.to;

    // Clip destination rect to document canvas bounds so strokes near the edge
    // are committed correctly rather than being dropped as out-of-bounds writes.
    const doc_w = document_context.canvas.width;
    const doc_h = document_context.canvas.height;
    const clip_x1 = Math.max(0, pixel_to_rect.x);
    const clip_y1 = Math.max(0, pixel_to_rect.y);
    const clip_x2 = Math.min(pixel_to_rect.x + pixel_to_rect.w, doc_w);
    const clip_y2 = Math.min(pixel_to_rect.y + pixel_to_rect.h, doc_h);
    if (clip_x2 <= clip_x1 || clip_y2 <= clip_y1) return; // entirely outside
    const clipped_w = clip_x2 - clip_x1;
    const clipped_h = clip_y2 - clip_y1;
    // Offsets into the full tool/doc buffer where the clipped region starts
    const src_x_off = clip_x1 - pixel_to_rect.x;
    const src_y_off = clip_y1 - pixel_to_rect.y;

    const tool_image_data = tool_context.getImageData(pixel_from_rect.x, pixel_from_rect.y, pixel_from_rect.w, pixel_from_rect.h)
    const tool_data = tool_image_data.data;
    const document_image_data = document_context.getImageData(clip_x1, clip_y1, clipped_w, clipped_h);
    const document_data = document_image_data.data;
    for (let dy = 0; dy < clipped_h; ++dy) {
        for (let dx = 0; dx < clipped_w; ++dx) {
            const src_off = 4 * ((src_y_off + dy) * pixel_from_rect.w + (src_x_off + dx));
            const dst_off = 4 * (dy * clipped_w + dx);
            if (tool_data[src_off + 3] > 0) {
                const opacity = tool_data[src_off + 3] / 255
                if (layer_color) {
                    document_data[dst_off + 0] = layer_color[0]
                    document_data[dst_off + 1] = layer_color[1]
                    document_data[dst_off + 2] = layer_color[2]
                    document_data[dst_off + 3] = 255;
                } else {
                    document_data[dst_off + 0] = tool_data[src_off + 0] / opacity
                    document_data[dst_off + 1] = tool_data[src_off + 1] / opacity
                    document_data[dst_off + 2] = tool_data[src_off + 2] / opacity
                    document_data[dst_off + 3] = 255;
                }
            }
        }
    }
    document_context.putImageData(document_image_data, clip_x1, clip_y1);
}

/**
 * Like tool_to_document but writes to a color token canvas.
 * Wherever the tool canvas has a non-transparent pixel, writes [255,255,255,255] to the token canvas.
 * The token canvas stores a white alpha-mask; the actual color is applied by the GPU tint shader.
 */
export function tool_to_token_canvas(
    tool_canvas: HTMLCanvasElement,
    rect_to_rect_mapping: RectToRectMapping,
    token_context: CanvasRenderingContext2D
): void {
    _blit_tool_to_token(tool_canvas, rect_to_rect_mapping, token_context, false);
}

/**
 * Erases from a color token canvas.
 * Wherever the tool canvas has a non-transparent pixel, writes [0,0,0,0] to the token canvas.
 */
export function tool_erase_token_canvas(
    tool_canvas: HTMLCanvasElement,
    rect_to_rect_mapping: RectToRectMapping,
    token_context: CanvasRenderingContext2D
): void {
    _blit_tool_to_token(tool_canvas, rect_to_rect_mapping, token_context, true);
}

function _blit_tool_to_token(
    tool_canvas: HTMLCanvasElement,
    rect_to_rect_mapping: RectToRectMapping,
    token_context: CanvasRenderingContext2D,
    erase: boolean
): void {
    const tool_context = tool_canvas.getContext('2d', { willReadFrequently: true })! as CanvasRenderingContext2D;
    const tw = tool_canvas.width;
    const th = tool_canvas.height;
    const pixel_from_rect = scale_rect(rect_to_rect_mapping.from, { x: tw, y: th });
    const pixel_to_rect = rect_to_rect_mapping.to;
    const token_canvas = token_context.canvas;
    const doc_w = token_canvas.width;
    const doc_h = token_canvas.height;
    const clip_x1 = Math.max(0, pixel_to_rect.x);
    const clip_y1 = Math.max(0, pixel_to_rect.y);
    const clip_x2 = Math.min(pixel_to_rect.x + pixel_to_rect.w, doc_w);
    const clip_y2 = Math.min(pixel_to_rect.y + pixel_to_rect.h, doc_h);
    if (clip_x2 <= clip_x1 || clip_y2 <= clip_y1) return;
    const clipped_w = clip_x2 - clip_x1;
    const clipped_h = clip_y2 - clip_y1;
    const src_x_off = clip_x1 - pixel_to_rect.x;
    const src_y_off = clip_y1 - pixel_to_rect.y;
    const tool_image_data = tool_context.getImageData(
        pixel_from_rect.x, pixel_from_rect.y, pixel_from_rect.w, pixel_from_rect.h);
    const tool_data = tool_image_data.data;
    const token_image_data = token_context.getImageData(clip_x1, clip_y1, clipped_w, clipped_h);
    const token_data = token_image_data.data;
    for (let dy = 0; dy < clipped_h; ++dy) {
        for (let dx = 0; dx < clipped_w; ++dx) {
            const src_off = 4 * ((src_y_off + dy) * pixel_from_rect.w + (src_x_off + dx));
            const dst_off = 4 * (dy * clipped_w + dx);
            if (tool_data[src_off + 3] > 0) {
                if (erase) {
                    token_data[dst_off + 0] = 0;
                    token_data[dst_off + 1] = 0;
                    token_data[dst_off + 2] = 0;
                    token_data[dst_off + 3] = 0;
                } else {
                    token_data[dst_off + 0] = 255;
                    token_data[dst_off + 1] = 255;
                    token_data[dst_off + 2] = 255;
                    token_data[dst_off + 3] = 255;
                }
            }
        }
    }
    token_context.putImageData(token_image_data, clip_x1, clip_y1);
}


export function init_canvas(tool: EditingTool, canvas_signal: Signal<HTMLCanvasElement>,
    canvas_bounds_mapping_signal: Signal<RectToRectMapping>) {
    tool.canvas_bounds_mapping_signal = canvas_bounds_mapping_signal;
    tool.canvas_signal = canvas_signal;
    if (tool.canvas == null) {
        if (document.getElementById('tool_canvas')) {
            tool.canvas = document.getElementById('tool_canvas')! as HTMLCanvasElement;
        } else {
            tool.canvas = document.createElement("canvas") as HTMLCanvasElement;
            // OD: for testing:
            tool.canvas.setAttribute('id', 'tool_canvas');
            document.getElementById('debug-tool-canvas-slot')!.appendChild(tool.canvas);
        }
    } else { // tool.canvas != null, illegal state
        throw new Error('init_canvas called twice');
    }
    tool.context = tool.canvas.getContext('2d', {
        'willReadFrequently': true,
        alpha: true
    })!;
    // Disable anti-aliasing/smoothing for pixel-perfect rendering
    tool.context.imageSmoothingEnabled = false;
    // set completely arbitrary bounds (might be dropped)
    tool.canvas!.width = 1;
    tool.canvas!.height = 1;

    //canvas_signal.value = tool.canvas;
    return tool.canvas
}
export function clear_canvas(canvas: HTMLCanvasElement) {
    const context: CanvasRenderingContext2D = canvas.getContext('2d')!;
    context.fillStyle = 'rgba(0,0,0,0)';
    context.fillRect(0, 0, canvas.width, canvas.height);

}

