export function override_canvas_context(context_to:CanvasRenderingContext2D, canvas_from:HTMLCanvasElement, keep?:boolean) {
    const w = canvas_from.width;
    const h = canvas_from.height;
    const context_from = canvas_from.getContext('2d')!
    if (!keep) {
        context_to.clearRect(0, 0, w, h);
    }
    const context_from_image_data = context_from.getImageData(0, 0, w, h)
    const context_from_data =  context_from_image_data.data;
    const context_to_image_data = context_to.getImageData(0, 0, w, h)
    const context_to_data =  context_to_image_data.data;

    // const tool_color = parse_RGBA(this.app.settings.fore_color);
    // let mn = 300
    // const hist:Map<string, number> = new Map<string, number>()
    for (let y = 0; y < h; ++y) {
        for (let x = 0; x < w; ++x) {
            const offset = (w*y+x)*4;
            // if (context_data[offset + 3] <  mn) {
            //     mn = context_data[offset + 3]
            // }
            // const  key:string = `${context_data[offset + 0]}_${context_data[offset + 1]}_${context_data[offset + 2]}_${context_data[offset + 3]}`
            // hist.set(key,(hist.get(key) || 0) + 1)
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

