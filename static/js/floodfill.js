function _parse_RGBA(color) {
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
function _equal_colors(c1,c2) {
    return c1[0] == c2[0] &&
    c1[1] == c2[1] &&
    c1[2] == c2[2]
}
function _floodfill(context, replaced_color, tool_color, x, y) {
    var stack = [[x,y]];
    const w = context.canvas.clientWidth;
    const h = context.canvas.clientHeight;
    const context_image_data = context.getImageData(0,0,w,h)
    const context_data =  context_image_data.data;
    let safety = 10000000
    while (stack.length > 0 && safety-- > 0) {
        const dot = stack.pop();
        const x = dot[0];
        const y = dot[1];
        if (x < 0 ||
            y < 0 ||
            x > w ||
            y >= h) {
                continue
            }
        const offset = (w*y+x)*4;
        const color_at_xy = context_data.slice(offset,offset+4);
        if (!_equal_colors(replaced_color, color_at_xy)) {
            continue;
        }
        context_data[offset + 0] = tool_color[0];
        context_data[offset + 1] = tool_color[1];
        context_data[offset + 2] = tool_color[2];
        context_data[offset + 3] = 255;
        stack.push([x+1,y])
        stack.push([x-1,y])
        stack.push([x,y-1])
        stack.push([x,y+1])
    }
    context.putImageData(context_image_data, 0,0);
}
export class Floodfill {
    constructor(context, applier) {
        this.context = context;
        this.app = applier.app;
        this.is_incremental = false;
        }
    start(from) {
        const replaced_color = this.app.art_context.getImageData(from[0],from[1],1,1).data;
        const parsed_fore_color = _parse_RGBA(this.app.settings.fore_color);
        _floodfill(this.app.art_context,replaced_color,parsed_fore_color,from[0],from[1]);
    }
}
