import { EditingTool } from "./editing_tool"
import { Editor } from "./editor";
import { MainApp } from "./main_app";
import { Rect, Vector2, RectToRectMapping, unit_rect, vfloor } from "./types";

import { signal, computed, effect } from "@preact/signals";
import { parse_RGBA, tool_to_document, clear_canvas, rect_union } from "./utils";
import { settings, SettingName } from "./settings_registry";
import { drawFilledCircle, parseColor, RGBA, setPixel } from "./pixel_utils";
import { mandala_mode } from "./mandala_mode";
export abstract class ClickAndDragTool extends EditingTool {
    dirty: boolean = false;
    drag_start: Vector2 | null = null;
    protected _start_buttons: number = 0;
    init() {
        this.start = this.start.bind(this);
        this.drag = this.drag.bind(this);
        this.stop = this.stop.bind(this);
        this.drag_start = null;
    }
    select(): void {
    }
    extend_canvas_mapping(to_include: Vector2 | Rect, copy: boolean = true, margin: number = 0): void {
        if (this.canvas == null || this.context == null) {
            throw new Error('cannot extend without a canvas')
        }
        const rect_to_include: Rect = { w: 1, h: 1, ...to_include };
        const prev_mapping: RectToRectMapping | null = this.canvas_bounds_mapping
        if (prev_mapping == null) {
            this.canvas_bounds_mapping = {
                from: { x: 0, y: 0, w: 1, h: 1 },
                to: rect_to_include
            }
            clear_canvas(this.canvas!);
        } else {
            const next_to = rect_union(prev_mapping.to, rect_to_include, margin);
            const ctx = this.canvas.getContext('2d')!;
            if (copy) {
                const src_image_data = ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
                this.canvas.width = next_to.w;
                this.canvas.height = next_to.h;
                ctx.putImageData(src_image_data,
                    -(next_to.x - prev_mapping.to.x),
                    -(next_to.y - prev_mapping.to.y));
                // Do NOT clear — preserve existing strokes
            } else {
                this.canvas.width = next_to.w;
                this.canvas.height = next_to.h;
                clear_canvas(this.canvas!);
            }
            this.canvas_bounds_mapping = {
                to: next_to,
                from: { x: 0, y: 0, w: 1, h: 1 }
            }
        }
    }
    start(at: Vector2, buttons: number): void {
        this._start_buttons = buttons;
        this.drag_start = vfloor(at);
        // Reset canvas to 1×1 so stale cross pixels don't bleed into the new stroke
        this.canvas!.width = 1;
        this.canvas!.height = 1;
        this.canvas_bounds_mapping = null;
        this.extend_canvas_mapping(at);
        this.editing_start();
    }
    editing_start() {
        // nop, implement me
    }
    drag(at: Vector2): void {
        if (!this.drag_start) {
            return;
        }
        this.editing_drag(vfloor(this.drag_start), vfloor(at));
        this.publish_signals();
    }
    hover(at: Vector2) {
        if (!this.context || this.drag_start) {
            return false;
        }
        this.hover_action(at);
    }
    hover_color(): RGBA {
        return parseColor(settings.peek<string>(SettingName.ForeColor));
    }
    hover_action(at: Vector2) {
        const lw = settings.peek<number>(SettingName.LineWidth);
        const radius = Math.floor(lw / 2);
        const color = this.hover_color();
        const ctx = this.context!;

        if (mandala_mode.enabled && this.document_canvas) {
            const center = mandala_mode.center ?? {
                x: this.document_canvas.width / 2,
                y: this.document_canvas.height / 2,
            };
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
            this._draw_center_cross(imageData, center);
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
    _draw_center_cross(imageData: ImageData, center: { x: number, y: number }) {
        if (!mandala_mode.center) return;
        const arm = 4;
        const cross_color: RGBA = [80, 80, 80, 200];
        for (let i = -arm; i <= arm; i++) {
            setPixel(imageData, center.x + i, center.y, cross_color);
            setPixel(imageData, center.x, center.y + i, cross_color);
        }
    }
    pointer_leave() {
        if (this.drag_start) {
            return; // keep in-progress stroke visible
        }
        this.canvas_bounds_mapping = null;
        this.canvas!.width = 1;
        this.canvas!.height = 1;
        this.canvas_signal!.value = null;
    }
    editing_drag(from: Vector2, to: Vector2) {
        throw new Error("Not fully implemented tool");
    }
    commit_to_document(color: string | null = null) {
        if (this.document_context == null) {
            throw new Error("Cannot stop tool if editor is not full initialized")
        }
        if (!this.canvas_bounds_mapping) {
            return;
        }
        if (color == null) {
            color = settings.peek<string>(SettingName.ForeColor);
        }
        const color_array = parse_RGBA(color)
        tool_to_document(this.canvas!,
            this.canvas_bounds_mapping, this.document_context, color_array);

    }
    stop(at: Vector2) {
        if (this.drag_start) {
            this.commit_to_document();
            this.document_dirty_signal!.value++;
            this.push_undo_snapshot?.();
        }
        this.drag_start = null;
        this.canvas_bounds_mapping = null;
        // Reset canvas to 1×1 so old stroke content doesn't bleed into the next stroke
        this.canvas!.width = 1;
        this.canvas!.height = 1;
        // Hide overlay
        this.canvas_signal!.value = null;
    }

    on_doc_origin_shift(dx: number, dy: number): void {
        if (this.drag_start) {
            this.drag_start.x += dx;
            this.drag_start.y += dy;
        }
    }

}
