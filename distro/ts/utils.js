export function override_canvas_context(context_to, canvas_from, view_port_from, keep, avoid_native, force_same_view_port) {
    const before_f_t = performance.now();
    // context_to.putImage(context_to_image_data,0,0);
    const to_w = context_to.canvas.clientWidth;
    const to_h = context_to.canvas.offsetHeight;
    const from_w = canvas_from.clientWidth;
    const from_h = canvas_from.offsetHeight;
    const context_from = canvas_from.getContext('2d');
    const context_from_image_data = context_from.getImageData(0, 0, canvas_from.clientWidth, canvas_from.clientHeight);
    const context_from_data = context_from_image_data.data;
    const context_to_image_data = context_to.getImageData(0, 0, context_to.canvas.clientWidth, context_to.canvas.clientHeight);
    const context_to_data = context_to_image_data.data;
    function render_non_native() {
        for (let y = 0; y < to_h; ++y) {
            for (let x = 0; x < to_w; ++x) {
                const offset = (to_w * y + x) * 4;
                const from_x = Math.round(x / to_w * view_port_from.w + view_port_from.x);
                const from_y = Math.round(y / to_h * view_port_from.h + view_port_from.y);
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
        context_to.drawImage(canvas_from, view_port_from.x, view_port_from.y, view_port_from.w, view_port_from.h, 0, 0, context_to.canvas.clientWidth, context_to.canvas.clientHeight);
    }
    if (!keep) {
        context_to.clearRect(0, 0, context_to.canvas.clientWidth, context_to.canvas.clientHeight);
    }
    if (force_same_view_port) {
        context_to.drawImage(canvas_from, 0, 0);
    }
    else if (avoid_native) {
        render_non_native();
    }
    else {
        render_native();
    }
}
export function parse_RGBA(color) {
    if (color instanceof Uint8ClampedArray) {
        return color;
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
    }
    else {
        throw new Error("Invalid rgb string format");
    }
}
export function hsl_to_rgb(hsl) {
    let r, g, b;
    const h = hsl[0];
    const s = hsl[1];
    const l = hsl[2];
    if (s === 0) {
        r = g = b = l; // achromatic
    }
    else {
        const hue2rgb = (p, q, t) => {
            if (t < 0)
                t += 1;
            if (t > 1)
                t -= 1;
            if (t < 1 / 6)
                return p + (q - p) * 6 * t;
            if (t < 1 / 2)
                return q;
            if (t < 2 / 3)
                return p + (q - p) * (2 / 3 - t) * 6;
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
export function vec_diff(v1, v2) {
    if (!v1) {
        return v2;
    }
    if (!v2) {
        return v1;
    }
    let res = [];
    for (let j = 0; j < v1.length; ++j) {
        res.push(v1[j] - v2[j]);
    }
    return res;
}
export function norm2(v) {
    let res = 0;
    for (let j = 0; j < v.length; ++j) {
        res = res + v[j] * v[j];
    }
    return res;
}
export function dist2(v1, v2) {
    return norm2(vec_diff(v1, v2));
}
export function dist2_to_set(v, set) {
    let min_dist2 = -1; //dist2(v, set[0]);
    let min_j = 0;
    for (let j = 0; j < set.length; ++j) {
        if (set[j] == undefined) {
            continue;
        }
        const dist2_j = dist2(v, set[j]);
        if (min_dist2 == -1 || dist2_j < min_dist2) {
            min_dist2 = dist2_j;
            min_j = j;
        }
    }
    if (min_dist2 == -1) {
        debugger;
    }
    return min_dist2;
}
export function scale_rect(r, scale) {
    return { x: r.x * scale.x,
        y: r.y * scale.y,
        w: r.w * scale.x,
        h: r.h * scale.y };
}
export function translate_rect(r, shift) {
    return { x: r.x + shift.x,
        y: r.y + shift.y,
        w: r.w,
        h: r.h };
}
export function rect_union(r1, r2) {
    const left = Math.min(r1.x, r2.x);
    const top = Math.min(r1.y, r2.y);
    const right = Math.max(r1.x + r1.w, r2.x + r2.w);
    const bottom = Math.max(r1.y + r1.h, r2.y + r2.h);
    return { x: left, y: top, w: right - left, h: bottom - top };
}
export function disposeScene(scene) {
    // Loop through all objects in the scene
    scene.traverse((object) => {
        // Dispose of geometries
        if (object.geometry) {
            object.geometry.dispose();
        }
        // Dispose of materials
        if (object.material) {
            // If the material has textures, dispose of them too
            if (Array.isArray(object.material)) {
                object.material.forEach((mat) => {
                    if (mat.map)
                        mat.map.dispose(); // dispose of texture
                    if (mat.lightMap)
                        mat.lightMap.dispose();
                    if (mat.bumpMap)
                        mat.bumpMap.dispose();
                    if (mat.normalMap)
                        mat.normalMap.dispose();
                    if (mat.aoMap)
                        mat.aoMap.dispose();
                    if (mat.emissiveMap)
                        mat.emissiveMap.dispose();
                    if (mat.envMap)
                        mat.envMap.dispose();
                    if (mat.displacementMap)
                        mat.displacementMap.dispose();
                    if (mat.specularMap)
                        mat.specularMap.dispose();
                });
            }
            else {
                if (object.material.map)
                    object.material.map.dispose(); // dispose of texture
                if (object.material.lightMap)
                    object.material.lightMap.dispose();
                if (object.material.bumpMap)
                    object.material.bumpMap.dispose();
                if (object.material.normalMap)
                    object.material.normalMap.dispose();
                if (object.material.aoMap)
                    object.material.aoMap.dispose();
                if (object.material.emissiveMap)
                    object.material.emissiveMap.dispose();
                if (object.material.envMap)
                    object.material.envMap.dispose();
                if (object.material.displacementMap)
                    object.material.displacementMap.dispose();
                if (object.material.specularMap)
                    object.material.specularMap.dispose();
            }
            object.material.dispose();
        }
    });
}
//# sourceMappingURL=utils.js.map