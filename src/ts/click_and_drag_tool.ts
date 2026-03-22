import { EditingTool } from "./editing_tool"
import { Editor } from "./editor";
import { MainApp } from "./main_app";
import { Rect, Vector2, RectToRectMapping, unit_rect, vfloor } from "./types";

import { signal, computed, effect } from "@preact/signals";
import { parse_RGBA, tool_to_document, clear_canvas, rect_union, extend_rect } from "./utils";
import { settings, SettingName } from "./settings_registry";
export abstract class ClickAndDragTool extends EditingTool {
    dirty: boolean = false;
    drag_start: Vector2 | null = null;
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
        this.drag_start = vfloor(at);
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
    hover(at: any) {
        if (!this.context) {
            return false;
        }
        const dirty = this.hover_action(at);
        if (dirty) {
            return true;
        }
    }
    hover_action(at: any) {
        // nop
        return false;
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
        this.commit_to_document()
        this.document_dirty_signal!.value++;
        this.drag_start = null;
        this.canvas_bounds_mapping = null;
        // Reset canvas to 1×1 so old stroke content doesn't bleed into the next stroke
        this.canvas!.width = 1;
        this.canvas!.height = 1;
        // Hide overlay
        this.canvas_signal!.value = null;
        this.push_undo_snapshot?.();
    }

}
