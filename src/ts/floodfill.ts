import { ClickTool } from "./click_tool"
import { settings, SettingName } from "./settings_registry";
import { Rect, Vector2 } from "./types";
import { parse_RGBA, rect_union } from "./utils";
import { mandala_mode } from "./mandala_mode";
import { drawFilledCircle, parseColor, setPixel, RGBA } from "./pixel_utils";
import { fill_pattern } from "./fill_pattern";
import { color_token_registry } from "./color_token_registry";

function _equal_colors(c1: Uint8ClampedArray, c2: Uint8ClampedArray): boolean {
    return c1[0] == c2[0] &&
        c1[1] == c2[1] &&
        c1[2] == c2[2] &&
        c1[3] == c2[3]
}

/** Returns the bounding rect of pixels that were changed, or null if nothing was filled. */
function _floodfill(context: CanvasRenderingContext2D,
    replaced_color: Uint8ClampedArray, fill_color: Uint8ClampedArray,
    x: number, y: number, w: number, h: number,
    pattern?: ImageData, back_color?: Uint8ClampedArray): Rect | null {
    const image_data = context.getImageData(0, 0, w, h);
    const data = image_data.data;
    let safety = w * h * 4;
    const stack = [{ x: Math.floor(x), y: Math.floor(y) }];
    let minX = w, minY = h, maxX = -1, maxY = -1;
    const pw = pattern ? pattern.width : 0;
    const ph = pattern ? pattern.height : 0;
    const pd = pattern ? pattern.data : null;
    while (stack.length > 0 && safety-- > 0) {
        const dot = stack.pop()!;
        const px = dot.x;
        const py = dot.y;
        if (px < 0 || py < 0 || px >= w || py >= h) continue;
        const offset = (w * py + px) * 4;
        const color_at = data.slice(offset, offset + 4) as unknown as Uint8ClampedArray;
        if (!_equal_colors(replaced_color, color_at)) continue;
        if (pd) {
            const ppx = (px % pw + pw) % pw;
            const ppy = (py % ph + ph) % ph;
            const pi = (ppy * pw + ppx) * 4;
            if (pd[pi + 3] === 0 && back_color) {
                // Transparent pattern pixel → use back color
                data[offset]     = back_color[0];
                data[offset + 1] = back_color[1];
                data[offset + 2] = back_color[2];
                data[offset + 3] = 255;
            } else {
                data[offset]     = pd[pi];
                data[offset + 1] = pd[pi + 1];
                data[offset + 2] = pd[pi + 2];
                data[offset + 3] = pd[pi + 3] > 0 ? pd[pi + 3] : 255;
            }
        } else {
            data[offset + 0] = fill_color[0];
            data[offset + 1] = fill_color[1];
            data[offset + 2] = fill_color[2];
            data[offset + 3] = 255;
        }
        if (px < minX) minX = px;
        if (px > maxX) maxX = px;
        if (py < minY) minY = py;
        if (py > maxY) maxY = py;
        stack.push({ x: px + 1, y: py });
        stack.push({ x: px - 1, y: py });
        stack.push({ x: px, y: py - 1 });
        stack.push({ x: px, y: py + 1 });
    }
    if (maxX < 0) return null;
    context.putImageData(image_data, 0, 0);
    return { x: minX, y: minY, w: maxX - minX + 1, h: maxY - minY + 1 };
}

export class Floodfill extends ClickTool {
    drag(at: Vector2) {}
    stop(at: Vector2) {}
    select() {}

    hover(at: Vector2) {
        if (!this.context) return;
        const color = parseColor(settings.peek<string>(SettingName.ForeColor));
        const ctx = this.context!;
        const radius = 2;

        if (mandala_mode.enabled && this.document_canvas) {
            const center = mandala_mode.center ?? { x: this.document_canvas.width / 2, y: this.document_canvas.height / 2 };
            const docW = this.document_canvas.width;
            const docH = this.document_canvas.height;
            this.canvas!.width = docW;
            this.canvas!.height = docH;
            this.canvas_bounds_mapping = {
                from: { x: 0, y: 0, w: 1, h: 1 },
                to: { x: 0, y: 0, w: docW, h: docH },
            };
            const imageData = ctx.getImageData(0, 0, docW, docH);
            for (const pt of mandala_mode.get_point_transforms(at, center)) {
                drawFilledCircle(imageData, Math.round(pt.x), Math.round(pt.y), radius, color);
            }
            if (mandala_mode.center) {
                const arm = 4;
                const cross_color: RGBA = [80, 80, 80, 200];
                for (let i = -arm; i <= arm; i++) {
                    setPixel(imageData, center.x + i, center.y, cross_color);
                    setPixel(imageData, center.x, center.y + i, cross_color);
                }
            }
            ctx.putImageData(imageData, 0, 0);
        } else {
            const margin = 1;
            const half = radius + margin;
            const size = half * 2 + 1;
            this.canvas!.width = size;
            this.canvas!.height = size;
            this.canvas_bounds_mapping = {
                from: { x: 0, y: 0, w: 1, h: 1 },
                to: { x: at.x - half, y: at.y - half, w: size, h: size },
            };
            const imageData = ctx.getImageData(0, 0, size, size);
            drawFilledCircle(imageData, half, half, radius, color);
            ctx.putImageData(imageData, 0, 0);
        }
        this.publish_signals();
    }

