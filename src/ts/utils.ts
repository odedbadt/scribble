export function override_canvas_context(context_to:CanvasRenderingContext2D, canvas_from:HTMLCanvasElement, keep?:boolean) {
    if (!keep) {
        context_to.clearRect(0, 0, canvas_from.width, canvas_from.height);
    }
    context_to.drawImage(canvas_from, 0, 0);
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

