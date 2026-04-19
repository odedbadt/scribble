import { EditingTool } from "./editing_tool"
import { Editor } from "./editor";
import { MainApp } from "./main_app";
import { Rect, Vector2, RectToRectMapping, unit_rect, vfloor } from "./types";

import { signal, computed, effect } from "@preact/signals";
import { parse_RGBA, tool_to_document, tool_to_token_canvas, tool_to_ghost_canvas, clear_canvas, rect_union } from "./utils";
import { settings, SettingName } from "./settings_registry";
import { drawFilledCircle, parseColor, RGBA, setPixel } from "./pixel_utils";
import { mandala_mode } from "./mandala_mode";
import { color_token_registry } from "./color_token_registry";
import { ghost_layer } from "./ghost_layer";
export abstract class ClickAndDragTool extends EditingTool {
    dirty: boolean = false;
    drag_start: Vector2 | null = null;
    protected _start_buttons: number = 0;
    /**
     * When true, suppress the tool-canvas overlay while dragging in ghost mode.
     * Drawing tools set this true (default) — committed pixels are invisible.
     * RevealBrush sets this false — its preview shows the actual ghost pixels.
     */
    protected _suppress_overlay_in_ghost_mode = true;
    // Cached filled-circle ImageData for hover cursor — reused while radius/color are unchanged
    private _hover_circle_cache: ImageData | null = null;
    private _hover_circle_cache_radius = -1;
    private _hover_circle_cache_color = '';
    init() {
        this.start = this.start.bind(this);
        this.drag = this.drag.bind(this);
        this.stop = this.stop.bind(this);
        this.drag_start = null;
    }
    select(): void {
    }

    start(at: Vector2, buttons: number): void {
        this._start_buttons = buttons;
        this.drag_start = vfloor(at);
        // Reset canvas to 1×1 so stale cross pixels don't bleed into the new stroke
        if (this.document_canvas) {
            this.canvas!.width = this.document_canvas.width;
            this.canvas!.height = this.document_canvas.height;
            this.canvas_bounds_mapping = {
                from: { x: 0, y: 0, w: 1, h: 1 },
                to: { x: 0, y: 0, w: this.document_canvas.width, h: this.document_canvas.height }
            };
        }
        this.editing_start();
    }
    editing_start() {
        // nop, implement me
    }
    /** Override: suppress the tool-canvas overlay while dragging in ghost mode. */
    publish_signals() {
        if (this._suppress_overlay_in_ghost_mode
                && this.drag_start !== null
                && ghost_layer.enabled.peek()) {
            return;
        }
        super.publish_signals();
    }
    drag(at: Vector2): void {
        if (!this.drag_start) {
            return;
        }
        this.editing_drag(vfloor(this.drag_start), vfloor(at));
        this.publish_signals();
    }
    /** Abort the current stroke without committing it to the document. */
    override cancel(): void {
        if (!this.drag_start) return;
        this.drag_start = null;
        this.cancel_undo_capture?.();
        if (this.canvas && this.context) {
            this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
        }
        this.canvas_signal!.value = null;
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
        const hoverColor = this.hover_color();
        const colorStr = `rgba(${hoverColor[0]},${hoverColor[1]},${hoverColor[2]},${hoverColor[3]})`;
        const color = hoverColor;
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
            const imageData = new ImageData(docW, docH);
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
            // Reuse the filled-circle ImageData when radius and color haven't changed —
            // the O(r²) fill is only paid once per (radius, color) combination.
            if (this._hover_circle_cache_radius !== radius || this._hover_circle_cache_color !== colorStr) {
                const imageData = new ImageData(size, size);
                drawFilledCircle(imageData, half, half, radius, color);
                this._hover_circle_cache = imageData;
                this._hover_circle_cache_radius = radius;
                this._hover_circle_cache_color = colorStr;
            }
            ctx.putImageData(this._hover_circle_cache!, 0, 0);
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

        // When a color token is active, redirect to the token's alpha-mask canvas.
        const active_token_idx = color_token_registry.active_index.peek();
        if (active_token_idx !== null) {
            const token = color_token_registry.tokens[active_token_idx];
            tool_to_token_canvas(this.canvas!, this.canvas_bounds_mapping, token.context);
            token.dirty.value++;
            return;
        }

        // When ghost mode is active, commit to the invisible ghost canvas.
        if (ghost_layer.enabled.peek()) {
            const color_array = color ? parse_RGBA(color) : undefined;
            tool_to_ghost_canvas(this.canvas!, this.canvas_bounds_mapping, ghost_layer.context, color_array);
            ghost_layer.dirty.value++;
            return;
        }

        // When no explicit color is given, use the actual pixel colors from the tool canvas
        // (supports dual-color fill+outline rendering). Pass a layer_color only when
        // callers explicitly request a specific color (e.g. scribble, eraser, topo_hull).
        const color_array = color ? parse_RGBA(color) : undefined;
        tool_to_document(this.canvas!,
            this.canvas_bounds_mapping, this.document_context, color_array);

    }
    stop(at: Vector2) {
        if (this.drag_start) {
            const active_token_idx = color_token_registry.active_index.peek();
            if (active_token_idx !== null) {
                // Token mode: commit to token canvas; no undo entry on document
                this.commit_to_document();
            } else if (ghost_layer.enabled.peek()) {
                // Ghost mode: commit to ghost canvas; no undo entry on document
                this.commit_to_document();
            } else {
                this.begin_undo_capture?.(this.canvas_bounds_mapping?.to);
                this.commit_to_document();
                this.document_dirty_signal!.value++;
                this.push_undo_snapshot?.();
            }
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
