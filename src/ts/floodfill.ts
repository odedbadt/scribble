import { ClickTool }from "./click_tool"
import { Editor } from "./editor";
import { Vector2 } from "./types";
import { parse_RGBA } from "./utils";

function _equal_colors(c1:Uint8ClampedArray,c2:Uint8ClampedArray):boolean {
    return c1[0] == c2[0] &&
    c1[1] == c2[1] &&
    c1[2] == c2[2]
}
function _floodfill(read_context:CanvasRenderingContext2D, write_context:CanvasRenderingContext2D,
                    replaced_color:Uint8ClampedArray, tool_color:Uint8ClampedArray,
                    x:number, y:number, w:number, h:number) {
    const context_image_data = read_context.getImageData(0, 0, w, h)
    const context_data =  context_image_data.data;
    let safety = w*h*4;
    let stack = [{x:Math.floor(x),y:Math.floor(y)}]
    while (stack.length > 0 && safety-- > 0) {
        const dot = stack.pop();
        if (!dot) {
            break
        }
        const x = dot.x;
        const y = dot.y;
        if (x < 0 ||
            y < 0 ||
            x > w ||
            y >= h) {
            continue
        }
        const offset = (w*y+x)*4;
        const color_at_xy = context_data.slice(offset, offset+4);
        if (!_equal_colors(replaced_color, color_at_xy)) {
            continue;
        }
        context_data[offset + 0] = tool_color[0];
        context_data[offset + 1] = tool_color[1];
        context_data[offset + 2] = tool_color[2];
        context_data[offset + 3] = 255;
        stack.push({x:x+1,y:y})
        stack.push({x:x-1,y:y})
        stack.push({x:x,y:y-1})
        stack.push({x:x,y:y+1})
    }
    write_context.putImageData(context_image_data, 0,0);
}
export class Floodfill extends ClickTool {
    action(at: Vector2): boolean {
        return false;
        throw new Error("Method not implemented.");
    }
    stop(at: Vector2): boolean {
        return false;
        throw new Error("Method not implemented.");
    }
    constructor(context:CanvasRenderingContext2D, editor:Editor) {
        super(context, editor)
        this.context = context;
        this.editor = editor;
        this.app = editor.app;
    }
    editing_start(at:Vector2) {
        const replaced_color = this.app.art_context.getImageData(at.x,at.y,1,1).data;
        const parsed_fore_color = parse_RGBA(this.app.settings.fore_color);
        _floodfill(this.app.art_context, this.context, replaced_color, parsed_fore_color,at.x,at.y, this.w, this.h);
        return true
    }
    hover(at:Vector2):boolean {
        return false
    }


}
