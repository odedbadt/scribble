export function override_canvas_context(
    context_to:CanvasRenderingContext2D, 
    canvas_from:HTMLCanvasElement, 
    keep?:boolean,
    avoid_native?:boolean) {
    // context_to.putImage(context_to_image_data,0,0);
    const w = canvas_from.width;
    const h = canvas_from.height;
    if (!keep) {
        context_to.clearRect(0, 0, w, h);
    }
    if (!avoid_native) {
        context_to.drawImage(canvas_from, 0, 0);
    } else {
        const context_from = canvas_from.getContext('2d')!
        const context_from_image_data = context_from.getImageData(0, 0, w, h)
        const context_from_data =  context_from_image_data.data;
        const context_to_image_data = context_to.getImageData(0, 0, w, h)
        const context_to_data =  context_to_image_data.data;

        for (let y = 0; y < h; ++y) {
            for (let x = 0; x < w; ++x) {
                const offset = (w*y+x)*4;
                if (context_from_data[offset + 3] > 0) {
                    context_to_data[offset + 0] = context_from_data[offset + 0];
                    context_to_data[offset + 1] = context_from_data[offset + 1];
                    context_to_data[offset + 2] = context_from_data[offset + 2];
                    context_to_data[offset + 3] = 255;
                }
            }
        }
        context_to.putImageData(context_to_image_data,0,0);
    }
 }
export function parse_RGBA(color:string | Uint8ClampedArray):Uint8ClampedArray
{
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
        return Uint8ClampedArray.from([r, g, b,a]);
    } else {
        throw new Error("Invalid rgb string format");
    }
}

export function hsl_to_rgb(hsl:number[]):number[] {
    let r, g, b;
    const h = hsl[0];
    const s = hsl[1];
    const l = hsl[2];
    if (s === 0) {
        r = g = b = l; // achromatic
    } else {
        const hue2rgb = (p:number, q:number, t:number) => {
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
export function vec_diff(v1:number[], v2:number[]):number[] {
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
export function norm2(v:number[]):number {
    let res = 0
    for (let j = 0; j < v.length; ++j) {
        res = res+v[j]*v[j]
    }
    return res
}

export function dist2(v1:number[], v2:number[]) {
    return norm2(vec_diff(v1,v2));
}

export function dist2_to_set(v:number[], set:number[][]):number {
    let min_dist2 = -1; //dist2(v, set[0]);
    let min_j = 0;
    for (let j = 0; j < set.length; ++j) {
        if (set[j] == undefined) {
            continue
        }
        const dist2_j = dist2(v, set[j])
        if (min_dist2 == -1 || dist2_j < min_dist2 ) {
            min_dist2 = dist2_j;
            min_j = j
        }
    }
    if (min_dist2 == -1) {
        debugger
    }
    return min_dist2
}


