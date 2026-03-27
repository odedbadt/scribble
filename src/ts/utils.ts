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
export function translate_rect(r: Rect, shift: Vector2) {
    return {
        x: r.x + shift.x,
        y: r.y + shift.y,
        w: r.w,
        h: r.h
    }
}
export function rect_union(r1: Rect, r2: Rect, margin: number = 0) {
    if (r1 == null) {
        return r2;
    }
    if (r2 == null) {
        return r1;
    }
    const left = Math.max(0, Math.min(r1.x, r2.x) - margin);
    const top = Math.max(0, Math.min(r1.y, r2.y) - margin);
    const right = Math.max(r1.x + r1.w, r2.x + r2.w) + margin;
    const bottom = Math.max(r1.y + r1.h, r2.y + r2.h) + margin;
    return { x: left, y: top, w: right - left, h: bottom - top }
}
export function rect_sum(r1: Rect, r2: Rect) {
    // Mikowsky sum of two rectangles
    const left = r1.x - r2.w;
    const top = r1.y - r2.h;
    return { x: left, y: top, w: r1.w + r2.w, h: r1.h + r2.h }
}
export function extend_rect(r: Rect, margin: number) {
    // Mikowsky sum of two rectangles
    const left = r.x - margin;
    const top = r.y - margin;
    return { x: left, y: top, w: r.w + margin * 2, h: r.h + margin * 2 }
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
    const tool_image_data = tool_context.getImageData(pixel_from_rect.x, pixel_from_rect.y, pixel_from_rect.w, pixel_from_rect.h)
    const tool_data = tool_image_data.data;
    const document_image_data = document_context.getImageData(
        pixel_to_rect.x, pixel_to_rect.y,
        pixel_to_rect.w, pixel_to_rect.h)
    const document_data = document_image_data.data;
    for (let y = 0; y < pixel_from_rect.h; ++y) {
        for (let x = 0; x < pixel_from_rect.w; ++x) {
            const base_offset = 4 * (y * pixel_from_rect.w + x);
            if (tool_data[base_offset + 3] > 0) {
                const opacity = tool_data[base_offset + 3] / 255
                if (layer_color) {
                    document_data[base_offset + 0] = layer_color[0]
                    document_data[base_offset + 1] = layer_color[1]
                    document_data[base_offset + 2] = layer_color[2]
                    document_data[base_offset + 3] = 255;
                } else {
                    document_data[base_offset + 0] = tool_data[base_offset + 0] / opacity
                    document_data[base_offset + 1] = tool_data[base_offset + 1] / opacity
                    document_data[base_offset + 2] = tool_data[base_offset + 2] / opacity
                    document_data[base_offset + 3] = 255;//tool_data[base_offset + 3] / opacity
                }

                // document_data[base_offset + 0] = opacity * tool_data[base_offset + 0] + (1 - opacity) * document_data[base_offset + 0]
                // document_data[base_offset + 1] = opacity * tool_data[base_offset + 1] + (1 - opacity) * document_data[base_offset + 1]
                // document_data[base_offset + 2] = opacity * tool_data[base_offset + 2] + (1 - opacity) * document_data[base_offset + 2]
                // document_data[base_offset + 3] = opacity * tool_data[base_offset + 3] + (1 - opacity) * document_data[base_offset + 3]
            }
        }
    }
    document_context.putImageData(document_image_data,
        pixel_to_rect.x, pixel_to_rect.y);
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
export function tool_canvas_to_document_canvas(canvas: HTMLCanvasElement, canvas_bounds_mapping: RectToRectMapping, v: Vector2): Vector2 {
    const from: Rect = canvas_bounds_mapping.from;
    const to: Rect = canvas_bounds_mapping.to;
    const cw = canvas.width;
    const ch = canvas.height;
    return {
        x: (v.x / cw - from.x) * to.w + to.x,
        y: (v.y / ch - from.y) * to.h + to.y
    }
}
export function clear_canvas(canvas: HTMLCanvasElement) {
    const context: CanvasRenderingContext2D = canvas.getContext('2d')!;
    context.fillStyle = 'rgba(0,0,0,0)';
    context.fillRect(0, 0, canvas.width, canvas.height);

}
export function document_canvas_to_tool_canvas(canvas: HTMLCanvasElement, canvas_bounds_mapping: RectToRectMapping, v: Vector2): Vector2 {

    const from: Rect = canvas_bounds_mapping.from;
    const to: Rect = canvas_bounds_mapping.to;
    const cw = canvas.width;
    const ch = canvas.height;
    return {
        x: ((v.x - to.x) / to.w + from.x) * cw,
        y: ((v.y - to.y) / to.h + from.y) * ch
    }

}