    pointer_leave() {
        this.canvas_bounds_mapping = null;
        this.canvas!.width = 1;
        this.canvas!.height = 1;
        this.canvas_signal!.value = null;
    }

    start(at: Vector2) {
        const w = this.document_canvas!.width;
        const h = this.document_canvas!.height;

        const active_token_idx = color_token_registry.active_index.peek();
        const is_token_mode = active_token_idx !== null;

        const fill_color = parse_RGBA(settings.peek<string>(SettingName.ForeColor));
        const white = new Uint8ClampedArray([255, 255, 255, 255]);

        const positions = mandala_mode.enabled
            ? mandala_mode.get_point_transforms(at, mandala_mode.center ?? { x: w / 2, y: h / 2 })
            : [at];

        if (is_token_mode) {
            // Fill token canvas with white mask.
            // Run the fill on a scratch copy of the document to discover the region,
            // then stamp white on those pixels in the token canvas.
            const token = color_token_registry.tokens[active_token_idx!];
            let dirty: Rect | null = null;
            for (const pos of positions) {
                const replaced_color = this.document_context!.getImageData(
                    Math.floor(pos.x), Math.floor(pos.y), 1, 1
                ).data;
                // scratch canvas initialized from composite document
                const scratch = document.createElement('canvas');
                scratch.width = w; scratch.height = h;
                const scratch_ctx = scratch.getContext('2d', { willReadFrequently: true })!;
                (scratch_ctx as CanvasRenderingContext2D).imageSmoothingEnabled = false;
                scratch_ctx.drawImage(this.document_canvas!, 0, 0);
                const before = scratch_ctx.getImageData(0, 0, w, h);
                const bbox = _floodfill(scratch_ctx as CanvasRenderingContext2D,
                    replaced_color as Uint8ClampedArray, white, pos.x, pos.y, w, h);
                if (!bbox) continue;
                // Find changed pixels; write white to token canvas at those positions
                const after = scratch_ctx.getImageData(bbox.x, bbox.y, bbox.w, bbox.h);
                const before_chunk = before.data;
                const after_data = after.data;
                const token_data = token.context.getImageData(bbox.x, bbox.y, bbox.w, bbox.h);
                const bw = bbox.w, bh = bbox.h;
                const bx = bbox.x, by = bbox.y;
                for (let py = 0; py < bh; py++) {
                    for (let px = 0; px < bw; px++) {
                        const chunk_off = 4 * (py * bw + px);
                        const full_off = 4 * ((by + py) * w + (bx + px));
                        if (after_data[chunk_off + 3] !== before_chunk[full_off + 3] ||
                            after_data[chunk_off] !== before_chunk[full_off]) {
                            token_data.data[chunk_off + 0] = 255;
                            token_data.data[chunk_off + 1] = 255;
                            token_data.data[chunk_off + 2] = 255;
                            token_data.data[chunk_off + 3] = 255;
                        }
                    }
                }
                token.context.putImageData(token_data, bbox.x, bbox.y);
                dirty = dirty ? rect_union(dirty, bbox) : bbox;
            }
            if (dirty) token.dirty.value++;
            return;
        }

        // Normal mode: fill into document canvas
        // Capture full canvas before fill; we'll clip to the actual dirty rect after.
        this.begin_undo_capture?.();
        let dirty: Rect | null = null;
        const pattern = fill_pattern.enabled.value ? fill_pattern.data ?? undefined : undefined;
        const back_color = pattern ? parse_RGBA(settings.peek<string>(SettingName.BackColor)) : undefined;
        for (const pos of positions) {
            const replaced_color = this.document_context!.getImageData(
                Math.floor(pos.x), Math.floor(pos.y), 1, 1
            ).data;
            if (_equal_colors(replaced_color, fill_color)) continue;
            const bbox = _floodfill(this.document_context!, replaced_color, fill_color, pos.x, pos.y, w, h, pattern, back_color);
            if (bbox) dirty = dirty ? rect_union(dirty, bbox) : bbox;
        }
        if (dirty) {
            this.document_dirty_signal!.value++;
            this.push_undo_snapshot_clipped?.(dirty);
        } else {
            this.cancel_undo_capture?.();
        }
    }
}
