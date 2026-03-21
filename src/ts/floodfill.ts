import { ClickTool } from "./click_tool"
import { settings, SettingName } from "./settings_registry";
import { Vector2 } from "./types";
import { parse_RGBA } from "./utils";

function _equal_colors(c1: Uint8ClampedArray, c2: Uint8ClampedArray): boolean {
    return c1[0] == c2[0] &&
        c1[1] == c2[1] &&
        c1[2] == c2[2] &&
        c1[3] == c2[3]
}

function _floodfill(context: CanvasRenderingContext2D,
    replaced_color: Uint8ClampedArray, fill_color: Uint8ClampedArray,
    x: number, y: number, w: number, h: number) {
    const image_data = context.getImageData(0, 0, w, h);
    const data = image_data.data;
    let safety = w * h * 4;
    const stack = [{ x: Math.floor(x), y: Math.floor(y) }];
    while (stack.length > 0 && safety-- > 0) {
        const dot = stack.pop()!;
        const px = dot.x;
        const py = dot.y;
        if (px < 0 || py < 0 || px >= w || py >= h) continue;
        const offset = (w * py + px) * 4;
        const color_at = data.slice(offset, offset + 4) as unknown as Uint8ClampedArray;
        if (!_equal_colors(replaced_color, color_at)) continue;
        data[offset + 0] = fill_color[0];
        data[offset + 1] = fill_color[1];
        data[offset + 2] = fill_color[2];
        data[offset + 3] = 255;
        stack.push({ x: px + 1, y: py });
        stack.push({ x: px - 1, y: py });
        stack.push({ x: px, y: py - 1 });
        stack.push({ x: px, y: py + 1 });
    }
    context.putImageData(image_data, 0, 0);
}

export class Floodfill extends ClickTool {
    drag(at: Vector2) {}
    stop(at: Vector2) {}
    select() {}
    hover(at: Vector2) {}

    start(at: Vector2) {
        const w = this.document_canvas!.width;
        const h = this.document_canvas!.height;
        const replaced_color = this.document_context!.getImageData(Math.floor(at.x), Math.floor(at.y), 1, 1).data;
        const color = settings.peek<string>(SettingName.ForeColor);
        const fill_color = parse_RGBA(color);

        if (_equal_colors(replaced_color, fill_color)) return;

        _floodfill(this.document_context!, replaced_color, fill_color, at.x, at.y, w, h);
        this.document_dirty_signal!.value++;
    }
}
