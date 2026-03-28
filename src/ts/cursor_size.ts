import { ClickAndDragTool } from "./click_and_drag_tool"
import { SettingName, settings } from "./settings_registry";
import { state_registry, StateValue } from "./state_registry";
import { Vector2 } from "./types";
import { drawFilledCircle, parseColor } from "./pixel_utils";

export class CursorSize extends ClickAndDragTool {
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
        const color = parseColor(settings.peek<string>(SettingName.ForeColor));
        drawFilledCircle(imageData, half, half, radius, color);
        ctx.putImageData(imageData, 0, 0);

        settings.set(SettingName.LineWidth, radius * 2);
        this.publish_signals();
    }

    stop(at: Vector2) {
        const start = this.drag_start;
        super.stop(at);
        // Single click (no drag) → 1px
        if (start && at.x === start.x && at.y === start.y) {
            settings.set(SettingName.LineWidth, 1);
        }
        state_registry.pop(StateValue.SelectedToolName);
    }

    commit_to_document() {
        // intentionally empty — preview circle must not be committed to the document
    }
}
