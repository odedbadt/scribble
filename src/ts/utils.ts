import { Scene } from "three";
import { Rect, Vector2, RectToRectMapping } from "./types";
import { EditingTool } from "./editing_tool";
import { Signal } from "@preact/signals";
export function override_canvas_context(
    context_to: CanvasRenderingContext2D,
    canvas_from: HTMLCanvasElement,
    view_port_from: Rect,
    keep?: boolean | undefined,
    avoid_native?: boolean,
    force_same_view_port?: boolean | undefined) {
    const before_f_t = performance.now();
    // context_to.putImage(context_to_image_data,0,0);
    const to_w = context_to.canvas.clientWidth;
    const to_h = context_to.canvas.offsetHeight;
    const from_w = canvas_from.clientWidth;
    const from_h = canvas_from.offsetHeight;
    const context_from = canvas_from.getContext('2d')!
    const context_from_image_data = context_from.getImageData(0, 0,
        canvas_from.clientWidth, canvas_from.clientHeight)
    const context_from_data = context_from_image_data.data;
    const context_to_image_data = context_to.getImageData(0, 0,
        context_to.canvas.clientWidth, context_to.canvas.clientHeight)
    const context_to_data = context_to_image_data.data;
    function render_non_native() {
        for (let y = 0; y < to_h; ++y) {
            for (let x = 0; x < to_w; ++x) {
                const offset = (to_w * y + x) * 4;
                const from_x = Math.round(x / to_w * view_port_from.w + view_port_from.x)
                const from_y = Math.round(y / to_h * view_port_from.h + view_port_from.y)
                const from_offset = force_same_view_port ? offset :
                    (from_w * from_y + from_x) * 4;
                if (context_from_data[from_offset + 3] > 0) {
                    context_to_data[offset + 0] = context_from_data[from_offset + 0];
                    context_to_data[offset + 1] = context_from_data[from_offset + 1];
                    context_to_data[offset + 2] = context_from_data[from_offset + 2];
                    context_to_data[offset + 3] = 255;
                }
            }
        }
        context_to.putImageData(context_to_image_data, 0, 0);
    }
    function render_native() {
        context_to.drawImage(
            canvas_from,
            view_port_from.x,
            view_port_from.y,
            view_port_from.w,
            view_port_from.h,
            0,
            0,
            context_to.canvas.clientWidth,
            context_to.canvas.clientHeight
        );

    }
    if (!keep) {
        context_to.clearRect(0, 0,
            context_to.canvas.clientWidth,
            context_to.canvas.clientHeight);
    }
    if (force_same_view_port) {
        context_to.drawImage(canvas_from, 0, 0)
    } else if (avoid_native) {
        render_non_native()
    } else {
        render_native();
    }
}
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
export function rect_union(r1: Rect, r2: Rect) {
    const left = Math.min(r1.x, r2.x);
    const top = Math.min(r1.y, r2.y);
    const right = Math.max(r1.x + r1.w, r2.x + r2.w);
    const bottom = Math.max(r1.y + r1.h, r2.y + r2.h);
    return { x: left, y: top, w: right - left, h: bottom - top }
}
export function disposeScene(scene: Scene) {
    // Loop through all objects in the scene
    scene.traverse((object: any) => {
        // Dispose of geometries
        if (object.geometry) {
            object.geometry.dispose();
        }

        // Dispose of materials
        if (object.material) {
            // If the material has textures, dispose of them too
            if (Array.isArray(object.material)) {
                object.material.forEach((mat: any) => {
                    if (mat.map) mat.map.dispose(); // dispose of texture
                    if (mat.lightMap) mat.lightMap.dispose();
                    if (mat.bumpMap) mat.bumpMap.dispose();
                    if (mat.normalMap) mat.normalMap.dispose();
                    if (mat.aoMap) mat.aoMap.dispose();
                    if (mat.emissiveMap) mat.emissiveMap.dispose();
                    if (mat.envMap) mat.envMap.dispose();
                    if (mat.displacementMap) mat.displacementMap.dispose();
                    if (mat.specularMap) mat.specularMap.dispose();
                });
            } else {
                if (object.material.map) object.material.map.dispose(); // dispose of texture
                if (object.material.lightMap) object.material.lightMap.dispose();
                if (object.material.bumpMap) object.material.bumpMap.dispose();
                if (object.material.normalMap) object.material.normalMap.dispose();
                if (object.material.aoMap) object.material.aoMap.dispose();
                if (object.material.emissiveMap) object.material.emissiveMap.dispose();
                if (object.material.envMap) object.material.envMap.dispose();
                if (object.material.displacementMap) object.material.displacementMap.dispose();
                if (object.material.specularMap) object.material.specularMap.dispose();
            }
            object.material.dispose();
        }
    });
}

export function tool_to_document(tool_canvas: HTMLCanvasElement,
    rect_to_rect_mapping: RectToRectMapping,
    document_context: CanvasRenderingContext2D) {
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
                document_data[base_offset + 0] = tool_data[base_offset + 0] / opacity
                document_data[base_offset + 1] = tool_data[base_offset + 1] / opacity
                document_data[base_offset + 2] = tool_data[base_offset + 2] / opacity
                document_data[base_offset + 3] = 255;//tool_data[base_offset + 3] / opacity

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
            document.getElementById('canvas-area')!.appendChild(tool.canvas);
        }
    } else { // tool.canvas != null, illegal state
        throw new Error('init_canvas called twice');
    }
    tool.context = tool.canvas.getContext('2d', {
        'willReadFrequently': true,
        alpha: true
    })!;
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
export function extend_canvas_mapping(tool: EditingTool,
    to: Rect, copy: boolean = true): void {
    if (tool.canvas == null || tool.context == null) {
        throw new Error('cannot extend without a canvas')
    }
    if (tool.canvas_bounds_mapping == null) {
        tool.canvas_bounds_mapping = {
            from: { x: 0, y: 0, w: 1, h: 1 },
            to: { ...to }
        }
    }
    const prev_mapping = tool.canvas_bounds_mapping;
    const w = tool.canvas.width;
    const h = tool.canvas.height;
    const ctx = tool.canvas!.getContext('2d')!;
    if (copy) {
        const src_image_data = ctx.getImageData(0, 0, w, h)
        tool.canvas.width = to.w;
        tool.canvas.height = to.h;
        ctx.putImageData(src_image_data,
            prev_mapping.from.x * prev_mapping.from.w,
            prev_mapping.from.y * prev_mapping.from.h);
    } else {
        tool.canvas.width = to.w;
        tool.canvas.height = to.h;
    }
    tool.canvas_bounds_mapping = {
        to: to,
        from: {
            x: 0, y: 0, w: 1, h: 1
        }
    }
    tool.context!.fillStyle = 'rgba(0,0,0,0)';
    tool.context!.fillRect(0, 0, tool.canvas.width, tool.canvas.height);
}