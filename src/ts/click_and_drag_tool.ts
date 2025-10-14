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
        } else {
            const next_to = rect_union(prev_mapping.to, rect_to_include, margin);
            const w = this.canvas.width;
            const h = this.canvas.height;
            const ctx = this.canvas.getContext('2d')!;
            if (copy) {
                const src_image_data = ctx.getImageData(0, 0, w, h)
                this.canvas.width = next_to.w;
                this.canvas.height = next_to.h;
                ctx.putImageData(src_image_data,
                    -(next_to.x - prev_mapping.to.x),
                    -(next_to.y - prev_mapping.to.y))
            } else {
                this.canvas.width = next_to.w;
                this.canvas.height = next_to.h;
            }
            this.canvas_bounds_mapping = {
                to: next_to,
                from: {
                    x: 0, y: 0, w: 1, h: 1
                }
            }
        }
        clear_canvas(this.canvas!)
    }
    start(at: Vector2, buttons: number): void {
        this.drag_start = vfloor(at);

        this.extend_canvas_mapping(at);
    }
    editing_start() {
        // nop, implemenet me
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
        if (color == null) {
            color = settings.peek<string>(SettingName.ForeColor);
        }
        const color_array = parse_RGBA(color)
        tool_to_document(this.canvas!,
            this.canvas_bounds_mapping_signal!.value, this.document_context, color_array);

    }
    stop(at: Vector2) {
        this.commit_to_document()
        this.drag_start = null;
        this.publish_signals();
        this.canvas_bounds_mapping = null;
    }

}
