import { ClickAndDragTool } from "./click_and_drag_tool"
import { ReadonlySignal, Signal } from "@preact/signals";
import { Vector2 } from "./types";
import { drawFilledCircle, parseColor } from "./pixel_utils";

export class CursorSize extends ClickAndDragTool {
    constructor(
        fore_color: ReadonlySignal<string>,
        line_width: Signal<number>,
        private _selected_tool_name: Signal<string>,
        private _previous_tool_name: ReadonlySignal<string | undefined>,
    ) {
        super(fore_color, line_width);
    }

    private get _line_width_writable(): Signal<number> {
        return this._line_width as Signal<number>;
    }

    start(at: Vector2, buttons: number) {
        super.start(at, buttons);
    }

    editing_drag(from: Vector2, to: Vector2) {
        const dx = to.x - from.x;
        const dy = to.y - from.y;
        const radius = Math.floor(Math.sqrt(dx * dx + dy * dy));
        if (radius < 1) return;

        const margin = 1;
        const half = radius + margin;
        const size = half * 2 + 1;

        this.canvas!.width = size;
        this.canvas!.height = size;
        this.canvas_bounds_mapping = {
            from: { x: 0, y: 0, w: 1, h: 1 },
            to: { x: from.x - half, y: from.y - half, w: size, h: size },
        };

        const ctx = this.context!;
        // Canvas was just reset (width assignment clears it) — allocate fresh zeroed buffer
        const imageData = new ImageData(size, size);
        const color = parseColor(this._fore_color.peek());
        drawFilledCircle(imageData, half, half, radius, color);
        ctx.putImageData(imageData, 0, 0);

        this._line_width_writable.value = radius * 2;
        this.publish_signals();
    }

    stop(at: Vector2) {
        const start = this.drag_start;
        super.stop(at);
        // Single click (no drag) → 1px
        if (start && at.x === start.x && at.y === start.y) {
            this._line_width_writable.value = 1;
        }
        const prev = this._previous_tool_name.peek();
        if (prev !== undefined) {
            this._selected_tool_name.value = prev;
        }
    }

    commit_to_document() {
        // intentionally empty — preview circle must not be committed to the document
    }
}
